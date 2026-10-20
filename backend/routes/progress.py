import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Query, Request
try:
    from ..database import get_db
except (ImportError, ValueError):
    from backend.database import get_db

router = APIRouter(prefix="/progress", tags=["Analytics & Progress"])


def get_user_id(request: Request) -> str:
    """Extract user_id from request state (injected by SecurityMiddleware)."""
    return getattr(request.state, "user_id", "default")


@router.get("")
def get_progress_analytics(
    request: Request,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze (1 to 365)")
):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Generate dates list
        today = datetime.date.today()
        dates = [(today - datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days - 1, -1, -1)]

        # 2. Get profile targets
        cursor.execute(
            "SELECT target_calories, target_protein_g, target_carbs_g, target_fat_g, target_water_ml, target_steps "
            "FROM user_profile WHERE id = ? OR user_id = ? LIMIT 1",
            (user_id, user_id)
        )
        p = cursor.fetchone()
        target_cal = p["target_calories"] if p else 1950
        target_prot = p["target_protein_g"] if p else 110.0
        target_carbs = p["target_carbs_g"] if p else 220.0
        target_fat = p["target_fat_g"] if p else 52.0
        target_water = p["target_water_ml"] if p else 3000
        target_steps = p["target_steps"] if p else 10000

        # 3. Fetch foods aggregated per date
        placeholders = ",".join("?" for _ in dates)
        cursor.execute(f"""
        SELECT date,
               SUM(calories) as total_cal,
               SUM(protein) as total_prot,
               SUM(carbs) as total_carbs,
               SUM(fat) as total_fat,
               SUM(fiber) as total_fiber,
               COUNT(log_id) as items_count
        FROM logged_foods
        WHERE date IN ({placeholders}) AND user_id = ?
        GROUP BY date
        """, (*dates, user_id))
        food_agg = {r["date"]: dict(r) for r in cursor.fetchall()}

        # 4. Fetch water aggregated per date
        cursor.execute(f"""
        SELECT date, SUM(amount_ml) as total_water
        FROM water_entries
        WHERE date IN ({placeholders}) AND user_id = ?
        GROUP BY date
        """, (*dates, user_id))
        water_agg = {r["date"]: r["total_water"] for r in cursor.fetchall()}

        # 5. Fetch activity per date
        cursor.execute(f"""
        SELECT date, steps, exercise_minutes, sleep_hours
        FROM activity_logs
        WHERE date IN ({placeholders}) AND user_id = ?
        """, (*dates, user_id))
        act_agg = {r["date"]: dict(r) for r in cursor.fetchall()}

        # 6. Fetch habits per date
        cursor.execute(f"""
        SELECT date, COUNT(habit_id) as completed_count
        FROM habit_logs
        WHERE date IN ({placeholders}) AND completed = 1 AND user_id = ?
        GROUP BY date
        """, (*dates, user_id))
        habit_agg = {r["date"]: r["completed_count"] for r in cursor.fetchall()}

        # 7. Construct daily history
        history = []
        for d_str in dates:
            d_obj = datetime.datetime.strptime(d_str, "%Y-%m-%d").date()
            f_data = food_agg.get(d_str, {})
            w_data = water_agg.get(d_str, 0)
            a_data = act_agg.get(d_str, {})
            h_count = habit_agg.get(d_str, 0)

            label = d_obj.strftime("%a") if days == 7 else d_obj.strftime("%d %b")

            cal = round(f_data.get("total_cal") or 0)
            prot = round(f_data.get("total_prot") or 0.0, 1)
            carbs = round(f_data.get("total_carbs") or 0.0, 1)
            fat = round(f_data.get("total_fat") or 0.0, 1)
            fiber = round(f_data.get("total_fiber") or 0.0, 1)
            steps = a_data.get("steps") or 0
            exercise = a_data.get("exercise_minutes") or 0
            sleep = a_data.get("sleep_hours") or 0.0

            habit_score = min(100, round((h_count / 6.0) * 100))

            history.append({
                "date": d_str,
                "label": label,
                "calories": cal,
                "protein": prot,
                "carbs": carbs,
                "fat": fat,
                "fiber": fiber,
                "water": w_data,
                "steps": steps,
                "exerciseMin": exercise,
                "sleepHours": sleep,
                "habitScore": habit_score,
                "deficit": target_cal - cal if cal > 0 else 0
            })

        # Summary statistics
        active_days = [h for h in history if h["calories"] > 0]
        avg_calories = round(sum(h["calories"] for h in active_days) / len(active_days)) if active_days else 0
        avg_protein = round(sum(h["protein"] for h in active_days) / len(active_days), 1) if active_days else 0
        avg_water = round(sum(h["water"] for h in history) / len(history)) if history else 0
        avg_steps = round(sum(h["steps"] for h in history) / len(history)) if history else 0

        return {
            "days": days,
            "targetCalories": target_cal,
            "targetProtein": target_prot,
            "targetCarbs": target_carbs,
            "targetFat": target_fat,
            "targetWater": target_water,
            "targetSteps": target_steps,
            "history": history,
            "averages": {
                "calories": avg_calories,
                "protein": avg_protein,
                "water": avg_water,
                "steps": avg_steps,
                "trackedDays": len(active_days)
            }
        }
