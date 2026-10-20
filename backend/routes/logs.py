import uuid
import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
try:
    from ..database import get_db
    from ..models import (
        DailyLogResponse,
        AddFoodRequest,
        UpdateFoodQuantityRequest,
        AddWaterRequest,
        UpdateActivityRequest,
        LoggedFoodItemSchema,
        WaterLogSchema,
        WaterEntrySchema,
        ActivityLogSchema
    )
except (ImportError, ValueError):
    from backend.database import get_db
    from backend.models import (
        DailyLogResponse,
        AddFoodRequest,
        UpdateFoodQuantityRequest,
        AddWaterRequest,
        UpdateActivityRequest,
        LoggedFoodItemSchema,
        WaterLogSchema,
        WaterEntrySchema,
        ActivityLogSchema
    )

router = APIRouter(prefix="/logs", tags=["Daily Logs"])


def get_user_id(request: Request) -> str:
    """Extract user_id from request state (injected by SecurityMiddleware)."""
    return getattr(request.state, "user_id", "default")


def calculate_nutrition_totals(foods):
    totals = {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0}
    meal_breakdown = {
        "breakfast": {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0, "items_count": 0},
        "lunch": {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0, "items_count": 0},
        "snacks": {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0, "items_count": 0},
        "dinner": {"calories": 0, "protein": 0.0, "carbs": 0.0, "fat": 0.0, "fiber": 0.0, "items_count": 0},
    }

    for f in foods:
        cal = f["calories"]
        prot = f["protein"]
        carb = f["carbs"]
        fat = f["fat"]
        fib = f["fiber"]
        meal = f["meal_category"]

        totals["calories"] += cal
        totals["protein"] += prot
        totals["carbs"] += carb
        totals["fat"] += fat
        totals["fiber"] += fib

        if meal in meal_breakdown:
            meal_breakdown[meal]["calories"] += cal
            meal_breakdown[meal]["protein"] += prot
            meal_breakdown[meal]["carbs"] += carb
            meal_breakdown[meal]["fat"] += fat
            meal_breakdown[meal]["fiber"] += fib
            meal_breakdown[meal]["items_count"] += 1

    totals["calories"] = round(totals["calories"])
    totals["protein"] = round(totals["protein"], 1)
    totals["carbs"] = round(totals["carbs"], 1)
    totals["fat"] = round(totals["fat"], 1)
    totals["fiber"] = round(totals["fiber"], 1)

    for m in meal_breakdown:
        meal_breakdown[m]["calories"] = round(meal_breakdown[m]["calories"])
        meal_breakdown[m]["protein"] = round(meal_breakdown[m]["protein"], 1)
        meal_breakdown[m]["carbs"] = round(meal_breakdown[m]["carbs"], 1)
        meal_breakdown[m]["fat"] = round(meal_breakdown[m]["fat"], 1)
        meal_breakdown[m]["fiber"] = round(meal_breakdown[m]["fiber"], 1)

    return totals, meal_breakdown


