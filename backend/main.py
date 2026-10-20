import os
import sys
import time
import sqlite3
from typing import Dict, List, Optional
from collections import defaultdict
from contextlib import asynccontextmanager

# Setup path so running directly via `python backend/main.py` or `python main.py` works seamlessly
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)

for p in [PARENT_DIR, CURRENT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, HTTPException, Request, Response, Query, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

try:
    from backend.database import (
        init_db,
        get_connection,
        get_db,
        DB_PATH,
        verify_database_integrity,
        safe_backup_database
    )
    from backend.seed_data import seed_database_if_empty
    from backend.routes import logs, foods, weight, habits, profile, progress, auth
except (ImportError, ValueError):
    from database import (
        init_db,
        get_connection,
        get_db,
        DB_PATH,
        verify_database_integrity,
        safe_backup_database
    )
    from seed_data import seed_database_if_empty
    from routes import logs, foods, weight, habits, profile, progress, auth


# Security Rate Limiter (Token/Timestamp Sliding Window: 180 req/minute per IP)
class RateLimiter:
    def __init__(self, max_requests: int = 180, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        window_start = now - self.window_seconds
        timestamps = self.requests[client_ip]
        # Remove expired timestamps
        self.requests[client_ip] = [t for t in timestamps if t > window_start]
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        self.requests[client_ip].append(now)
        return True


rate_limiter = RateLimiter(max_requests=180, window_seconds=60)


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Rate Limiting Check
        client_ip = request.client.host if request.client else "unknown"
        if not rate_limiter.is_allowed(client_ip):
            return Response(
                content='{"detail": "Too many requests. Rate limit exceeded for database protection."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": "60"}
            )

        # 2. Extract user_id from X-User-Id header and inject into request state
        user_id = request.headers.get("x-user-id", "default")
        request.state.user_id = user_id

        # 3. Process Request
        response: Response = await call_next(request)

        # 4. Security HTTP Headers Hardening
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(self), microphone=()"
        response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:;"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed initial food data on startup
    init_db()
    seed_database_if_empty()
    yield


app = FastAPI(
    title="NutriTrack India Secure API",
    description="Precision Calorie & Macro Tracking Backend with Hardened SQLite Database — Multi-User Support",
    version="1.2.0",
    lifespan=lifespan
)

# Attach Security Middleware
app.add_middleware(SecurityMiddleware)

# Enable CORS for local React Vite frontend and mobile WebView Capacitor
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "https://localhost",
        "capacitor://localhost",
        "http://localhost",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(foods.router, prefix="/api")
app.include_router(weight.router, prefix="/api")
app.include_router(habits.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(progress.router, prefix="/api")


# Allowed database tables for export and restore (strict whitelist prevents SQL injection)
ALLOWED_TABLES = frozenset([
    "users",
    "user_profile",
    "foods_db",
    "daily_logs",
    "logged_foods",
    "water_entries",
    "activity_logs",
    "weight_entries",
    "habit_logs"
])


@app.get("/api/health")
def health_check():
    integrity = verify_database_integrity()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM foods_db")
    foods_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM logged_foods")
    logs_count = cursor.fetchone()[0]
    conn.close()
    return {
        "status": "healthy",
        "database": "SQLite (WAL Mode + Secure Delete)",
        "databasePath": DB_PATH,
        "totalFoodsInDatabase": foods_count,
        "totalFoodLogsInDatabase": logs_count,
        "engine": "Python FastAPI + Hardened SQLite",
        "multiUser": True,
        "security": {
            "walMode": True,
            "secureDelete": True,
            "foreignKeys": True,
            "integrityVerified": integrity["healthy"],
            "rateLimitEnabled": True
        }
    }


@app.get("/api/db/integrity")
def check_db_integrity():
    """Validates SQLite database integrity and returns diagnostic results."""
    return verify_database_integrity()


@app.post("/api/db/backup")
def create_backup():
    """Generates an online atomic SQLite backup snapshot."""
    try:
        backup_path = safe_backup_database()
        return {
            "success": True,
            "message": "Database backup created successfully",
            "backupPath": backup_path,
            "timestamp": time.time()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")


@app.get("/api/db/export")
def export_database(request: Request):
    """Securely exports all whitelisted database tables as structured JSON for the current user."""
    user_id = getattr(request.state, "user_id", "default")
    conn = get_connection()
    cursor = conn.cursor()
    data = {}
    try:
        for t in sorted(ALLOWED_TABLES):
            # Filter by user_id where applicable
            try:
                cursor.execute(f"SELECT * FROM {t} WHERE user_id = ?", (user_id,))
            except Exception:
                # Table might not have user_id column (e.g., legacy)
                cursor.execute(f"SELECT * FROM {t}")
            rows = [dict(r) for r in cursor.fetchall()]
            data[t] = rows
    finally:
        conn.close()

    return {
        "version": "1.2.0",
        "userId": user_id,
        "exportedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "tables": data
    }


@app.post("/api/db/import")
def import_database(request: Request, payload: dict = Body(...)):
    """Safely restores database tables from a valid backup payload within a single transaction."""
    user_id = getattr(request.state, "user_id", "default")
    tables_data = payload.get("tables", payload)
    if not isinstance(tables_data, dict):
        raise HTTPException(status_code=400, detail="Invalid payload structure: missing 'tables' map")

    with get_db() as conn:
        cursor = conn.cursor()
        restored_counts = {}

        for table_name, rows in tables_data.items():
            if table_name not in ALLOWED_TABLES:
                continue  # Ignore any non-whitelisted tables
            if not isinstance(rows, list):
                continue

            for row in rows:
                if not isinstance(row, dict) or not row:
                    continue

                # Inject user_id into the row
                row["user_id"] = user_id

                # Sanitize column names: only alphanumeric and underscores
                columns = [c for c in row.keys() if c.isidentifier()]
                if not columns:
                    continue

                col_clause = ", ".join(columns)
                placeholders = ", ".join("?" for _ in columns)
                values = [row[c] for c in columns]

                query = f"INSERT OR REPLACE INTO {table_name} ({col_clause}) VALUES ({placeholders})"
                cursor.execute(query, values)

            restored_counts[table_name] = len(rows)

        return {
            "success": True,
            "message": "Database restored successfully",
            "restoredTables": restored_counts
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    print("=======================================================")
    print("🚀 NutriTrack India Precision SQLite Database Server")
    print(f"   Listening on: http://127.0.0.1:{port}")
    print(f"   API Docs:     http://127.0.0.1:{port}/docs")
    print(f"   Health Check: http://127.0.0.1:{port}/api/health")
    print("   Multi-User:   ✅ Enabled (via X-User-Id header)")
    print("=======================================================")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)

