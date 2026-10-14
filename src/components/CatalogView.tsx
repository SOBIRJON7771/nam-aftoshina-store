import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Disc,
  BatteryCharging,
  Eye,
  ShieldCheck,
  Wrench,
  Check,
  ShoppingBag,
  Plus,
  Car,
  Filter,
  RefreshCw,
  Zap,
  Package,
  Layers,
  Sparkles,
  Truck,
  Edit3,
  Trash2,
  PackagePlus,
} from 'lucide-react';
import type { Product, BranchLocation } from '../types';
import { getProductImage, formatUzs } from '../utils/format';
import { ProductDetailModal } from './ProductDetailModal';

export type ActiveCatalogCategory =
  | 'ALL'
  | 'TIRES'
  | 'Akkumulyator'
  | 'Litye Diska'
  | 'Aksessuarlar';

interface CatalogViewProps {
  products: Product[];
  locations?: BranchLocation[];
  activeCategory: ActiveCatalogCategory;
  onSelectCategory: (cat: ActiveCatalogCategory) => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onOpenCart: () => void;
  cartCountByProduct: Record<string, number>;
  onOpenBatteryTradeIn?: () => void;
  onOpenQuickOrder?: (product: Product) => void;
  initialSelectedCar?: string;
  onOpenAddProduct?: () => void;
  onOpenEditProduct?: (product: Product) => void;
  onOpenDeleteProduct?: (product: Product) => void;
  onGoToAdmin?: () => void;
}

const TIRE_RADII = ['ALL', 'R12', 'R14', 'R15', 'R16', 'R17', 'R18'];
const BATTERY_CAPACITIES = ['ALL', '45Ah', '60Ah', '65Ah', '75Ah'];
const TIRE_SEASONS = ['ALL', 'Yozgi shina', 'Qishki shina', '4 Fasl (All-Season)'];

const CARS_LIST = [
  { id: 'ALL', name: 'Barcha mashinalar' },
  { id: 'Cobalt', name: 'Cobalt' },
  { id: 'Gentra', name: 'Gentra' },
  { id: 'Nexia 3', name: 'Nexia 3' },
  { id: 'Damas', name: 'Damas' },
  { id: 'Onix', name: 'Onix' },
  { id: 'Monza', name: 'Monza' },
  { id: 'Tracker 2', name: 'Tracker 2' },
  { id: 'Malibu 2', name: 'Malibu 2' },
  { id: 'Spark', name: 'Spark' },
  { id: 'BYD Song Plus', name: 'BYD Song Plus' },
  { id: 'Kia K5', name: 'Kia K5' },
  { id: 'Lacetti', name: 'Lacetti' },
];

