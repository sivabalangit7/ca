import hashlib
import secrets
import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, HTTPException, status
try:
    from ..database import get_db
except (ImportError, ValueError):
    from backend.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    salt = secrets.token_hex(8)
    h = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}${h}"


def verify_password(stored: str, password: str) -> bool:
    if not stored or "$" not in stored:
        return False
    salt, original_hash = stored.split("$", 1)
    test_hash = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return secrets.compare_digest(original_hash, test_hash)


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=120)
    password: str = Field(..., min_length=4, max_length=100)
    name: Optional[str] = Field(None, max_length=100)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=120)
    password: str = Field(..., min_length=1, max_length=100)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str


class AuthResponse(BaseModel):
    success: bool
    user: UserResponse
    message: str


@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest):
    email = req.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address (e.g. user@gmail.com)."
        )

    name = req.name.strip() if req.name and req.name.strip() else email.split("@")[0].capitalize()
    now_iso = datetime.datetime.now().isoformat()
    pwd_hash = hash_password(req.password)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists. Please sign in."
            )

        cursor.execute("""
        INSERT INTO users (id, email, name, password_hash, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (email, email, name, pwd_hash, now_iso, now_iso))

        # Also create initial profile record for this user if not already present
        cursor.execute("""
        INSERT OR IGNORE INTO user_profile (
            id, user_id, name, age, gender, height_cm, weight_kg, activity_level, goal,
            dietary_preference, target_calories, target_protein_g, target_carbs_g,
            target_fat_g, target_fiber_g, target_water_ml, target_steps, is_custom_targets, updated_at
        ) VALUES (
            ?, ?, ?, 28, 'male', 174.0, 74.5, 'moderately_active', 'lose_05',
            'veg', 1950, 110.0, 220.0, 52.0, 35.0, 3000, 10000, 0, ?
        )
        """, (email, email, name, now_iso))

    return AuthResponse(
        success=True,
        user=UserResponse(id=email, email=email, name=name),
        message="Registration successful"
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest):
    email = req.email.strip().lower()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, password_hash FROM users WHERE LOWER(email) = ?", (email,))
        row = cursor.fetchone()

        if not row:
            # Auto-register convenience: if someone logs in with a password for the first time,
            # we can create the account or guide them
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please click Sign Up to create your account."
            )

        if not verify_password(row["password_hash"], req.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again."
            )

        now_iso = datetime.datetime.now().isoformat()
        cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (now_iso, row["id"]))

        return AuthResponse(
            success=True,
            user=UserResponse(id=row["id"], email=row["email"], name=row["name"]),
            message="Sign in successful"
        )
