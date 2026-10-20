import type {
  Product,
  BranchLocation,
  Order,
  LedgerTransaction,
  AccountingSummary,
  AppStateResponse,
  OrderStatus,
  ProductCategory,
  OrderItem,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_LOCATIONS,
  INITIAL_ORDERS,
  INITIAL_LEDGER,
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'nam_avtoshina_products_v2',
  LOCATIONS: 'nam_avtoshina_locations_v2',
  ORDERS: 'nam_avtoshina_orders_v2',
  LEDGER: 'nam_avtoshina_ledger_v2',
  BOT_CONFIG: 'nam_avtoshina_bot_config_v2',
};

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

export function computeSummary(products: Product[]): AccountingSummary {
  let totalStockUnits = 0;
  let totalAddedUnits = 0;
  let totalSoldUnits = 0;
  let totalInventoryCostValue = 0;
  let totalInventoryRetailValue = 0;
  let lowStockCount = 0;

  for (const p of products) {
    totalStockUnits += p.stock;
    totalAddedUnits += p.totalAdded;
    totalSoldUnits += p.totalSold;
    totalInventoryCostValue += p.stock * p.costPrice;
    totalInventoryRetailValue += p.stock * p.salePrice;
    if (p.stock <= p.minStockAlert) {
      lowStockCount += 1;
    }
  }

  let totalSalesRevenue = 0;
  let totalNetProfit = 0;

  for (const p of products) {
    totalSalesRevenue += p.totalSold * p.salePrice;
    totalNetProfit += p.totalSold * (p.salePrice - p.costPrice);
  }

  return {
    totalSkuCount: products.length,
    totalStockUnits,
    totalAddedUnits,
    totalSoldUnits,
    totalInventoryCostValue,
    totalInventoryRetailValue,
    totalSalesRevenue,
    totalNetProfit,
    lowStockCount,
  };
}

