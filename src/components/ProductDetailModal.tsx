import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Wrench,
  Check,
  BatteryCharging,
  Zap,
} from 'lucide-react';
import type { Product, BranchLocation } from '../types';
import { formatUzs, getProductImage } from '../utils/format';

interface ProductDetailModalProps {
  product: Product | null;
  locations: BranchLocation[];
  onClose: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onOpenQuickOrder?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  locations,
  onClose,
  onAddToCart,
  onOpenQuickOrder,
}) => {
  const [selectedQty, setSelectedQty] = useState<number>(4);
  const [tradeInChecked, setTradeInChecked] = useState<boolean>(true);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);

  if (!product) return null;

  const isBattery = product.category === 'Akkumulyator';
  const defaultQty = isBattery ? 1 : 4;
  const qty = selectedQty || defaultQty;
  const storeLocation = 'Namangan sh., Lola markazi (Yetkazib berish yoki Olib ketish)';

  const handleAdd = () => {
    onAddToCart(product.id, qty);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0D121F] text-slate-100 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-800 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono font-bold text-orange-400">
              {product.brand}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">{product.category}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Product Image & Badges */}
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-[#080C14] rounded-2xl overflow-hidden border border-slate-800 relative">
              <img
                src={getProductImage(product.imageType)}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-3 right-3 bg-[#0D121F]/90 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white shadow-md">
                {product.size}
              </div>
            </div>

            {/* Service & Guarantee Badges */}
            <div className="space-y-2 text-xs text-slate-300 bg-[#111726] p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-white">{product.warrantyMonths} oy rasmiy kafolat</strong> (Namangan)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#EA580C] shrink-0" />
                <span>
                  {isBattery
                    ? 'Bepul generator testi va akkumulyator o‘rnatib berish'
                    : 'Filialimizda bepul o‘rnatish va 3D balansirovka chegirmasi'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Namangan shahrida 1 soatda tezkor yetkazib berish</span>
              </div>
            </div>
          </div>

          {/* Right: Info & Purchase Controls */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-xl font-display font-bold text-white leading-snug">
                {product.name}
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed">
                {product.description ||
                  `Namangan viloyati bo‘yicha rasmiy kafolatli ${product.brand} mahsuloti. Ishonchli, sifatli va uzoq muddat xizmat qiladi.`}
              </p>

              {/* Technical Specs List */}
              <div className="space-y-1.5 text-xs border-y border-slate-800 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">O‘lchami / Parametri:</span>
                  <span className="font-mono font-semibold text-white">{product.size}</span>
                </div>
                {isBattery && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sig‘imi (Ah):</span>
                      <span className="font-mono font-semibold text-white">
                        {product.batteryCapacityAh || 60} Amper-soat
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Boshlang‘ich toki (CCA):</span>
                      <span className="font-mono font-semibold text-white">
                        {product.batteryColdCrankingAmps || 540} A
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Xarakteristika / Tezlik:</span>
                  <span className="font-mono text-slate-300">{product.speedIndex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mos avtomobillar:</span>
                  <span className="font-medium text-slate-200 text-right">
                    {product.compatibleCars.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Do‘kon manzili:</span>
                  <span className="font-medium text-slate-300">{storeLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Omborda mavjud:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {product.stock} dona qolgan
                  </span>
                </div>
              </div>

              {/* Trade-in Promo for Batteries */}
              {isBattery && product.tradeInDiscount && (
                <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-2xl space-y-1.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tradeInChecked}
                      onChange={(e) => setTradeInChecked(e.target.checked)}
                      className="mt-0.5 rounded border-amber-500 text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <BatteryCharging className="w-3.5 h-3.5 text-[#EA580C]" />
                        Eski akkumulyatoringizni topshiring (-{formatUzs(product.tradeInDiscount)})
                      </div>
                      <p className="text-amber-200/80 mt-0.5">
                        Eskisini berganingizda to‘lovdan {formatUzs(product.tradeInDiscount)} chegirib beramiz!
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Pricing */}
              <div className="pt-2">
                <span className="text-xs text-slate-400 block">Narxi (1 dona):</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-mono font-bold text-[#FB923C] tabular-nums">
                    {formatUzs(product.salePrice)}
                  </span>
                  {isBattery && tradeInChecked && product.tradeInDiscount && (
                    <span className="text-xs font-mono text-emerald-400">
                      (Eskisini topshirsangiz: {formatUzs(product.salePrice - product.tradeInDiscount)})
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-300">Miqdorini tanlang:</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      disabled={product.stock < n}
                      onClick={() => setSelectedQty(n)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer disabled:opacity-40 ${
                        qty === n
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold shadow-xs'
                          : 'bg-[#131B2D] text-slate-300 hover:bg-[#1C2742] hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {n === 4 && !isBattery ? '4 ta (Komplekt)' : `${n} dona`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                disabled={product.stock < qty}
                onClick={handleAdd}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95 ${
                  addedNotice
                    ? 'bg-emerald-600'
                    : 'bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700'
                }`}
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Korzinkaga qo‘shildi!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isBattery
                        ? `Akkumulyatorni savatga qo‘shish (${formatUzs(product.salePrice * qty)})`
                        : `Savatchaga qo‘shish (${qty} dona · ${formatUzs(product.salePrice * qty)})`}
                    </span>
                  </>
                )}
              </button>

              {onOpenQuickOrder && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickOrder(product);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#1A2338] border border-orange-500/40 text-orange-400 hover:bg-[#23304E] hover:text-orange-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  <span>1-bosqichda tezkor xarid (Kassaga o‘tmasdan)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
