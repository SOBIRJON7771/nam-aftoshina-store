import React, { useState } from 'react';
import { Lock, X, Check, ShieldAlert } from 'lucide-react';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === '7777' || pin.trim() === 'admin' || pin.trim() === '1234') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  const handleInstantUnlock = () => {
    setError(false);
    setPin('');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0D121F] text-slate-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-display font-bold">
            <Lock className="w-5 h-5 text-[#EA580C]" />
            <span>Do‘kon Egasi / Admin Kirish</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Ushbu bo‘lim do‘kon egasi uchun maxfiy bo‘lib, ombor qoldiqlari, tan narxlari,
          sof foyda hisoboti va Telegram Bot sozlamalarini o‘z ichiga oladi.
        </p>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>Parol noto‘g‘ri. Standart PIN: 7777</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Admin PIN-kodini kiriting (Standart: 7777):
            </label>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="****"
              className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 bg-[#090D14] border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/20"
          >
            Tasdiqlash va Kirish
          </button>

          <button
            type="button"
            onClick={handleInstantUnlock}
            className="w-full py-2 px-4 bg-[#131B2D] hover:bg-[#1A253E] border border-slate-700/70 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Do‘kon egasi sifatida ochish</span>
          </button>
        </form>
      </div>
    </div>
  );
};
