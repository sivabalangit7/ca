import datetime
from fastapi import APIRouter, HTTPException, Request
try:
    from ..database import get_db
    from ..models import UserProfileSchema, MacroCalculateRequest
except (ImportError, ValueError):
    from backend.database import get_db
    from backend.models import UserProfileSchema, MacroCalculateRequest

router = APIRouter(prefix="/profile", tags=["User Profile & Targets"])


def get_user_id(request: Request) -> str:
    """Extract user_id from request state (injected by SecurityMiddleware)."""
    return getattr(request.state, "user_id", "default")


def calculate_bmr_tdee(age: int, gender: str, height_cm: float, weight_kg: float, activity_level: str, goal: str, diet_plan: str = "balanced"):
    """
    Standard Mifflin-St Jeor formula + ICMR reference guidelines for Indian demographics.
    """
    if gender.lower() == "female":
        bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) - 161.0
    else:
        bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) + 5.0

    multipliers = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725
    }
    multiplier = multipliers.get(activity_level, 1.375)
    tdee = bmr * multiplier

    # Adjust calorie target based on goal
    goal_offsets = {
        "maintain_health": 0,
        "maintain": 0,
        "lose_025": -250,
        "lose_weight_gradual": -250,
        "lose_05": -500,
        "lose_weight_moderate": -500,
        "lose_10": -800,
        "gain_025": 250,
        "gain_05": 500,
        "build_strength": 300,
        "general_fitness": 0
    }
    offset = goal_offsets.get(goal, 0)
    target_calories = max(1300 if gender.lower() == "female" else 1500, round(tdee + offset))

    # Macronutrient distribution based on diet plan
    # Calories per gram: Protein=4, Carbs=4, Fat=9
    if diet_plan == "high_protein":
        protein_pct, carbs_pct, fat_pct = 0.30, 0.40, 0.30
    elif diet_plan == "low_carb":
        protein_pct, carbs_pct, fat_pct = 0.25, 0.30, 0.45
    elif diet_plan == "low_fat":
        protein_pct, carbs_pct, fat_pct = 0.20, 0.65, 0.15
    else: # balanced
        protein_pct, carbs_pct, fat_pct = 0.22, 0.50, 0.28

    protein_g = round((target_calories * protein_pct) / 4.0, 1)
    carbs_g = round((target_calories * carbs_pct) / 4.0, 1)
    fat_g = round((target_calories * fat_pct) / 9.0, 1)
    fiber_g = round(max(25.0, (target_calories / 1000.0) * 14.0), 1) # ICMR recommendation: 14g per 1000 kcal

    water_ml = max(2500, round(weight_kg * 35.0)) # ~35ml per kg body weight

    return {
        "bmr": round(bmr),
        "tdee": round(tdee),
        "targetCalories": target_calories,
        "targetKj": round(target_calories * 4.184),
        "proteinG": protein_g,
        "carbsG": carbs_g,
        "fatG": fat_g,
        "fiberG": fiber_g,
        "targetWaterMl": water_ml,
        "deficitOrSurplus": offset,
        "estimatedWeeklyChangeKg": round(offset * 7 / 7700.0, 2), # ~7700 kcal per kg body fat
        "proteinRange": {"min": round(protein_g * 0.85, 1), "max": round(protein_g * 1.15, 1)},
        "carbsRange": {"min": round(carbs_g * 0.85, 1), "max": round(carbs_g * 1.15, 1)},
        "fatRange": {"min": round(fat_g * 0.85, 1), "max": round(fat_g * 1.15, 1)},
    }


@router.get("", response_model=UserProfileSchema)
def get_user_profile(request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM user_profile WHERE id = ? OR user_id = ? ORDER BY CASE WHEN id = ? THEN 0 ELSE 1 END LIMIT 1", (user_id, user_id, user_id))
        row = cursor.fetchone()

        if not row and user_id and user_id != "default":
            # Lookup user's registered name from users table
            cursor.execute("SELECT name, email FROM users WHERE id = ? OR LOWER(email) = ?", (user_id, user_id.lower()))
            u_row = cursor.fetchone()
            name = u_row["name"] if u_row else user_id.split("@")[0].replace(".", " ").capitalize()
            now_iso = datetime.datetime.now().isoformat()
            cursor.execute("""
            INSERT OR REPLACE INTO user_profile (
                id, user_id, name, age, gender, height_cm, weight_kg, activity_level, goal,
                dietary_preference, target_calories, target_protein_g, target_carbs_g,
                target_fat_g, target_fiber_g, target_water_ml, target_steps, is_custom_targets, updated_at
            ) VALUES (
                ?, ?, ?, 26, 'male', 172.0, 68.0, 'moderately_active', 'maintain_health',
                'veg', 2000, 100.0, 225.0, 55.0, 30.0, 2500, 8500, 0, ?
            )
            """, (user_id, user_id, name, now_iso))
            cursor.execute("SELECT * FROM user_profile WHERE id = ? OR user_id = ? LIMIT 1", (user_id, user_id))
            row = cursor.fetchone()

        if not row:
            # Fallback to current default only for unauthenticated guest
            cursor.execute("SELECT * FROM user_profile WHERE id = 'current' LIMIT 1")
            row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")

        return UserProfileSchema(
            name=row["name"],
            age=row["age"],
            gender=row["gender"],
            heightCm=row["height_cm"],
            weightKg=row["weight_kg"],
            activityLevel=row["activity_level"],
            goal=row["goal"],
            dietaryPreference=row["dietary_preference"],
            targetCalories=row["target_calories"],
            targetProteinG=row["target_protein_g"],
            targetCarbsG=row["target_carbs_g"],
            targetFatG=row["target_fat_g"],
            targetFiberG=row["target_fiber_g"],
            targetWaterMl=row["target_water_ml"],
            targetSteps=row["target_steps"],
            isCustomTargets=bool(row["is_custom_targets"])
        )


@router.put("", response_model=UserProfileSchema)
def update_user_profile(req: UserProfileSchema, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        now_iso = datetime.datetime.now().isoformat()

        cursor.execute("""
        INSERT OR REPLACE INTO user_profile (
            id, user_id, name, age, gender, height_cm, weight_kg, activity_level, goal,
            dietary_preference, target_calories, target_protein_g, target_carbs_g,
            target_fat_g, target_fiber_g, target_water_ml, target_steps, is_custom_targets, updated_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        """, (
            user_id, user_id, req.name, req.age, req.gender, req.heightCm, req.weightKg, req.activityLevel,
            req.goal, req.dietaryPreference, req.targetCalories, req.targetProteinG,
            req.targetCarbsG, req.targetFatG, req.targetFiberG, req.targetWaterMl,
            req.targetSteps, 1 if req.isCustomTargets else 0, now_iso
        ))

        return req


@router.post("/calculate-macros")
def calculate_macros(req: MacroCalculateRequest):
    result = calculate_bmr_tdee(
        age=req.age,
        gender=req.gender,
        height_cm=req.heightCm,
        weight_kg=req.weightKg,
        activity_level=req.activityLevel,
        goal=req.goal,
        diet_plan=req.dietPlan or "balanced"
    )
    return result
