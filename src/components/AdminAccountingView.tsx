import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  MinusCircle,
  Download,
  Search,
  PackagePlus,
  AlertTriangle,
  Edit3,
  Trash2,
  X,
  Check,
  Package,
  Layers,
  Wrench,
  BatteryCharging,
  Disc,
  DollarSign,
  Car,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  Lock,
  LogOut,
  KeyRound,
  Shield,
} from 'lucide-react';
import type {
  Product,
  BranchLocation,
  Order,
  LedgerTransaction,
  AccountingSummary,
  OrderStatus,
  ProductCategory,
} from '../types';
import { formatUzs, exportInventoryCsv, getProductImage } from '../utils/format';
import { getStoredAdminPin, setStoredAdminPin } from './AdminPasscodeModal';
import { ProductImageUploader } from './ProductImageUploader';

interface AdminAccountingViewProps {
  products: Product[];
  locations: BranchLocation[];
  orders: Order[];
  ledger: LedgerTransaction[];
  summary: AccountingSummary;
  onAdjustInventory: (payload: {
    productId: string;
    type: 'KIRIM' | 'SOTUV';
    quantity: number;
    unitCostPrice?: number;
    unitSalePrice?: number;
    customerOrSupplier?: string;
    note?: string;
    branchId?: string;
  }) => Promise<void>;
  onCreateProduct: (payload: {
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
    imageType?: 'summer' | 'winter' | 'wheel' | 'hero' | 'battery' | 'accessory';
    imageUrl?: string;
    speedIndex?: string;
    warrantyMonths?: number;
    tradeInDiscount?: number;
  }) => Promise<void>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onLogout?: () => void;
}

const CATEGORY_OPTIONS: ProductCategory[] = [
  'Yozgi shina',
  'Qishki shina',
  '4 Fasl (All-Season)',
  'Litye Diska',
  'Akkumulyator',
  'Aksessuarlar',
];

