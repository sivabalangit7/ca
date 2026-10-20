import { FoodItem, DetectedFoodItem, AIScanResponse } from '../types/food';
import { foodService } from './foodService';
import { storageService } from './storageService';

const GEMINI_API_KEY_STORAGE = 'gemini_api_key';

export interface ImageAnalysisOptions {
  apiKey?: string;
  onProgress?: (step: string) => void;
}

// Preset meal samples for instant 1-click testing & demo
export interface SampleMealPhoto {
  id: string;
  title: string;
  description: string;
  category: string;
  imageThumbnail: string; // SVG data URI or high quality representation
  simulatedDetections: {
    name: string;
    quantity: number;
    unit: string;
    serving: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    confidence: number;
  }[];
}

export const SAMPLE_MEAL_PRESETS: SampleMealPhoto[] = [
  {
    id: 'sample-south-tiffin',
    title: 'South Indian Tiffin Platter',
    description: 'Crispy Masala Dosa, 2 Steamed Idlis & Sambar',
    category: 'Breakfast / Tiffin',
    imageThumbnail: '🍛',
    simulatedDetections: [
      {
        name: 'Masala Dosa (with Spiced Potato)',
        quantity: 1,
        unit: 'piece',
        serving: '1 dosa (150g)',
        calories: 250,
        protein: 5.5,
        carbs: 38,
        fat: 8.5,
        fiber: 3.2,
        confidence: 0.94,
      },
      {
        name: 'Idli (Steamed Rice & Urad Dal Cake)',
        quantity: 2,
        unit: 'piece',
        serving: '2 medium idlis (100g)',
        calories: 130,
        protein: 4.5,
        carbs: 26,
        fat: 0.8,
        fiber: 2.2,
        confidence: 0.92,
      },
      {
        name: 'Sambar (Lentil Vegetable Stew)',
        quantity: 1,
        unit: 'cup',
        serving: '1 cup (150ml)',
        calories: 95,
        protein: 4.5,
        carbs: 14,
        fat: 2.5,
        fiber: 3.5,
        confidence: 0.88,
      },
    ],
  },
  {
    id: 'sample-north-lunch',
    title: 'North Indian Roti & Curry Thali',
    description: 'Cooked White Rice, Chicken Curry & Beans Poriyal',
    category: 'Lunch / Dinner',
    imageThumbnail: '🍱',
    simulatedDetections: [
      {
        name: 'Cooked White Rice (Sona Masoori / Ponni)',
        quantity: 1,
        unit: 'cup',
        serving: '1 cup (150g)',
        calories: 195,
        protein: 3.8,
        carbs: 42,
        fat: 0.5,
        fiber: 0.8,
        confidence: 0.95,
      },
      {
        name: 'Homestyle Chicken Curry',
        quantity: 1,
        unit: 'cup',
        serving: '1 cup (200g)',
        calories: 275,
        protein: 26.0,
        carbs: 7.5,
        fat: 15.0,
        fiber: 1.8,
        confidence: 0.91,
      },
      {
        name: 'Beans Carrot Poriyal (Stir-fry with Coconut)',
        quantity: 1,
        unit: 'cup',
        serving: '1 cup (130g)',
        calories: 90,
        protein: 2.5,
        carbs: 11.0,
        fat: 4.2,
        fiber: 4.0,
        confidence: 0.86,
      },
    ],
  },
  {
    id: 'sample-roti-dal-paneer',
    title: 'Homestyle Vegetarian Thali',
    description: '2 Phulkas, Dal Tadka & Palak Paneer',
    category: 'Dinner',
    imageThumbnail: '🥘',
    simulatedDetections: [
      {
        name: 'Phulka (Oil-free Whole Wheat Roti)',
        quantity: 2,
        unit: 'piece',
        serving: '2 phulkas (60g)',
        calories: 150,
        protein: 5.6,
        carbs: 30.0,
        fat: 1.0,
        fiber: 4.4,
        confidence: 0.96,
      },
      {
        name: 'Dal Tadka (Yellow Lentils with Cumin Tempering)',
        quantity: 1,
        unit: 'cup',
        serving: '1 cup (150g)',
        calories: 140,
        protein: 7.2,
        carbs: 18.0,
        fat: 4.5,
        fiber: 4.2,
        confidence: 0.92,
      },
      {
        name: 'Palak Paneer (Spinach Cottage Cheese)',
        quantity: 1,
        unit: 'cup',
        serving: '1 cup (180g)',
        calories: 220,
        protein: 13.0,
        carbs: 8.5,
        fat: 15.5,
        fiber: 4.5,
        confidence: 0.89,
      },
    ],
  },
  {
    id: 'sample-biryani-raita',
    title: 'Chicken Biryani & Boondi Raita',
    description: 'Dum Biryani with Cooling Spiced Yogurt',
    category: 'Weekend Special',
    imageThumbnail: '🍗',
    simulatedDetections: [
      {
        name: 'Chicken Dum Biryani',
        quantity: 1,
        unit: 'plate',
        serving: '1 plate (300g)',
        calories: 460,
        protein: 24.0,
        carbs: 56.0,
        fat: 15.0,
        fiber: 3.2,
        confidence: 0.96,
      },
      {
        name: 'Boondi Raita',
        quantity: 1,
        unit: 'bowl',
        serving: '1 bowl (120g)',
        calories: 110,
        protein: 4.2,
        carbs: 11.0,
        fat: 5.5,
        fiber: 0.8,
        confidence: 0.87,
      },
    ],
  },
];

