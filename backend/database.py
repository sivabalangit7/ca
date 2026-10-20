import sqlite3
import os
from contextlib import contextmanager
from typing import Generator

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(DB_DIR, exist_ok=True)
# Security: ensure directory has restricted permissions (read/write/exec for owner only)
try:
    os.chmod(DB_DIR, 0o700)
except Exception:
    pass

DB_PATH = os.path.join(DB_DIR, "nutritrack.db")


def secure_file_permissions(path: str):
    """Restricts file permissions to owner read/write only (600) for sensitive health data."""
    if os.path.exists(path):
        try:
            os.chmod(path, 0o600)
        except Exception:
            pass


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    # Security Pragmas:
    # 1. Enforce referential integrity
    conn.execute("PRAGMA foreign_keys = ON;")
    # 2. High concurrency Write-Ahead Logging
    conn.execute("PRAGMA journal_mode = WAL;")
    # 3. Cryptographically zero-out deleted content to prevent forensic data recovery
    conn.execute("PRAGMA secure_delete = ON;")
    # 4. Enforce B-tree cell bounds checking against corrupted / crafted database files
    conn.execute("PRAGMA cell_size_check = ON;")
    # 5. Safe synchronization mode preventing corruption on crash while maintaining speed
    conn.execute("PRAGMA synchronous = NORMAL;")
    
    # Enforce file permission security on the active database
    secure_file_permissions(DB_PATH)
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def verify_database_integrity() -> dict:
    """Runs SQLite PRAGMA integrity_check and quick_check to verify database health."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA integrity_check(5);")
        integrity_results = [r[0] for r in cursor.fetchall()]
        cursor.execute("PRAGMA quick_check(5);")
        quick_results = [r[0] for r in cursor.fetchall()]
        
        is_healthy = integrity_results == ["ok"] and quick_results == ["ok"]
        file_size_bytes = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
        
        return {
            "healthy": is_healthy,
            "integrityCheck": integrity_results,
            "quickCheck": quick_results,
            "fileSizeBytes": file_size_bytes,
            "databasePath": DB_PATH,
            "journalMode": "WAL",
            "secureDelete": True,
            "foreignKeys": True,
        }
    finally:
        conn.close()


def safe_backup_database(destination_path: str = None) -> str:
    """Uses SQLite native backup API to take a consistent online snapshot of the database."""
    if not destination_path:
        backup_dir = os.path.join(DB_DIR, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        try:
            os.chmod(backup_dir, 0o700)
        except Exception:
            pass
        destination_path = os.path.join(backup_dir, "nutritrack_backup.db")

    source_conn = get_connection()
    dest_conn = sqlite3.connect(destination_path)
    try:
        with dest_conn:
            source_conn.backup(dest_conn, pages=100)
        secure_file_permissions(destination_path)
        return destination_path
    finally:
        dest_conn.close()
        source_conn.close()


def _migrate_add_user_id(cursor):
    """Safely adds user_id column to existing tables if they don't have it yet."""
    tables_needing_user_id = [
        ("user_profile", "TEXT NOT NULL DEFAULT 'default'"),
        ("foods_db", "TEXT DEFAULT NULL"),
        ("daily_logs", "TEXT NOT NULL DEFAULT 'default'"),
        ("logged_foods", "TEXT NOT NULL DEFAULT 'default'"),
        ("water_entries", "TEXT NOT NULL DEFAULT 'default'"),
        ("activity_logs", "TEXT NOT NULL DEFAULT 'default'"),
        ("weight_entries", "TEXT NOT NULL DEFAULT 'default'"),
        ("habit_logs", "TEXT NOT NULL DEFAULT 'default'"),
    ]
    
    for table_name, col_def in tables_needing_user_id:
        try:
            cursor.execute(f"SELECT user_id FROM {table_name} LIMIT 1;")
        except sqlite3.OperationalError:
            try:
                cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN user_id {col_def};")
                print(f"  Migration: Added user_id column to {table_name}")
            except Exception as e:
                print(f"  Migration warning for {table_name}: {e}")


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()

        # 0. Registered Users table (Normal Login & Signup)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            last_login TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

        # 1. User Profile table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profile (
            id TEXT PRIMARY KEY DEFAULT 'current',
            user_id TEXT NOT NULL DEFAULT 'default',
            name TEXT NOT NULL DEFAULT 'Aarav Sharma',
            age INTEGER NOT NULL DEFAULT 28,
            gender TEXT NOT NULL DEFAULT 'male',
            height_cm REAL NOT NULL DEFAULT 174.0,
            weight_kg REAL NOT NULL DEFAULT 74.5,
            activity_level TEXT NOT NULL DEFAULT 'moderately_active',
            goal TEXT NOT NULL DEFAULT 'lose_05',
            dietary_preference TEXT NOT NULL DEFAULT 'veg',
            target_calories INTEGER NOT NULL DEFAULT 1950,
            target_protein_g REAL NOT NULL DEFAULT 110.0,
            target_carbs_g REAL NOT NULL DEFAULT 220.0,
            target_fat_g REAL NOT NULL DEFAULT 52.0,
            target_fiber_g REAL NOT NULL DEFAULT 35.0,
            target_water_ml INTEGER NOT NULL DEFAULT 3000,
            target_steps INTEGER NOT NULL DEFAULT 10000,
            is_custom_targets INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)

        # 2. Foods Master Database (Preset & Custom Indian Foods)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS foods_db (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            hindi_name TEXT,
            category TEXT NOT NULL,
            serving TEXT NOT NULL,
            serving_size TEXT,
            serving_unit TEXT NOT NULL DEFAULT 'serving',
            default_quantity REAL NOT NULL DEFAULT 1.0,
            calories REAL NOT NULL,
            protein REAL NOT NULL,
            carbs REAL NOT NULL,
            fat REAL NOT NULL,
            fiber REAL NOT NULL DEFAULT 0.0,
            dietary TEXT NOT NULL DEFAULT 'veg',
            notes TEXT,
            is_custom INTEGER NOT NULL DEFAULT 0,
            user_id TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)

        # 3. Daily Logs Metadata
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_logs (
            date TEXT NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'default',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (date, user_id)
        );
        """)

        # 4. Logged Food Entries
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS logged_foods (
            log_id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'default',
            food_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT,
            meal_category TEXT NOT NULL, -- breakfast, lunch, snacks, dinner
            serving TEXT NOT NULL,
            unit TEXT NOT NULL DEFAULT 'serving',
            quantity REAL NOT NULL DEFAULT 1.0,
            calories REAL NOT NULL,
            protein REAL NOT NULL,
            carbs REAL NOT NULL,
            fat REAL NOT NULL,
            fiber REAL NOT NULL DEFAULT 0.0,
            dietary TEXT NOT NULL DEFAULT 'veg',
            source TEXT NOT NULL DEFAULT 'manual', -- manual, ai_scan
            logged_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)

        # 5. Water Entries
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_entries (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'default',
            amount_ml INTEGER NOT NULL,
            target_ml INTEGER NOT NULL DEFAULT 2500,
            logged_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)

        # 6. Activity Logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            date TEXT NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'default',
            steps INTEGER NOT NULL DEFAULT 0,
            target_steps INTEGER NOT NULL DEFAULT 8500,
            exercise_minutes INTEGER NOT NULL DEFAULT 0,
            sleep_hours REAL NOT NULL DEFAULT 7.0,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (date, user_id)
        );
        """)

        # 7. Weight Log Entries
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS weight_entries (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'default',
            weight_kg REAL NOT NULL,
            bmi REAL,
            body_fat_pct REAL,
            waist_cm REAL,
            notes TEXT,
            logged_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)

        # 8. Habit Completions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS habit_logs (
            id TEXT PRIMARY KEY, -- date_habitId
            date TEXT NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'default',
            habit_id TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 1,
            logged_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """)

        # Run migration to add user_id column to any existing pre-migration tables
        _migrate_add_user_id(cursor)

        # Create indexes (after ensuring user_id column exists)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_foods_name ON foods_db(name);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_foods_category ON foods_db(category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_foods_user ON foods_db(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_logged_foods_date ON logged_foods(date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_logged_foods_meal ON logged_foods(date, meal_category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_logged_foods_user ON logged_foods(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_logged_foods_user_date ON logged_foods(user_id, date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_water_date ON water_entries(date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_water_user ON water_entries(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_water_user_date ON water_entries(user_id, date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_entries(date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_weight_user ON weight_entries(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_habits_date ON habit_logs(date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_habits_user ON habit_logs(user_id);")
