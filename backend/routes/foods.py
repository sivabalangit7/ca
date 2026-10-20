import uuid
import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Request
try:
    from ..database import get_db
    from ..models import FoodItemSchema, CustomFoodInput
except (ImportError, ValueError):
    from backend.database import get_db
    from backend.models import FoodItemSchema, CustomFoodInput

router = APIRouter(prefix="/foods", tags=["Foods Database"])


def get_user_id(request: Request) -> str:
    """Extract user_id from request state (injected by SecurityMiddleware)."""
    return getattr(request.state, "user_id", "default")


@router.get("", response_model=List[FoodItemSchema])
def search_foods(
    request: Request,
    query: Optional[str] = Query(None, description="Search term for food name or hindi name"),
    category: Optional[str] = Query(None, description="Category filter or 'All'"),
    dietary: Optional[str] = Query(None, description="Dietary filter: 'veg', 'non-veg', 'egg', 'vegan', or 'all'"),
    customOnly: Optional[bool] = Query(False, description="Filter only custom foods"),
    limit: int = Query(250, description="Max results to return")
):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        sql = "SELECT * FROM foods_db WHERE 1=1"
        params = []

        if customOnly:
            sql += " AND is_custom = 1 AND (user_id = ? OR user_id IS NULL OR user_id = 'default')"
            params.append(user_id)
        elif category and category != "All":
            if category == "Custom":
                sql += " AND is_custom = 1 AND (user_id = ? OR user_id IS NULL OR user_id = 'default')"
                params.append(user_id)
            else:
                sql += " AND category = ? AND (is_custom = 0 OR user_id = ? OR user_id IS NULL OR user_id = 'default')"
                params.extend([category, user_id])
        else:
            sql += " AND (is_custom = 0 OR user_id = ? OR user_id IS NULL OR user_id = 'default')"
            params.append(user_id)

        if dietary and dietary != "all":
            if dietary == "veg":
                sql += " AND (dietary = 'veg' OR dietary = 'vegan')"
            else:
                sql += " AND dietary = ?"
                params.append(dietary)

        if query and query.strip():
            q_like = f"%{query.strip().lower()}%"
            sql += " AND (LOWER(name) LIKE ? OR LOWER(IFNULL(hindi_name, '')) LIKE ? OR LOWER(IFNULL(notes, '')) LIKE ?)"
            params.extend([q_like, q_like, q_like])

        sql += " ORDER BY is_custom DESC, name ASC LIMIT ?"
        params.append(limit)

        cursor.execute(sql, params)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            result.append(FoodItemSchema(
                id=r["id"],
                name=r["name"],
                hindiName=r["hindi_name"],
                category=r["category"],
                serving=r["serving"],
                servingSize=r["serving_size"] or r["serving"],
                servingUnit=r["serving_unit"] or "serving",
                defaultQuantity=r["default_quantity"],
                calories=r["calories"],
                protein=r["protein"],
                carbs=r["carbs"],
                fat=r["fat"],
                fiber=r["fiber"] if r["fiber"] is not None else 0.0,
                dietary=r["dietary"] or "veg",
                isCustom=bool(r["is_custom"]),
                notes=r["notes"]
            ))
        return result


@router.get("/recent", response_model=List[FoodItemSchema])
def get_recent_foods(request: Request, limit: int = 8):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT f.* FROM foods_db f
        INNER JOIN (
            SELECT food_id, MAX(logged_at) as last_logged
            FROM logged_foods
            WHERE user_id = ?
            GROUP BY food_id
            ORDER BY last_logged DESC
            LIMIT ?
        ) rf ON f.id = rf.food_id
        ORDER BY rf.last_logged DESC
        """, (user_id, limit))
        rows = cursor.fetchall()
        if not rows:
            # Fallback popular foods
            cursor.execute("SELECT * FROM foods_db WHERE id IN ('si-idli', 'si-plain-dosa', 'ni-roti', 'rc-white-rice', 'pr-boiled-egg', 'ni-dal-tadka') LIMIT ?", (limit,))
            rows = cursor.fetchall()

        result = []
        for r in rows:
            result.append(FoodItemSchema(
                id=r["id"],
                name=r["name"],
                hindiName=r["hindi_name"],
                category=r["category"],
                serving=r["serving"],
                servingSize=r["serving_size"] or r["serving"],
                servingUnit=r["serving_unit"] or "serving",
                defaultQuantity=r["default_quantity"],
                calories=r["calories"],
                protein=r["protein"],
                carbs=r["carbs"],
                fat=r["fat"],
                fiber=r["fiber"] or 0.0,
                dietary=r["dietary"] or "veg",
                isCustom=bool(r["is_custom"]),
                notes=r["notes"]
            ))
        return result


@router.post("/custom", response_model=FoodItemSchema)
def create_custom_food(req: CustomFoodInput, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        food_id = f"custom-{user_id[:8]}-{int(datetime.datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:4]}"
        now_iso = datetime.datetime.now().isoformat()
        serving_str = req.serving.strip() if req.serving else f"1 {req.servingUnit or 'serving'}"

        cursor.execute("""
        INSERT INTO foods_db (
            id, user_id, name, hindi_name, category, serving, serving_size, serving_unit,
            default_quantity, calories, protein, carbs, fat, fiber, dietary, notes, is_custom, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1.0, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (
            food_id, user_id, req.name.strip(), req.hindiName, req.category, serving_str,
            serving_str, req.servingUnit or "serving", round(req.calories),
            round(req.protein, 1), round(req.carbs, 1), round(req.fat, 1),
            round(req.fiber or 0.0, 1), req.dietary, req.notes or "Custom user added food", now_iso
        ))

        return FoodItemSchema(
            id=food_id,
            name=req.name.strip(),
            hindiName=req.hindiName,
            category=req.category,
            serving=serving_str,
            servingSize=serving_str,
            servingUnit=req.servingUnit or "serving",
            defaultQuantity=1.0,
            calories=round(req.calories),
            protein=round(req.protein, 1),
            carbs=round(req.carbs, 1),
            fat=round(req.fat, 1),
            fiber=round(req.fiber or 0.0, 1),
            dietary=req.dietary,
            isCustom=True,
            notes=req.notes or "Custom user added food"
        )


@router.delete("/custom/{food_id}")
def delete_custom_food(food_id: str, request: Request):
    user_id = get_user_id(request)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM foods_db WHERE id = ? AND is_custom = 1 AND (user_id = ? OR user_id = 'default' OR user_id IS NULL)",
            (food_id, user_id)
        )
        return {"success": True, "deletedFoodId": food_id}