@router.get("/{date}", response_model=DailyLogResponse)
def get_daily_log(date: str, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Fetch Logged Foods (filtered by user_id)
        cursor.execute("""
        SELECT log_id, food_id, name, category, meal_category, serving, unit,
               quantity, calories, protein, carbs, fat, fiber, dietary, source, logged_at
        FROM logged_foods WHERE date = ? AND user_id = ? ORDER BY logged_at ASC
        """, (date, user_id))
        rows = cursor.fetchall()
        foods_list = []
        raw_foods = []
        for r in rows:
            food_dict = dict(r)
            raw_foods.append(food_dict)
            foods_list.append(LoggedFoodItemSchema(
                logId=food_dict["log_id"],
                id=food_dict["log_id"],
                foodId=food_dict["food_id"],
                name=food_dict["name"],
                foodName=food_dict["name"],
                category=food_dict["category"] or "Custom",
                mealCategory=food_dict["meal_category"],
                mealType=food_dict["meal_category"],
                serving=food_dict["serving"] or "1 serving",
                unit=food_dict["unit"] or "serving",
                quantity=food_dict["quantity"],
                calories=food_dict["calories"],
                protein=food_dict["protein"],
                carbs=food_dict["carbs"],
                fat=food_dict["fat"],
                fiber=food_dict["fiber"],
                dietary=food_dict["dietary"] or "veg",
                loggedAt=food_dict["logged_at"],
                date=date,
                source=food_dict["source"] or "manual"
            ))

        # 2. Fetch Water Entries (filtered by user_id)
        cursor.execute("SELECT id, amount_ml, target_ml, logged_at FROM water_entries WHERE date = ? AND user_id = ? ORDER BY logged_at ASC", (date, user_id))
        w_rows = cursor.fetchall()
        total_water = sum(r["amount_ml"] for r in w_rows)
        target_water = w_rows[0]["target_ml"] if w_rows else 2500
        water_entries = [WaterEntrySchema(id=r["id"], amountMl=r["amount_ml"], timestamp=r["logged_at"]) for r in w_rows]
        water_schema = WaterLogSchema(amountMl=total_water, targetMl=target_water, entries=water_entries)

        # 3. Fetch Activity Log (filtered by user_id)
        cursor.execute("SELECT steps, target_steps, exercise_minutes, sleep_hours FROM activity_logs WHERE date = ? AND user_id = ?", (date, user_id))
        act_row = cursor.fetchone()
        if act_row:
            act_schema = ActivityLogSchema(
                steps=act_row["steps"],
                targetSteps=act_row["target_steps"],
                exerciseMinutes=act_row["exercise_minutes"],
                sleepHours=act_row["sleep_hours"]
            )
        else:
            act_schema = ActivityLogSchema(steps=0, targetSteps=8500, exerciseMinutes=0, sleepHours=7.0)

        # 4. Fetch Notes (filtered by user_id)
        cursor.execute("SELECT notes FROM daily_logs WHERE date = ? AND user_id = ?", (date, user_id))
        d_row = cursor.fetchone()
        notes = d_row["notes"] if d_row else None

        totals, meal_breakdown = calculate_nutrition_totals(raw_foods)

        return DailyLogResponse(
            date=date,
            foods=foods_list,
            water=water_schema,
            activity=act_schema,
            notes=notes,
            totals=totals,
            mealBreakdown=meal_breakdown
        )


@router.post("/{date}/foods", response_model=LoggedFoodItemSchema)
def add_food_to_log(date: str, req: AddFoodRequest, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        log_id = f"log-{int(datetime.datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
        now_iso = datetime.datetime.now().isoformat()

        cursor.execute("INSERT OR IGNORE INTO daily_logs (date, user_id) VALUES (?, ?)", (date, user_id))
        cursor.execute("""
        INSERT INTO logged_foods (
            log_id, date, user_id, food_id, name, category, meal_category, serving, unit,
            quantity, calories, protein, carbs, fat, fiber, dietary, source, logged_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_id, date, user_id, req.foodId, req.name, req.category, req.mealCategory,
            req.serving, req.unit, req.quantity, req.calories, req.protein,
            req.carbs, req.fat, req.fiber, req.dietary, req.source, now_iso
        ))

        return LoggedFoodItemSchema(
            logId=log_id,
            id=log_id,
            foodId=req.foodId,
            name=req.name,
            foodName=req.name,
            category=req.category,
            mealCategory=req.mealCategory,
            mealType=req.mealCategory,
            serving=req.serving,
            unit=req.unit,
            quantity=req.quantity,
            calories=req.calories,
            protein=req.protein,
            carbs=req.carbs,
            fat=req.fat,
            fiber=req.fiber,
            dietary=req.dietary,
            loggedAt=now_iso,
            date=date,
            source=req.source
        )


@router.put("/{date}/foods/{log_id}")
def update_logged_food_quantity(date: str, log_id: str, req: UpdateFoodQuantityRequest, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT food_id, quantity, calories, protein, carbs, fat, fiber FROM logged_foods WHERE log_id = ? AND date = ? AND user_id = ?", (log_id, date, user_id))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Logged food not found")

        old_qty = row["quantity"]
        new_qty = max(0.1, req.quantity)

        # Check if we have base food to scale precisely
        cursor.execute("SELECT calories, protein, carbs, fat, fiber FROM foods_db WHERE id = ?", (row["food_id"],))
        base_food = cursor.fetchone()

        if base_food:
            new_cal = round(base_food["calories"] * new_qty)
            new_prot = round(base_food["protein"] * new_qty, 1)
            new_carb = round(base_food["carbs"] * new_qty, 1)
            new_fat = round(base_food["fat"] * new_qty, 1)
            new_fib = round(base_food["fiber"] * new_qty, 1)
        else:
            ratio = new_qty / old_qty if old_qty > 0 else 1.0
            new_cal = round(row["calories"] * ratio)
            new_prot = round(row["protein"] * ratio, 1)
            new_carb = round(row["carbs"] * ratio, 1)
            new_fat = round(row["fat"] * ratio, 1)
            new_fib = round(row["fiber"] * ratio, 1)

        cursor.execute("""
        UPDATE logged_foods
        SET quantity = ?, calories = ?, protein = ?, carbs = ?, fat = ?, fiber = ?
        WHERE log_id = ? AND date = ? AND user_id = ?
        """, (new_qty, new_cal, new_prot, new_carb, new_fat, new_fib, log_id, date, user_id))

        return {"success": True, "logId": log_id, "quantity": new_qty, "calories": new_cal}


@router.delete("/{date}/foods/{log_id}")
def delete_logged_food(date: str, log_id: str, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM logged_foods WHERE log_id = ? AND date = ? AND user_id = ?", (log_id, date, user_id))
        return {"success": True, "deletedLogId": log_id}


@router.delete("/{date}/clear-meal/{meal_category}")
def clear_meal(date: str, meal_category: str, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM logged_foods WHERE date = ? AND meal_category = ? AND user_id = ?", (date, meal_category, user_id))
        return {"success": True, "clearedMeal": meal_category}


@router.delete("/{date}/clear")
def clear_day(date: str, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM logged_foods WHERE date = ? AND user_id = ?", (date, user_id))
        cursor.execute("DELETE FROM water_entries WHERE date = ? AND user_id = ?", (date, user_id))
        cursor.execute("DELETE FROM activity_logs WHERE date = ? AND user_id = ?", (date, user_id))
        return {"success": True, "clearedDate": date}


@router.post("/{date}/water", response_model=WaterLogSchema)
def add_water(date: str, req: AddWaterRequest, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        entry_id = f"w-{int(datetime.datetime.now().timestamp() * 1000)}"
        now_iso = datetime.datetime.now().isoformat()
        target = req.targetMl or 2500

        cursor.execute("""
        INSERT INTO water_entries (id, date, user_id, amount_ml, target_ml, logged_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (entry_id, date, user_id, req.amountMl, target, now_iso))

        # Return updated water log (filtered by user_id)
        cursor.execute("SELECT id, amount_ml, target_ml, logged_at FROM water_entries WHERE date = ? AND user_id = ? ORDER BY logged_at ASC", (date, user_id))
        w_rows = cursor.fetchall()
        total_water = sum(r["amount_ml"] for r in w_rows)
        target_water = w_rows[0]["target_ml"] if w_rows else target
        water_entries = [WaterEntrySchema(id=r["id"], amountMl=r["amount_ml"], timestamp=r["logged_at"]) for r in w_rows]

        return WaterLogSchema(amountMl=total_water, targetMl=target_water, entries=water_entries)


@router.put("/{date}/activity", response_model=ActivityLogSchema)
def update_activity(date: str, req: UpdateActivityRequest, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT steps, target_steps, exercise_minutes, sleep_hours FROM activity_logs WHERE date = ? AND user_id = ?", (date, user_id))
        row = cursor.fetchone()

        steps = req.steps if req.steps is not None else (row["steps"] if row else 0)
        target_steps = req.targetSteps if req.targetSteps is not None else (row["target_steps"] if row else 8500)
        exercise_min = req.exerciseMinutes if req.exerciseMinutes is not None else (row["exercise_minutes"] if row else 0)
        sleep_h = req.sleepHours if req.sleepHours is not None else (row["sleep_hours"] if row else 7.0)
        now_iso = datetime.datetime.now().isoformat()

        cursor.execute("""
        INSERT OR REPLACE INTO activity_logs (date, user_id, steps, target_steps, exercise_minutes, sleep_hours, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (date, user_id, steps, target_steps, exercise_min, sleep_h, now_iso))

        return ActivityLogSchema(
            steps=steps,
            targetSteps=target_steps,
            exerciseMinutes=exercise_min,
            sleepHours=sleep_h
        )
