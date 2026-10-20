import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, CheckCircle2, MapPin, Truck } from 'lucide-react';
import type { Product, BranchLocation, CartItem, Order } from '../types';
import { formatUzs, getProductImage } from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  locations: BranchLocation[];
  externalConfirmedOrder?: {
    order: Order;
    telegramMessage?: string;
    telegramSent?: boolean;
    botUsername?: string;
  } | null;
  onUpdateQty: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onSubmitOrder: (payload: {
    customerName: string;
    customerPhone: string;
    deliveryType: 'Filialdan olib ketish' | 'Manzilga yetkazib berish';
    branchId: string;
    deliveryAddress: string;
    paymentMethod: 'Naqd' | 'Click' | 'Payme' | 'Uzcard / Humo';
  }) => Promise<{ order: Order; telegramMessage?: string; telegramSent?: boolean; botUsername?: string } | null>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  locations,
  externalConfirmedOrder = null,
  onUpdateQty,
  onClearCart,
  onSubmitOrder,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+998 ');
  const [deliveryType, setDeliveryType] = useState<'Filialdan olib ketish' | 'Manzilga yetkazib berish'>(
    'Filialdan olib ketish'
  );
  const [branchId, setBranchId] = useState<string>(locations[0]?.id || 'loc-lola');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Naqd' | 'Click' | 'Payme' | 'Uzcard / Humo'>('Click');
  const [tradeInBatteries, setTradeInBatteries] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedData, setConfirmedData] = useState<{
    order: Order;
    telegramMessage?: string;
    telegramSent?: boolean;
    botUsername?: string;
  } | null>(externalConfirmedOrder);

  React.useEffect(() => {
    if (externalConfirmedOrder) {
      setConfirmedData(externalConfirmedOrder);
    }
  }, [externalConfirmedOrder]);

  if (!isOpen) return null;

  const detailedCart = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter((x): x is { product: Product; quantity: number } => x !== null);

  const rawSubtotal = detailedCart.reduce(
    (sum, item) => sum + item.product.salePrice * item.quantity,
    0
  );

  const totalBatteryCount = detailedCart
    .filter((i) => i.product.category === 'Akkumulyator')
    .reduce((sum, i) => sum + i.quantity, 0);

  const tradeInDiscountTotal =
    tradeInBatteries && totalBatteryCount > 0
      ? detailedCart
          .filter((i) => i.product.category === 'Akkumulyator')
          .reduce((sum, i) => sum + (i.product.tradeInDiscount || 100000) * i.quantity, 0)
      : 0;

  const subtotal = Math.max(0, rawSubtotal - tradeInDiscountTotal);
  const totalItems = detailedCart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Iltimos, ismingizni kiriting.');
      return;
    }
    if (customerPhone.trim().length < 9) {
      setErrorMsg('Iltimos, telefon raqamingizni to‘liq kiriting.');
      return;
    }
    if (deliveryType === 'Manzilga yetkazib berish' && !deliveryAddress.trim()) {
      setErrorMsg('Yetkazib berish manzilini kiriting.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmitOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryType,
        branchId,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
      });
      if (result) {
        setConfirmedData(result);
        setCustomerName('');
        setDeliveryAddress('');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Buyurtma yuborishda xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0B0F19] text-slate-100 h-full flex flex-col justify-between shadow-2xl border-l border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0F1626]/90 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#EA580C]" />
            <h2 className="text-lg font-display font-bold text-white tracking-tight">
              Nam Avtoshina Korzinkasi
            </h2>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              · {totalItems} dona
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmedData(null);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {confirmedData ? (
            <div className="bg-gradient-to-b from-[#111A2E] via-[#0D1424] to-[#090D18] border border-emerald-500/30 shadow-2xl shadow-emerald-950/50 rounded-3xl p-6 sm:p-7 space-y-6 relative overflow-hidden">
              <div className="text-center py-2 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/15 ring-4 ring-emerald-500/5">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  Buyurtmangiz muvaffaqiyatli qabul qilindi!
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Buyurtma raqamingiz: <strong className="text-emerald-400 font-mono font-bold bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">#{confirmedData.order.orderNumber}</strong>. Mutaxassisimiz tez orada siz bilan telefon orqali bog‘lanadi.
                </p>
              </div>

              <div className="bg-[#090E1B]/95 border border-slate-800/90 rounded-2xl p-5 space-y-3 text-xs backdrop-blur-md">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Xaridor:</span>
                  <span className="font-semibold text-white">{confirmedData.order.customerName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Telefon:</span>
                  <span className="font-mono font-semibold text-slate-100">{confirmedData.order.customerPhone}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Qabul qilish:</span>
                  <span className="font-medium text-slate-200">{confirmedData.order.deliveryType}</span>
                </div>
                <div className="flex justify-between items-start py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium shrink-0">Manzil:</span>
                  <span className="font-medium text-slate-200 text-right max-w-[240px]">
                    {confirmedData.order.deliveryAddress}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">To‘lov turi:</span>
                  <span className="font-medium text-slate-200">{confirmedData.order.paymentMethod}</span>
                </div>
                <div className="pt-2 space-y-2">
                  {confirmedData.order.items.map((item) => (
                    <div key={item.productId} className="flex justify-between font-mono tabular-nums text-xs">
                      <span className="text-slate-300">
                        {item.productName} ({item.size}) × {item.quantity}
                      </span>
                      <span className="font-semibold text-white">
                        {formatUzs(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-700/80 flex justify-between items-baseline text-sm font-mono font-bold text-white tabular-nums">
                  <span className="text-slate-300 tracking-wide uppercase text-xs">Jami to‘lov:</span>
                  <span className="text-xl text-[#FB923C] drop-shadow-sm">{formatUzs(confirmedData.order.totalAmount)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConfirmedData(null);
                  onClose();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/25 active:scale-[0.99] cursor-pointer"
              >
                Katalogga qaytish
              </button>
            </div>
          ) : detailedCart.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="space-y-1.5">
                <p className="text-lg font-display font-bold text-white">
                  Korzinkangiz hozircha bo‘sh
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Katalogdan o‘zingizga mos razmerdagi shina yoki akkumulyatorlarni tanlab korzinkaga qo‘shing.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs font-bold rounded-xl hover:from-orange-600 hover:to-amber-700 transition-colors shadow-md cursor-pointer"
              >
                Katalogni ko‘rish
              </button>
            </div>
          ) : (
            <>
              {/* Itemized Cart List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Tanlangan mahsulotlar ({detailedCart.length} xil):
                  </span>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Tozalash
                  </button>
                </div>

                {detailedCart.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="p-3.5 bg-[#111726] border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-sm"
                  >
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover bg-[#090D14] border border-slate-700/80 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-400 font-mono">
                        {product.size} · Omborda: {product.stock} ta
                      </p>
                      <h4 className="text-sm font-display font-semibold text-white truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs font-mono font-bold text-[#FB923C] tabular-nums mt-0.5">
                        {formatUzs(product.salePrice * quantity)}{' '}
                        <span className="text-slate-400 font-normal">
                          ({formatUzs(product.salePrice)} / dona)
                        </span>
                      </p>
                    </div>

                    {/* Quantity Steppers */}
                    <div className="flex items-center gap-1.5 bg-[#090D14] border border-slate-700/80 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(product.id, quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                        aria-label="Kamaytirish"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-mono font-bold text-white tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={quantity >= product.stock}
                        onClick={() => onUpdateQty(product.id, quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                        aria-label="Ko'paytirish"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Checkout Form */}
              <form id="cart-checkout-form" onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-display font-bold text-white">
                  Buyurtmani rasmiylashtirish
                </h3>

                {errorMsg && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Ism-familiyangiz *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masalan: Sardor Karimov"
                      className="w-full px-3 py-2 bg-[#090D14] border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Telefon raqamingiz *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-3 py-2 bg-[#090D14] border border-slate-700/80 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                    />
                  </div>
                </div>

                {/* Delivery / Pickup Selector */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-300">
                    Qabul qilish usuli:
                  </span>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#090D14] border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('Filialdan olib ketish')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        deliveryType === 'Filialdan olib ketish'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Do‘kondan olib ketish
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('Manzilga yetkazib berish')}
                      className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        deliveryType === 'Manzilga yetkazib berish'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      Yetkazib berish
                    </button>
                  </div>
                </div>

                {deliveryType === 'Filialdan olib ketish' ? (
                  <div className="p-3 bg-[#111726] border border-slate-800 rounded-xl text-xs space-y-1">
                    <p className="font-semibold text-orange-400">
                      📍 Do‘kon manzili: Namangan shahri, Lola avtobozori ro‘parasida
                    </p>
                    <p className="text-slate-400">
                      Islom Karimov ko‘chasi, 44-uy. Ish vaqti: 08:00 – 20:00 (Har kuni)
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Yetkazib berish manzili (Namangan shahar, tuman, ko‘cha, uy) *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Namangan sh., Davlatobod, 3-kichik nohiya..."
                      className="w-full px-3 py-2 bg-[#090D14] border border-slate-700/80 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
                    />
                  </div>
                )}

                {totalBatteryCount > 0 && (
                  <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl space-y-1">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tradeInBatteries}
                        onChange={(e) => setTradeInBatteries(e.target.checked)}
                        className="mt-0.5 rounded border-amber-500 text-[#EA580C] focus:ring-[#EA580C]"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-amber-300">
                          Eski akkumulyatorimni topshiraman (-{formatUzs(tradeInDiscountTotal)})
                        </span>
                        <p className="text-amber-200/80 mt-0.5">
                          {totalBatteryCount} ta akkumulyatoringiz uchun jami {formatUzs(tradeInDiscountTotal)} chegirma hisoblandi.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    To‘lov usuli:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#090D14] border border-slate-800 rounded-xl">
                    {(['Click', 'Payme', 'Naqd', 'Uzcard / Humo'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 truncate cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Sticky Footer */}
        {!confirmedData && detailedCart.length > 0 && (
          <div className="p-6 border-t border-slate-800 bg-[#0F1626]/95 backdrop-blur space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-slate-400">
                Jami to‘lov ({totalItems} dona):
              </span>
              <span className="text-2xl font-mono font-bold text-[#FB923C] tabular-nums">
                {formatUzs(subtotal)}
              </span>
            </div>
            <button
              type="submit"
              form="cart-checkout-form"
              disabled={submitting}
              className="w-full py-4 px-4 bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-bold uppercase tracking-wider rounded-xl disabled:opacity-50 transition-all shadow-lg shadow-orange-500/25 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>
                {submitting
                  ? 'Rasmiylashtirilmoqda...'
                  : 'Haridni tasdiqlash (Telegram Botga yuborish)'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
