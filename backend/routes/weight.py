import datetime
from typing import List
from fastapi import APIRouter, HTTPException, Request
try:
    from ..database import get_db
    from ..models import WeightEntrySchema, AddWeightRequest
except (ImportError, ValueError):
    from backend.database import get_db
    from backend.models import WeightEntrySchema, AddWeightRequest

router = APIRouter(prefix="/weight", tags=["Weight Tracking"])


def get_user_id(request: Request) -> str:
    """Extract user_id from request state (injected by SecurityMiddleware)."""
    return getattr(request.state, "user_id", "default")


@router.get("", response_model=List[WeightEntrySchema])
def get_weight_entries(request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, date, weight_kg, bmi, body_fat_pct, waist_cm, notes, logged_at "
            "FROM weight_entries WHERE user_id = ? "
            "ORDER BY date DESC, logged_at DESC",
            (user_id,)
        )
        rows = cursor.fetchall()
        result = []
        for r in rows:
            result.append(WeightEntrySchema(
                id=r["id"],
                date=r["date"],
                weightKg=r["weight_kg"],
                bmi=r["bmi"],
                bodyFatPct=r["body_fat_pct"],
                waistCm=r["waist_cm"],
                notes=r["notes"],
                loggedAt=r["logged_at"]
            ))
        return result


@router.post("", response_model=WeightEntrySchema)
def add_weight_entry(req: AddWeightRequest, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        entry_id = f"w-{user_id[:8]}-{req.date}-{int(datetime.datetime.now().timestamp())}"
        now_iso = datetime.datetime.now().isoformat()

        # Calculate BMI if height is in profile
        cursor.execute("SELECT height_cm FROM user_profile WHERE id = ? OR user_id = ? LIMIT 1", (user_id, user_id))
        p = cursor.fetchone()
        height_m = (p["height_cm"] / 100.0) if p and p["height_cm"] > 0 else 1.74
        calculated_bmi = round(req.weightKg / (height_m * height_m), 1)
        bmi = req.bmi if req.bmi is not None else calculated_bmi

        cursor.execute("""
        INSERT INTO weight_entries (id, user_id, date, weight_kg, bmi, body_fat_pct, waist_cm, notes, logged_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (entry_id, user_id, req.date, req.weightKg, bmi, req.bodyFatPct, req.waistCm, req.notes, now_iso))

        # Also update current profile weight
        cursor.execute(
            "UPDATE user_profile SET weight_kg = ?, updated_at = ? WHERE id = ? OR user_id = ?",
            (req.weightKg, now_iso, user_id, user_id)
        )

        return WeightEntrySchema(
            id=entry_id,
            date=req.date,
            weightKg=req.weightKg,
            bmi=bmi,
            bodyFatPct=req.bodyFatPct,
            waistCm=req.waistCm,
            notes=req.notes,
            loggedAt=now_iso
        )


@router.delete("/{entry_id}")
def delete_weight_entry(entry_id: str, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM weight_entries WHERE id = ? AND (user_id = ? OR user_id = 'default')", (entry_id, user_id))
        return {"success": True, "deletedEntryId": entry_id}
