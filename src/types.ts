export type ProductCategory =
  | 'Yozgi shina'
  | 'Qishki shina'
  | '4 Fasl (All-Season)'
  | 'Litye Diska'
  | 'Akkumulyator'
  | 'Aksessuarlar';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: ProductCategory;
  size: string; // e.g. "195/65 R15" or "60 Ah (540A)"
  radius: string; // e.g. "R15" or "60Ah" or "Universal"
  compatibleCars: string[]; // e.g. ["Cobalt", "Gentra", "Nexia 3"]
  costPrice: number; // Tan narxi (so'm)
  salePrice: number; // Sotuv narxi (so'm)
  stock: number; // Qoldiq soni (dona)
  totalAdded: number; // Jami kirim qilingan (dona)
  totalSold: number; // Jami sotilgan (dona)
  minStockAlert: number; // Kam qolganda ogohlantirish chegarasi
  branchId: string;
  imageType: 'summer' | 'winter' | 'allSeason' | 'wheel' | 'hero' | 'battery' | 'accessory';
  imageUrl?: string; // Yangi yoki tahrirlangan mahsulot rasmi (DataURL yoki internet havolasi)
  speedIndex: string; // or battery CCA / voltage: "12V 540A CCA"
  warrantyMonths: number;
  batteryCapacityAh?: number;
  batteryColdCrankingAmps?: number;
  tradeInDiscount?: number; // e.g. 100000 som eski akkumulyator topshirilganda
  description?: string;
}

export interface BranchLocation {
  id: string;
  name: string;
  district: string;
  address: string;
  landmark: string;
  phone: string;
  workingHours: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  services: string[];
  managerName: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type LedgerType = 'KIRIM' | 'SOTUV';

export interface LedgerTransaction {
  id: string;
  timestamp: string;
  type: LedgerType;
  productId: string;
  productName: string;
  productSize: string;
  quantity: number;
  unitCostPrice: number;
  unitSalePrice: number;
  totalAmount: number;
  profitAmount: number;
  branchName: string;
  customerOrSupplier: string;
  note: string;
  source: 'Web Katalog' | 'Telegram Bot' | 'Admin Ombor';
}

export type OrderStatus = 'Yangi' | 'Tasdiqlangan' | 'Yetkazildi' | 'Bekor qilindi';

export interface OrderItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryType: 'Filialdan olib ketish' | 'Manzilga yetkazib berish';
  branchId: string;
  branchName: string;
  deliveryAddress: string;
  paymentMethod: 'Naqd' | 'Click' | 'Payme' | 'Uzcard / Humo';
  items: OrderItem[];
  totalAmount: number;
  totalProfit: number;
  status: OrderStatus;
  source: 'Web Katalog' | 'Telegram Bot' | 'Admin Ombor';
}

export interface AccountingSummary {
  totalSkuCount: number;
  totalStockUnits: number;
  totalAddedUnits: number;
  totalSoldUnits: number;
  totalInventoryCostValue: number;
  totalInventoryRetailValue: number;
  totalSalesRevenue: number;
  totalNetProfit: number;
  lowStockCount: number;
}

export interface AppStateResponse {
  products: Product[];
  locations: BranchLocation[];
  orders: Order[];
  ledger: LedgerTransaction[];
  summary: AccountingSummary;
  botStatus: {
    hasEnvToken: boolean;
    pollingActive: boolean;
    botUsername: string | null;
    processedMessages: number;
  };
}