function formatNow(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export const apiService = {
  async getState(): Promise<AppStateResponse> {
    try {
      const res = await fetch('/api/state');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = (await res.json()) as AppStateResponse;
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          setLocalData(STORAGE_KEYS.PRODUCTS, data.products);
          setLocalData(STORAGE_KEYS.LOCATIONS, data.locations);
          setLocalData(STORAGE_KEYS.ORDERS, data.orders);
          setLocalData(STORAGE_KEYS.LEDGER, data.ledger);
          return data;
        }
      }
    } catch {
      // Fallback to local storage
    }

    // Local fallback for Vercel static deployment
    let products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    let locations = getLocalData<BranchLocation[]>(STORAGE_KEYS.LOCATIONS, []);
    let orders = getLocalData<Order[]>(STORAGE_KEYS.ORDERS, []);
    let ledger = getLocalData<LedgerTransaction[]>(STORAGE_KEYS.LEDGER, []);

    if (!products || products.length === 0) {
      products = INITIAL_PRODUCTS;
      setLocalData(STORAGE_KEYS.PRODUCTS, products);
    }
    if (!locations || locations.length === 0) {
      locations = INITIAL_LOCATIONS;
      setLocalData(STORAGE_KEYS.LOCATIONS, locations);
    }
    if (!orders || orders.length === 0) {
      orders = INITIAL_ORDERS;
      setLocalData(STORAGE_KEYS.ORDERS, orders);
    }
    if (!ledger || ledger.length === 0) {
      ledger = INITIAL_LEDGER;
      setLocalData(STORAGE_KEYS.LEDGER, ledger);
    }

    const summary = computeSummary(products);
    return {
      products,
      locations,
      orders,
      ledger,
      summary,
      botStatus: {
        hasEnvToken: false,
        pollingActive: false,
        botUsername: 'nam_avtoshina_bot',
        processedMessages: 0,
      },
    };
  },

  async createOrder(payload: {
    customerName: string;
    customerPhone: string;
    deliveryType: 'Filialdan olib ketish' | 'Manzilga yetkazib berish';
    branchId: string;
    branchName?: string;
    deliveryAddress: string;
    paymentMethod: 'Naqd' | 'Click' | 'Payme' | 'Uzcard / Humo';
    items: { productId: string; quantity: number }[];
    source?: 'Web Katalog' | 'Telegram Bot' | 'Admin Ombor';
  }): Promise<{
    order: Order;
    products: Product[];
    orders: Order[];
    ledger: LedgerTransaction[];
    summary: AccountingSummary;
    telegramMessage?: string;
    telegramSent?: boolean;
    botUsername?: string;
  }> {
    const products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const locations = getLocalData<BranchLocation[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    const orders = getLocalData<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const ledger = getLocalData<LedgerTransaction[]>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);

    const branch = locations.find((l) => l.id === payload.branchId) || locations[0];

    const orderItems: OrderItem[] = [];
    let totalAmount = 0;
    let totalProfit = 0;

    for (const it of payload.items) {
      const prd = products.find((p) => p.id === it.productId);
      if (!prd) continue;
      const qty = Math.max(1, it.quantity);
      orderItems.push({
        productId: prd.id,
        productName: prd.name,
        size: prd.size,
        quantity: qty,
        unitPrice: prd.salePrice,
        unitCost: prd.costPrice,
      });
      totalAmount += prd.salePrice * qty;
      totalProfit += (prd.salePrice - prd.costPrice) * qty;

      prd.stock = Math.max(0, prd.stock - qty);
      prd.totalSold += qty;

      ledger.unshift({
        id: `ldg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: formatNow(),
        type: 'SOTUV',
        productId: prd.id,
        productName: prd.name,
        productSize: prd.size,
        quantity: qty,
        unitCostPrice: prd.costPrice,
        unitSalePrice: prd.salePrice,
        totalAmount: prd.salePrice * qty,
        profitAmount: (prd.salePrice - prd.costPrice) * qty,
        branchName: branch ? branch.name : 'Asosiy Ombor',
        customerOrSupplier: payload.customerName,
        note: `Buyurtma: ${payload.customerPhone} (${payload.deliveryType})`,
        source: payload.source || 'Web Katalog',
      });
    }

    const orderNumber = `NAM-${String(orders.length + 1).padStart(4, '0')}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: formatNow(),
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      deliveryType: payload.deliveryType,
      branchId: payload.branchId,
      branchName: branch ? branch.name : 'Lola Bosh Markazi',
      deliveryAddress: payload.deliveryAddress,
      paymentMethod: payload.paymentMethod,
      items: orderItems,
      totalAmount,
      totalProfit,
      status: 'Yangi',
      source: payload.source || 'Web Katalog',
    };

    orders.unshift(newOrder);

    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    setLocalData(STORAGE_KEYS.ORDERS, orders);
    setLocalData(STORAGE_KEYS.LEDGER, ledger);

    const summary = computeSummary(products);

    const telegramMessage =
      `📦 *YANGI BUYURTMA QABUL QILINDI!* (#${orderNumber})\n\n` +
      `👤 *Mijoz:* ${payload.customerName}\n` +
      `📞 *Telefon:* ${payload.customerPhone}\n` +
      `🚚 *Yetkazib berish:* ${payload.deliveryType}\n` +
      `🏢 *Filial:* ${branch ? branch.name : 'Lola Bosh Markazi'}\n` +
      (payload.deliveryAddress ? `📍 *Manzil:* ${payload.deliveryAddress}\n` : '') +
      `💳 *To‘lov turi:* ${payload.paymentMethod}\n\n` +
      `🛒 *Buyurtma qilingan mahsulotlar:*\n` +
      orderItems
        .map(
          (it, idx) =>
            `${idx + 1}. *${it.productName}* (${it.size})\n   ↳ ${it.quantity} dona × ${it.unitPrice.toLocaleString('ru-RU')} = *${(it.unitPrice * it.quantity).toLocaleString('ru-RU')} so‘m*`
        )
        .join('\n') +
      `\n\n💰 *JAMI SUMMA:* *${totalAmount.toLocaleString('ru-RU')} so‘m*\n` +
      `🕒 *Vaqt:* ${formatNow()}\n` +
      `🏢 *Do‘kon:* Nam Avtoshina`;

    let telegramSent = false;
    let botUsername: string | undefined = undefined;

    // 1. Try serverless /api/orders endpoint first
    try {
      const apiRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          orderNumber,
          totalAmount,
          items: orderItems,
        }),
      });
      const contentType = apiRes.headers.get('content-type') || '';
      if (apiRes.ok && contentType.includes('application/json')) {
        const resData = await apiRes.json();
        if (resData.telegramSent) {
          telegramSent = true;
        }
      }
    } catch {
      // serverless endpoint not reachable
    }

    // 2. If not yet sent by serverless, dispatch directly from browser
    if (!telegramSent) {
      try {
        const savedCfg =
          getLocalData<{ token?: string; botToken?: string; chatId?: string; adminChatId?: string; botUsername?: string } | null>(
            STORAGE_KEYS.BOT_CONFIG,
            null
          ) ||
          (typeof localStorage !== 'undefined'
            ? JSON.parse(localStorage.getItem('nam_avtoshina_bot_config_v2') || 'null')
            : null);

        const activeToken =
          savedCfg?.botToken ||
          savedCfg?.token ||
          (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN);
        const activeChatId =
          savedCfg?.adminChatId ||
          savedCfg?.chatId ||
          (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADMIN_TELEGRAM_ID);
        botUsername = savedCfg?.botUsername;

        if (activeToken && activeChatId) {
          const tgRes = await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: activeChatId,
              text: telegramMessage,
              parse_mode: 'Markdown',
            }),
          });
          const tgJson = (await tgRes.json()) as { ok: boolean };
          telegramSent = Boolean(tgJson.ok);
        }
      } catch (err) {
        console.warn('Telegram notification dispatch failed:', err);
      }
    }

    return {
      order: newOrder,
      products,
      orders,
      ledger,
      summary,
      telegramMessage,
      telegramSent,
      botUsername,
    };
  },

  async adjustInventory(payload: {
    productId: string;
    type: 'KIRIM' | 'SOTUV';
    quantity: number;
    unitCostPrice?: number;
    unitSalePrice?: number;
    customerOrSupplier?: string;
    note?: string;
    branchId?: string;
  }): Promise<{ products: Product[]; ledger: LedgerTransaction[]; summary: AccountingSummary }> {
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setLocalData(STORAGE_KEYS.PRODUCTS, data.products);
        setLocalData(STORAGE_KEYS.LEDGER, data.ledger);
        return data;
      }
    } catch {
      // Local fallback
    }

    const products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const locations = getLocalData<BranchLocation[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    const ledger = getLocalData<LedgerTransaction[]>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);

    const prd = products.find((p) => p.id === payload.productId);
    if (!prd) throw new Error('Mahsulot topilmadi');

    const branch = locations.find((l) => l.id === payload.branchId) || locations[0];
    const qty = Math.max(1, payload.quantity);

    if (payload.type === 'KIRIM') {
      prd.stock += qty;
      prd.totalAdded += qty;
      if (payload.unitCostPrice) prd.costPrice = payload.unitCostPrice;
      if (payload.unitSalePrice) prd.salePrice = payload.unitSalePrice;

      ledger.unshift({
        id: `ldg-${Date.now()}`,
        timestamp: formatNow(),
        type: 'KIRIM',
        productId: prd.id,
        productName: prd.name,
        productSize: prd.size,
        quantity: qty,
        unitCostPrice: payload.unitCostPrice || prd.costPrice,
        unitSalePrice: payload.unitSalePrice || prd.salePrice,
        totalAmount: (payload.unitCostPrice || prd.costPrice) * qty,
        profitAmount: 0,
        branchName: branch ? branch.name : 'Asosiy Ombor',
        customerOrSupplier: payload.customerOrSupplier || 'Ta‘minotchi / Zavod',
        note: payload.note || 'Yangi partiya kirim qilindi',
        source: 'Admin Ombor',
      });
    } else {
      prd.stock = Math.max(0, prd.stock - qty);
      prd.totalSold += qty;

      ledger.unshift({
        id: `ldg-${Date.now()}`,
        timestamp: formatNow(),
        type: 'SOTUV',
        productId: prd.id,
        productName: prd.name,
        productSize: prd.size,
        quantity: qty,
        unitCostPrice: prd.costPrice,
        unitSalePrice: payload.unitSalePrice || prd.salePrice,
        totalAmount: (payload.unitSalePrice || prd.salePrice) * qty,
        profitAmount: ((payload.unitSalePrice || prd.salePrice) - prd.costPrice) * qty,
        branchName: branch ? branch.name : 'Asosiy Ombor',
        customerOrSupplier: payload.customerOrSupplier || 'Chakana xaridor',
        note: payload.note || 'To‘g‘ridan-to‘g‘ri sotuv',
        source: 'Admin Ombor',
      });
    }

    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    setLocalData(STORAGE_KEYS.LEDGER, ledger);
    const summary = computeSummary(products);

    return { products, ledger, summary };
  },

  async createProduct(payload: {
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
  }): Promise<{ products: Product[]; ledger: LedgerTransaction[]; summary: AccountingSummary; product: Product }> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setLocalData(STORAGE_KEYS.PRODUCTS, data.products);
        if (data.ledger) setLocalData(STORAGE_KEYS.LEDGER, data.ledger);
        return data;
      }
    } catch {
      // Local fallback
    }

    const products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const locations = getLocalData<BranchLocation[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
    const ledger = getLocalData<LedgerTransaction[]>(STORAGE_KEYS.LEDGER, INITIAL_LEDGER);

    const branch = locations.find((l) => l.id === payload.branchId) || locations[0];
    const initialQty = Math.max(0, payload.initialStock || 0);

    const brandPrefix = (payload.brand || 'PRD').substring(0, 3).toUpperCase();
    const sizeClean = (payload.size || 'STD').replace(/[^a-zA-Z0-9]/g, '-');
    const newSku = `NAM-${brandPrefix}-${sizeClean}-${Date.now().toString().slice(-4)}`;

    const newProduct: Product = {
      id: `prd-${Date.now()}`,
      sku: newSku,
      name: payload.name.trim(),
      brand: payload.brand.trim(),
      category: payload.category,
      size: payload.size.trim(),
      radius: payload.radius || 'Standart',
      compatibleCars: payload.compatibleCars && payload.compatibleCars.length > 0 ? payload.compatibleCars : ['Universal'],
      costPrice: Number(payload.costPrice) || 0,
      salePrice: Number(payload.salePrice) || 0,
      stock: initialQty,
      totalAdded: initialQty,
      totalSold: 0,
      minStockAlert: Number(payload.minStockAlert) || 10,
      branchId: payload.branchId || 'loc-lola',
      imageType: payload.imageType || (payload.category === 'Akkumulyator' ? 'battery' : payload.category === 'Litye Diska' ? 'wheel' : 'summer'),
      imageUrl: payload.imageUrl && payload.imageUrl.trim().length > 0 ? payload.imageUrl.trim() : undefined,
      speedIndex: payload.speedIndex || '91V (240 km/s)',
      warrantyMonths: Number(payload.warrantyMonths) || 12,
      tradeInDiscount: Number(payload.tradeInDiscount) || 0,
    };

    products.unshift(newProduct);

    if (initialQty > 0) {
      ledger.unshift({
        id: `ldg-${Date.now()}`,
        timestamp: formatNow(),
        type: 'KIRIM',
        productId: newProduct.id,
        productName: newProduct.name,
        productSize: newProduct.size,
        quantity: initialQty,
        unitCostPrice: newProduct.costPrice,
        unitSalePrice: newProduct.salePrice,
        totalAmount: newProduct.costPrice * initialQty,
        profitAmount: 0,
        branchName: branch ? branch.name : 'Lola Bosh Markazi',
        customerOrSupplier: 'Yangi katalog qo‘shildi',
        note: `Yangi tovar ro‘yxatga olindi: ${newProduct.name}`,
        source: 'Admin Ombor',
      });
    }

    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    setLocalData(STORAGE_KEYS.LEDGER, ledger);
    const summary = computeSummary(products);

    return { products, ledger, summary, product: newProduct };
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<{ products: Product[]; summary: AccountingSummary; product: Product }> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setLocalData(STORAGE_KEYS.PRODUCTS, data.products);
        return data;
      }
    } catch {
      // Local fallback
    }

    const products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Mahsulot topilmadi');

    products[idx] = {
      ...products[idx],
      ...updates,
      costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : products[idx].costPrice,
      salePrice: updates.salePrice !== undefined ? Number(updates.salePrice) : products[idx].salePrice,
      stock: updates.stock !== undefined ? Number(updates.stock) : products[idx].stock,
      minStockAlert: updates.minStockAlert !== undefined ? Number(updates.minStockAlert) : products[idx].minStockAlert,
      tradeInDiscount: updates.tradeInDiscount !== undefined ? Number(updates.tradeInDiscount) : products[idx].tradeInDiscount,
    };

    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    const summary = computeSummary(products);
    return { products, summary, product: products[idx] };
  },

  async deleteProduct(id: string): Promise<{ products: Product[]; summary: AccountingSummary }> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setLocalData(STORAGE_KEYS.PRODUCTS, data.products);
        return data;
      }
    } catch {
      // Local fallback
    }

    let products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    products = products.filter((p) => p.id !== id);

    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    const summary = computeSummary(products);
    return { products, summary };
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ orders: Order[]; products: Product[]; summary: AccountingSummary }> {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setLocalData(STORAGE_KEYS.ORDERS, data.orders);
        setLocalData(STORAGE_KEYS.PRODUCTS, data.products);
        return data;
      }
    } catch {
      // Local fallback
    }

    const orders = getLocalData<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    const products = getLocalData<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);

    const ord = orders.find((o) => o.id === orderId);
    if (!ord) throw new Error('Buyurtma topilmadi');

    const prevStatus = ord.status;
    ord.status = status;

    // If order was cancelled and now changed, or cancelled now: restore stock
    if (status === 'Bekor qilindi' && prevStatus !== 'Bekor qilindi') {
      for (const it of ord.items) {
        const prd = products.find((p) => p.id === it.productId);
        if (prd) {
          prd.stock += it.quantity;
          prd.totalSold = Math.max(0, prd.totalSold - it.quantity);
        }
      }
    }

    setLocalData(STORAGE_KEYS.ORDERS, orders);
    setLocalData(STORAGE_KEYS.PRODUCTS, products);
    const summary = computeSummary(products);
    return { orders, products, summary };
  },

  getBotConfig(): { token: string; chatId: string; botUsername?: string } {
    try {
      const savedCfg =
        getLocalData<{ token?: string; botToken?: string; chatId?: string; adminChatId?: string; botUsername?: string } | null>(
          STORAGE_KEYS.BOT_CONFIG,
          null
        ) ||
        (typeof localStorage !== 'undefined'
          ? JSON.parse(localStorage.getItem('nam_avtoshina_bot_config_v2') || 'null')
          : null);

      return {
        token:
          savedCfg?.botToken ||
          savedCfg?.token ||
          (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN : '') ||
          '',
        chatId:
          savedCfg?.adminChatId ||
          savedCfg?.chatId ||
          (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_ADMIN_TELEGRAM_ID : '') ||
          '',
        botUsername: savedCfg?.botUsername,
      };
    } catch {
      return { token: '', chatId: '' };
    }
  },

  async testBotMessage(
    token: string,
    chatId: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanToken = token.trim();
    const cleanChatId = chatId.trim();

    if (!cleanToken || !cleanChatId) {
      return {
        success: false,
        message: 'Iltimos, Bot Token va Telegram ID raqamingizni ikkalasini ham kiriting!',
      };
    }

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text:
            `🎉 *NAM AVTOSHINA TELEGRAM XABARNOMASI MUAFFAQIYATLI ULANGAN!*\n\n` +
            `Assalomu alaykum! Saytdan xarid qilingan yangi buyurtmalar to‘g‘ridan-to‘g‘ri ushbu chatga keladi.\n\n` +
            `🚗 *Do‘kon:* Nam Avtoshina\n` +
            `🕒 *Vaqt:* ${formatNow()}`,
          parse_mode: 'Markdown',
        }),
      });

      const data = (await tgRes.json()) as { ok: boolean; description?: string };
      if (data.ok) {
        return {
          success: true,
          message: '🎉 Ajoyib! Telegramingizga sinov xabari yetib bordi! Tekshirib ko‘ring.',
        };
      }
      return {
        success: false,
        message: `❌ Telegram xatosi: ${data.description || 'Xabar yuborib bo‘lmadi'}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Tarmoq xatosi: ${err?.message || 'Ulanib bo‘lmadi'}`,
      };
    }
  },

  async configureBot(
    botToken: string,
    adminChatId: string
  ): Promise<{ success: boolean; botUsername?: string; message: string }> {
    const cleanToken = botToken.trim();
    const cleanChatId = adminChatId.trim();

    let botUsername = 'nam_avtoshina_bot';

    if (cleanToken) {
      try {
        const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
        const meJson = (await meRes.json()) as { ok: boolean; result?: { username: string }; description?: string };
        if (meJson.ok && meJson.result?.username) {
          botUsername = meJson.result.username;
        } else {
          return {
            success: false,
            message: `❌ Token xato (${meJson.description || 'Unauthorized'}). Iltimos, @BotFather bergan HTTP API tokenni to‘liq nusxalab qo‘ying.`,
          };
        }
      } catch {
        // network issue
      }
    }

    const configObj = {
      botToken: cleanToken,
      token: cleanToken,
      adminChatId: cleanChatId,
      chatId: cleanChatId,
      botUsername,
    };

    setLocalData(STORAGE_KEYS.BOT_CONFIG, configObj);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nam_avtoshina_bot_config_v2', JSON.stringify(configObj));
    }

    try {
      await fetch('/api/bot/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: cleanToken, adminChatId: cleanChatId }),
      });
    } catch {
      // Serverless environment fallback
    }

    return {
      success: true,
      botUsername,
      message: `Telegram bot (@${botUsername}) sozlamalari muvaffaqiyatli saqlandi!`,
    };
  },
};
