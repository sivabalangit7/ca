import datetime
from fastapi import APIRouter, Request
try:
    from ..database import get_db
    from ..models import HabitLogSchema, ToggleHabitRequest
except (ImportError, ValueError):
    from backend.database import get_db
    from backend.models import HabitLogSchema, ToggleHabitRequest

router = APIRouter(prefix="/habits", tags=["Habits Tracking"])


def get_user_id(request: Request) -> str:
    """Extract user_id from request state (injected by SecurityMiddleware)."""
    return getattr(request.state, "user_id", "default")


@router.get("/{date}", response_model=HabitLogSchema)
def get_habit_log(date: str, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT habit_id FROM habit_logs WHERE date = ? AND user_id = ? AND completed = 1", (date, user_id))
        rows = cursor.fetchall()
        completed_ids = [r["habit_id"] for r in rows]
        return HabitLogSchema(date=date, completedHabitIds=completed_ids)


@router.post("/{date}/toggle")
def toggle_habit(date: str, req: ToggleHabitRequest, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        pk = f"{date}_{req.habitId}_{user_id}"
        cursor.execute("SELECT id, completed FROM habit_logs WHERE date = ? AND habit_id = ? AND user_id = ?", (date, req.habitId, user_id))
        row = cursor.fetchone()
        now_iso = datetime.datetime.now().isoformat()

        if row:
            if row["completed"] == 1:
                cursor.execute("DELETE FROM habit_logs WHERE date = ? AND habit_id = ? AND user_id = ?", (date, req.habitId, user_id))
                completed = False
            else:
                cursor.execute("UPDATE habit_logs SET completed = 1, logged_at = ? WHERE date = ? AND habit_id = ? AND user_id = ?", (now_iso, date, req.habitId, user_id))
                completed = True
        else:
            cursor.execute("""
            INSERT INTO habit_logs (id, date, user_id, habit_id, completed, logged_at)
            VALUES (?, ?, ?, ?, 1, ?)
            """, (pk, date, user_id, req.habitId, now_iso))
            completed = True

        cursor.execute("SELECT habit_id FROM habit_logs WHERE date = ? AND user_id = ? AND completed = 1", (date, user_id))
        completed_ids = [r["habit_id"] for r in cursor.fetchall()]

        return {
            "success": True,
            "habitId": req.habitId,
            "completed": completed,
            "date": date,
            "completedHabitIds": completed_ids
        }


@router.get("/streak/stats")
def get_habit_streak(request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT date FROM habit_logs WHERE user_id = ? AND completed = 1 ORDER BY date DESC", (user_id,))
        dates = [r["date"] for r in cursor.fetchall()]

        if not dates:
            return {"currentStreak": 0, "bestStreak": 0, "totalDaysTracked": 0}

        # Calculate consecutive days streak
        streak = 0
        today = datetime.date.today()
        current_check = today

        # Check if today is logged, if not check yesterday as ongoing streak
        today_str = today.strftime("%Y-%m-%d")
        yest_str = (today - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

        if today_str in dates:
            start_d = today
        elif yest_str in dates:
            start_d = today - datetime.timedelta(days=1)
        else:
            return {"currentStreak": 0, "bestStreak": len(dates), "totalDaysTracked": len(dates)}

        check_d = start_d
        while check_d.strftime("%Y-%m-%d") in dates:
            streak += 1
            check_d -= datetime.timedelta(days=1)

        return {
            "currentStreak": streak,
            "bestStreak": max(streak, len(dates)),
            "totalDaysTracked": len(dates)
        }
