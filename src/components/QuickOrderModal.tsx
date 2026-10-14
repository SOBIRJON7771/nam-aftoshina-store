import React, { useState } from 'react';
import {
  Zap,
  X,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { Product, BranchLocation } from '../types';
import { formatUzs, getProductImage } from '../utils/format';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  locations: BranchLocation[];
  onOrderSuccess: (orderData: any) => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  product,
  locations,
  onOrderSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('+998 ');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(locations[0]?.id || '');
  const [deliveryType, setDeliveryType] = useState<'Filialdan olib ketish' | 'Manzilga yetkazib berish'>(
    'Filialdan olib ketish'
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const totalAmount = product.salePrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 9) {
      setErrorMessage('Iltimos, to‘g‘ri telefon raqamingizni kiriting');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Iltimos, ismingizni kiriting');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const selectedBranch =
      locations.find((l) => l.id === selectedBranchId) || locations[0];

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryType,
          branchId: selectedBranch?.id || 'loc-lola',
          branchName: selectedBranch?.name || 'Lola Bosh Markazi',
          deliveryAddress:
            deliveryType === 'Manzilga yetkazib berish'
              ? deliveryAddress.trim() || 'Namangan shahri bo‘ylab tezkor yetkazish'
              : `${selectedBranch?.name} (${selectedBranch?.address})`,
          paymentMethod: 'Naqd',
          items: [
            {
              productId: product.id,
              quantity,
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Buyurtma yuborishda xatolik yuz berdi');
      }

      const data = await res.json();
      onOrderSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0D121F] border border-slate-800 text-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white">
                1-Bosqichda Tezkor Xarid
              </h2>
              <p className="text-xs text-slate-400">
                Ortiqcha ro‘yxatdan o‘tishsiz, 30 soniyada buyurtma bering
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

        {/* Selected Product Summary Box */}
        <div className="bg-[#111726] border border-slate-800 rounded-2xl p-4 flex gap-4 items-center">
          <img
            src={getProductImage(product)}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-xl object-cover bg-slate-950 shrink-0 border border-slate-800"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-orange-400 font-mono uppercase">
              {product.brand} · {product.size}
            </div>
            <h4 className="text-sm font-bold text-white truncate">{product.name}</h4>
            <div className="text-sm font-mono font-bold text-[#FB923C] mt-1">
              {formatUzs(product.salePrice)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Soni (dona):
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 4].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    quantity === q
                      ? 'bg-[#EA580C] text-white shadow-md'
                      : 'bg-[#111726] border border-slate-800 text-slate-300 hover:bg-[#182136]'
                  }`}
                >
                  {q === 4 ? '4 dona (Komplekt)' : `${q} dona`}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Ismingiz:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masalan: Sardorbek"
                className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Telefon raqamingiz:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Delivery Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryType('Filialdan olib ketish')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deliveryType === 'Filialdan olib ketish'
                  ? 'bg-orange-950/60 border border-orange-500 text-orange-400'
                  : 'bg-[#111726] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Do‘kondan olib ketish
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType('Manzilga yetkazib berish')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                deliveryType === 'Manzilga yetkazib berish'
                  ? 'bg-orange-950/60 border border-orange-500 text-orange-400'
                  : 'bg-[#111726] border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              1 soatda yetkazib berish
            </button>
          </div>

          {deliveryType === 'Filialdan olib ketish' ? (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Qaysi filialdan olasiz:
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-[#111726] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-[#0D121F]">
                    {loc.name} ({loc.district})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Yetkazib berish manzili:
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Namangan sh., Chorsu yoki mo‘ljal"
                  className="w-full bg-[#111726] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs p-3 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Total & Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Jami to‘lov summasi:</span>
              <span className="text-xl font-mono font-bold text-orange-400">
                {formatUzs(totalAmount)}
              </span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 rounded-xl text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Qabul qilinmoqda...</span>
                </>
              ) : (
                <>
                  <span>Buyurtmani tasdiqlash</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