const BRANDS_LIST = [
  'ALL',
  'Michelin',
  'Pirelli',
  'Continental',
  'Bridgestone',
  'Kumho',
  'Bars',
  'Nokian',
  'Nexen',
  'Delkor',
  'Varta',
  'Bosch',
  'Mutlu',
  'Baseus',
  'Vossen',
];

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  locations = [],
  activeCategory,
  onSelectCategory,
  onAddToCart,
  onOpenCart,
  cartCountByProduct,
  onOpenBatteryTradeIn,
  onOpenQuickOrder,
  initialSelectedCar = 'ALL',
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenDeleteProduct,
  onGoToAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [selectedRadius, setSelectedRadius] = useState<string>('ALL');
  const [selectedCapacity, setSelectedCapacity] = useState<string>('ALL');
  const [selectedCar, setSelectedCar] = useState<string>(initialSelectedCar);
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'stock-desc'>('popular');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [justAddedKey, setJustAddedKey] = useState<string | null>(null);
  const [detailModalProduct, setDetailModalProduct] = useState<Product | null>(null);

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = products.filter((p) => {
      // 1. Category Filter
      if (activeCategory === 'TIRES') {
        if (
          p.category === 'Akkumulyator' ||
          p.category === 'Litye Diska' ||
          p.category === 'Aksessuarlar'
        )
          return false;
        if (selectedSeason !== 'ALL' && p.category !== selectedSeason) return false;
        if (selectedRadius !== 'ALL' && p.radius !== selectedRadius) return false;
      } else if (activeCategory === 'Akkumulyator') {
        if (p.category !== 'Akkumulyator') return false;
        if (selectedCapacity !== 'ALL' && p.radius !== selectedCapacity) return false;
      } else if (activeCategory === 'Litye Diska') {
        if (p.category !== 'Litye Diska') return false;
        if (selectedRadius !== 'ALL' && p.radius !== selectedRadius) return false;
      } else if (activeCategory === 'Aksessuarlar') {
        if (p.category !== 'Aksessuarlar') return false;
      }

      // 2. Brand filter
      if (selectedBrand !== 'ALL' && p.brand !== selectedBrand) {
        return false;
      }

      // 3. Car compatibility
      if (selectedCar !== 'ALL' && !p.compatibleCars.includes(selectedCar)) {
        return false;
      }

      // 4. Stock only
      if (onlyInStock && p.stock <= 0) {
        return false;
      }

      // 5. Text search
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchSize = p.size.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchCar = p.compatibleCars.some((c) => c.toLowerCase().includes(q));
        if (!matchName && !matchBrand && !matchSize && !matchCategory && !matchCar) {
          return false;
        }
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.salePrice - b.salePrice;
      if (sortBy === 'price-desc') return b.salePrice - a.salePrice;
      if (sortBy === 'stock-desc') return b.stock - a.stock;
      return b.totalSold - a.totalSold;
    });
  }, [
    products,
    activeCategory,
    selectedSeason,
    selectedRadius,
    selectedCapacity,
    selectedCar,
    selectedBrand,
    onlyInStock,
    searchQuery,
    sortBy,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSeason !== 'ALL' ||
    selectedRadius !== 'ALL' ||
    selectedCapacity !== 'ALL' ||
    selectedCar !== 'ALL' ||
    selectedBrand !== 'ALL' ||
    onlyInStock ||
    sortBy !== 'popular';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSeason('ALL');
    setSelectedRadius('ALL');
    setSelectedCapacity('ALL');
    setSelectedCar('ALL');
    setSelectedBrand('ALL');
    setOnlyInStock(false);
    setSortBy('popular');
  };

  const handleQuickAdd = (productId: string, qty: number) => {
    onAddToCart(productId, qty);
    const key = `${productId}-${qty}`;
    setJustAddedKey(key);
    setTimeout(() => {
      setJustAddedKey((prev) => (prev === key ? null : prev));
    }, 900);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Hero & Quick Smart Tools Bar */}
      {activeCategory === 'ALL' && (
        <section className="bg-gradient-to-br from-[#111726] via-[#0D121F] to-[#080C14] text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#EA580C] rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Namangan shahrida 38+ turdagi original shina, akkumulyator va avto-aksessuarlar</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white leading-tight">
              Avtomobilingiz uchun rasmiy kafolatli ehtiyot qismlar
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Michelin, Kumho, Delkor, Varta, Bars, Bosch, Vossen va Baseus. O‘zingizga mos o‘lcham yoki avtomobil modelini tanlang,
              1 soatda Namangan bo‘ylab yetkazib beramiz yoki filialimizda bepul o‘rnatib beramiz.
            </p>

            {/* Category Quick Navigation */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => onSelectCategory('TIRES')}
                className="px-4 py-2 bg-[#1A2338] border border-slate-700 hover:border-orange-500/50 text-slate-100 text-xs font-bold rounded-xl hover:bg-[#23304E] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🛞 Shinalar ({products.filter((p) => p.category.includes('shina') || p.category.includes('Fasl')).length})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectCategory('Akkumulyator')}
                className="px-4 py-2 bg-[#1A2338] border border-slate-700 hover:border-amber-500/50 text-slate-100 text-xs font-bold rounded-xl hover:bg-[#23304E] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>⚡ Akkumulyatorlar ({products.filter((p) => p.category === 'Akkumulyator').length})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectCategory('Litye Diska')}
                className="px-4 py-2 bg-[#1A2338] border border-slate-700 hover:border-purple-500/50 text-slate-100 text-xs font-bold rounded-xl hover:bg-[#23304E] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🔘 Litye Diskalar ({products.filter((p) => p.category === 'Litye Diska').length})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectCategory('Aksessuarlar')}
                className="px-4 py-2 bg-[#EA580C] text-white text-xs font-bold rounded-xl hover:bg-[#C2410C] transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                <span>🧰 Aksessuarlar ({products.filter((p) => p.category === 'Aksessuarlar').length})</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Category-Specific Banners */}
      {activeCategory === 'TIRES' && (
        <section className="bg-gradient-to-r from-[#111726] to-[#0D121F] text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold">
              <span>🛞 SHINALAR DO‘KONI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Yozgi, Qishki va 4 Fasl Shinalar Katalogi
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Radius (R12–R18), mavsum yoki avtomobil modelini tanlang. 4 ta shina (komplekt) xaridida
              3D balansirovka bepul!
            </p>
          </div>

          <div className="bg-[#111726] p-4 rounded-2xl border border-slate-700/80 text-xs text-slate-300 space-y-1.5 shrink-0 shadow-lg">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-[#EA580C]" />
              <span>36 oygacha rasmiy kafolat</span>
            </div>
            <p className="text-slate-400">Har bir shina original va zavoddan to‘g‘ridan-to‘g‘ri keltirilgan.</p>
          </div>
        </section>
      )}

      {activeCategory === 'Akkumulyator' && (
        <section className="bg-gradient-to-r from-amber-950/60 via-[#111726] to-[#0D121F] text-white rounded-3xl p-6 sm:p-8 border border-amber-800/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>⚡ AKKUMULYATORLAR DO‘KONI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Avtomobil Akkumulyatorlari (Delkor, Varta, Bars, Bosch, Mutlu, Akom)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Qishki sovuqda ishonchli o‘t oldirish. Eski akkumulyatoringizni topshirsangiz 70 000 dan
              160 000 so‘mgacha darhol naqd chegirma beriladi!
            </p>
          </div>

          <div className="bg-amber-950/70 p-4 rounded-2xl border border-amber-600/50 text-xs text-amber-200 space-y-1 shrink-0 shadow-lg">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Eski akkumulyatorga Trade-in chegirma</span>
            </div>
            <p className="text-amber-100/80">O‘rnatish va generator tekshiruvi bepul!</p>
          </div>
        </section>
      )}

      {activeCategory === 'Litye Diska' && (
        <section className="bg-gradient-to-r from-purple-950/40 via-[#111726] to-[#0D121F] text-white rounded-3xl p-6 sm:p-8 border border-purple-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-semibold">
              <Disc className="w-3.5 h-3.5" />
              <span>🔘 LITYE DISKALAR DO‘KONI</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Litye va Titan Diskalar (R14, R15, R16, R17, R18)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Cobalt, Gentra, Nexia 3, Onix, Tracker 2 va Malibu 2 uchun Vossen, AMG Style hamda zavod titan diskalari.
            </p>
          </div>
        </section>
      )}

      {activeCategory === 'Aksessuarlar' && (
        <section className="bg-gradient-to-r from-orange-950/40 via-[#111726] to-[#0D121F] text-white rounded-3xl p-6 sm:p-8 border border-orange-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-semibold">
              <Package className="w-3.5 h-3.5" />
              <span>🧰 AVTO-ASBOBLAR VA AKSESSUARLAR</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Raqamli Nasoslar, Manometrlar, Domkrat va Shina Parvarishi
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Yo‘lda va garajda xavfsizlik uchun zaruriy uskunalar: Baseus avto-kompressorlari, Michelin manometrlari, shina qoraytiruvchi gellar va remkomplektlar.
            </p>
          </div>
        </section>
      )}

      {/* 1.5. DO'KON BOSHQARUVI & ADMIN TEZKOR AMALLAR BANNERI */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111728] via-[#17223C] to-[#111728] border-2 border-orange-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EA580C]/20 border border-[#EA580C]/40 flex items-center justify-center text-orange-400 shrink-0">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>🛠️ Admin Boshqaruv Paneli: Mahsulotlar & Narxlar</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-800">
                Faol
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Katalogga yangi mahsulot qo‘shish, istalgan mahsulot narxini o‘zgartirish yoki olib tashlash:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="flex-1 md:flex-none px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yangi Mahsulot Qo‘shish</span>
          </button>
          <button
            type="button"
            onClick={onGoToAdmin}
            className="flex-1 md:flex-none px-4 py-2.5 bg-[#131B2D] hover:bg-[#1C2742] text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Package className="w-4 h-4 text-orange-400" />
            <span>Barcha Mahsulotlar Jadvali</span>
          </button>
        </div>
      </div>

      {/* 2. Trade-In Chegirma va Tezkor Xizmat Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Eski akkumulyator trade-in */}
        <button
          type="button"
          onClick={onOpenBatteryTradeIn}
          className="p-4 rounded-2xl bg-[#0D121F] border border-slate-800 hover:border-emerald-500/60 transition-all text-left flex items-center justify-between group shadow-lg cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                <span>Eski Akkumulyatorni Topshirish (Trade-In)</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-800">
                  -160 000 so‘m
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Eski akkumulyatoringiz evaziga yangisiga darhol naqd chegirma hisoblang!
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 font-mono shrink-0 pl-2">Chegirma olish →</span>
        </button>

        {/* Tezkor Yetkazish va Shinomontaj */}
        <div className="p-4 rounded-2xl bg-[#0D121F] border border-slate-800 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Namangan Bo‘ylab 1 Soatda Yetkazish</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 text-[10px] font-mono font-bold border border-orange-800">
                  Tezkor
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                4 ta shina xaridida 3D balansirovka va o‘rnatish xizmati do‘konda bepul!
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-400 font-mono shrink-0 pl-2">Bepul xizmat</span>
        </div>
      </div>

      {/* 3. Interactive Vehicle Quick Selector (Avtomobilingizni tanlang) */}
      <section className="bg-[#0D121F] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Car className="w-4 h-4 text-[#EA580C]" />
            <span>Avtomobilingizni tanlang (Mos keladigan barcha qismlar filtrlansin):</span>
          </div>
          {selectedCar !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedCar('ALL')}
              className="text-xs text-[#EA580C] hover:underline font-semibold cursor-pointer"
            >
              Filtrni tozalash
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CARS_LIST.map((c) => {
            const isSelected = selectedCar === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCar(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 text-white font-bold shadow-md shadow-orange-500/20'
                    : 'bg-[#131B2D] text-slate-300 hover:bg-[#1A253E] hover:text-white border border-slate-700/60'
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Brand Quick Filter Strip */}
      <section className="bg-[#0D121F] border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
            Brend bo‘yicha saralash:
          </span>
          {selectedBrand !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedBrand('ALL')}
              className="text-[#EA580C] hover:underline font-semibold cursor-pointer"
            >
              Barcha brendlar
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {BRANDS_LIST.map((b) => {
            const isSelected = selectedBrand === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600 text-white font-bold shadow-sm'
                    : 'bg-[#111726] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {b === 'ALL' ? 'Barchasi' : b}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Main Search and Category-Specific Filter Strip */}
      <div className="bg-[#0D121F] border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot nomi, razmer (masalan: 195/65 R15 yoki 60Ah), brend yoki mashina..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#131B2D] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-[#131B2D] border border-slate-700/80 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="popular" className="bg-[#0D121F]">Ommabopligi bo‘yicha</option>
              <option value="price-asc" className="bg-[#0D121F]">Narxi: Arzonidan qimmatiga</option>
              <option value="price-desc" className="bg-[#0D121F]">Narxi: Qimmatidan arzoniga</option>
              <option value="stock-desc" className="bg-[#0D121F]">Ombordagi qoldiq bo‘yicha</option>
            </select>

            {/* In-Stock Only Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 bg-[#131B2D] border border-slate-700/80 rounded-xl text-xs text-slate-300 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded border-slate-600 text-[#EA580C] focus:ring-[#EA580C]"
              />
              <span>Faqat mavjud</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                title="Barcha filtrlarni tozalash"
                className="p-2.5 text-slate-400 hover:text-white bg-[#131B2D] border border-slate-700/80 rounded-xl hover:bg-[#1C2742] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Contextual Filters */}
        {activeCategory === 'TIRES' && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-4 items-center text-xs">
            {/* Radius Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-semibold mr-1">Diametr (R):</span>
              {TIRE_RADII.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRadius(r)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-colors cursor-pointer ${
                    selectedRadius === r
                      ? 'bg-orange-600 text-white'
                      : 'bg-[#131B2D] text-slate-300 hover:bg-[#1C2742] hover:text-white border border-slate-700/60'
                  }`}
                >
                  {r === 'ALL' ? 'Barchasi' : r}
                </button>
              ))}
            </div>

            {/* Season Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-semibold mr-1">Mavsum:</span>
              {TIRE_SEASONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSeason(s)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    selectedSeason === s
                      ? 'bg-orange-600 text-white'
                      : 'bg-[#131B2D] text-slate-300 hover:bg-[#1C2742] hover:text-white border border-slate-700/60'
                  }`}
                >
                  {s === 'ALL' ? 'Barchasi' : s}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeCategory === 'Akkumulyator' && (
          <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-semibold mr-1">Sig‘imi (Amper-soat):</span>
            {BATTERY_CAPACITIES.map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => setSelectedCapacity(cap)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold transition-colors cursor-pointer ${
                  selectedCapacity === cap
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#131B2D] text-slate-300 hover:bg-[#1C2742] hover:text-white border border-slate-700/60'
                }`}
              >
                {cap === 'ALL' ? 'Barchasi' : cap}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. Products Count & Grid */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Jami topildi:{' '}
          <strong className="text-white font-mono">{filteredProducts.length}</strong> ta mahsulot
        </span>
        {selectedCar !== 'ALL' && (
          <span className="text-orange-400 font-semibold">
            {selectedCar} uchun moslashtirilgan ko‘rinish
          </span>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-[#0D121F] border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <p className="text-base font-display font-bold text-white">
            Tanlangan parametrlar bo‘yicha mahsulot topilmadi
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Qidiruv so‘zini o‘zgartirib ko‘ring yoki barcha filtr parametrlarini dastlabki holatga qaytaring.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-orange-500/20"
          >
            Barcha filtrlarni tozalash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
            const isBattery = product.category === 'Akkumulyator';
            const isAccessory = product.category === 'Aksessuarlar';
            const inCart = cartCountByProduct[product.id] || 0;
            const added1 = justAddedKey === `${product.id}-1`;
            const added4 = justAddedKey === `${product.id}-4`;

            return (
              <article
                key={product.id}
                className="bg-[#0D121F] border border-slate-800/80 hover:border-orange-500/50 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 group"
              >
                <div>
                  {/* Product Photography Container */}
                  <div
                    onClick={() => setDetailModalProduct(product)}
                    className="aspect-[4/3] bg-[#080C14] relative overflow-hidden border-b border-slate-800 cursor-pointer group"
                  >
                    <img
                      src={getProductImage(product)}
                      alt={`${product.name} ${product.size}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    />

                    {/* Quick View Button on Hover */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="px-3.5 py-1.5 bg-[#0D121F] text-white border border-slate-700/80 text-xs font-bold rounded-xl shadow-xl flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#EA580C]" />
                        Batafsil ma’lumot
                      </span>
                    </div>

                    {/* Clean Size Tag Top Right */}
                    <div className="absolute top-3 right-3 bg-[#0D121F]/90 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white shadow-md">
                      {product.size}
                    </div>

                    {/* Trade-in Promo Tag for Batteries */}
                    {isBattery && product.tradeInDiscount && (
                      <div className="absolute bottom-3 left-3 bg-[#EA580C] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-md">
                        <BatteryCharging className="w-3.5 h-3.5" />
                        <span>Eskisiga: -{formatUzs(product.tradeInDiscount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="uppercase font-bold tracking-wider text-orange-400 font-mono">
                        {product.brand}
                      </span>
                      <span>·</span>
                      <span>{product.category}</span>
                      <span>·</span>
                      <span className="font-semibold text-emerald-400">
                        {product.warrantyMonths} oy kafolat
                      </span>
                    </div>

                    <h3
                      onClick={() => setDetailModalProduct(product)}
                      className="text-base font-display font-bold text-white leading-snug hover:text-orange-400 transition-colors cursor-pointer"
                    >
                      {product.name}
                    </h3>

                    <p className="text-xs text-slate-400">
                      Mos avtomobillar:{' '}
                      <strong className="text-slate-200">
                        {product.compatibleCars.slice(0, 3).join(', ')}
                        {product.compatibleCars.length > 3 ? ` +${product.compatibleCars.length - 3}` : ''}
                      </strong>
                      {' · '}
                      {isBattery ? 'Tok' : isAccessory ? 'Turi' : 'Tezlik'}:{' '}
                      <span className="font-mono text-slate-300">{product.speedIndex}</span>
                    </p>

                    <div className="pt-3 border-t border-slate-800/80 flex items-baseline justify-between gap-2">
                      <div>
                        <span className="block text-[11px] text-slate-400">Narxi (1 dona):</span>
                        <span className="text-xl font-mono font-bold text-[#FB923C] tabular-nums">
                          {formatUzs(product.salePrice)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="block text-[11px] text-slate-400">Ombor:</span>
                        <span
                          className={`text-xs font-mono font-bold tabular-nums ${
                            isOutOfStock
                              ? 'text-red-400'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isOutOfStock
                            ? 'Tugagan'
                            : isLowStock
                            ? `Kam: ${product.stock} ta`
                            : `Mavjud: ${product.stock} ta`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="px-5 pb-5 pt-1 space-y-2">
                  {/* Lightning 1-Step Quick Order Button */}
                  {onOpenQuickOrder && !isOutOfStock && (
                    <button
                      type="button"
                      onClick={() => onOpenQuickOrder(product)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#1A2338] border border-orange-500/40 text-orange-400 hover:bg-[#23304E] hover:text-orange-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-orange-400" />
                      <span>1-bosqichda tezkor xarid</span>
                    </button>
                  )}

                  {isBattery ? (
                    // Battery Actions
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailModalProduct(product)}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold bg-[#131B2D] border border-slate-700/80 text-slate-200 hover:bg-[#1C2742] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Batafsil</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleQuickAdd(product.id, 1)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                          added1
                            ? 'bg-emerald-600'
                            : 'bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700'
                        }`}
                      >
                        {added1 ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Qo‘shildi</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Savatga</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : isAccessory ? (
                    // Accessory Actions
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailModalProduct(product)}
                        className="py-2.5 px-3 rounded-xl text-xs font-bold bg-[#131B2D] border border-slate-700/80 text-slate-200 hover:bg-[#1C2742] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Batafsil</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleQuickAdd(product.id, 1)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                          added1
                            ? 'bg-emerald-600'
                            : 'bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700'
                        }`}
                      >
                        {added1 ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Qo‘shildi</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Savatga</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    // Tire & Wheel Actions
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleQuickAdd(product.id, 1)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1 ${
                          added1
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-[#131B2D] border-slate-700/80 text-slate-200 hover:bg-[#1C2742] hover:text-white'
                        }`}
                      >
                        {added1 ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span>1 dona</span>
                      </button>

                      <button
                        type="button"
                        disabled={isOutOfStock || product.stock < 4}
                        onClick={() => handleQuickAdd(product.id, 4)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                          added4
                            ? 'bg-emerald-600'
                            : 'bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 hover:from-orange-600 hover:to-amber-700'
                        }`}
                      >
                        {added4 ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Qo‘shildi</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3" />
                            <span>4 ta (Komplekt)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {inCart > 0 && (
                    <div className="text-[11px] text-center text-emerald-400 font-mono font-semibold pt-1">
                      Savatda: {inCart} dona
                    </div>
                  )}

                  {/* Admin Direct Actions: Edit & Delete */}
                  {(onOpenEditProduct || onOpenDeleteProduct) && (
                    <div className="pt-2 mt-2 border-t border-slate-800/90 flex items-center justify-between gap-2">
                      {onOpenEditProduct && (
                        <button
                          type="button"
                          onClick={() => onOpenEditProduct(product)}
                          className="flex-1 py-1.5 px-2 bg-[#172033] hover:bg-[#1E2B45] text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                          title="Mahsulot narxini va boshqa ma'lumotlarini belgilash"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Tahrirlash / Narx</span>
                        </button>
                      )}
                      {onOpenDeleteProduct && (
                        <button
                          type="button"
                          onClick={() => onOpenDeleteProduct(product)}
                          className="py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/40 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                          title="Mahsulotni butunlay olib tashlash"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>O‘chirish</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {detailModalProduct && (
        <ProductDetailModal
          product={detailModalProduct}
          locations={locations}
          onClose={() => setDetailModalProduct(null)}
          onAddToCart={onAddToCart}
          onOpenQuickOrder={onOpenQuickOrder}
        />
      )}
    </div>
  );
};
