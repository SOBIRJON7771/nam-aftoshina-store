import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lock, LogOut, ArrowLeft, RefreshCw, Zap, PackagePlus, Package, Edit3, Trash2 } from 'lucide-react';
import type {
  Product,
  Order,
  LedgerTransaction,
  AccountingSummary,
  CartItem,
  OrderStatus,
  ProductCategory,
  BranchLocation,
  AppStateResponse,
} from './types';
import { CatalogView, type ActiveCatalogCategory } from './components/CatalogView';
import { AdminAccountingView } from './components/AdminAccountingView';
import { TelegramBotGuideView } from './components/TelegramBotGuideView';
import { CartDrawer } from './components/CartDrawer';
import { AdminPasscodeModal, ADMIN_AUTH_STORAGE_KEY } from './components/AdminPasscodeModal';
import { BatteryTradeInModal } from './components/BatteryTradeInModal';
import { QuickOrderModal } from './components/QuickOrderModal';
import {
  AddProductModal,
  EditProductModal,
  DeleteProductModal,
} from './components/ProductManagementModals';
import { apiService } from './services/apiService';

type ActiveSection = 'catalog' | 'admin' | 'telegram';

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('catalog');
  const [catalogCategory, setCatalogCategory] = useState<ActiveCatalogCategory>('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<BranchLocation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<LedgerTransaction[]>([]);
  const [summary, setSummary] = useState<AccountingSummary>({
    totalSkuCount: 0,
    totalStockUnits: 0,
    totalAddedUnits: 0,
    totalSoldUnits: 0,
    totalInventoryCostValue: 0,
    totalInventoryRetailValue: 0,
    totalSalesRevenue: 0,
    totalNetProfit: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [pendingAdminSection, setPendingAdminSection] = useState<ActiveSection>('admin');

  // Features State (Trade-In, Quick Order, Orders)
  const [isTradeInOpen, setIsTradeInOpen] = useState<boolean>(false);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('ALL');
  const [externalConfirmedOrder, setExternalConfirmedOrder] = useState<{
    order: Order;
    telegramMessage?: string;
    telegramSent?: boolean;
    botUsername?: string;
  } | null>(null);

  // Direct Product Management Modals (Add, Edit price/details, Delete)
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState<boolean>(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await apiService.getState();
      setProducts(data.products || []);
      setLocations(data.locations || []);
      setOrders(data.orders || []);
      setLedger(data.ledger || []);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const cartCountByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.productId] = item.quantity;
    }
    return map;
  }, [cart]);

  const totalCartItems = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const batteryProducts = useMemo(() => {
    return products.filter((p) => p.category === 'Akkumulyator');
  }, [products]);

  const handleAddToCart = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: nextQty } : i
        );
      }
      const initialQty = Math.min(product.stock, quantity);
      return [...prev, { productId, quantity: initialQty }];
    });
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const capped = Math.min(product.stock, quantity);
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: capped } : i
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSubmitOrder = async (payload: {
    customerName: string;
    customerPhone: string;
    deliveryType: 'Filialdan olib ketish' | 'Manzilga yetkazib berish';
    branchId: string;
    deliveryAddress: string;
    paymentMethod: 'Naqd' | 'Click' | 'Payme' | 'Uzcard / Humo';
  }): Promise<{ order: Order; telegramMessage?: string; telegramSent?: boolean; botUsername?: string } | null> => {
    const data = await apiService.createOrder({
      ...payload,
      items: cart,
      source: 'Web Katalog',
    });

    setProducts(data.products);
    setOrders(data.orders);
    setLedger(data.ledger);
    setSummary(data.summary);
    setCart([]);
    return {
      order: data.order as Order,
      telegramMessage: data.telegramMessage,
      telegramSent: data.telegramSent,
      botUsername: data.botUsername,
    };
  };

  const handleQuickOrderSuccess = (data: any) => {
    if (data.products) setProducts(data.products);
    if (data.orders) setOrders(data.orders);
    if (data.ledger) setLedger(data.ledger);
    if (data.summary) setSummary(data.summary);
    if (data.order) {
      setExternalConfirmedOrder({
        order: data.order,
        telegramMessage: data.telegramMessage,
        telegramSent: data.telegramSent,
        botUsername: data.botUsername,
      });
      setIsCartOpen(true);
    }
  };

  const handleAdminLoginSuccess = (targetSection: ActiveSection = pendingAdminSection) => {
    setIsAdminAuthenticated(true);
    setIsAdminModalOpen(false);
    setActiveSection(targetSection);
    try {
      sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
    } catch {}
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setActiveSection('catalog');
    try {
      sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    } catch {}
  };

  const requireAdminAuth = (targetSection: ActiveSection = 'admin', callback?: () => void) => {
    if (isAdminAuthenticated) {
      if (callback) callback();
      else setActiveSection(targetSection);
    } else {
      setPendingAdminSection(targetSection);
      setIsAdminModalOpen(true);
    }
  };

  const handleAdjustInventory = async (payload: {
    productId: string;
    type: 'KIRIM' | 'SOTUV';
    quantity: number;
    unitCostPrice?: number;
    unitSalePrice?: number;
    customerOrSupplier?: string;
    note?: string;
    branchId?: string;
  }) => {
    if (!isAdminAuthenticated) {
      requireAdminAuth('admin');
      return;
    }
    const data = await apiService.adjustInventory(payload);
    setProducts(data.products);
    setLedger(data.ledger);
    setSummary(data.summary);
  };

  // ADMIN: Yangi mahsulot qo'shish (Faqat admin ruxsati bilan)
  const handleCreateProduct = async (payload: {
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
  }) => {
    if (!isAdminAuthenticated) {
      requireAdminAuth('admin');
      return;
    }
    const data = await apiService.createProduct(payload);
    setProducts(data.products);
    if (data.ledger) setLedger(data.ledger);
    setSummary(data.summary);
  };

  // ADMIN: Mahsulotni tahrirlash (Faqat admin ruxsati bilan)
  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    if (!isAdminAuthenticated) {
      requireAdminAuth('admin');
      return;
    }
    const data = await apiService.updateProduct(id, updates);
    setProducts(data.products);
    setSummary(data.summary);
  };

  // ADMIN: Mahsulotni olib tashlash / o'chirish (Faqat admin ruxsati bilan)
  const handleDeleteProduct = async (id: string) => {
    if (!isAdminAuthenticated) {
      requireAdminAuth('admin');
      return;
    }
    const data = await apiService.deleteProduct(id);
    setProducts(data.products);
    setSummary(data.summary);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!isAdminAuthenticated) {
      requireAdminAuth('admin');
      return;
    }
    const data = await apiService.updateOrderStatus(orderId, status);
    setOrders(data.orders);
    setProducts(data.products);
    setSummary(data.summary);
  };

  const handleCustomerNav = (cat: ActiveCatalogCategory) => {
    setCatalogCategory(cat);
    setActiveSection('catalog');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090D14] text-slate-100 selection:bg-[#EA580C] selection:text-white">
      {/* Admin Mode Top Indicator Banner (Faqat Do‘kon Egasi / Admin kirganda ko‘rinadi) */}
      {isAdminAuthenticated && (
        <div className="bg-[#0D121F] text-white px-4 sm:px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">Do‘kon egasi boshqaruv paneli (Admin)</span>
            <span className="hidden sm:inline text-slate-400">· Mahsulot qo‘shish, narxlar va hisobotlar faol</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('admin')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeSection === 'admin' ? 'bg-[#EA580C] text-white font-bold' : 'text-slate-300 hover:text-white bg-[#131B2D]'
              }`}
            >
              Ombor & Mahsulotlar
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('telegram')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeSection === 'telegram' ? 'bg-[#EA580C] text-white font-bold' : 'text-slate-300 hover:text-white bg-[#131B2D]'
              }`}
            >
              TG Bot Sozlamasi
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('catalog')}
              className="px-3 py-1 bg-[#131B2D] border border-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Katalog</span>
            </button>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-3 py-1 bg-red-950/50 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-red-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-semibold ml-1"
              title="Admin rejimidan chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Application Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          {/* Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleCustomerNav('ALL');
            }}
            className="text-lg font-display font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <span>Nam</span>
            <span className="text-[#EA580C] drop-shadow-sm">Avtoshina</span>
          </a>

          {/* Customer shopping navigation links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => handleCustomerNav('ALL')}
              className={`hover:text-white transition-colors cursor-pointer ${
                activeSection === 'catalog' && catalogCategory === 'ALL'
                  ? 'text-orange-400 font-bold'
                  : ''
              }`}
            >
              Barchasi
            </button>
            <button
              type="button"
              onClick={() => handleCustomerNav('TIRES')}
              className={`hover:text-white transition-colors cursor-pointer ${
                activeSection === 'catalog' && catalogCategory === 'TIRES'
                  ? 'text-orange-400 font-bold'
                  : ''
              }`}
            >
              Shinalar
            </button>
            <button
              type="button"
              onClick={() => handleCustomerNav('Akkumulyator')}
              className={`hover:text-white transition-colors cursor-pointer ${
                activeSection === 'catalog' && catalogCategory === 'Akkumulyator'
                  ? 'text-orange-400 font-bold'
                  : ''
              }`}
            >
              Akkumulyatorlar
            </button>
            <button
              type="button"
              onClick={() => handleCustomerNav('Litye Diska')}
              className={`hover:text-white transition-colors cursor-pointer ${
                activeSection === 'catalog' && catalogCategory === 'Litye Diska'
                  ? 'text-orange-400 font-bold'
                  : ''
              }`}
            >
              Diskalar
            </button>
            <button
              type="button"
              onClick={() => handleCustomerNav('Aksessuarlar')}
              className={`hover:text-white transition-colors cursor-pointer ${
                activeSection === 'catalog' && catalogCategory === 'Aksessuarlar'
                  ? 'text-orange-400 font-bold'
                  : ''
              }`}
            >
              Aksessuarlar
            </button>
            <button
              type="button"
              onClick={() => requireAdminAuth('admin')}
              className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                activeSection === 'admin'
                  ? 'bg-[#1A2338] text-orange-400 font-bold border-orange-500/50 shadow-md shadow-orange-500/10'
                  : isAdminAuthenticated
                  ? 'text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-[#131B2D]'
                  : 'text-amber-300 border-amber-500/30 hover:border-amber-500/60 hover:bg-[#131B2D]'
              }`}
            >
              {isAdminAuthenticated ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>⚙️ Admin Panel</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Kirish</span>
                </>
              )}
            </button>
          </nav>

          {/* Smart Tools: Add Product (Admin Only), Trade-in & Korzinka */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Admin Authenticated: Show Quick Add Product & Quick Logout */}
            {isAdminAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all cursor-pointer shadow-md shadow-orange-500/20 active:scale-95 whitespace-nowrap"
                  title="Katalogga yangi mahsulot qo‘shish"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span className="hidden sm:inline">+ Mahsulot Qo‘shish</span>
                  <span className="sm:hidden">+ Qo‘shish</span>
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 rounded-xl transition-colors cursor-pointer"
                  title="Admin rejimidan chiqish"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Chiqish</span>
                </button>
              </>
            ) : (
              /* Regular Visitor: Discreet Admin Login Trigger */
              <button
                type="button"
                onClick={() => requireAdminAuth('admin')}
                className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#131B2D] border border-slate-700/80 rounded-xl hover:bg-[#1A253E] transition-colors cursor-pointer shadow-xs"
                title="Do‘kon ma'muri (Admin) sifatida kirish"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Trade-in discount */}
            <button
              type="button"
              onClick={() => setIsTradeInOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-600/40 rounded-xl hover:bg-emerald-900/50 transition-colors cursor-pointer shadow-sm"
              title="Eski akkumulyatorni topshirib chegirma olish"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trade-In (-160 000 so‘m)</span>
              <span className="sm:hidden">Trade-In</span>
            </button>

            {/* Korzinka */}
            <button
              type="button"
              onClick={() => {
                setExternalConfirmedOrder(null);
                setIsCartOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 via-[#EA580C] to-amber-600 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all whitespace-nowrap shrink-0 font-mono tabular-nums cursor-pointer shadow-lg shadow-orange-500/20 active:scale-[0.98]"
            >
              Savat ({totalCartItems})
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Customer Navigation Bar */}
      <div className="lg:hidden bg-[#0D121F] border-b border-slate-800/80 px-2 py-2">
        <div className="grid grid-cols-6 gap-1 p-1 bg-[#090D14] border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleCustomerNav('ALL')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold text-center transition-colors truncate cursor-pointer ${
              activeSection === 'catalog' && catalogCategory === 'ALL'
                ? 'bg-orange-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Barchasi
          </button>
          <button
            type="button"
            onClick={() => handleCustomerNav('TIRES')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold text-center transition-colors truncate cursor-pointer ${
              activeSection === 'catalog' && catalogCategory === 'TIRES'
                ? 'bg-orange-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Shina
          </button>
          <button
            type="button"
            onClick={() => handleCustomerNav('Akkumulyator')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold text-center transition-colors truncate cursor-pointer ${
              activeSection === 'catalog' && catalogCategory === 'Akkumulyator'
                ? 'bg-orange-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Akum
          </button>
          <button
            type="button"
            onClick={() => handleCustomerNav('Litye Diska')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold text-center transition-colors truncate cursor-pointer ${
              activeSection === 'catalog' && catalogCategory === 'Litye Diska'
                ? 'bg-orange-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Diska
          </button>
          <button
            type="button"
            onClick={() => handleCustomerNav('Aksessuarlar')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold text-center transition-colors truncate cursor-pointer ${
              activeSection === 'catalog' && catalogCategory === 'Aksessuarlar'
                ? 'bg-orange-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Asbob
          </button>
          <button
            type="button"
            onClick={() => requireAdminAuth('admin')}
            className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold text-center transition-colors truncate cursor-pointer ${
              activeSection === 'admin'
                ? 'bg-orange-600 text-white font-bold'
                : 'text-amber-400 hover:text-white'
            }`}
          >
            {isAdminAuthenticated ? '⚙️ Admin' : '🔐 Admin'}
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-6">
            <div className="h-64 bg-[#111726] rounded-3xl animate-pulse border border-slate-800" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-80 bg-[#111726] rounded-3xl animate-pulse border border-slate-800" />
              <div className="h-80 bg-[#111726] rounded-3xl animate-pulse border border-slate-800" />
              <div className="h-80 bg-[#111726] rounded-3xl animate-pulse border border-slate-800" />
            </div>
          </div>
        ) : (
          <>
            {activeSection === 'catalog' && (
              <CatalogView
                products={products}
                locations={locations}
                activeCategory={catalogCategory}
                onSelectCategory={setCatalogCategory}
                onAddToCart={handleAddToCart}
                onOpenCart={() => {
                  setExternalConfirmedOrder(null);
                  setIsCartOpen(true);
                }}
                cartCountByProduct={cartCountByProduct}
                onOpenBatteryTradeIn={() => setIsTradeInOpen(true)}
                onOpenQuickOrder={(p) => setQuickOrderProduct(p)}
                initialSelectedCar={selectedVehicleFilter}
                isAdmin={isAdminAuthenticated}
                onOpenAddProduct={isAdminAuthenticated ? () => setIsAddProductModalOpen(true) : undefined}
                onOpenEditProduct={isAdminAuthenticated ? (p) => setProductToEdit(p) : undefined}
                onOpenDeleteProduct={isAdminAuthenticated ? (p) => setProductToDelete(p) : undefined}
                onGoToAdmin={() => requireAdminAuth('admin')}
              />
            )}

            {activeSection === 'admin' && (
              <AdminAccountingView
                products={products}
                locations={locations}
                orders={orders}
                ledger={ledger}
                summary={summary}
                onAdjustInventory={handleAdjustInventory}
                onCreateProduct={handleCreateProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onLogout={handleAdminLogout}
              />
            )}

            {activeSection === 'telegram' && (
              <TelegramBotGuideView
                products={products}
                locations={locations}
                summary={summary}
                cart={cart}
                onAddToCart={handleAddToCart}
                onOpenCartDrawer={() => {
                  setExternalConfirmedOrder(null);
                  setIsCartOpen(true);
                }}
                onAdjustInventory={handleAdjustInventory}
              />
            )}
          </>
        )}
      </main>

      {/* Slide-Over Shopping Cart Drawer (Korzinka) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          setExternalConfirmedOrder(null);
        }}
        cart={cart}
        products={products}
        locations={locations}
        externalConfirmedOrder={externalConfirmedOrder}
        onUpdateQty={handleUpdateCartQty}
        onClearCart={handleClearCart}
        onSubmitOrder={handleSubmitOrder}
      />

      {/* 1-Click Quick Order Modal */}
      <QuickOrderModal
        isOpen={!!quickOrderProduct}
        onClose={() => setQuickOrderProduct(null)}
        product={quickOrderProduct}
        locations={locations}
        onOrderSuccess={handleQuickOrderSuccess}
      />

      {/* Battery Trade-In Discount Calculator Modal */}
      <BatteryTradeInModal
        isOpen={isTradeInOpen}
        onClose={() => setIsTradeInOpen(false)}
        batteryProducts={batteryProducts}
        onSelectBatteryWithTradeIn={(product, _tradeInDiscount) => {
          handleAddToCart(product.id, 1);
          setIsCartOpen(true);
        }}
      />

      {/* Direct Global Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        locations={locations}
        onAddProduct={handleCreateProduct}
      />

      {/* Direct Global Edit Product (Price & All Attributes) Modal */}
      <EditProductModal
        product={productToEdit}
        onClose={() => setProductToEdit(null)}
        locations={locations}
        onUpdateProduct={handleUpdateProduct}
      />

      {/* Direct Global Delete Product Confirmation Modal */}
      <DeleteProductModal
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* Passcode Protection Modal for Store Owner Admin Panel */}
      <AdminPasscodeModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => handleAdminLoginSuccess(pendingAdminSection)}
      />

      {/* Clean Footer with Discreet Admin Access for Store Owner */}
      <footer className="bg-[#0D121F] border-t border-slate-800/80 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Nam Avtoshina — Shina, Akkumulyator, Diska va Avto-aksessuarlar Markazi (Namangan).</p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleCustomerNav('TIRES')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Shinalar
            </button>
            <button
              type="button"
              onClick={() => handleCustomerNav('Akkumulyator')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Akkumulyatorlar
            </button>
            <button
              type="button"
              onClick={() => handleCustomerNav('Litye Diska')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Diskalar
            </button>
            <button
              type="button"
              onClick={() => handleCustomerNav('Aksessuarlar')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Aksessuarlar
            </button>

            {/* Admin & Telegram Bot Access for Store Owner */}
            {isAdminAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveSection('admin')}
                  className="font-bold text-slate-200 hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  Mahsulotlar & Ombor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('telegram')}
                  className="font-bold text-slate-200 hover:text-[#EA580C] transition-colors cursor-pointer"
                >
                  TG Bot Sozlamalari
                </button>
                <button
                  type="button"
                  onClick={handleAdminLogout}
                  className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  title="Admin rejimidan chiqish"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Chiqish</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => requireAdminAuth('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#131B2D] border border-slate-700/80 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold cursor-pointer text-xs shadow-xs"
                title="Admin mahsulot boshqaruvi va hisobotlar"
              >
                <Lock className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>⚙️ Admin Panel</span>
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
