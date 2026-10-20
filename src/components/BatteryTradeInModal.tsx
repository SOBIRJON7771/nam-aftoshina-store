import React, { useState } from 'react';
import { BatteryCharging, X, CheckCircle, ArrowRight, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import type { Product } from '../types';
import { formatUzs } from '../utils/format';

interface BatteryTradeInModalProps {
  isOpen: boolean;
  onClose: () => void;
  batteryProducts: Product[];
  onSelectBatteryWithTradeIn: (product: Product, tradeInDiscount: number, oldBatteryAmps: number) => void;
}

const OLD_BATTERY_TIERS = [
  { capacity: 45, label: '45 Ah (Damas, Labo, Matiz, Spark)', discount: 70000 },
  { capacity: 60, label: '60 Ah (Cobalt, Gentra, Nexia 3, Onix)', discount: 100000 },
  { capacity: 65, label: '65 Ah (Tracker 2, Malibu 2, Captiva)', discount: 110000 },
  { capacity: 75, label: '75 Ah (Malibu 2, Haval, Gazel, Isuzu)', discount: 130000 },
  { capacity: 90, label: '90 – 100 Ah+ (Yuk mashinalar va Jiplar)', discount: 160000 },
];

export const BatteryTradeInModal: React.FC<BatteryTradeInModalProps> = ({
  isOpen,
  onClose,
  batteryProducts,
  onSelectBatteryWithTradeIn,
}) => {
  const [selectedAmps, setSelectedAmps] = useState<number>(60);
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>(
    batteryProducts[0]?.id || ''
  );

  if (!isOpen) return null;

  const currentTier =
    OLD_BATTERY_TIERS.find((t) => t.capacity === selectedAmps) || OLD_BATTERY_TIERS[1];
  const selectedProduct =
    batteryProducts.find((p) => p.id === selectedBatteryId) || batteryProducts[0];

  const originalPrice = selectedProduct?.salePrice || 0;
  const finalDiscount = currentTier.discount;
  const priceWithTradeIn = Math.max(0, originalPrice - finalDiscount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0D121F] border border-slate-800 text-slate-100 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">
                Eski Akkumulyatorni Topshirib Chegirma Oling!
              </h2>
              <p className="text-xs text-slate-400">
                Eski akkumulyatoringizni utilizatsiyaga bering va yangisiga 160 000 so‘mgacha chegirma oling
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Select Old Battery Capacity */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            1-Bosqich: Topshirmoqchi bo‘lgan eski akkumulyatoringiz sig‘imi (Ah):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {OLD_BATTERY_TIERS.map((tier) => {
              const active = tier.capacity === selectedAmps;
              return (
                <div
                  key={tier.capacity}
                  onClick={() => setSelectedAmps(tier.capacity)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    active
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-[#111726] border-slate-800 text-slate-300 hover:bg-[#182136]'
                  }`}
                >
                  <div>
                    <span className="font-display font-bold text-sm block text-white">
                      {tier.capacity} Ah
                    </span>
                    <span className="text-[11px] text-slate-400">{tier.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      -{formatUzs(tier.discount)}
                    </span>
                    <span className="text-[10px] text-slate-500">chegirma</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select New Battery */}
        {batteryProducts.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              2-Bosqich: O‘zingizga mos yangi akkumulyatorni tanlang:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {batteryProducts.map((p) => {
                const active = p.id === selectedBatteryId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedBatteryId(p.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-orange-950/40 border-orange-500 text-white shadow-md'
                        : 'bg-[#111726] border-slate-800 text-slate-300 hover:bg-[#182136]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[200px]">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {p.brand} · {p.size}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-orange-400">
                        {formatUzs(p.salePrice)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Calculation Result Summary Box */}
        {selectedProduct && (
          <div className="bg-[#111726] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Yangi akkumulyator narxi:</span>
              <span className="font-mono text-slate-200">{formatUzs(originalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <BatteryCharging className="w-4 h-4" />
                Eski {selectedAmps}Ah akkumulyator uchun chegirma:
              </span>
              <span className="font-mono font-bold">-{formatUzs(finalDiscount)}</span>
            </div>
            <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">
                  Siz to‘laydigan yakuniy narx:
                </span>
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {formatUzs(priceWithTradeIn)}
                </span>
              </div>
              <div className="text-right text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{formatUzs(finalDiscount)} tejab qoldingiz!</span>
              </div>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 bg-[#111726]/50 p-2.5 rounded-xl border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Topshirilgan eski batareyalar ekologik xavfsiz qayta ishlanadi.</span>
          </div>
          <div className="flex items-center gap-2 bg-[#111726]/50 p-2.5 rounded-xl border border-slate-800/80">
            <Zap className="w-4 h-4 text-orange-400 shrink-0" />
            <span>Do‘konga kelganingizda ustalardan bepul o‘rnatib berish xizmati.</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Yopish
          </button>
          {selectedProduct && (
            <button
              type="button"
              onClick={() => {
                onSelectBatteryWithTradeIn(selectedProduct, finalDiscount, selectedAmps);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>Chegirma bilan savatga qo‘shish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
