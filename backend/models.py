from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# Nutrition & Food models
FoodCategory = Literal[
    'South Indian',
    'North Indian',
    'Rice',
    'Protein',
    'Protein foods',
    'Vegetables',
    'Fruits',
    'Snacks',
    'Beverages',
    'Drinks',
    'Custom'
]

DietaryType = Literal['veg', 'non-veg', 'egg', 'vegan']
MealCategory = Literal['breakfast', 'lunch', 'snacks', 'dinner']
ActivityLevel = Literal['sedentary', 'lightly_active', 'moderately_active', 'very_active']
GoalType = Literal[
    'maintain_health',
    'maintain',
    'lose_025',
    'lose_weight_gradual',
    'lose_05',
    'lose_weight_moderate',
    'lose_10',
    'gain_025',
    'gain_05',
    'build_strength',
    'general_fitness'
]
GenderType = Literal['male', 'female', 'other']


class FoodItemSchema(BaseModel):
    id: str
    name: str
    hindiName: Optional[str] = None
    category: str
    serving: str
    servingSize: Optional[str] = None
    servingUnit: str = 'serving'
    defaultQuantity: float = 1.0
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float = 0.0
    dietary: DietaryType = 'veg'
    isCustom: bool = False
    notes: Optional[str] = None


class CustomFoodInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    hindiName: Optional[str] = Field(None, max_length=120)
    category: str = Field('Custom', max_length=50)
    serving: str = Field(..., min_length=1, max_length=60)
    servingSize: Optional[str] = Field(None, max_length=60)
    servingUnit: str = Field('serving', max_length=30)
    calories: float = Field(..., ge=0, le=15000)
    protein: float = Field(..., ge=0, le=1000)
    carbs: float = Field(..., ge=0, le=2000)
    fat: float = Field(..., ge=0, le=1000)
    fiber: float = Field(0.0, ge=0, le=500)
    dietary: DietaryType = 'veg'
    notes: Optional[str] = Field(None, max_length=500)


class LoggedFoodItemSchema(BaseModel):
    logId: str
    id: Optional[str] = None
    foodId: str
    name: str
    foodName: Optional[str] = None
    category: str
    mealCategory: MealCategory
    mealType: Optional[MealCategory] = None
    serving: str
    servingSize: Optional[str] = None
    unit: str = 'serving'
    quantity: float = Field(..., ge=0.01, le=100.0)
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float = 0.0
    dietary: DietaryType = 'veg'
    loggedAt: str
    date: Optional[str] = None
    source: str = 'manual'


class AddFoodRequest(BaseModel):
    foodId: str
    name: str = Field(..., min_length=1, max_length=120)
    category: str = Field(..., max_length=50)
    mealCategory: MealCategory
    serving: str = Field(..., max_length=60)
    unit: str = Field('serving', max_length=30)
    quantity: float = Field(1.0, ge=0.01, le=100.0)
    calories: float = Field(..., ge=0, le=15000)
    protein: float = Field(..., ge=0, le=1000)
    carbs: float = Field(..., ge=0, le=2000)
    fat: float = Field(..., ge=0, le=1000)
    fiber: float = Field(0.0, ge=0, le=500)
    dietary: DietaryType = 'veg'
    source: str = Field('manual', max_length=30)


class UpdateFoodQuantityRequest(BaseModel):
    quantity: float = Field(..., ge=0.05, le=50.0)


class WaterEntrySchema(BaseModel):
    id: str
    amountMl: int
    timestamp: str


class WaterLogSchema(BaseModel):
    amountMl: int
    targetMl: int = 2500
    entries: List[WaterEntrySchema] = []


class AddWaterRequest(BaseModel):
    amountMl: int = Field(..., ge=1, le=5000)
    targetMl: Optional[int] = Field(None, ge=500, le=10000)


class ActivityLogSchema(BaseModel):
    steps: int = 0
    targetSteps: int = 8500
    exerciseMinutes: int = 0
    sleepHours: float = 7.0


class UpdateActivityRequest(BaseModel):
    steps: Optional[int] = None
    targetSteps: Optional[int] = None
    exerciseMinutes: Optional[int] = None
    sleepHours: Optional[float] = None


class DailyLogResponse(BaseModel):
    date: str
    foods: List[LoggedFoodItemSchema] = []
    water: WaterLogSchema
    activity: ActivityLogSchema
    notes: Optional[str] = None
    totals: dict = Field(default_factory=dict)
    mealBreakdown: dict = Field(default_factory=dict)


class UserProfileSchema(BaseModel):
    name: str = 'Aarav Sharma'
    age: int = 28
    gender: GenderType = 'male'
    heightCm: float = 174.0
    weightKg: float = 74.5
    activityLevel: ActivityLevel = 'moderately_active'
    goal: GoalType = 'lose_05'
    dietaryPreference: DietaryType = 'veg'
    targetCalories: int = 1950
    targetProteinG: float = 110.0
    targetCarbsG: float = 220.0
    targetFatG: float = 52.0
    targetFiberG: float = 35.0
    targetWaterMl: int = 3000
    targetSteps: int = 10000
    isCustomTargets: bool = False


class WeightEntrySchema(BaseModel):
    id: str
    date: str
    weightKg: float
    bmi: Optional[float] = None
    bodyFatPct: Optional[float] = None
    waistCm: Optional[float] = None
    notes: Optional[str] = None
    loggedAt: str


class AddWeightRequest(BaseModel):
    date: str
    weightKg: float
    bmi: Optional[float] = None
    bodyFatPct: Optional[float] = None
    waistCm: Optional[float] = None
    notes: Optional[str] = None


class HabitLogSchema(BaseModel):
    date: str
    completedHabitIds: List[str]


class ToggleHabitRequest(BaseModel):
    habitId: str


class MacroCalculateRequest(BaseModel):
    age: int
    gender: GenderType
    heightCm: float
    weightKg: float
    activityLevel: ActivityLevel
    goal: GoalType
    dietPlan: Optional[str] = 'balanced'
