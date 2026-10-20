import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Edit3,
  Trash2,
  PackagePlus,
  AlertTriangle,
  DollarSign,
  Package,
} from 'lucide-react';
import type { Product, BranchLocation, ProductCategory } from '../types';
import { formatUzs } from '../utils/format';
import { ProductImageUploader } from './ProductImageUploader';

export const CATEGORY_OPTIONS: ProductCategory[] = [
  'Yozgi shina',
  'Qishki shina',
  '4 Fasl (All-Season)',
  'Litye Diska',
  'Akkumulyator',
  'Aksessuarlar',
];

// ==========================================
// 1. ADD NEW PRODUCT MODAL
// ==========================================
interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: BranchLocation[];
  onAddProduct: (payload: {
    name: string;
    brand: string;
    category: ProductCategory;
    size: string;
    radius: string;
    compatibleCars: string[];
    costPrice: number;
    salePrice: number;
    initialStock: number;
    minStockAlert: number;
    branchId: string;
    imageType?: Product['imageType'];
    imageUrl?: string;
    speedIndex?: string;
    warrantyMonths?: number;
    tradeInDiscount?: number;
  }) => Promise<void>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  locations,
  onAddProduct,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Michelin');
  const [category, setCategory] = useState<ProductCategory>('Yozgi shina');
  const [size, setSize] = useState('195/65 R15');
  const [radius, setRadius] = useState('R15');
  const [cars, setCars] = useState('Cobalt, Gentra, Nexia 3');
  const [costPrice, setCostPrice] = useState<number>(680000);
  const [salePrice, setSalePrice] = useState<number>(850000);
  const [initialStock, setInitialStock] = useState<number>(40);
  const [minStockAlert, setMinStockAlert] = useState<number>(8);
  const [branchId, setBranchId] = useState<string>(locations[0]?.id || 'loc-lola');
  const [speedIndex, setSpeedIndex] = useState('91V (240 km/s)');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(24);
  const [tradeInDiscount, setTradeInDiscount] = useState<number>(0);
  const [imageType, setImageType] = useState<Product['imageType']>('summer');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) {
      setError('Iltimos, mahsulot nomi va brendini kiriting');
      return;
    }
    if (salePrice <= 0) {
      setError('Sotuv narxi 0 dan katta bo‘lishi kerak');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const parsedCars = cars
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await onAddProduct({
        name: name.trim(),
        brand: brand.trim(),
        category,
        size: size.trim() || 'Standart',
        radius: radius.trim() || 'R15',
        compatibleCars: parsedCars.length > 0 ? parsedCars : ['Barcha avtomobillar'],
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice),
        initialStock: Number(initialStock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        branchId: branchId || locations[0]?.id || 'loc-lola',
        speedIndex: speedIndex.trim() || undefined,
        warrantyMonths: Number(warrantyMonths) || 12,
        tradeInDiscount: category === 'Akkumulyator' ? Number(tradeInDiscount) : 0,
        imageType,
        imageUrl: imageUrl.trim() || undefined,
      });

      // reset form
      setName('');
      setImageUrl('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0D121F] text-slate-100 rounded-3xl max-w-2xl w-full border border-orange-500/30 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#111726]">
          <div>
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-orange-500" />
              <span>Yangi Mahsulot Qo‘shish (Katalog & Ombor)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Mahsulot ma’lumotlari va narxini belgilang. U darhol saytda va omborda paydo bo‘ladi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nomi va Brendi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mahsulot Nomi <span className="text-orange-400">*</span>:
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: Michelin Primacy 4 yoki Varta Blue Dynamic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Brendi <span className="text-orange-400">*</span>:
              </label>
              <input
                type="text"
                required
                placeholder="Michelin, Bars, Hankook..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>
          </div>

          {/* Kategoriya, O'lchami, Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kategoriya:
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as ProductCategory;
                  setCategory(cat);
                  if (cat === 'Akkumulyator') setImageType('battery');
                  else if (cat === 'Aksessuarlar') setImageType('accessory');
                  else if (cat === 'Litye Diska') setImageType('wheel');
                  else if (cat === 'Qishki shina') setImageType('winter');
                  else setImageType('summer');
                }}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                O‘lchami / Parametr:
              </label>
              <input
                type="text"
                required
                placeholder="195/65 R15 yoki 60Ah 540A"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Radius / O‘lcham kodi:
              </label>
              <input
                type="text"
                placeholder="R15, R16, 60Ah..."
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Narxlar (Sotuv va Tan narxi) */}
          <div className="p-4 bg-[#131B2D] border border-orange-500/30 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Narxlarni Belgilash:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Mijoz uchun Sotuv Narxi (UZS) <span className="text-orange-400">*</span>:
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  placeholder="Masalan: 850000"
                  value={salePrice === 0 ? '' : salePrice}
                  onChange={(e) => setSalePrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#090D14] border border-orange-500/50 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-orange-500"
                />
                <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                  {formatUzs(salePrice)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Do‘kon Tan Narxi (Kirim UZS):
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Masalan: 680000"
                  value={costPrice === 0 ? '' : costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#090D14] border border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-300 focus:outline-none focus:border-orange-500"
                />
                <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                  Foyda: {formatUzs(Math.max(0, salePrice - costPrice))} / dona
                </span>
              </div>
            </div>
          </div>

          {/* Qoldiq va Ogohlantirish */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ombor Qoldig‘i (dona):
              </label>
              <input
                type="number"
                min={0}
                value={initialStock === 0 ? '' : initialStock}
                onChange={(e) => setInitialStock(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kam Qolganda Signal (dona):
              </label>
              <input
                type="number"
                min={1}
                value={minStockAlert === 0 ? '' : minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Filial:
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mos avtomobillar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mos Avtomobillar (vergul bilan):
            </label>
            <input
              type="text"
              placeholder="Cobalt, Gentra, Tracker, Onix, Nexia 3..."
              value={cars}
              onChange={(e) => setCars(e.target.value)}
              className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Qo'shimcha parametrlar: Kafolat & Trade-In */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kafolat muddati (oy):
              </label>
              <input
                type="number"
                min={0}
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Trade-in chegirmasi (UZS):
              </label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="160000"
                value={tradeInDiscount === 0 ? '' : tradeInDiscount}
                onChange={(e) => setTradeInDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Mahsulot Rasmi (Qurilmadan fayl yuklash, URL yoki Galereya) */}
          <ProductImageUploader
            imageUrl={imageUrl}
            imageType={imageType}
            category={category}
            productName={name}
            onChange={(val) => {
              setImageUrl(val.imageUrl);
              if (val.imageType) setImageType(val.imageType);
            }}
          />

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Katalogga Qo‘shish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. EDIT ANY PRODUCT ATTRIBUTE MODAL
// ==========================================
interface EditProductModalProps {
  product: Product | null;
  onClose: () => void;
  locations: BranchLocation[];
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  onClose,
  locations,
  onUpdateProduct,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Yozgi shina');
  const [size, setSize] = useState('');
  const [radius, setRadius] = useState('');
  const [cars, setCars] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minAlert, setMinAlert] = useState<number>(8);
  const [speedIndex, setSpeedIndex] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(24);
  const [tradeInDiscount, setTradeInDiscount] = useState<number>(0);
  const [branchId, setBranchId] = useState('');
  const [imageType, setImageType] = useState<Product['imageType']>('summer');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setBrand(product.brand || '');
      setCategory(product.category || 'Yozgi shina');
      setSize(product.size || '');
      setRadius(product.radius || '');
      setCars(product.compatibleCars ? product.compatibleCars.join(', ') : '');
      setCostPrice(product.costPrice || 0);
      setSalePrice(product.salePrice || 0);
      setStock(product.stock || 0);
      setMinAlert(product.minStockAlert || 8);
      setSpeedIndex(product.speedIndex || '');
      setWarrantyMonths(product.warrantyMonths || 24);
      setTradeInDiscount(product.tradeInDiscount || 0);
      setBranchId(product.branchId || locations[0]?.id || 'loc-lola');
      setImageType(product.imageType || 'summer');
      setImageUrl(product.imageUrl || '');
      setError(null);
    }
  }, [product, locations]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) {
      setError('Mahsulot nomi va brendi bo‘sh bo‘lishi mumkin emas');
      return;
    }
    if (salePrice <= 0) {
      setError('Sotuv narxi 0 dan katta bo‘lishi kerak');
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      const parsedCars = cars
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await onUpdateProduct(product.id, {
        name: name.trim(),
        brand: brand.trim(),
        category,
        size: size.trim(),
        radius: radius.trim(),
        compatibleCars: parsedCars,
        costPrice: Number(costPrice) || 0,
        salePrice: Number(salePrice),
        stock: Number(stock) || 0,
        minStockAlert: Number(minAlert) || 5,
        speedIndex: speedIndex.trim() || undefined,
        warrantyMonths: Number(warrantyMonths) || 12,
        tradeInDiscount: category === 'Akkumulyator' ? Number(tradeInDiscount) : 0,
        branchId: branchId || undefined,
        imageType,
        imageUrl: imageUrl.trim() || undefined,
      });

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0D121F] text-slate-100 rounded-3xl max-w-2xl w-full border border-orange-500/40 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#111726]">
          <div>
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-orange-400" />
              <span>Mahsulotni Tahrirlash: {product.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Sotuv narxini, ombor qoldig‘ini va barcha parametrlarini belgilashingiz mumkin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Nomi va Brendi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mahsulot Nomi:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Brendi:
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
              />
            </div>
          </div>

          {/* Kategoriya, O'lchami, Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kategoriya:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                O‘lchami / Parametr:
              </label>
              <input
                type="text"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Radius / Kod:
              </label>
              <input
                type="text"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Narxlar (Sotuv va Tan narxi) */}
          <div className="p-4 bg-[#131B2D] border border-orange-500/40 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              Narxlarini Belgilash:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Mijoz Sotuv Narxi (UZS):
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  placeholder="Masalan: 850000"
                  value={salePrice === 0 ? '' : salePrice}
                  onChange={(e) => setSalePrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#090D14] border border-orange-500 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-orange-400"
                />
                <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                  {formatUzs(salePrice)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Do‘kon Tan Narxi (UZS):
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="Masalan: 680000"
                  value={costPrice === 0 ? '' : costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#090D14] border border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-300 focus:outline-none focus:border-orange-500"
                />
                <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                  Sof foyda: {formatUzs(Math.max(0, salePrice - costPrice))} / dona
                </span>
              </div>
            </div>
          </div>

          {/* Qoldiq va Ogohlantirish */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ombor Qoldig‘i (dona):
              </label>
              <input
                type="number"
                min={0}
                value={stock === 0 ? '' : stock}
                onChange={(e) => setStock(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kam Qolganda Signal:
              </label>
              <input
                type="number"
                min={1}
                value={minAlert === 0 ? '' : minAlert}
                onChange={(e) => setMinAlert(e.target.value === '' ? 0 : Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Filial:
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mos avtomobillar */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mos Avtomobillar:
            </label>
            <input
              type="text"
              value={cars}
              onChange={(e) => setCars(e.target.value)}
              className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Qo'shimcha parametrlar: Kafolat & Trade-In */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kafolat muddati (oy):
              </label>
              <input
                type="number"
                min={0}
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Trade-in chegirmasi (UZS):
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={tradeInDiscount === 0 ? '' : tradeInDiscount}
                onChange={(e) => setTradeInDiscount(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Mahsulot Rasmi (Qurilmadan fayl yuklash, URL yoki Galereya) */}
          <ProductImageUploader
            imageUrl={imageUrl}
            imageType={imageType}
            category={category}
            productName={name}
            onChange={(val) => {
              setImageUrl(val.imageUrl);
              if (val.imageType) setImageType(val.imageType);
            }}
          />

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {isUpdating ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>O‘zgarishlarni Saqlash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. DELETE PRODUCT CONFIRMATION MODAL
// ==========================================
interface DeleteProductModalProps {
  product: Product | null;
  onClose: () => void;
  onDeleteProduct: (id: string) => Promise<void>;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  product,
  onClose,
  onDeleteProduct,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDeleteProduct(product.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0D121F] text-slate-100 rounded-3xl max-w-md w-full border border-red-500/40 shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Mahsulotni O‘chirish</h3>
            <p className="text-xs text-slate-400">Ushbu amalni ortga qaytarib bo‘lmaydi.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="p-4 bg-[#131B2D] border border-slate-800 rounded-2xl space-y-1 text-xs">
          <div className="text-white font-bold">{product.name}</div>
          <div className="text-slate-400">
            {product.brand} • {product.size} ({product.category})
          </div>
          <div className="text-orange-400 font-mono font-bold mt-1">
            Narxi: {formatUzs(product.salePrice)} | Qoldiq: {product.stock} dona
          </div>
        </div>

        <p className="text-xs text-slate-300">
          Haqiqatan ham ushbu mahsulotni sayt katalogi va ombor bazasidan butunlay olib
          tashlamoqchimisiz?
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirmDelete}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30 disabled:opacity-50"
          >
            {isDeleting ? (
              <span>O‘chirilmoqda...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Ha, Butunlay O‘chirish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