export const aiService = {
  getApiKey(): string {
    return (
      storageService.getData<string>(GEMINI_API_KEY_STORAGE, '') ||
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      ''
    );
  },

  setApiKey(key: string): void {
    storageService.saveData(GEMINI_API_KEY_STORAGE, key.trim());
  },

  hasApiKey(): boolean {
    return Boolean(this.getApiKey().trim());
  },

  /**
   * Resizes an image file down to max 1024x1024 before converting to Base64
   * Keeps network lightweight and responsive
   */
  async compressAndEncodeImage(file: File): Promise<{ base64Data: string; mimeType: string; previewUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1024;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, 0.85);
          const base64Data = dataUrl.split(',')[1];

          resolve({
            base64Data,
            mimeType,
            previewUrl: dataUrl,
          });
        };
        img.onerror = () => reject(new Error('Failed to load image file for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Smart Indian Food Matcher
   * Matches AI text to verified local database foods to preserve accurate nutrition
   */
  matchWithLocalDatabase(rawName: string): FoodItem | null {
    const allFoods = foodService.getAllFoods();
    const clean = rawName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();

    // 1. Direct name includes
    const directMatch = allFoods.find((f) => {
      const fName = f.name.toLowerCase();
      return fName.includes(clean) || clean.includes(fName.split('(')[0].trim());
    });
    if (directMatch) return directMatch;

    // 2. Keyword tokens matching
    const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
    let bestMatch: FoodItem | null = null;
    let maxOverlap = 0;

    for (const food of allFoods) {
      const targetTokens = `${food.name} ${food.hindiName || ''} ${food.category} ${food.notes || ''}`
        .toLowerCase()
        .split(/\s+/);

      let overlap = 0;
      for (const t of tokens) {
        if (targetTokens.some((target) => target.includes(t) || t.includes(target))) {
          overlap++;
        }
      }

      if (overlap > maxOverlap && overlap >= 1) {
        maxOverlap = overlap;
        bestMatch = food;
      }
    }

    return bestMatch;
  },

  /**
   * Main vision analysis function
   */
  async analyzeFoodImage(
    base64Data: string,
    mimeType: string,
    options?: ImageAnalysisOptions
  ): Promise<DetectedFoodItem[]> {
    const apiKey = options?.apiKey || this.getApiKey();

    // If no API key is provided, use smart local demo analysis
    if (!apiKey) {
      if (options?.onProgress) options.onProgress('No API key detected. Running in Demo AI Mode...');
      await new Promise((res) => setTimeout(res, 1200));

      // Return a smart generic Indian lunch detection
      const fallbackPreset = SAMPLE_MEAL_PRESETS[1].simulatedDetections;
      return fallbackPreset.map((item, idx) => ({
        id: `ai-food-${Date.now()}-${idx}`,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        serving: item.serving,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        confidence: item.confidence,
        dietary: 'veg',
        category: 'Rice',
        isMatchedFromDB: true,
      }));
    }

    if (options?.onProgress) options.onProgress('Connecting to Gemini Vision AI...');

    const prompt = `
You are an expert Indian culinary and nutrition AI specialist.
Analyze this photo of Indian food. Identify all distinct food items present on the plate or in the meal.
For each detected food item:
1. Provide the standard Indian food name (e.g., "Cooked White Rice", "Chicken Curry", "Vegetable Poriyal", "Dosa", "Sambar", "Phulka / Roti", "Dal Tadka").
2. Estimate the portion quantity as a number (e.g. 1, 2, 1.5).
3. Estimate the serving unit (e.g. "cup", "piece", "bowl", "plate", "g").
4. Provide estimated calories (kcal), protein (g), carbs (g), fat (g).
5. Confidence between 0.50 and 0.99.

CRITICAL INSTRUCTION:
Return ONLY a valid JSON object without markdown formatting, ticks, or extra conversation.
JSON Schema:
{
  "foods": [
    {
      "name": "Food Name",
      "quantity": 1,
      "unit": "cup",
      "calories": 200,
      "protein": 4.0,
      "carbs": 42.0,
      "fat": 1.0,
      "confidence": 0.92
    }
  ]
}
`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      };

      if (options?.onProgress) options.onProgress('Analyzing food items and portion estimates...');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini Vision API error (${response.status}): ${errorText.slice(0, 150)}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('No detection result returned by AI.');
      }

      // Parse JSON from text
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '');
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '');
      if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');

      const parsed: AIScanResponse = JSON.parse(cleaned.trim());

      if (!parsed.foods || !Array.isArray(parsed.foods) || parsed.foods.length === 0) {
        throw new Error('Food could not be identified reliably. Please enter it manually.');
      }

      if (options?.onProgress) options.onProgress('Cross-referencing with Indian Food Database...');

      // Match each detected food against our verified local database
      const detectedItems: DetectedFoodItem[] = parsed.foods.map((aiFood, index) => {
        const localMatch = this.matchWithLocalDatabase(aiFood.name);
        const qty = typeof aiFood.quantity === 'number' && aiFood.quantity > 0 ? aiFood.quantity : 1;

        if (localMatch) {
          // Use verified local nutrition values multiplied by AI portion
          return {
            id: `ai-food-${Date.now()}-${index}`,
            name: localMatch.name,
            matchedFoodId: localMatch.id,
            quantity: qty,
            unit: aiFood.unit || localMatch.servingUnit || 'serving',
            serving: `${qty} × ${localMatch.serving}`,
            calories: Math.round(localMatch.calories * qty),
            protein: parseFloat((localMatch.protein * qty).toFixed(1)),
            carbs: parseFloat((localMatch.carbs * qty).toFixed(1)),
            fat: parseFloat((localMatch.fat * qty).toFixed(1)),
            fiber: parseFloat((localMatch.fiber * qty).toFixed(1)),
            confidence: aiFood.confidence || 0.88,
            dietary: localMatch.dietary,
            category: localMatch.category,
            isMatchedFromDB: true,
          };
        }

        // Unmatched fallback to AI estimation
        return {
          id: `ai-food-${Date.now()}-${index}`,
          name: aiFood.name,
          quantity: qty,
          unit: aiFood.unit || 'serving',
          serving: `${qty} ${aiFood.unit || 'serving'}`,
          calories: Math.round(aiFood.calories || 150),
          protein: parseFloat(((aiFood.protein || 4) * qty).toFixed(1)),
          carbs: parseFloat(((aiFood.carbs || 20) * qty).toFixed(1)),
          fat: parseFloat(((aiFood.fat || 5) * qty).toFixed(1)),
          fiber: 2.0,
          confidence: aiFood.confidence || 0.75,
          dietary: 'veg',
          category: 'Custom',
          isMatchedFromDB: false,
        };
      });

      return detectedItems;
    } catch (err: any) {
      console.error('AI food scan failed:', err);
      throw err;
    }
  },
};
