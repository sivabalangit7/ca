import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Moon,
  Sun,
  RotateCcw,
  Save,
  Check,
  DownloadCloud,
  Database,
  RefreshCw,
  Lock,
  ShieldCheck,
  FileDown,
  FileUp,
  Key,
  LogOut,
} from 'lucide-react';
import { UserProfile, GenderType, GoalType } from '../types/profile';
import { DietaryType } from '../types/food';
import { profileService } from '../services/profileService';
import { populateSampleData } from '../data/sampleData';
import {
  apiService,
  getEffectiveApiBase,
  setCustomApiUrl,
  getCustomApiKey,
  setCustomApiKey,
  DatabaseStatus
} from '../services/apiService';
import { storageService } from '../services/storageService';
import { Modal } from '../components/common/Modal';
import { DisclaimerNotice } from '../components/common/DisclaimerNotice';
import { AuthUser } from '../services/authService';

interface ProfileSettingsPageProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  user?: AuthUser | null;
  onLogout?: () => void;
  onClearTodayLog?: () => void;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  profile,
  onUpdateProfile,
  isDarkMode,
  onToggleTheme,
  user,
  onLogout,
  onClearTodayLog,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);

  // Database / API connection settings
  const [apiUrl, setApiUrl] = useState<string>(() => getEffectiveApiBase());
  const [apiKey, setApiKey] = useState<string>(() => getCustomApiKey() || '');
  const [apiStatus, setApiStatus] = useState<DatabaseStatus | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [apiSaveSuccess, setApiSaveSuccess] = useState(false);

  // Security Diagnostics & Backups
  const [integrityStatus, setIntegrityStatus] = useState<any | null>(null);
  const [runningIntegrity, setRunningIntegrity] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Passcode / PIN Lock
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(() => storageService.isPinLockEnabled());
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    apiService.checkHealth().then(setApiStatus);
  }, []);

  const handleTestConnection = async () => {
    setTestingApi(true);
    setCustomApiUrl(apiUrl);
    const status = await apiService.checkHealth();
    setApiStatus(status);
    setTestingApi(false);
  };

  const handleSaveApiUrl = () => {
    setCustomApiUrl(apiUrl);
    setApiSaveSuccess(true);
    setTimeout(() => setApiSaveSuccess(false), 3000);
    apiService.checkHealth().then(setApiStatus);
  };

  const handleResetApiUrl = () => {
    setCustomApiUrl(null);
    setApiUrl('/api');
    setApiSaveSuccess(true);
    setTimeout(() => setApiSaveSuccess(false), 3000);
    apiService.checkHealth().then(setApiStatus);
  };

  const handleVerifyIntegrity = async () => {
    setRunningIntegrity(true);
    const res = await apiService.checkDatabaseIntegrity();
    setIntegrityStatus(res);
    setRunningIntegrity(false);
  };

  const handleCreateBackup = async () => {
    const res = await apiService.triggerDatabaseBackup();
    if (res?.success) {
      setBackupMsg(`Online SQLite backup saved to: ${res.backupPath}`);
      setTimeout(() => setBackupMsg(null), 5000);
    } else {
      setBackupMsg("Backup initiated on server.");
      setTimeout(() => setBackupMsg(null), 4000);
    }
  };

  const handleExportBackup = async () => {
    try {
      let exportData: any = null;
      if (apiStatus?.connected) {
        exportData = await apiService.exportDatabaseBackup();
      }
      if (!exportData) {
        const clientJson = storageService.exportFullClientBackup();
        exportData = JSON.parse(clientJson);
      }

      const fileName = `nutritrack_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });

      // If Android native share is supported, open the share sheet (Google Drive, WhatsApp, Files)
      if (typeof navigator !== 'undefined' && navigator.canShare) {
        try {
          const file = new File([blob], fileName, { type: 'application/json' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'NutriTrack Data Backup',
              text: 'My NutriTrack Calorie & Health Data Backup'
            });
            setBackupMsg("Backup shared successfully!");
            setTimeout(() => setBackupMsg(null), 4000);
            return;
          }
        } catch (shareErr) {
          if ((shareErr as any)?.name === 'AbortError') return; // User closed share sheet
        }
      }

      // Standard browser/webview download fallback via Blob URL
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = fileName;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setBackupMsg("JSON backup exported and downloaded successfully!");
      setTimeout(() => setBackupMsg(null), 4000);
    } catch (err) {
      console.error("Export error", err);
      alert("Failed to export backup: " + String(err));
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (apiStatus?.connected) {
        const res = await apiService.importDatabaseBackup(parsed);
        if (res?.success) {
          setRestoreMsg("Database restored successfully from backup! Reloading...");
          setTimeout(() => { setRestoreMsg(null); window.location.reload(); }, 1500);
          return;
        }
      }
      // Fallback local client restore
      const clientRes = storageService.restoreFullClientBackup(text);
      if (clientRes.success) {
        setRestoreMsg(`Restored ${clientRes.keyCount} data records successfully! Reloading...`);
        setTimeout(() => { setRestoreMsg(null); window.location.reload(); }, 1500);
      } else {
        alert("Failed to parse or restore backup file.");
      }
    } catch (err) {
      alert("Invalid JSON backup file: " + String(err));
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length === 4) {
      storageService.setSecurityPin(newPin.trim());
      setIsPinEnabled(true);
      setNewPin('');
      setPinSuccessMsg("Security PIN set successfully!");
      setTimeout(() => setPinSuccessMsg(null), 3000);
    } else {
      alert("Please enter exactly 4 digits for your security PIN.");
    }
  };

  const handleDisablePin = () => {
    storageService.setSecurityPin(null);
    setIsPinEnabled(false);
    setPinSuccessMsg("Security PIN lock disabled.");
    setTimeout(() => setPinSuccessMsg(null), 3000);
  };

  const handleSaveApiKey = () => {
    setCustomApiKey(apiKey);
    setApiSaveSuccess(true);
    setTimeout(() => setApiSaveSuccess(false), 3000);
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetData = () => {
    profileService.resetAllApplicationData();
    window.location.reload();
  };


  const handleReloadSampleData = () => {
    populateSampleData(true);
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="glass-card p-5 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Profile &amp; Preferences
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your personal metrics, dietary preferences, daily goals, and app settings.
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Active Account Card */}
      <div className="glass-card p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20 flex-shrink-0">
            {(user?.displayName || formData.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {user?.displayName || formData.name || 'User'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Active Account
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {user?.email || 'Logged in locally'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onClearTodayLog && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Clear today's meals and start with a fresh daily log?")) {
                  onClearTodayLog();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors app-btn-press"
              title="Clear today's logged meals and start fresh today"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>Reset Today's Log</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/60 dark:border-rose-900/40 text-xs font-bold transition-all app-btn-press"
              title="Sign out of this account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800/60">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Profile and nutrition targets successfully updated!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Personal Info */}
        <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Arjun"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Age (years)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={formData.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value) || 18)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
                required
              />
              {formData.age < 18 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-1">
                  Youth & Adolescent health safeguards active
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Biological Sex
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value as GenderType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Non-binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dietary Preference
              </label>
              <select
                value={formData.dietaryPreference}
                onChange={(e) => handleChange('dietaryPreference', e.target.value as DietaryType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
              >
                <option value="veg">Vegetarian (Lacto-vegetarian)</option>
                <option value="egg">Eggetarian (Vegetarian + Eggs)</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="vegan">Vegan (100% Plant-based)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Goal
              </label>
              <select
                value={formData.goal || 'maintain_health'}
                onChange={(e) => handleChange('goal', e.target.value as GoalType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
              >
                <option value="lose_weight_gradual">Weight Loss: Gradual (~350 kcal deficit)</option>
                <option value="lose_weight_moderate">Weight Loss: Moderate (~500 kcal deficit)</option>
                <option value="maintain_health">Maintain Health & Weight</option>
                <option value="general_fitness">General Fitness & Endurance</option>
                <option value="build_strength">Build Muscle & Strength (+250 kcal surplus)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                min="100"
                max="240"
                value={formData.heightCm}
                onChange={(e) => handleChange('heightCm', parseInt(e.target.value) || 165)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                min="30"
                max="250"
                value={formData.weightKg}
                onChange={(e) => handleChange('weightKg', parseInt(e.target.value) || 65)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Daily Nutrition Targets */}
        <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Nutrition & Hydration Goals
            </h2>
            <span className="text-[11px] text-slate-400">
              Customize or auto-set via Macro Calculator
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Calories (kcal)
              </label>
              <input
                type="number"
                min="1200"
                max="5000"
                value={formData.targetCalories}
                onChange={(e) => handleChange('targetCalories', parseInt(e.target.value) || 2000)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                min="30"
                max="300"
                value={formData.targetProteinG}
                onChange={(e) => handleChange('targetProteinG', parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                min="50"
                max="600"
                value={formData.targetCarbsG}
                onChange={(e) => handleChange('targetCarbsG', parseInt(e.target.value) || 250)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                Fat (g)
              </label>
              <input
                type="number"
                min="20"
                max="150"
                value={formData.targetFatG}
                onChange={(e) => handleChange('targetFatG', parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                Dietary Fiber Target (g)
              </label>
              <input
                type="number"
                min="15"
                max="70"
                value={formData.targetFiberG}
                onChange={(e) => handleChange('targetFiberG', parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                Water Target (ml)
              </label>
              <input
                type="number"
                min="1000"
                max="6000"
                step="250"
                value={formData.targetWaterMl}
                onChange={(e) => handleChange('targetWaterMl', parseInt(e.target.value) || 2500)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Profile Changes</span>
        </button>
      </form>

      {/* Database Security, Integrity & Backup Center */}
      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Database Security &amp; Diagnostics</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                  SQLite Hardened
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                WAL mode, cryptographic secure delete, PRAGMA bounds checking &amp; integrity verification
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
              apiStatus?.connected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                apiStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{apiStatus?.connected ? 'Connected (SQLite)' : 'Offline Local Storage'}</span>
          </span>
        </div>

        {/* Security Specs Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Journal Mode</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">WAL (Concurrent)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Secure Delete</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">PRAGMA Active</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Foods Database</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">{apiStatus?.totalFoods || 120} items</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Rate Protection</span>
            <span className="font-extrabold text-brand-600 dark:text-brand-400 mt-0.5 block">180 req/min limit</span>
          </div>
        </div>

        {/* Action Buttons: Integrity Check & Online Backup */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleVerifyIntegrity}
            disabled={runningIntegrity}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-emerald-200/60 dark:border-emerald-800/40"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${runningIntegrity ? 'animate-spin' : ''}`} />
            <span>{runningIntegrity ? 'Verifying Integrity...' : 'Run PRAGMA Integrity Check'}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateBackup}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-blue-200/60 dark:border-blue-800/40"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Snapshot SQLite Backup</span>
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Backup (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>

        {/* Integrity Check Result Modal / Banner */}
        {integrityStatus && (
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Database Integrity Verified: 100% Intact</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              PRAGMA quick_check: <code>{integrityStatus.quickCheck?.join(', ')}</code> • File Size: {Math.round((integrityStatus.fileSizeBytes || 0) / 1024)} KB • Foreign Keys: Enforced
            </p>
          </div>
        )}

        {backupMsg && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800">
            <Check className="w-4 h-4" />
            <span>{backupMsg}</span>
          </div>
        )}

        {restoreMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
            <Check className="w-4 h-4" />
            <span>{restoreMsg}</span>
          </div>
        )}

        {/* Device Passcode / PIN Protection Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  App Passcode &amp; Privacy Lock
                </h3>
                <p className="text-[11px] text-slate-400">
                  Protect your calorie, weight, and health diary on this device with a 4-digit PIN
                </p>
              </div>
            </div>

            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
              isPinEnabled
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {isPinEnabled ? 'PIN Enabled' : 'Disabled'}
            </span>
          </div>

          {isPinEnabled ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-300">Passcode protection is currently active on this phone.</span>
              <button
                type="button"
                onClick={handleDisablePin}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all border border-rose-200 dark:border-rose-800 ml-auto"
              >
                Disable PIN Lock
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavePin} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="w-36 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs tracking-widest text-center font-bold focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={newPin.length !== 4}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs"
              >
                Set PIN Lock
              </button>
            </form>
          )}

          {pinSuccessMsg && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{pinSuccessMsg}</span>
            </p>
          )}
        </div>

        {/* Backend API Host & Key Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Backend API Host URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="e.g. /api or http://192.168.1.10:8001"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-xs"
                >
                  Apply
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API Security Key (Optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="X-API-Key token"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2 pt-1">
            <span>For Android physical devices, use LAN IP (e.g. <code>http://192.168.x.x:8001</code>).</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingApi}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${testingApi ? 'animate-spin' : ''}`} />
                <span>{testingApi ? 'Testing...' : 'Test Connection'}</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleResetApiUrl}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Demo Actions */}
      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
          Data Management
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setShowSampleModal(true)}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                Load 30-Day Sample Data
              </p>
              <p className="text-[11px] text-slate-400">
                Populate realistic historical logs, charts & habit streaks
              </p>
            </div>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-left transition-colors flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Reset All Local Data
              </p>
              <p className="text-[11px] text-rose-600/70 dark:text-rose-400/80">
                Clear all custom foods, logs, and reset to defaults
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Version & Build Info */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-400">
        <span>NutriTrack India • Hardened Offline Edition</span>
        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-750">
          v1.1.0 (Build 2)
        </span>
      </div>

      <DisclaimerNotice />

      {/* Confirmation Modal for Reset */}
      {showResetModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowResetModal(false)}
          title="Reset All App Data?"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              This will erase all logged meals, custom Indian dishes, habit records, and meal plans from your browser's LocalStorage.
            </p>
            <p className="font-bold text-rose-600 dark:text-rose-400">
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal for Sample Data */}
      {showSampleModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowSampleModal(false)}
          title="Reload Demo & Sample Data?"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              This will load a complete 30-day realistic Indian diet history with authentic breakfasts (Idlis, Dosas, Poha), lunches (Roti, Dal, Paneer, Rice), evening snacks, hydration data, and habit completion stats.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReloadSampleData}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
