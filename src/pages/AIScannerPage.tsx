import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { aiService, SAMPLE_MEAL_PRESETS, SampleMealPhoto } from '../services/aiService';
import { DetectedFoodItem, MealCategory } from '../types/food';

interface AIScannerPageProps {
  selectedDate: string;
  onAddDetectedFoodsToMeal: (foods: DetectedFoodItem[], meal: MealCategory) => void;
  onOpenManualAddFood?: (meal: MealCategory) => void;
}

export const AIScannerPage: React.FC<AIScannerPageProps> = ({
  selectedDate: _selectedDate,
  onAddDetectedFoodsToMeal,
  onOpenManualAddFood,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [detectedFoods, setDetectedFoods] = useState<DetectedFoodItem[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSamplePreset, setSelectedSamplePreset] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload from computer or phone gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous results
    setDetectedFoods([]);
    setAnalysisError(null);
    setSuccessMessage(null);
    setSelectedSamplePreset(null);

    try {
      setAnalysisStatus('Compressing and preparing photo...');
      const encoded = await aiService.compressAndEncodeImage(file);
      setImagePreview(encoded.previewUrl);
      setBase64Data(encoded.base64Data);
      setMimeType(encoded.mimeType);
      setAnalysisStatus('');
    } catch {
      setAnalysisError('Could not process this image format. Please select another photo.');
    }
  };

  // Select one of the preset sample meals for instant 1-click test
  const handleSelectPreset = (preset: SampleMealPhoto) => {
    setSelectedSamplePreset(preset.id);
    setImagePreview(null);
    setBase64Data(null);
    setAnalysisError(null);
    setSuccessMessage(null);

    const items: DetectedFoodItem[] = preset.simulatedDetections.map((sim, idx) => ({
      id: `preset-${preset.id}-${idx}`,
      name: sim.name,
      quantity: sim.quantity,
      unit: sim.unit,
      serving: sim.serving,
      calories: sim.calories,
      protein: sim.protein,
      carbs: sim.carbs,
      fat: sim.fat,
      fiber: sim.fiber,
      confidence: sim.confidence,
      dietary: 'veg',
      category: 'South Indian',
      isMatchedFromDB: true,
    }));

    setDetectedFoods(items);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setBase64Data(null);
    setDetectedFoods([]);
    setAnalysisError(null);
    setSuccessMessage(null);
    setSelectedSamplePreset(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  // Run AI analysis on the uploaded photo
  const handleAnalyzeFood = async () => {
    if (!base64Data) {
      setAnalysisError('Please choose or take a food photo first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setSuccessMessage(null);
    setAnalysisStatus('Analyzing Indian dishes and estimating portions with AI...');

    try {
      const results = await aiService.analyzeFoodImage(base64Data, mimeType, {
        onProgress: (step) => setAnalysisStatus(step),
      });

      if (results.length === 0) {
        setAnalysisError('Food could not be identified reliably. Please enter it manually.');
      } else {
        setDetectedFoods(results);
      }
    } catch (err: any) {
      const msg = err?.message || 'Food could not be identified reliably. Please enter it manually.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
    }
  };

  // Edit fields for detected items
  const handleUpdateItem = (index: number, field: keyof DetectedFoodItem, value: any) => {
    setDetectedFoods((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };

      // If quantity was updated, recalculate calories and macros proportionately
      if (field === 'quantity') {
        const newQty = Math.max(0.25, parseFloat(value) || 1);
        const oldQty = next[index].quantity || 1;
        const ratio = newQty / oldQty;

        target.quantity = newQty;
        target.calories = Math.round(target.calories * ratio);
        target.protein = parseFloat((target.protein * ratio).toFixed(1));
        target.carbs = parseFloat((target.carbs * ratio).toFixed(1));
        target.fat = parseFloat((target.fat * ratio).toFixed(1));
      }

      next[index] = target;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setDetectedFoods((prev) => prev.filter((_, i) => i !== index));
  };

  // Add all detected items to user's meal category
  const handleSaveToMeal = (meal: MealCategory) => {
    if (detectedFoods.length === 0) return;

    onAddDetectedFoodsToMeal(detectedFoods, meal);
    setSuccessMessage(
      `Successfully logged ${detectedFoods.length} items to today's ${meal.toUpperCase()}!`
    );
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Totals for the scanned meal
  const totalCalories = detectedFoods.reduce((acc, i) => acc + (i.calories || 0), 0);
  const totalProtein = Math.round(detectedFoods.reduce((acc, i) => acc + (i.protein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(detectedFoods.reduce((acc, i) => acc + (i.carbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(detectedFoods.reduce((acc, i) => acc + (i.fat || 0), 0) * 10) / 10;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 via-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Food Scanner</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200/60 dark:border-brand-900/50">
                  Vision AI
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Snap or upload any Indian meal photo to automatically detect dishes, portion sizes, and nutrients.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accuracy Warning Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-300/90 leading-relaxed">
          <p className="font-bold text-amber-950 dark:text-amber-200">
            AI Nutrition Estimates are Approximate
          </p>
          <p className="mt-0.5">
            Photo analysis may not accurately determine hidden cooking oil, ghee, specific ingredients, or exact portion densities. Always review and adjust values before saving to your daily log.
          </p>
        </div>
      </div>

      {/* Main Upload & Camera Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload / Camera Card */}
        <div className="lg:col-span-6 glass-card p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              1. Choose or Capture Food Photo
            </h2>

            {/* Hidden native file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Image Preview or Dropzone */}
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 aspect-video flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Food to analyze"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleClearImage}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : selectedSamplePreset ? (
              <div className="p-8 rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/40 dark:bg-brand-950/20 text-center space-y-2">
                <span className="text-4xl block">
                  {SAMPLE_MEAL_PRESETS.find((p) => p.id === selectedSamplePreset)?.imageThumbnail}
                </span>
                <h3 className="text-sm font-bold text-brand-900 dark:text-brand-300">
                  {SAMPLE_MEAL_PRESETS.find((p) => p.id === selectedSamplePreset)?.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {SAMPLE_MEAL_PRESETS.find((p) => p.id === selectedSamplePreset)?.description}
                </p>
                <button
                  onClick={handleClearImage}
                  className="text-xs font-semibold text-rose-600 hover:underline pt-2 block mx-auto"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4 hover:border-brand-500/50 transition-colors">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Upload a plate photo or take a picture
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    JPEG, PNG, WebP up to 10MB (automatically compressed)
                  </p>
                </div>

                {/* Upload & Camera Buttons */}
                <div className="flex items-center justify-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse Gallery</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analyze CTA */}
          <div className="pt-2">
            {imagePreview && (
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={handleAnalyzeFood}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-700 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-brand-500/25 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Photo with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze Food with AI</span>
                  </>
                )}
              </button>
            )}

            {isAnalyzing && (
              <p className="text-[11px] text-center text-slate-400 mt-2 italic animate-pulse">
                {analysisStatus}
              </p>
            )}

            {/* Error message */}
            {analysisError && (
              <div className="mt-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs space-y-2">
                <p className="font-bold">{analysisError}</p>
                {onOpenManualAddFood && (
                  <button
                    onClick={() => onOpenManualAddFood('breakfast')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                  >
                    + Enter Food Manually
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Demo Sample Presets */}
        <div className="lg:col-span-6 glass-card p-6 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Instant Demo Meals (1-Click Test)
              </h2>
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                No Camera Needed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any classic Indian meal preset to experience instant AI plate recognition and nutrition estimation:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
              {SAMPLE_MEAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSamplePreset === preset.id
                      ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{preset.imageThumbnail}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {preset.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand-500" />
              <span>How AI Vision Works</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              The vision model detects items on the plate, cross-references our verified 160+ Indian food database for exact macronutrients, and estimates realistic culinary portions.
            </p>
          </div>
        </div>
      </div>

      {/* Review Section (Only shown after items are detected) */}
      {detectedFoods.length > 0 && (
        <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Estimated Meal Review</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {detectedFoods.length} Foods Detected
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                You can edit any portion, quantity, or macro value before adding to your diary.
              </p>
            </div>

            {/* Total Macro Summary Pill */}
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-brand-600 dark:text-brand-400 text-sm">
                Total: {totalCalories} kcal
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-600 dark:text-emerald-400">P: {totalProtein}g</span>
              <span className="text-amber-600 dark:text-amber-400">C: {totalCarbs}g</span>
              <span className="text-purple-600 dark:text-purple-400">F: {totalFat}g</span>
            </div>
          </div>

          {/* Editable Detected Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Food Item</th>
                  <th className="py-2.5 px-3 w-28">Quantity / Unit</th>
                  <th className="py-2.5 px-3 w-20">Calories</th>
                  <th className="py-2.5 px-3 w-16">Protein</th>
                  <th className="py-2.5 px-3 w-16">Carbs</th>
                  <th className="py-2.5 px-3 w-16">Fat</th>
                  <th className="py-2.5 px-2 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {detectedFoods.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Food Name */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                        className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.serving} • Confidence: {Math.round((item.confidence || 0.85) * 100)}%
                      </span>
                    </td>

                    {/* Quantity & Unit */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0.25"
                          max="20"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                          className="w-12 px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-center border border-slate-200 dark:border-slate-700"
                        />
                        <span className="text-slate-500 text-[11px] truncate">{item.unit}</span>
                      </div>
                    </td>

                    {/* Calories */}
                    <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                      <input
                        type="number"
                        value={item.calories}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'calories', parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-1.5 py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 font-extrabold text-brand-600 dark:text-brand-400"
                      />
                    </td>

                    {/* Protein */}
                    <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      <input
                        type="number"
                        step="0.5"
                        value={item.protein}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'protein', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 px-1 py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      />
                    </td>

                    {/* Carbs */}
                    <td className="py-3 px-3 font-semibold text-amber-600 dark:text-amber-400">
                      <input
                        type="number"
                        step="0.5"
                        value={item.carbs}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'carbs', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 px-1 py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      />
                    </td>

                    {/* Fat */}
                    <td className="py-3 px-3 font-semibold text-purple-600 dark:text-purple-400">
                      <input
                        type="number"
                        step="0.5"
                        value={item.fat}
                        onChange={(e) =>
                          handleUpdateItem(idx, 'fat', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 px-1 py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                      />
                    </td>

                    {/* Remove Action */}
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Meal Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Save Reviewed Foods to:
            </span>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSaveToMeal('breakfast')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all text-center"
              >
                + Breakfast
              </button>
              <button
                type="button"
                onClick={() => handleSaveToMeal('lunch')}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-xs transition-all text-center"
              >
                + Lunch
              </button>
              <button
                type="button"
                onClick={() => handleSaveToMeal('snacks')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all text-center"
              >
                + Snack
              </button>
              <button
                type="button"
                onClick={() => handleSaveToMeal('dinner')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all text-center"
              >
                + Dinner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
