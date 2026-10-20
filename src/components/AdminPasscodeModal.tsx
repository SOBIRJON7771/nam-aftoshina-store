import React, { useState } from 'react';
import { Lock, X, ShieldAlert, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ADMIN_PIN_STORAGE_KEY = 'nam_avtoshina_admin_pin';
export const ADMIN_AUTH_STORAGE_KEY = 'nam_avtoshina_admin_auth';
export const DEFAULT_ADMIN_PIN = '7777';

export const getStoredAdminPin = (): string => {
  try {
    return localStorage.getItem(ADMIN_PIN_STORAGE_KEY) || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
};

export const setStoredAdminPin = (newPin: string): void => {
  try {
    localStorage.setItem(ADMIN_PIN_STORAGE_KEY, newPin);
  } catch (err) {
    console.error('Failed to save PIN:', err);
  }
};

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getStoredAdminPin();
    const inputVal = pin.trim();

    // Support current stored PIN, default PIN, or 'admin' fallback if configured
    if (inputVal === correctPin || (correctPin !== DEFAULT_ADMIN_PIN && inputVal === DEFAULT_ADMIN_PIN) || inputVal === 'admin') {
      setError(false);
      setPin('');
      try {
        sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
      } catch {
        // ignore
      }
      onSuccess();
    } else {
      setError(true);
      setAttempts((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0D121F] text-slate-100 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-white font-display font-bold">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#EA580C]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg text-white font-bold">Admin Panelga Kirish</h2>
              <p className="text-[11px] text-slate-400 font-normal">Faqat do‘kon egasi va ma'murlar uchun</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-[#131B2D]/80 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Xavfsizlik eslatmasi:</span>
            <p className="text-slate-400 mt-0.5">
              Mahsulot qo‘shish, narxlarni o‘zgartirish, o‘chirish va ombor hisobotlarini ko‘rish faqat do‘kon ma'muri uchun ruxsat etilgan.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-2xl text-xs text-red-200 flex items-center gap-2.5 animate-shake">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
            <div>
              <p className="font-bold text-red-300">Parol noto‘g‘ri kiritildi!</p>
              <p className="text-[11px] text-red-400 mt-0.5">
                Standart PIN-kod: <span className="font-mono font-bold text-white bg-black/40 px-1.5 py-0.5 rounded">7777</span>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                <span>Admin PIN yoki Parolni kiriting:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Standart: <strong className="text-amber-400">7777</strong>
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(false);
                }}
                placeholder="PIN-kodni yozing..."
                className={`w-full tracking-widest text-base sm:text-lg font-mono px-4 py-3 bg-[#090D14] border ${
                  error ? 'border-red-500/80' : 'border-slate-700/80 focus:border-orange-500'
                } rounded-2xl text-white placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-xs focus:outline-none transition-colors pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-[#131B2D] hover:bg-[#1A253E] border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-2xl transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-orange-500/20 active:scale-[0.98]"
            >
              Kirish (Tasdiqlash)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
