import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NutriTrackLogo } from './NutriTrackLogo';

interface AppLockModalProps {
  onUnlockSuccess: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({ onUnlockSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (storageService.verifyPin(nextPin)) {
          onUnlockSuccess();
        } else {
          setError(true);
          setAttempts((prev) => prev + 1);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080D1B]/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-card p-6 sm:p-8 border border-[#263247] text-center shadow-2xl animate-fade-in">
        <div className="relative inline-block mb-4">
          <NutriTrackLogo size={64} variant="icon" withGlow={true} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#10B981] text-[#080D1B] flex items-center justify-center shadow-md">
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        <h2 className="text-xl font-extrabold text-[#F8FAFC]">
          Nutri<span className="text-[#10B981]">Track</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Enter your 4-digit security PIN to access your health diary
        </p>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? error
                    ? 'bg-rose-500 scale-110'
                    : 'bg-brand-500 scale-110 shadow-sm shadow-brand-500/60'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-400 mb-4 animate-shake">
            Incorrect PIN. Please try again.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="w-16 h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-90 text-white font-extrabold text-xl border border-slate-800 shadow-sm transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setPin('')}
            className="w-16 h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-90 text-slate-400 font-semibold text-xs border border-slate-800/50 transition-all flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-90 text-white font-extrabold text-xl border border-slate-800 shadow-sm transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:scale-90 text-slate-400 font-semibold text-xs border border-slate-800/50 transition-all flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {attempts >= 5 && (
          <p className="text-[11px] text-amber-400 mt-5 italic">
            Need help? PIN can be reset by clearing browser storage.
          </p>
        )}
      </div>
    </div>
  );
};