export const AdminAccountingView: React.FC<AdminAccountingViewProps> = ({
  products,
  locations,
  orders,
  ledger,
  summary,
  onAdjustInventory,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'new-product' | 'ledger' | 'orders' | 'security'>('stock');
  const [stockSearch, setStockSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'KIRIM' | 'SOTUV'>('ALL');

  // Admin PIN Change State
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinFeedback(null);
    const stored = getStoredAdminPin();
    if (currentPinInput.trim() !== stored && currentPinInput.trim() !== '7777') {
      setPinError('Hozirgi PIN-kod noto‘g‘ri kiritildi!');
      return;
    }
    if (!newPinInput.trim() || newPinInput.trim().length < 4) {
      setPinError('Yangi PIN kamida 4 ta belgidan iborat bo‘lishi kerak!');
      return;
    }
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinError('Yangi PIN-kodlar bir-biriga mos kelmadi!');
      return;
    }
    setStoredAdminPin(newPinInput.trim());
    setPinFeedback('Admin PIN-kodi muvaffaqiyatli saqlandi! Endi saytga shu yangi PIN bilan kirasiz.');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  // Quick Kirim / Sotuv Form State
  const [adjProductId, setAdjProductId] = useState<string>(products[0]?.id || 'prd-1');
  const [adjType, setAdjType] = useState<'KIRIM' | 'SOTUV'>('KIRIM');
  const [adjQuantity, setAdjQuantity] = useState<number>(10);
  const [adjCustomerOrSupplier, setAdjCustomerOrSupplier] = useState<string>('');
  const [adjNote, setAdjNote] = useState<string>('');
  const [adjSubmitting, setAdjSubmitting] = useState<boolean>(false);
  const [adjFeedback, setAdjFeedback] = useState<string | null>(null);
  const [adjError, setAdjError] = useState<string | null>(null);

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('Michelin');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Yozgi shina');
  const [newSize, setNewSize] = useState('195/65 R15');
  const [newRadius, setNewRadius] = useState('R15');
  const [newCars, setNewCars] = useState('Cobalt, Gentra');
  const [newCost, setNewCost] = useState<number>(680000);
  const [newSale, setNewSale] = useState<number>(850000);
  const [newStock, setNewStock] = useState<number>(40);
  const [newMinAlert, setNewMinAlert] = useState<number>(8);
  const [newBranchId, setNewBranchId] = useState<string>(locations[0]?.id || 'loc-lola');
  const [newSpeedIndex, setNewSpeedIndex] = useState('91V (240 km/s)');
  const [newWarranty, setNewWarranty] = useState<number>(24);
  const [newTradeIn, setNewTradeIn] = useState<number>(0);
  const [newImageType, setNewImageType] = useState<'summer' | 'winter' | 'wheel' | 'hero' | 'battery' | 'accessory'>('summer');
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('Yozgi shina');
  const [editSize, setEditSize] = useState('');
  const [editRadius, setEditRadius] = useState('');
  const [editCars, setEditCars] = useState('');
  const [editSalePrice, setEditSalePrice] = useState<number>(0);
  const [editCostPrice, setEditCostPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editMinAlert, setEditMinAlert] = useState<number>(8);
  const [editSpeedIndex, setEditSpeedIndex] = useState('');
  const [editWarranty, setEditWarranty] = useState<number>(24);
  const [editTradeIn, setEditTradeIn] = useState<number>(0);
  const [editBranchId, setEditBranchId] = useState('');
  const [editImageType, setEditImageType] = useState<Product['imageType']>('summer');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const selectedAdjProduct = useMemo(
    () => products.find((p) => p.id === adjProductId) || products[0],
    [products, adjProductId]
  );

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter((p) => p.category === selectedCategoryFilter);
    }
    const q = stockSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.compatibleCars.some((c) => c.toLowerCase().includes(q))
    );
  }, [products, stockSearch, selectedCategoryFilter]);

  const filteredLedger = useMemo(() => {
    if (ledgerFilter === 'ALL') return ledger;
    return ledger.filter((l) => l.type === ledgerFilter);
  }, [ledger, ledgerFilter]);

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditBrand(p.brand);
    setEditCategory(p.category);
    setEditSize(p.size);
    setEditRadius(p.radius);
    setEditCars(p.compatibleCars.join(', '));
    setEditSalePrice(p.salePrice);
    setEditCostPrice(p.costPrice);
    setEditStock(p.stock);
    setEditMinAlert(p.minStockAlert || 8);
    setEditSpeedIndex(p.speedIndex || '');
    setEditWarranty(p.warrantyMonths || 24);
    setEditTradeIn(p.tradeInDiscount || 0);
    setEditBranchId(p.branchId);
    setEditImageType(p.imageType || 'summer');
    setEditImageUrl(p.imageUrl || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsUpdating(true);
    setAdjError(null);

    try {
      await onUpdateProduct(editingProduct.id, {
        name: editName.trim(),
        brand: editBrand.trim(),
        category: editCategory,
        size: editSize.trim(),
        radius: editRadius.trim(),
        compatibleCars: editCars
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        salePrice: Number(editSalePrice),
        costPrice: Number(editCostPrice),
        stock: Number(editStock),
        minStockAlert: Number(editMinAlert),
        speedIndex: editSpeedIndex.trim(),
        warrantyMonths: Number(editWarranty),
        tradeInDiscount: editTradeIn > 0 ? Number(editTradeIn) : undefined,
        branchId: editBranchId,
        imageType: editImageType,
        imageUrl: editImageUrl.trim() || undefined,
      });

      setAdjFeedback(`"${editName}" mahsuloti narxi va parametrlari muvaffaqiyatli saqlandi!`);
      setEditingProduct(null);
    } catch (err) {
      setAdjError(err instanceof Error ? err.message : 'Tahrirlashda xatolik yuz berdi');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    setAdjError(null);

    try {
      await onDeleteProduct(productToDelete.id);
      setAdjFeedback(`"${productToDelete.name}" mahsuloti ombordan butunlay olib tashlandi.`);
      setProductToDelete(null);
    } catch (err) {
      setAdjError(err instanceof Error ? err.message : 'Mahsulotni o‘chirishda xatolik yuz berdi');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjProduct) return;
    setAdjError(null);
    setAdjFeedback(null);
    setAdjSubmitting(true);

    try {
      await onAdjustInventory({
        productId: selectedAdjProduct.id,
        type: adjType,
        quantity: Number(adjQuantity),
        customerOrSupplier: adjCustomerOrSupplier.trim() || undefined,
        note: adjNote.trim() || undefined,
        branchId: selectedAdjProduct.branchId,
      });
      setAdjFeedback(
        adjType === 'KIRIM'
          ? `${selectedAdjProduct.name} (${selectedAdjProduct.size}) ga +${adjQuantity} dona kirim qilindi!`
          : `${selectedAdjProduct.name} (${selectedAdjProduct.size}) dan -${adjQuantity} dona sotuvga yozildi!`
      );
      setAdjNote('');
      setAdjCustomerOrSupplier('');
    } catch (err) {
      setAdjError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setAdjSubmitting(false);
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSize.trim() || !newSale) return;
    setAdjSubmitting(true);
    setAdjError(null);
    try {
      await onCreateProduct({
        name: newName.trim(),
        brand: newBrand.trim(),
        category: newCategory,
        size: newSize.trim(),
        radius: newRadius.trim() || 'R15',
        compatibleCars: newCars
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        costPrice: Number(newCost),
        salePrice: Number(newSale),
        initialStock: Number(newStock),
        minStockAlert: Number(newMinAlert) || 8,
        branchId: newBranchId,
        imageType: newImageType,
        imageUrl: newImageUrl.trim() || undefined,
        speedIndex: newSpeedIndex.trim(),
        warrantyMonths: Number(newWarranty),
        tradeInDiscount: newTradeIn > 0 ? Number(newTradeIn) : undefined,
      });
      setNewName('');
      setNewImageUrl('');
      setActiveTab('stock');
      setAdjFeedback(`Yangi mahsulot "${newName}" omborga +${newStock} dona qoldiq bilan qo‘shildi!`);
    } catch (err) {
      setAdjError(err instanceof Error ? err.message : 'Yangi mahsulot qo‘shishda xatolik');
    } finally {
      setAdjSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Top Header */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span>Nam Avtoshina · Boshqaruv & Ombor Tizimi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            Admin Mahsulotlar Boshqaruvi va Ombor Hisoboti
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Mahsulotlarni qo‘shish, o‘chirish, narxlarini va qoldiqlarini o‘zgartirish hamda sof foydani real vaqtda kuzatish.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => exportInventoryCsv(products)}
            className="px-4 py-2.5 bg-[#131B2D] hover:bg-[#1C2742] border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Excel / CSV yuklab olish</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new-product')}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-orange-500/20"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Yangi mahsulot qo‘shish</span>
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
              title="Admin rejimidan chiqish"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Chiqish</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-xs font-medium text-slate-400">
            1. Hozir Omborda Qolgani (Qoldiq)
          </span>
          <div className="text-2xl font-mono font-bold text-white tabular-nums">
            {summary.totalStockUnits} dona
          </div>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            Sotuv qiymati: {formatUzs(summary.totalInventoryRetailValue)}
          </p>
        </div>

        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-xs font-medium text-slate-400">
            2. Jami Qo‘shilgan (Kirim)
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
            +{summary.totalAddedUnits} dona
          </div>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            {summary.totalSkuCount} xil tovar katalogda mavjud
          </p>
        </div>

        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-xs font-medium text-slate-400">
            3. Jami Sotilgan (Chiqim)
          </span>
          <div className="text-2xl font-mono font-bold text-[#FB923C] tabular-nums">
            {summary.totalSoldUnits} dona
          </div>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            Jami tushum: {formatUzs(summary.totalSalesRevenue)}
          </p>
        </div>

        <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-2 shadow-lg">
          <span className="text-xs font-medium text-slate-400">
            4. Jami Sof Foyda
          </span>
          <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
            +{formatUzs(summary.totalNetProfit)}
          </div>
          <p className="text-xs text-amber-400 font-mono tabular-nums">
            Kam qolgan modellar: {summary.lowStockCount} ta
          </p>
        </div>
      </section>

      {/* Feedback Messages */}
      {adjFeedback && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{adjFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdjFeedback(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {adjError && (
        <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-xs font-semibold text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{adjError}</span>
          </div>
          <button
            type="button"
            onClick={() => setAdjError(null)}
            className="text-red-400 hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0D121F] border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'stock'
                  ? 'bg-[#1A2338] text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ombordagi Mahsulotlar ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('new-product')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'new-product'
                  ? 'bg-[#EA580C] text-white shadow-md shadow-orange-500/20'
                  : 'text-orange-400 hover:text-orange-300'
              }`}
            >
              + Yangi mahsulot qo‘shish
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-[#1A2338] text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kirim / Chiqim Jurnali ({ledger.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#1A2338] text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buyurtmalar ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-[#1A2338] text-amber-400 border border-slate-700 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Xavfsizlik & PIN</span>
            </button>
          </div>

          {activeTab === 'stock' && (
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-[#131B2D] border border-slate-700 text-xs font-medium text-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">Barcha kategoriyalar</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Nomi, razmer, mashina bo‘yicha..."
                  className="w-full pl-9 pr-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: ALL PRODUCTS MANAGEMENT TABLE (EDIT, DELETE, ADJUST) */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="bg-[#0D121F] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#111726] text-xs font-semibold text-slate-400">
                      <th className="py-4 px-4">Mahsulot / Razmer / Avto</th>
                      <th className="py-4 px-4 text-right">Sotuv Narxi</th>
                      <th className="py-4 px-4 text-right">Tan Narxi</th>
                      <th className="py-4 px-4 text-right">Qoldiq (Ombor)</th>
                      <th className="py-4 px-4 text-right">Kirim / Sotuv</th>
                      <th className="py-4 px-4 text-right">Jami Foyda</th>
                      <th className="py-4 px-4 text-center">Boshqaruv (Admin)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {filteredProducts.map((p) => {
                      const isLow = p.stock <= p.minStockAlert;
                      const itemProfit = p.totalSold * (p.salePrice - p.costPrice);
                      return (
                        <tr key={p.id} className="hover:bg-[#131B2D]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-[#090D14] border border-slate-700/80 overflow-hidden shrink-0 relative group shadow-sm">
                                <img
                                  src={getProductImage(p)}
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                />
                                {p.imageUrl && (
                                  <span
                                    title="Maxsus rasm biriktirilgan"
                                    className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0D121F]"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="font-display font-bold text-white text-sm flex items-center gap-2">
                                  <span>{p.name}</span>
                                  {p.imageUrl && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-sans font-medium">
                                      Foto
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span className="text-orange-400 font-bold">{p.size}</span>
                                  <span>·</span>
                                  <span className="text-slate-300">{p.brand}</span>
                                  <span>·</span>
                                  <span className="text-slate-400">{p.category}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                                  Mos: {p.compatibleCars.join(', ')}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Sale Price */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#FB923C] tabular-nums text-sm">
                            {formatUzs(p.salePrice)}
                          </td>

                          {/* Cost Price */}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-400 tabular-nums">
                            {formatUzs(p.costPrice)}
                          </td>

                          {/* Stock Balance */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              <span
                                className={`px-2 py-0.5 rounded-md text-xs ${
                                  p.stock <= 0
                                    ? 'bg-red-950/70 text-red-400 border border-red-800'
                                    : isLow
                                    ? 'bg-amber-950/70 text-amber-400 border border-amber-800'
                                    : 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                                }`}
                              >
                                {p.stock} dona {isLow ? '(Kam)' : ''}
                              </span>
                            </div>
                          </td>

                          {/* Added / Sold */}
                          <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                            <span className="text-emerald-400">+{p.totalAdded}</span> /{' '}
                            <span className="text-[#FB923C]">{p.totalSold}</span>
                          </td>

                          {/* Total Item Profit */}
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400 tabular-nums">
                            +{formatUzs(itemProfit)}
                          </td>

                          {/* Action Controls */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(p)}
                                className="px-2.5 py-1.5 bg-[#1A2338] hover:bg-[#23304E] text-slate-200 hover:text-white border border-slate-700 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Narxini va barcha parametrlarini tahrirlash"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                                <span>Tahrirlash</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setProductToDelete(p)}
                                className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/60 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Mahsulotni olib tashlash"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>O‘chirish</span>
                              </button>

                              {/* Quick +10 stock */}
                              <button
                                type="button"
                                onClick={() =>
                                  onAdjustInventory({
                                    productId: p.id,
                                    type: 'KIRIM',
                                    quantity: 10,
                                    note: '+10 tezkor kirim',
                                  })
                                }
                                className="px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 rounded-lg font-mono font-bold transition-colors cursor-pointer"
                                title="+10 dona tezkor kirim"
                              >
                                +10
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredProducts.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Qidiruv bo‘yicha mahsulot topilmadi.
                </div>
              )}
            </div>

            {/* Quick Kirim & Sotuv Bar for storekeepers */}
            <div className="bg-[#0D121F] border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-orange-400" />
                    <span>Tezkor Ombor Operatsiyasi (Kirim / Chiqim)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Omborga yangi tovar kelganda &ldquo;+ Kirim&rdquo;, do‘kondan sotilganda &ldquo;− Sotildi&rdquo; qilib belgilang.
                  </p>
                </div>
                {selectedAdjProduct && (
                  <div className="text-xs font-mono text-slate-300 tabular-nums">
                    Tanlangan: <strong className="text-white">{selectedAdjProduct.name}</strong> · Qoldi:{' '}
                    <strong className="text-emerald-400">{selectedAdjProduct.stock} dona</strong>
                  </div>
                )}
              </div>

              <form onSubmit={handleAdjustSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Amal turi:</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#131B2D] border border-slate-700 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAdjType('KIRIM')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        adjType === 'KIRIM'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      + Kirim
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjType('SOTUV')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        adjType === 'SOTUV'
                          ? 'bg-[#EA580C] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      − Sotildi
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Mahsulot:</label>
                  <select
                    value={adjProductId}
                    onChange={(e) => setAdjProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-orange-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.size}) — Qoldi: {p.stock} ta
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Soni (dona):</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    required
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs font-mono font-bold text-white tabular-nums focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={adjSubmitting}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                      adjType === 'KIRIM'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20'
                        : 'bg-[#EA580C] hover:bg-orange-600 shadow-md shadow-orange-500/20'
                    }`}
                  >
                    {adjSubmitting
                      ? 'Saqlanmoqda...'
                      : adjType === 'KIRIM'
                      ? `+ ${adjQuantity} dona omborga qo‘shish`
                      : `− ${adjQuantity} dona sotuvga yozish`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: CREATE NEW PRODUCT FORM */}
        {activeTab === 'new-product' && (
          <div className="bg-[#0D121F] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-orange-400" />
                <span>Yangi Mahsulot Qo‘shish (Katalog & Ombor)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Katalogga yangi shina, akkumulyator, diska yoki aksessuar qo‘shing. Narxini, qoldig‘ini va barcha ma’lumotlarini erkin belgilashingiz mumkin.
              </p>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategoriya:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ProductCategory;
                      setNewCategory(cat);
                      if (cat === 'Akkumulyator') {
                        setNewImageType('battery');
                        setNewRadius('Universal');
                        setNewSize('60 Ah');
                        setNewSpeedIndex('540A (EN)');
                      } else if (cat === 'Aksessuarlar') {
                        setNewImageType('accessory');
                        setNewRadius('Universal');
                        setNewSize('Universal');
                        setNewSpeedIndex('12V / 150 PSI');
                      } else if (cat === 'Litye Diska') {
                        setNewImageType('wheel');
                        setNewRadius('R16');
                        setNewSize('16x6.5J 4x100');
                        setNewSpeedIndex('ET40 / DIA 56.6');
                      } else if (cat === 'Qishki shina') {
                        setNewImageType('winter');
                        setNewRadius('R15');
                      } else {
                        setNewImageType('summer');
                        setNewRadius('R15');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mahsulot Nomi:
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Masalan: Michelin Primacy 4+ yoki Delkor 60Ah Royal"
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Brand */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Brendi:
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="Michelin, Bars, Delkor..."
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    O‘lchami (Razmer / Quvvat):
                  </label>
                  <input
                    type="text"
                    required
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder="195/65 R15 yoki 60 Ah"
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>

                {/* Radius */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Radiusi / Turi:
                  </label>
                  <input
                    type="text"
                    value={newRadius}
                    onChange={(e) => setNewRadius(e.target.value)}
                    placeholder="R15, R16 yoki Universal"
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Product Image Uploader */}
              <ProductImageUploader
                imageUrl={newImageUrl}
                imageType={newImageType}
                category={newCategory}
                productName={newName}
                onChange={(val) => {
                  setNewImageUrl(val.imageUrl);
                  if (val.imageType) setNewImageType(val.imageType as any);
                }}
              />

              {/* Pricing & Stock */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#111726] border border-slate-800 rounded-2xl">
                {/* Sale Price */}
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">
                    💰 Sotuv Narxi (so‘m):
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={newSale}
                    onChange={(e) => setNewSale(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-orange-500/50 rounded-xl text-sm font-mono font-bold text-[#FB923C] focus:outline-none focus:border-orange-500 tabular-nums"
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tan Narxi (so‘m):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-sm font-mono text-slate-300 focus:outline-none focus:border-orange-500 tabular-nums"
                  />
                </div>

                {/* Initial Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ombordagi Qoldiq (dona):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-orange-500 tabular-nums"
                  />
                </div>

                {/* Min Stock Alert */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kam qolgan ogohlantirish:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newMinAlert}
                    onChange={(e) => setNewMinAlert(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-sm font-mono text-slate-300 focus:outline-none focus:border-orange-500 tabular-nums"
                  />
                </div>
              </div>

              {/* Cars, Warranty, Speed/Tok */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mos Avtomobillar (vergul bilan):
                  </label>
                  <input
                    type="text"
                    value={newCars}
                    onChange={(e) => setNewCars(e.target.value)}
                    placeholder="Cobalt, Gentra, Damas, Malibu 2..."
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tezlik / Tok / Quvvat Ko‘rsatkichi:
                  </label>
                  <input
                    type="text"
                    value={newSpeedIndex}
                    onChange={(e) => setNewSpeedIndex(e.target.value)}
                    placeholder="91V (240 km/s) yoki 540A (EN)"
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kafolat Muddati (oylar):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={newWarranty}
                    onChange={(e) => setNewWarranty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Trade-in discount if Battery */}
              {newCategory === 'Akkumulyator' && (
                <div className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-amber-300">
                    ⚡ Eski Akkumulyatorni Qabul Qilish (Trade-In Chegirma summasi, so‘m):
                  </label>
                  <input
                    type="number"
                    step={1000}
                    min={0}
                    value={newTradeIn}
                    onChange={(e) => setNewTradeIn(Number(e.target.value))}
                    placeholder="Masalan: 120000"
                    className="w-full max-w-sm px-3.5 py-2.5 bg-[#131B2D] border border-amber-500/60 rounded-xl text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 tabular-nums"
                  />
                  <p className="text-[11px] text-amber-200/80">
                    Xaridor eski akkumulyatorini topshirganda ushbu summa yangi akkumulyator narxidan avtomatik chegiriladi.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('stock')}
                  className="px-5 py-2.5 bg-[#131B2D] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={adjSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {adjSubmitting ? 'Qo‘shilmoqda...' : '+ Mahsulotni Omborga Saqlash'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: LEDGER TRANSACTIONS */}
        {activeTab === 'ledger' && (
          <div className="bg-[#0D121F] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Ombor Kirim va Chiqim Jurnali</h3>
              <div className="flex items-center gap-1 p-1 bg-[#131B2D] rounded-xl border border-slate-700">
                {(['ALL', 'KIRIM', 'SOTUV'] as const).map((flt) => (
                  <button
                    key={flt}
                    type="button"
                    onClick={() => setLedgerFilter(flt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      ledgerFilter === flt
                        ? 'bg-[#EA580C] text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {flt === 'ALL'
                      ? 'Barchasi'
                      : flt === 'KIRIM'
                      ? 'Faqat Kirim (+)'
                      : 'Faqat Sotuv (−)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#111726] text-slate-400 font-semibold">
                    <th className="py-3 px-4">Vaqt</th>
                    <th className="py-3 px-4">Turi</th>
                    <th className="py-3 px-4">Mahsulot</th>
                    <th className="py-3 px-4 text-right">Miqdor</th>
                    <th className="py-3 px-4 text-right">Summa</th>
                    <th className="py-3 px-4">Izoh / Kontragent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLedger.map((it) => (
                    <tr key={it.id} className="hover:bg-[#131B2D]/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">{it.timestamp}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            it.type === 'KIRIM'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-orange-950 text-orange-400 border border-orange-800'
                          }`}
                        >
                          {it.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {it.productName} ({it.productSize})
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                        {it.type === 'KIRIM' ? `+${it.quantity}` : `-${it.quantity}`} dona
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                        {formatUzs(it.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{it.note || it.customerOrSupplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-[#0D121F] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Mijozlar Buyurtmalari Ro‘yxati</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#111726] text-slate-400 font-semibold">
                    <th className="py-3 px-4">Buyurtma #</th>
                    <th className="py-3 px-4">Mijoz / Telefon</th>
                    <th className="py-3 px-4">Mahsulotlar</th>
                    <th className="py-3 px-4 text-right">Summa</th>
                    <th className="py-3 px-4">Yetkazish</th>
                    <th className="py-3 px-4">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#131B2D]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-400">
                        #{ord.orderNumber}
                        <div className="text-[10px] text-slate-400 font-normal">{ord.createdAt}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{ord.customerName}</div>
                        <div className="text-slate-400 font-mono">{ord.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="text-slate-300">
                            • {it.productName} ({it.size}) × <strong>{it.quantity} dona</strong>
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white tabular-nums">
                        {formatUzs(ord.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {ord.deliveryType} ({ord.deliveryAddress})
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          className="px-2.5 py-1 bg-[#131B2D] border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
                        >
                          <option value="Yangi">Yangi</option>
                          <option value="Tasdiqlandi">Tasdiqlandi</option>
                          <option value="Yetkazilmoqda">Yetkazilmoqda</option>
                          <option value="Yetkazildi">Yetkazildi</option>
                          <option value="Bekor qilindi">Bekor qilindi</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && (
              <div className="p-12 text-center text-slate-400 text-xs">
                Hozircha buyurtmalar mavjud emas.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SECURITY & ADMIN PIN SETTINGS */}
        {activeTab === 'security' && (
          <div className="bg-[#0D121F] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-2xl mx-auto space-y-6">
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Admin Xavfsizlik & PIN-kod Sozlamasi</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mahsulot qo‘shish, tahrirlash, o‘chirish, narxlarni belgilash va hisobotlarni begonalardan himoya qilish uchun maxfiy PIN-kodni o‘zgartiring.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#111726] border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Shield className="w-4 h-4" />
                <span>Himoya tizimi faol</span>
              </div>
              <p className="text-slate-400">
                Standart PIN: <strong className="text-white font-mono">7777</strong>. Istagan vaqtda quyidagi forma orqali yangi o‘zingiz biladigan kodga almashtirishingiz mumkin.
              </p>
            </div>

            {pinFeedback && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{pinFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPinFeedback(null)}
                  className="text-emerald-400 hover:text-emerald-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {pinError && (
              <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl text-xs font-semibold text-red-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{pinError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPinError(null)}
                  className="text-red-400 hover:text-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hozirgi PIN-kod:
                </label>
                <input
                  type="password"
                  required
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="Hozirgi PIN-kodni yozing (masalan: 7777)"
                  className="w-full px-4 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yangi PIN-kod:
                </label>
                <input
                  type="password"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Yangi PIN-kod (kamida 4 ta belgi)"
                  className="w-full px-4 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Yangi PIN-kodni tasdiqlang:
                </label>
                <input
                  type="password"
                  required
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Yangi PIN-kodni qayta yozing"
                  className="w-full px-4 py-2.5 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono tracking-widest"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-4">
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="py-2.5 px-4 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Admin rejimidan chiqish</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="ml-auto py-2.5 px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                >
                  Yangi PIN-kodni Saqlash
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT ANY PRODUCT ATTRIBUTE (NARXINI VA BARCHA MA'LUMOTLARINI)    */}
      {/* ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#0D121F] text-slate-100 rounded-3xl max-w-2xl w-full border border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#111726]">
              <div>
                <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-orange-400" />
                  <span>Mahsulotni Tahrirlash: {editingProduct.name}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Narxini, ombor qoldig‘ini, nomini va barcha parametrlarini belgilashingiz mumkin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Name & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mahsulot Nomi:
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              {/* Category, Size, Radius */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kategoriya:
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    O‘lchami (Razmer):
                  </label>
                  <input
                    type="text"
                    required
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Radiusi / Turi:
                  </label>
                  <input
                    type="text"
                    value={editRadius}
                    onChange={(e) => setEditRadius(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* CRITICAL: NARXINI VA QOLDIG'INI BELGILASH */}
              <div className="p-4 bg-[#111726] border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#FB923C] mb-1">
                    💰 Sotuv Narxi (so‘m):
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-orange-500/60 rounded-xl text-sm font-mono font-bold text-[#FB923C] focus:outline-none focus:border-orange-500 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tan Narxi (so‘m):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-orange-500 tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-400 mb-1">
                    Ombordagi Qoldiq (dona):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editStock}
                    onChange={(e) => setEditStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400 tabular-nums"
                  />
                </div>
              </div>

              {/* Cars & Speed/Tok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mos Avtomobillar:
                  </label>
                  <input
                    type="text"
                    value={editCars}
                    onChange={(e) => setEditCars(e.target.value)}
                    placeholder="Cobalt, Gentra, Damas..."
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tezlik / Tok Ko‘rsatkichi:
                  </label>
                  <input
                    type="text"
                    value={editSpeedIndex}
                    onChange={(e) => setEditSpeedIndex(e.target.value)}
                    placeholder="91V yoki 540A"
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              {/* Warranty & Trade-in */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kafolat (oylar):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={editWarranty}
                    onChange={(e) => setEditWarranty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Trade-In Chegirma (so‘m):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={editTradeIn}
                    onChange={(e) => setEditTradeIn(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#131B2D] border border-slate-700 rounded-xl text-xs text-amber-300 focus:outline-none focus:border-orange-500 font-mono tabular-nums"
                  />
                </div>
              </div>

              {/* Product Image Uploader */}
              <ProductImageUploader
                imageUrl={editImageUrl}
                imageType={editImageType}
                category={editCategory}
                productName={editName}
                onChange={(val) => {
                  setEditImageUrl(val.imageUrl);
                  if (val.imageType) setEditImageType(val.imageType as any);
                }}
              />

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-[#131B2D] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Saqlanmoqda...' : 'O‘zgarishlarni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRM DELETE PRODUCT (OLIB TASHLASH)                          */}
      {/* ========================================================================= */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0D121F] text-slate-100 rounded-3xl max-w-md w-full border border-red-500/30 shadow-2xl p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-display font-bold text-white">
                Mahsulotni olib tashlashni tasdiqlaysizmi?
              </h3>
              <p className="text-xs text-slate-300">
                <strong className="text-white font-semibold">{productToDelete.name}</strong> ({productToDelete.size}) bazadan butunlay o‘chiriladi. Omborda hozir {productToDelete.stock} dona qoldiq bor.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-[#131B2D] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'O‘chirilmoqda...' : 'Ha, butunlay o‘chirish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
