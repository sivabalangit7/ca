import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useProfile } from './hooks/useProfile';
import { useDailyLog } from './hooks/useDailyLog';
import { useHabits } from './hooks/useHabits';
import { useWeight } from './hooks/useWeight';
import { useAuth } from './contexts/AuthContext';
import { foodService } from './services/foodService';
import { logService } from './services/logService';
import { apiService } from './services/apiService';
import { populateSampleData } from './data/sampleData';
import { getTodayKey } from './utils/dateUtils';
import { FoodItem, MealCategory } from './types/food';

// Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { MobileMoreMenu } from './components/common/MobileMoreMenu';
import { FoodSearchModal } from './components/tracker/FoodSearchModal';
import { CustomFoodModal } from './components/tracker/CustomFoodModal';
import { AppLockModal } from './components/common/AppLockModal';
import { storageService } from './services/storageService';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FoodTrackerPage } from './pages/FoodTrackerPage';
import { IndianFoodDBPage } from './pages/IndianFoodDBPage';
import { MacroCalculatorPage } from './pages/MacroCalculatorPage';
import { MealPlannerPage } from './pages/MealPlannerPage';
import { WeightManagementPage } from './pages/WeightManagementPage';
import { HabitTrackerPage } from './pages/HabitTrackerPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Loading NutriTrack...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // User is authenticated — set user_id for API calls
  apiService.setUserId(user.uid);

  return <AuthenticatedApp />;
};

/**
 * The main application, rendered only when user is authenticated.
 */
const AuthenticatedApp: React.FC = () => {
  // Passcode Privacy Lock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => !storageService.isPinLockEnabled());

  // Preload initial sample data on first run
  useEffect(() => {
    populateSampleData(false);
  }, []);

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());
  const { profile, updateProfile } = useProfile();
  const {
    log,
    addFood,
    updateFoodQty,
    deleteFood,
    clearMealLog,
    clearDayLog,
    refreshLog,
    addWater,
    updateWaterTarget,
    updateActivity,
  } = useDailyLog(selectedDate);

  const { habitsList, currentLog, stats, toggleHabit } = useHabits(selectedDate);
  const weight = useWeight();

  const [allFoods, setAllFoods] = useState<FoodItem[]>(() => foodService.getAllFoods());

  // Modal states
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [targetMeal, setTargetMeal] = useState<MealCategory>('breakfast');
  const [preselectedFood, setPreselectedFood] = useState<FoodItem | undefined>(undefined);
  const [customFoodModalOpen, setCustomFoodModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const refreshFoods = () => setAllFoods(foodService.getAllFoods());

  const handleOpenAddFood = (meal: MealCategory = 'breakfast', food?: FoodItem) => {
    setTargetMeal(meal);
    setPreselectedFood(food);
    setFoodModalOpen(true);
  };

  const handleSaveCustomFood = (input: any) => {
    foodService.saveCustomFood(input);
    refreshFoods();
  };

  const handleDeleteCustomFood = (foodId: string) => {
    foodService.deleteCustomFood(foodId);
    apiService.deleteCustomFood(foodId).catch(() => {});
    refreshFoods();
  };

  const handleUpdateFoodQty = (logId: string, newQty: number) => {
    updateFoodQty(logId, newQty, allFoods);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
        {/* Desktop Sidebar */}
        <Sidebar theme={theme} toggleTheme={toggleTheme} profile={profile} />

        {/* Main Column */}
        <div className="flex-1 flex flex-col min-w-0 pb-28 lg:pb-8">
          <Navbar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onOpenAddFood={() => handleOpenAddFood('breakfast')}
            streak={stats.currentStreak}
            theme={theme}
            toggleTheme={toggleTheme}
            profile={profile}
          />

          <main className="flex-1 px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6">
            <Routes>
              {/* Dashboard */}
              <Route
                path="/"
                element={
                  <DashboardPage
                    selectedDate={selectedDate}
                    log={log}
                    profile={profile}
                    habitsList={habitsList}
                    completedHabitIds={currentLog.completedHabitIds}
                    todayHabitScore={stats.todayScore}
                    allFoods={allFoods}
                    onOpenAddFood={handleOpenAddFood}
                    onUpdateFoodQuantity={handleUpdateFoodQty}
                    onDeleteFood={deleteFood}
                    onAddWater={addWater}
                    onUpdateWaterTarget={updateWaterTarget}
                    onUpdateActivity={updateActivity}
                    onToggleHabit={toggleHabit}
                  />
                }
              />

              {/* Food Tracker */}
              <Route
                path="/tracker"
                element={
                  <FoodTrackerPage
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    log={log}
                    profile={profile}
                    allFoods={allFoods}
                    onOpenAddFood={handleOpenAddFood}
                    onOpenCustomFoodModal={() => setCustomFoodModalOpen(true)}
                    onUpdateFoodQuantity={handleUpdateFoodQty}
                    onDeleteFood={deleteFood}
                    onClearMeal={clearMealLog}
                    onClearDay={clearDayLog}
                  />
                }
              />

              {/* Indian Food Database */}
              <Route
                path="/database"
                element={
                  <IndianFoodDBPage
                    allFoods={allFoods}
                    onOpenAddFoodModal={(food) => handleOpenAddFood('breakfast', food)}
                    onOpenCustomFoodModal={() => setCustomFoodModalOpen(true)}
                    onDeleteCustomFood={handleDeleteCustomFood}
                  />
                }
              />

              {/* Macro Calculator */}
              <Route
                path="/calculator"
                element={
                  <MacroCalculatorPage
                    profile={profile}
                    onApplyTargets={(updatedProfile) => updateProfile(updatedProfile)}
                  />
                }
              />

              {/* Weight Management */}
              <Route path="/weight" element={<WeightManagementPage />} />

              {/* Habit Tracker */}
              <Route
                path="/habits"
                element={
                  <HabitTrackerPage
                    selectedDate={selectedDate}
                    habitsList={habitsList}
                    currentLog={currentLog}
                    stats={stats}
                    onToggleHabit={toggleHabit}
                  />
                }
              />

              {/* Progress & Charts */}
              <Route
                path="/progress"
                element={<ProgressPage profile={profile} weightEntries={weight.entries} />}
              />

              {/* Meal Planner */}
              <Route path="/planner" element={<MealPlannerPage />} />

              {/* Profile & Settings */}
              <Route
                path="/profile"
                element={
                  <ProfileSettingsPage
                    profile={profile}
                    onUpdateProfile={updateProfile}
                    isDarkMode={isDark}
                    onToggleTheme={toggleTheme}
                  />
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <BottomNav onOpenMoreMenu={() => setMobileMenuOpen(true)} />

        {/* Mobile More Menu */}
        <MobileMoreMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        {/* Global Food Search Modal */}
        <FoodSearchModal
          isOpen={foodModalOpen}
          onClose={() => {
            setFoodModalOpen(false);
            setPreselectedFood(undefined);
          }}
          defaultMeal={targetMeal}
          initialSelectedFood={preselectedFood}
          onAddFood={(food, quantity, meal) => addFood(food, quantity, meal)}
          onOpenCustomFoodModal={() => {
            setFoodModalOpen(false);
            setCustomFoodModalOpen(true);
          }}
        />

        {/* Global Custom Food Modal */}
        <CustomFoodModal
          isOpen={customFoodModalOpen}
          onClose={() => setCustomFoodModalOpen(false)}
          onSave={handleSaveCustomFood}
        />

        {/* Device Passcode Privacy Lock Modal */}
        {!isUnlocked && (
          <AppLockModal onUnlockSuccess={() => setIsUnlocked(true)} />
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
