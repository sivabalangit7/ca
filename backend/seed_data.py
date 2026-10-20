import json
import re
import os
import datetime
try:
    from .database import get_db, init_db
except (ImportError, ValueError):
    from backend.database import get_db, init_db

def parse_indian_foods_ts():
    """Extracts food items from src/data/indianFoods.ts to seed into sqlite foods_db."""
    ts_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "indianFoods.ts")
    foods = []
    if not os.path.exists(ts_file):
        return foods

    with open(ts_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Match object blocks { id: '...', ... }
    # Let's extract items using regex for fields
    item_blocks = re.findall(r'\{\s*id:\s*[\'"]([^\'"]+)[\'"],(.*?)\}', content, re.DOTALL)
    for food_id, body in item_blocks:
        name_m = re.search(r'name:\s*[\'"]([^\'"]+)[\'"]', body)
        hindi_m = re.search(r'hindiName:\s*[\'"]([^\'"]+)[\'"]', body)
        category_m = re.search(r'category:\s*[\'"]([^\'"]+)[\'"]', body)
        serving_m = re.search(r'serving:\s*[\'"]([^\'"]+)[\'"]', body)
        serving_size_m = re.search(r'servingSize:\s*[\'"]([^\'"]+)[\'"]', body)
        unit_m = re.search(r'servingUnit:\s*[\'"]([^\'"]+)[\'"]', body)
        qty_m = re.search(r'defaultQuantity:\s*([0-9.]+)', body)
        cal_m = re.search(r'calories:\s*([0-9.]+)', body)
        prot_m = re.search(r'protein:\s*([0-9.]+)', body)
        carbs_m = re.search(r'carbs:\s*([0-9.]+)', body)
        fat_m = re.search(r'fat:\s*([0-9.]+)', body)
        fiber_m = re.search(r'fiber:\s*([0-9.]+)', body)
        dietary_m = re.search(r'dietary:\s*[\'"]([^\'"]+)[\'"]', body)
        notes_m = re.search(r'notes:\s*[\'"]([^\'"]+)[\'"]', body)

        if name_m and cal_m:
            foods.append({
                "id": food_id,
                "name": name_m.group(1),
                "hindi_name": hindi_m.group(1) if hindi_m else None,
                "category": category_m.group(1) if category_m else "North Indian",
                "serving": serving_m.group(1) if serving_m else "1 serving",
                "serving_size": serving_size_m.group(1) if serving_size_m else (serving_m.group(1) if serving_m else "1 serving"),
                "serving_unit": unit_m.group(1) if unit_m else "serving",
                "default_quantity": float(qty_m.group(1)) if qty_m else 1.0,
                "calories": float(cal_m.group(1)),
                "protein": float(prot_m.group(1)) if prot_m else 0.0,
                "carbs": float(carbs_m.group(1)) if carbs_m else 0.0,
                "fat": float(fat_m.group(1)) if fat_m else 0.0,
                "fiber": float(fiber_m.group(1)) if fiber_m else 0.0,
                "dietary": dietary_m.group(1) if dietary_m else "veg",
                "notes": notes_m.group(1) if notes_m else None,
                "is_custom": 0
            })
    return foods


def seed_database_if_empty():
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Check if user profile exists
        cursor.execute("SELECT COUNT(*) FROM user_profile")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
            INSERT INTO user_profile (
                id, name, age, gender, height_cm, weight_kg, activity_level, goal,
                dietary_preference, target_calories, target_protein_g, target_carbs_g,
                target_fat_g, target_fiber_g, target_water_ml, target_steps, is_custom_targets
            ) VALUES (
                'current', 'Aarav Sharma', 28, 'male', 174.0, 74.5, 'moderately_active', 'lose_05',
                'veg', 1950, 110.0, 220.0, 52.0, 35.0, 3000, 10000, 0
            )
            """)

        # 2. Check if foods exist
        cursor.execute("SELECT COUNT(*) FROM foods_db")
        if cursor.fetchone()[0] == 0:
            parsed_foods = parse_indian_foods_ts()
            for f in parsed_foods:
                cursor.execute("""
                INSERT OR REPLACE INTO foods_db (
                    id, name, hindi_name, category, serving, serving_size, serving_unit,
                    default_quantity, calories, protein, carbs, fat, fiber, dietary, notes, is_custom
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f["id"], f["name"], f["hindi_name"], f["category"], f["serving"],
                    f["serving_size"], f["serving_unit"], f["default_quantity"],
                    f["calories"], f["protein"], f["carbs"], f["fat"], f["fiber"],
                    f["dietary"], f["notes"], f["is_custom"]
                ))

        # 3. Seed weight entries if none exist
        cursor.execute("SELECT COUNT(*) FROM weight_entries")
        if cursor.fetchone()[0] == 0:
            today = datetime.date.today()
            weights_data = [
                (today - datetime.timedelta(days=28), 77.2, "Initial check-in"),
                (today - datetime.timedelta(days=21), 76.5, "Good adherence to deficit"),
                (today - datetime.timedelta(days=14), 75.8, "Steady progress"),
                (today - datetime.timedelta(days=7), 75.1, "Feeling energetic, gym workouts consistent"),
                (today, 74.5, "Goal milestone 1 achieved!")
            ]
            for d, w, note in weights_data:
                d_str = d.strftime("%Y-%m-%d")
                height_m = 1.74
                bmi = round(w / (height_m * height_m), 1)
                cursor.execute("""
                INSERT INTO weight_entries (id, date, weight_kg, bmi, body_fat_pct, waist_cm, notes, logged_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (f"w-{d_str}", d_str, w, bmi, 18.5, 84.0, note, d_str + "T08:00:00Z"))

        # 4. Seed sample daily logs for recent 7 days if none exist
        cursor.execute("SELECT COUNT(*) FROM logged_foods")
        if cursor.fetchone()[0] == 0:
            today = datetime.date.today()
            sample_days = [
                {
                    "date": today.strftime("%Y-%m-%d"),
                    "water": 2250,
                    "steps": 8420,
                    "exercise": 45,
                    "sleep": 7.5,
                    "foods": [
                        ("si-idli", "Idli (Steamed Rice & Urad Dal Cake)", "South Indian", "breakfast", "2 medium idlis (100g)", "piece", 2.0, 130, 4.5, 26, 0.8, 2.2, "vegan"),
                        ("si-sambar", "Vegetable Sambar", "South Indian", "breakfast", "1 bowl (150ml)", "bowl", 1.0, 110, 4.2, 18, 2.5, 3.8, "vegan"),
                        ("ni-dal-tadka", "Dal Tadka (Yellow Lentils)", "North Indian", "lunch", "1 bowl (150g)", "bowl", 1.0, 150, 7.5, 20, 4.5, 4.0, "veg"),
                        ("ni-roti", "Phulka / Roti (Whole Wheat)", "North Indian", "lunch", "1 medium phulka (30g)", "piece", 2.0, 160, 6.0, 30, 1.6, 3.6, "vegan"),
                        ("ni-paneer-bhurji", "Paneer Bhurji (Scrambled Cottage Cheese)", "North Indian", "lunch", "1 small bowl (100g)", "bowl", 1.0, 190, 12.0, 4.0, 14.0, 1.2, "veg"),
                        ("sn-roasted-makhana", "Roasted Makhana (Fox Nuts)", "Snacks", "snacks", "1 bowl (30g)", "bowl", 1.0, 110, 3.0, 20, 2.0, 2.5, "vegan"),
                        ("bv-masala-chai", "Masala Chai (with Milk & Spice)", "Beverages", "snacks", "1 cup (150ml)", "cup", 1.0, 75, 2.2, 10, 2.8, 0.0, "veg"),
                        ("rc-white-rice", "Cooked Rice (Steamed)", "Rice", "dinner", "1 katori / bowl (150g)", "bowl", 1.0, 195, 4.0, 43, 0.5, 0.6, "vegan"),
                        ("ni-dal-makhani", "Dal Makhani", "North Indian", "dinner", "1 bowl (150g)", "bowl", 1.0, 260, 8.5, 22, 15.0, 5.0, "veg"),
                    ],
                    "habits": ["h-water", "h-protein", "h-steps", "h-sleep", "h-veggies"]
                },
                {
                    "date": (today - datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
                    "water": 2750,
                    "steps": 10350,
                    "exercise": 50,
                    "sleep": 8.0,
                    "foods": [
                        ("si-plain-dosa", "Plain Dosa (Crispy Crepe)", "South Indian", "breakfast", "1 medium dosa (80g)", "piece", 1.0, 165, 3.8, 28, 4.2, 1.8, "veg"),
                        ("si-coconut-chutney", "Fresh Coconut Chutney", "South Indian", "breakfast", "2 tbsp (30g)", "tbsp", 1.0, 95, 1.1, 3.0, 9.0, 1.5, "vegan"),
                        ("pr-boiled-egg", "Boiled Whole Egg", "Protein", "breakfast", "1 large egg (50g)", "piece", 2.0, 144, 12.6, 0.8, 9.6, 0.0, "egg"),
                        ("ni-chole", "Chole / Chana Masala", "North Indian", "lunch", "1 bowl (150g)", "bowl", 1.0, 210, 9.0, 30, 6.0, 6.5, "vegan"),
                        ("ni-roti", "Phulka / Roti (Whole Wheat)", "North Indian", "lunch", "1 medium phulka (30g)", "piece", 2.0, 160, 6.0, 30, 1.6, 3.6, "vegan"),
                        ("sn-sprouted-moong-salad", "Sprouted Moong Salad", "Snacks", "snacks", "1 bowl (100g)", "bowl", 1.0, 105, 7.0, 18, 0.8, 4.0, "vegan"),
                        ("ni-dal-tadka", "Dal Tadka (Yellow Lentils)", "North Indian", "dinner", "1 bowl (150g)", "bowl", 1.0, 150, 7.5, 20, 4.5, 4.0, "veg"),
                        ("ni-roti", "Phulka / Roti (Whole Wheat)", "North Indian", "dinner", "1 medium phulka (30g)", "piece", 2.0, 160, 6.0, 30, 1.6, 3.6, "vegan"),
                    ],
                    "habits": ["h-water", "h-protein", "h-steps", "h-sleep", "h-workout", "h-veggies"]
                }
            ]

            for sday in sample_days:
                date_str = sday["date"]
                cursor.execute("INSERT OR IGNORE INTO daily_logs (date) VALUES (?)", (date_str,))
                cursor.execute("""
                INSERT OR REPLACE INTO activity_logs (date, steps, target_steps, exercise_minutes, sleep_hours)
                VALUES (?, ?, 10000, ?, ?)
                """, (date_str, sday["steps"], sday["exercise"], sday["sleep"]))

                cursor.execute("""
                INSERT OR REPLACE INTO water_entries (id, date, amount_ml, target_ml, logged_at)
                VALUES (?, ?, ?, 3000, ?)
                """, (f"w-{date_str}-1", date_str, sday["water"], f"{date_str}T18:00:00Z"))

                for idx, item in enumerate(sday["foods"]):
                    log_id = f"log-{date_str}-{idx}"
                    food_id, name, cat, meal, serv, unit, qty, cal, prot, carbs, fat, fib, diet = item
                    cursor.execute("""
                    INSERT OR REPLACE INTO logged_foods (
                        log_id, date, food_id, name, category, meal_category, serving, unit,
                        quantity, calories, protein, carbs, fat, fiber, dietary, source, logged_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?)
                    """, (log_id, date_str, food_id, name, cat, meal, serv, unit, qty, cal, prot, carbs, fat, fib, diet, f"{date_str}T12:00:00Z"))

                for h_id in sday["habits"]:
                    cursor.execute("""
                    INSERT OR REPLACE INTO habit_logs (id, date, habit_id, completed, logged_at)
                    VALUES (?, ?, ?, 1, ?)
                    """, (f"{date_str}_{h_id}", date_str, h_id, f"{date_str}T20:00:00Z"))
