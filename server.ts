import express from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import type {
  Product,
  BranchLocation,
  Order,
  LedgerTransaction,
  AccountingSummary,
  OrderStatus,
  ProductCategory,
} from './src/types';

dotenv.config();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nam_avtoshina_db.json');

interface DatabaseSchema {
  products: Product[];
  locations: BranchLocation[];
  orders: Order[];
  ledger: LedgerTransaction[];
}

const INITIAL_LOCATIONS: BranchLocation[] = [
  {
    id: 'loc-lola',
    name: 'Nam Avtoshina — Lola Bosh Markazi',
    district: 'Namangan sh., Davlatobod tumani',
    address: 'Islom Karimov ko‘chasi, 44-uy',
    landmark: 'Lola avtobozori kirish darvozasi ro‘parasida',
    phone: '+998 69 227 45 00',
    workingHours: '08:00 – 20:00 (Har kuni)',
    coordinates: { lat: 40.9854, lng: 71.5842 },
    services: ['Shinomontaj 3D balansirovka', 'Azot quyish', 'Optom va chakana savdo', 'Diska tekislash'],
    managerName: 'Sardorbek Maxmudov',
  },
  {
    id: 'loc-sardoba',
    name: 'Nam Avtoshina — Sardoba Filiali',
    district: 'Namangan sh., Марказий tuman',
    address: 'Navoiy ko‘chasi, 118-uy',
    landmark: 'Sardoba bozori yonidagi Avto-ehtiyot qismlar qatori',
    phone: '+998 91 345 88 22',
    workingHours: '08:30 – 19:30 (Dushanba–Shanba)',
    coordinates: { lat: 40.9982, lng: 71.6725 },
    services: ['Tezkor shina almashtirish', 'Kafolatli rasmiylashtirish', 'Yetkazib berish punkti'],
    managerName: 'Ulug‘bek Toshmatov',
  },
  {
    id: 'loc-gromov',
    name: 'Nam Avtoshina — Gromov Servis',
    district: 'Namangan sh., Shimoliy aylanma yo‘l',
    address: 'Uychi ko‘chasi, 72-B uy',
    landmark: 'Gromov chorrahasi, Lukoil AYQSH yonida',
    phone: '+998 93 490 12 12',
    workingHours: '08:00 – 21:00 (Har kuni)',
    coordinates: { lat: 41.0124, lng: 71.6931 },
    services: ['Yuk va yengil avto shinalari', 'Kompyuter razval-sxojdeniya', 'Bepul o‘rnatib berish'],
    managerName: 'Jamshidbek Karimov',
  },
  {
    id: 'loc-chust',
    name: 'Nam Avtoshina — Chust Tuman Filiali',
    district: 'Chust tumani, Markaziy ko‘cha',
    address: 'Mustaqillik shoh ko‘chasi, 19-uy',
    landmark: 'Chust dehqon bozori chorrahasidan 200m',
    phone: '+998 94 270 55 44',
    workingHours: '08:30 – 19:00 (Har kuni)',
    coordinates: { lat: 41.0033, lng: 71.2378 },
    services: ['Chakana savdo', 'Buyurtmani 1 soatda yetkazish', 'Shinomontaj'],
    managerName: 'Otabek Rahimov',
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prd-1',
    sku: 'NAM-MCH-195-65-15',
    name: 'Michelin Primacy 4+ Comfort',
    brand: 'Michelin',
    category: 'Yozgi shina',
    size: '195/65 R15',
    radius: 'R15',
    compatibleCars: ['Cobalt', 'Gentra', 'Lacetti'],
    costPrice: 740000,
    salePrice: 890000,
    stock: 80,
    totalAdded: 80,
    totalSold: 0,
    minStockAlert: 12,
    branchId: 'loc-lola',
    imageType: 'summer',
    speedIndex: '91V (240 km/s)',
    warrantyMonths: 36,
  },
  {
    id: 'prd-2',
    sku: 'NAM-KMH-195-60-15',
    name: 'Kumho Ecowing ES31 Eko-Yumshoq',
    brand: 'Kumho',
    category: '4 Fasl (All-Season)',
    size: '195/60 R15',
    radius: 'R15',
    compatibleCars: ['Gentra', 'Cobalt', 'Nexia 3'],
    costPrice: 540000,
    salePrice: 665000,
    stock: 120,
    totalAdded: 120,
    totalSold: 0,
    minStockAlert: 16,
    branchId: 'loc-lola',
    imageType: 'summer',
    speedIndex: '88H (210 km/s)',
    warrantyMonths: 24,
  },
  {
    id: 'prd-3',
    sku: 'NAM-BRS-185-65-14',
    name: 'Bars UZ200 Standart Mustahkam',
    brand: 'Bars',
    category: '4 Fasl (All-Season)',
    size: '185/65 R14',
    radius: 'R14',
    compatibleCars: ['Nexia 3', 'Spark', 'Nexia 2'],
    costPrice: 365000,
    salePrice: 445000,
    stock: 180,
    totalAdded: 180,
    totalSold: 0,
    minStockAlert: 20,
    branchId: 'loc-sardoba',
    imageType: 'summer',
    speedIndex: '86T (190 km/s)',
    warrantyMonths: 18,
  },
  {
    id: 'prd-4',
    sku: 'NAM-NOK-205-55-16',
    name: 'Nokian Hakkapeliitta R5 Muz-Qor',
    brand: 'Nokian',
    category: 'Qishki shina',
    size: '205/55 R16',
    radius: 'R16',
    compatibleCars: ['Onix', 'Monza', 'Cerato'],
    costPrice: 690000,
    salePrice: 840000,
    stock: 52,
    totalAdded: 52,
    totalSold: 0,
    minStockAlert: 12,
    branchId: 'loc-gromov',
    imageType: 'winter',
    speedIndex: '94R (170 km/s)',
    warrantyMonths: 24,
  },
  {
    id: 'prd-5',
    sku: 'NAM-NXN-225-55-18',
    name: 'Nexen N’Fera RU1 Premium SUV',
    brand: 'Nexen',
    category: '4 Fasl (All-Season)',
    size: '225/55 R18',
    radius: 'R18',
    compatibleCars: ['Malibu 2', 'Tracker 2', 'Equinox'],
    costPrice: 920000,
    salePrice: 1120000,
    stock: 40,
    totalAdded: 40,
    totalSold: 0,
    minStockAlert: 8,
    branchId: 'loc-lola',
    imageType: 'hero',
    speedIndex: '98V (240 km/s)',
    warrantyMonths: 30,
  },
  {
    id: 'prd-6',
    sku: 'NAM-TRG-155-70-12',
    name: 'Triangle TR737 Kuchaytirilgan Yuk',
    brand: 'Triangle',
    category: '4 Fasl (All-Season)',
    size: '155/70 R12C',
    radius: 'R12',
    compatibleCars: ['Damas', 'Labo'],
    costPrice: 310000,
    salePrice: 385000,
    stock: 100,
    totalAdded: 100,
    totalSold: 0,
    minStockAlert: 16,
    branchId: 'loc-chust',
    imageType: 'winter',
    speedIndex: '104N (8-qavat kord)',
    warrantyMonths: 18,
  },
  {
    id: 'prd-7',
    sku: 'NAM-VSN-R16-4X100',
    name: 'Vossen CVT Graphite Litye Diska (Komplekt 4 dona)',
    brand: 'Vossen',
    category: 'Litye Diska',
    size: 'R16 4x100 J7.0',
    radius: 'R16',
    compatibleCars: ['Cobalt', 'Gentra', 'Onix', 'Nexia 3'],
    costPrice: 3450000,
    salePrice: 4150000,
    stock: 18,
    totalAdded: 18,
    totalSold: 0,
    minStockAlert: 4,
    branchId: 'loc-lola',
    imageType: 'wheel',
    speedIndex: 'Engil qotishma (Titanium Dark)',
    warrantyMonths: 24,
  },
  {
    id: 'prd-8',
    sku: 'NAM-LSS-215-55-17',
    name: 'Lassa Snoways 4 Qishki Protektor',
    brand: 'Lassa',
    category: 'Qishki shina',
    size: '215/55 R17',
    radius: 'R17',
    compatibleCars: ['Tracker 2', 'Malibu 2', 'K5'],
    costPrice: 780000,
    salePrice: 950000,
    stock: 46,
    totalAdded: 46,
    totalSold: 0,
    minStockAlert: 10,
    branchId: 'loc-gromov',
    imageType: 'winter',
    speedIndex: '98V XL',
    warrantyMonths: 24,
  },
  {
    id: 'prd-bat-1',
    sku: 'NAM-BAT-DLK-60AH',
    name: 'Delkor Calcium 60Ah 550A (Janubiy Koreya)',
    brand: 'Delkor',
    category: 'Akkumulyator',
    size: '60 Ah (550A CCA)',
    radius: '60Ah',
    compatibleCars: ['Cobalt', 'Gentra', 'Nexia 3', 'Spark', 'Lacetti'],
    costPrice: 620000,
    salePrice: 780000,
    stock: 65,
    totalAdded: 65,
    totalSold: 0,
    minStockAlert: 10,
    branchId: 'loc-lola',
    imageType: 'battery',
    speedIndex: '12V 550A (O‘ng plyus +)',
    warrantyMonths: 24,
    batteryCapacityAh: 60,
    batteryColdCrankingAmps: 550,
    tradeInDiscount: 100000,
    description: 'Janubiy Koreyaning eng mashhur va ishonchli akkumulyatori. Qishki sovuqda tez o‘t oldiradi. Eski akkumulyatoringizni bersangiz 100 000 so‘m chegirma!',
  },
  {
    id: 'prd-bat-2',
    sku: 'NAM-BAT-BRS-60AH',
    name: 'Bars Silver 60Ah 540A Ishonchli Quvvat',
    brand: 'Bars',
    category: 'Akkumulyator',
    size: '60 Ah (540A CCA)',
    radius: '60Ah',
    compatibleCars: ['Cobalt', 'Gentra', 'Nexia 3', 'Spark', 'Nexia 2'],
    costPrice: 430000,
    salePrice: 550000,
    stock: 90,
    totalAdded: 90,
    totalSold: 0,
    minStockAlert: 15,
    branchId: 'loc-sardoba',
    imageType: 'battery',
    speedIndex: '12V 540A (Standart)',
    warrantyMonths: 18,
    batteryCapacityAh: 60,
    batteryColdCrankingAmps: 540,
    tradeInDiscount: 80000,
    description: 'Hamyonbop va uzoq xizmat qiluvchi akkumulyator. O‘zbekiston iqlimiga 100% moslashtirilgan. Eski akkumulyatoringizga 80 000 so‘m chegirma.',
  },
  {
    id: 'prd-bat-3',
    sku: 'NAM-BAT-VRT-60AH',
    name: 'Varta Blue Dynamic D59 60Ah 540A Premium',
    brand: 'Varta',
    category: 'Akkumulyator',
    size: '60 Ah (540A CCA)',
    radius: '60Ah',
    compatibleCars: ['Onix', 'Tracker 2', 'Monza', 'Gentra'],
    costPrice: 740000,
    salePrice: 920000,
    stock: 40,
    totalAdded: 40,
    totalSold: 0,
    minStockAlert: 8,
    branchId: 'loc-lola',
    imageType: 'battery',
    speedIndex: '12V 540A (PowerFrame)',
    warrantyMonths: 24,
    batteryCapacityAh: 60,
    batteryColdCrankingAmps: 540,
    tradeInDiscount: 100000,
    description: 'Nemis texnologiyasi asosidagi yuqori sifatli akkumulyator. Elektronikasi ko‘p zamonaviy avtomobillar uchun ideal.',
  },
  {
    id: 'prd-bat-4',
    sku: 'NAM-BAT-MTL-65AH',
    name: 'Mutlu Calcium Silver 65Ah 600A (Turkiya)',
    brand: 'Mutlu',
    category: 'Akkumulyator',
    size: '65 Ah (600A CCA)',
    radius: '65Ah',
    compatibleCars: ['Malibu 2', 'Tracker 2', 'Captiva', 'Equinox'],
    costPrice: 680000,
    salePrice: 850000,
    stock: 48,
    totalAdded: 48,
    totalSold: 0,
    minStockAlert: 8,
    branchId: 'loc-gromov',
    imageType: 'battery',
    speedIndex: '12V 600A (Kuchaytirilgan)',
    warrantyMonths: 24,
    batteryCapacityAh: 65,
    batteryColdCrankingAmps: 600,
    tradeInDiscount: 100000,
    description: 'Turkiya sifati. Kuchli start toki (600A) va yuqori sig‘im. Katta dvigatelli avtomobillarga mos.',
  },
  {
    id: 'prd-bat-5',
    sku: 'NAM-BAT-AKM-75AH',
    name: 'Akom EFB Heavy 75Ah 700A Yuqori Kuch',
    brand: 'Akom',
    category: 'Akkumulyator',
    size: '75 Ah (700A CCA)',
    radius: '75Ah',
    compatibleCars: ['Malibu 2', 'Isuzu', 'Gazel', 'Travego', 'Haval'],
    costPrice: 790000,
    salePrice: 980000,
    stock: 30,
    totalAdded: 30,
    totalSold: 0,
    minStockAlert: 6,
    branchId: 'loc-lola',
    imageType: 'battery',
    speedIndex: '12V 700A EFB texnologiyasi',
    warrantyMonths: 24,
    batteryCapacityAh: 75,
    batteryColdCrankingAmps: 700,
    tradeInDiscount: 120000,
    description: 'EFB texnologiyali chidamli akkumulyator. Start-Stop tizimli va yuqori yuklamali mashinalar uchun.',
  },
  {
    id: 'prd-bat-6',
    sku: 'NAM-BAT-BRS-45AH',
    name: 'Bars Compact 45Ah 400A (Damas & Labo)',
    brand: 'Bars',
    category: 'Akkumulyator',
    size: '45 Ah (400A CCA)',
    radius: '45Ah',
    compatibleCars: ['Damas', 'Labo', 'Matiz', 'Spark'],
    costPrice: 340000,
    salePrice: 430000,
    stock: 80,
    totalAdded: 80,
    totalSold: 0,
    minStockAlert: 12,
    branchId: 'loc-chust',
    imageType: 'battery',
    speedIndex: '12V 400A (Ingichka klemma)',
    warrantyMonths: 18,
    batteryCapacityAh: 45,
    batteryColdCrankingAmps: 400,
    tradeInDiscount: 70000,
    description: 'Damas va Labo maxsus o‘lchami (ingichka klemma). Ixcham va sovuqqa chidamli.',
  },
  {
    id: 'prd-9',
    sku: 'NAM-BRG-205-65-15',
    name: 'Bridgestone Turanza T005 Shovqinsiz',
    brand: 'Bridgestone',
    category: 'Yozgi shina',
    size: '205/65 R15',
    radius: 'R15',
    compatibleCars: ['Cobalt', 'Gentra', 'Lacetti'],
    costPrice: 760000,
    salePrice: 920000,
    stock: 60,
    totalAdded: 60,
    totalSold: 0,
    minStockAlert: 10,
    branchId: 'loc-lola',
    imageType: 'summer',
    speedIndex: '94V (240 km/s)',
    warrantyMonths: 36,
  },
  {
    id: 'prd-10',
    sku: 'NAM-PRL-215-55-17',
    name: 'Pirelli Cinturato P7 Sport Premium',
    brand: 'Pirelli',
    category: 'Yozgi shina',
    size: '215/55 R17',
    radius: 'R17',
    compatibleCars: ['Tracker 2', 'Malibu 2', 'Kia K5'],
    costPrice: 820000,
    salePrice: 1020000,
    stock: 36,
    totalAdded: 36,
    totalSold: 0,
    minStockAlert: 8,
    branchId: 'loc-gromov',
    imageType: 'summer',
    speedIndex: '94W (270 km/s)',
    warrantyMonths: 36,
  },
];

const INITIAL_ORDERS: Order[] = [];

const INITIAL_LEDGER: LedgerTransaction[] = [
  {
    id: 'ldg-1',
    timestamp: '2026-10-11 08:00',
    type: 'KIRIM',
    productId: 'prd-1',
    productName: 'Michelin Primacy 4+ Comfort',
    productSize: '195/65 R15',
    quantity: 80,
    unitCostPrice: 740000,
    unitSalePrice: 890000,
    totalAmount: 59200000,
    profitAmount: 0,
    branchName: 'Nam Avtoshina — Lola Bosh Markazi',
    customerOrSupplier: 'Rasmiy yetkazib beruvchi',
    note: 'Yangi do‘kon ochilishi munosabati bilan boshlang‘ich ombor zaxirasi',
    source: 'Admin Ombor',
  },
  {
    id: 'ldg-2',
    timestamp: '2026-10-11 08:15',
    type: 'KIRIM',
    productId: 'prd-bat-1',
    productName: 'Delkor Calcium 60Ah 550A (Janubiy Koreya)',
    productSize: '60 Ah (550A CCA)',
    quantity: 65,
    unitCostPrice: 620000,
    unitSalePrice: 780000,
    totalAmount: 40300000,
    profitAmount: 0,
    branchName: 'Nam Avtoshina — Lola Bosh Markazi',
    customerOrSupplier: 'Delkor Rasmiy Distribyutori',
    note: 'Janubiy Koreya akkumulyatorlari omborga qabul qilindi',
    source: 'Admin Ombor',
  },
];

function loadDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const seed: DatabaseSchema = {
        products: INITIAL_PRODUCTS,
        locations: INITIAL_LOCATIONS,
        orders: INITIAL_ORDERS,
        ledger: INITIAL_LEDGER,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch {
    return {
      products: INITIAL_PRODUCTS,
      locations: INITIAL_LOCATIONS,
      orders: INITIAL_ORDERS,
      ledger: INITIAL_LEDGER,
    };
  }
}

function saveDb(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Database write error:', err);
  }
}

function computeSummary(db: DatabaseSchema): AccountingSummary {
  let totalStockUnits = 0;
  let totalAddedUnits = 0;
  let totalSoldUnits = 0;
  let totalInventoryCostValue = 0;
  let totalInventoryRetailValue = 0;
  let lowStockCount = 0;

  for (const p of db.products) {
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

  for (const p of db.products) {
    totalSalesRevenue += p.totalSold * p.salePrice;
    totalNetProfit += p.totalSold * (p.salePrice - p.costPrice);
  }

  return {
    totalSkuCount: db.products.length,
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

const BOT_CONFIG_FILE = path.join(DATA_DIR, 'bot_config.json');

function loadBotConfig(): { token: string; adminChatId: string } {
  const DEFAULT_TOKEN = '8749032474:AAETChe-6Zhh9Cc1v_-XdAmEKZP7G5k2mJw';
  const DEFAULT_CHAT_ID = '7878545674';
  try {
    if (fs.existsSync(BOT_CONFIG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(BOT_CONFIG_FILE, 'utf-8'));
      return {
        token: parsed.token || DEFAULT_TOKEN,
        adminChatId: String(parsed.adminChatId || DEFAULT_CHAT_ID),
      };
    }
  } catch {}
  return {
    token:
      process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE'
        ? process.env.TELEGRAM_BOT_TOKEN
        : DEFAULT_TOKEN,
    adminChatId:
      process.env.ADMIN_TELEGRAM_ID && process.env.ADMIN_TELEGRAM_ID !== 'YOUR_TELEGRAM_USER_ID'
        ? process.env.ADMIN_TELEGRAM_ID
        : DEFAULT_CHAT_ID,
  };
}

function saveBotConfig(cfg: { token: string; adminChatId: string }) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BOT_CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save bot config:', err);
  }
}

const initialConfig = loadBotConfig();
let activeBotToken: string = initialConfig.token;
let adminChatId: string | number = initialConfig.adminChatId;
let botUsername: string | null = null;
let pollingActive = false;
let processedMessages = 0;
let lastUpdateId = 0;

async function startTelegramPolling(token: string, dbRef: () => DatabaseSchema) {
  if (!token || token.length < 20) return;
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meJson = (await meRes.json()) as { ok: boolean; result?: { username: string } };
    if (!meJson.ok || !meJson.result) {
      pollingActive = false;
      return;
    }
    activeBotToken = token;
    botUsername = meJson.result.username;
    pollingActive = true;
  } catch {
    pollingActive = false;
    return;
  }

  const pollLoop = async () => {
    if (!pollingActive || activeBotToken !== token) return;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`
      );
      const data = (await res.json()) as {
        ok: boolean;
        result?: Array<{
          update_id: number;
          message?: {
            chat: { id: number; first_name?: string };
            text?: string;
          };
        }>;
      };

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          const msg = update.message;
          if (msg && msg.text) {
            processedMessages += 1;
            const chatId = msg.chat.id;
            const text = msg.text.trim();
            const db = dbRef();
            const summary = computeSummary(db);

            let replyText = '';
            if (text.startsWith('/start')) {
              replyText =
                `Assalomu alaykum, ${msg.chat.first_name || 'Xaridor'}!\n\n` +
                `🚗 *NAM AVTOSHINA* rasmiy savdo-sotiq botiga xush kelibsiz!\n\n` +
                `Buyruqlar ro‘yxati:\n` +
                `🔍 /katalog — Barcha shina va diskalar narxi va qoldig‘i\n` +
                `📍 /lokatsiya — Namangan shahridagi 4 ta filialimiz manzillari\n` +
                `📊 /hisobot — Admin uchun ombor qoldig‘i va sotuv hisob-kitobi\n\n` +
                `Yoki kerakli razmerni yozib yuboring (masalan: *195/65 R15* yoki *Cobalt*):`;
            } else if (text.startsWith('/katalog')) {
              const lines = db.products.map(
                (p, idx) =>
                  `${idx + 1}. *${p.name}* (${p.size})\n` +
                  `   💰 Narxi: ${p.salePrice.toLocaleString('ru-RU')} so‘m | 📦 Qoldiq: ${p.stock} dona\n` +
                  `   🚘 Mos: ${p.compatibleCars.join(', ')}`
              );
              replyText = `🛞 *NAM AVTOSHINA KATALOGI:*\n\n` + lines.join('\n\n');
            } else if (text.startsWith('/lokatsiya')) {
              const locs = db.locations.map(
                (l, i) =>
                  `${i + 1}. 📍 *${l.name}*\n` +
                  `   Manzil: ${l.address} (${l.landmark})\n` +
                  `   Tel: ${l.phone} | Ish vaqti: ${l.workingHours}`
              );
              replyText = `📍 *NAM AVTOSHINA FILIALLARI:*\n\n` + locs.join('\n\n');
            } else if (text.startsWith('/hisobot') || text.startsWith('/admin')) {
              const stockLines = db.products.map(
                (p) =>
                  `• ${p.name} (${p.size}): Qoldi *${p.stock}* ta | Sotildi: *${p.totalSold}* ta | Qo‘shildi: *${p.totalAdded}* ta`
              );
              replyText =
                `📊 *NAM AVTOSHINA — ADMIN HISOB-KITOB:*\n\n` +
                `📦 Jami ombordagi shinalar: *${summary.totalStockUnits} dona*\n` +
                `➕ Jami kirim qilingan: *${summary.totalAddedUnits} dona*\n` +
                `🛒 Jami sotilgan: *${summary.totalSoldUnits} dona*\n` +
                `💵 Umumiy tushum: *${summary.totalSalesRevenue.toLocaleString('ru-RU')} so‘m*\n` +
                `📈 Sof foyda: *${summary.totalNetProfit.toLocaleString('ru-RU')} so‘m*\n\n` +
                `*Mahsulotlar kesimida qoldiq:*\n` +
                stockLines.join('\n');
            } else {
              const q = text.toLowerCase();
              const matched = db.products.filter(
                (p) =>
                  p.name.toLowerCase().includes(q) ||
                  p.size.toLowerCase().includes(q) ||
                  p.brand.toLowerCase().includes(q) ||
                  p.radius.toLowerCase().includes(q) ||
                  p.compatibleCars.some((c) => c.toLowerCase().includes(q))
              );
              if (matched.length > 0) {
                replyText =
                  `🔎 *"${text}" bo‘yicha topilgan mahsulotlar (${matched.length} ta):*\n\n` +
                  matched
                    .map(
                      (p) =>
                        `🛞 *${p.name}*\n` +
                        `O‘lcham: ${p.size} | Kategoriya: ${p.category}\n` +
                        `Mos avtolar: ${p.compatibleCars.join(', ')}\n` +
                        `💰 Narxi: *${p.salePrice.toLocaleString('ru-RU')} so‘m* (Qoldiq: ${p.stock} dona)`
                    )
                    .join('\n\n');
              } else {
                replyText = `❌ "${text}" bo‘yicha mahsulot topilmadi. Masalan: *195/65 R15*, *Cobalt*, *Michelin* yoki /katalog deb yozing.`;
              }
            }

            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: replyText,
                parse_mode: 'Markdown',
              }),
            });
          }
        }
      }
    } catch {
      // Ignore transient network errors during long-polling
    }
    if (pollingActive && activeBotToken === token) {
      setTimeout(pollLoop, 1500);
    }
  };

  pollLoop();
}

function generateStandaloneBotCode(db: DatabaseSchema): string {
  const productsJson = JSON.stringify(
    db.products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      category: p.category,
      size: p.size,
      radius: p.radius,
      cars: p.compatibleCars,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      stock: p.stock,
      totalAdded: p.totalAdded,
      totalSold: p.totalSold,
    })),
    null,
    2
  );

  const locationsJson = JSON.stringify(
    db.locations.map((l) => ({
      name: l.name,
      address: l.address,
      landmark: l.landmark,
      phone: l.phone,
      hours: l.workingHours,
      lat: l.coordinates.lat,
      lng: l.coordinates.lng,
    })),
    null,
    2
  );

  return `/**
 * ============================================================================
 * NAM AVTOSHINA — 100% ISHLAYDIGAN TELEGRAM SAVDO VA OMBOR HISOB-KITOB BOTI
 * ============================================================================
 * Visual Studio Code (VS Code) da ishga tushirish tartibi:
 * 1. Terminalni oching va yozing: npm install node-telegram-bot-api dotenv
 * 2. BOT_TOKEN o'zgaruvchisiga @BotFather dan olgan tokeningizni qo'ying
 * 3. ADMIN_ID o'zgaruvchisiga o'zingizning Telegram ID raqamingizni yozing
 * 4. Ishga tushirish: node bot.js
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'BU_YERGA_BOTFATHER_TOKENINGIZNI_YOZING';
const ADMIN_ID = Number(process.env.ADMIN_TELEGRAM_ID || 0); // Masalan: 123456789
const WEB_APP_URL = process.env.APP_URL || 'https://sizning-saytingiz.uz';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Ombor bazasi (Avtomatik faylga saqlanadi)
const DB_PATH = './nam_avtoshina_bot_db.json';
let products = ${productsJson};
const locations = ${locationsJson};

if (fs.existsSync(DB_PATH)) {
  try {
    products = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (e) {}
}

function saveProducts() {
  fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

// Har bir foydalanuvchi uchun Korzinka (Savatcha)
const userCarts = {};

// 1. /start buyrug'i va Asosiy Menyu
bot.onText(/\\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    \`Assalomu alaykum, *\${msg.from.first_name || 'Xaridor'}*!\\n\\n\` +
    \`🛞 *NAM AVTOSHINA* rasmiy savdo-sotiq botiga xush kelibsiz!\\n\` +
    \`O'zingizga kerakli shina yoki diskani qidiring, filtrlang va korzinkaga qo'shib buyurtma bering:\`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: '🛞 Katalog va Filtr' }, { text: '🔍 Qidiruv (Razmer / Avto)' }],
          [{ text: '🛒 Korzinka (Savatcha)' }, { text: '📍 Filiallar va Lokatsiya' }],
          [{ text: '📊 Admin: Hisob-kitob va Ombor' }]
        ],
        resize_keyboard: true
      }
    }
  );
});

// 2. Katalog va Radius/Mavsum filtri
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  if (text === '🛞 Katalog va Filtr') {
    bot.sendMessage(chatId, 'Kerakli shina radiusini yoki kategoriyani tanlang:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'R12 (Damas/Labo)', callback_data: 'filter_R12' },
            { text: 'R14 (Nexia/Spark)', callback_data: 'filter_R14' }
          ],
          [
            { text: 'R15 (Cobalt/Gentra)', callback_data: 'filter_R15' },
            { text: 'R16 (Onix/Diska)', callback_data: 'filter_R16' }
          ],
          [
            { text: 'R17-R18 (Malibu/Tracker)', callback_data: 'filter_R18' },
            { text: 'Barchasini ko\\'rish', callback_data: 'filter_ALL' }
          ]
        ]
      }
    });
  } else if (text === '🔍 Qidiruv (Razmer / Avto)') {
    bot.sendMessage(
      chatId,
      '🔍 Qidirish uchun shina razmerini, brendini yoki mashina nomini yozib yuboring.\\n\\nMasalan: *195/65 R15*, *Cobalt*, *Michelin*, *Bars* yoki *Damas*',
      { parse_mode: 'Markdown' }
    );
  } else if (text === '🛒 Korzinka (Savatcha)') {
    showCart(chatId);
  } else if (text === '📍 Filiallar va Lokatsiya') {
    locations.forEach((loc) => {
      bot.sendMessage(
        chatId,
        \`📍 *\${loc.name}*\\n🏛 Manzil: \${loc.address}\\n🧭 Mo'ljal: \${loc.landmark}\\n📞 Tel: \${loc.phone}\\n🕒 Ish vaqti: \${loc.hours}\`,
        { parse_mode: 'Markdown' }
      );
      bot.sendLocation(chatId, loc.lat, loc.lng);
    });
  } else if (text === '📊 Admin: Hisob-kitob va Ombor') {
    let totalStock = 0, totalSold = 0, totalAdded = 0, totalRevenue = 0, totalProfit = 0;
    const rows = products.map((p) => {
      totalStock += p.stock;
      totalSold += p.totalSold;
      totalAdded += p.totalAdded;
      totalRevenue += p.totalSold * p.salePrice;
      totalProfit += p.totalSold * (p.salePrice - p.costPrice);
      return \`• *\${p.name}* (\${p.size})\\n  Qoldi: *\${p.stock} ta* | Sotildi: *\${p.totalSold} ta* | Qo'shildi: *\${p.totalAdded} ta*\`;
    });

    bot.sendMessage(
      chatId,
      \`📊 *NAM AVTOSHINA — ADMIN OMBOR HISOB-KITOBI*\\n\\n\` +
      \`📦 Jami qolgan mahsulot: *\${totalStock} dona*\\n\` +
      \`➕ Jami qo'shilgan (Kirim): *\${totalAdded} dona*\\n\` +
      \`🛒 Jami sotilgan (Chiqim): *\${totalSold} dona*\\n\` +
      \`💵 Umumiy savdo: *\${totalRevenue.toLocaleString('ru-RU')} so'm*\\n\` +
      \`📈 Sof foyda: *\${totalProfit.toLocaleString('ru-RU')} so'm*\\n\\n\` +
      \`*Mahsulotlar qoldig'i:*\\n\` + rows.join('\\n\\n') +
      \`\\n\\n➕ *Omborga mahsulot qo'shish uchun:* \\\`/qoshish ID SONI\\\` (Masalan: \\\`/qoshish prd-1 20\\\`) deb yozing.\`,
      { parse_mode: 'Markdown' }
    );
  } else if (text.startsWith('/qoshish')) {
    const parts = text.split(' ');
    const pid = parts[1];
    const qty = parseInt(parts[2], 10);
    const item = products.find((p) => p.id === pid || p.sku.toLowerCase() === (pid || '').toLowerCase());
    if (!item || isNaN(qty) || qty <= 0) {
      bot.sendMessage(chatId, '❌ Xato format. Misol: /qoshish prd-1 20');
      return;
    }
    item.stock += qty;
    item.totalAdded += qty;
    saveProducts();
    bot.sendMessage(
      chatId,
      \`✅ *OMBorga KIRIM QILINDI!*\\n\\nMahsulot: *\${item.name}* (\${item.size})\\nQo'shildi: *+\${qty} dona*\\nYangi qoldiq: *\${item.stock} dona*\`,
      { parse_mode: 'Markdown' }
    );
  } else if (!text.startsWith('/')) {
    // Matnli Qidiruv (Search)
    const q = text.toLowerCase();
    const found = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.cars.some((c) => c.toLowerCase().includes(q))
    );
    if (found.length === 0) {
      bot.sendMessage(chatId, \`❌ "\${text}" bo'yicha shina topilmadi. Boshqa razmer yoki avto nomini yozib ko'ring.\`);
    } else {
      found.forEach((p) => sendProductCard(chatId, p));
    }
  }
});

function sendProductCard(chatId, p) {
  bot.sendMessage(
    chatId,
    \`🛞 *\${p.name}*\\n\` +
    \`📏 Razmer: *\${p.size}* (\${p.category})\\n\` +
    \`🚘 Mos mashinalar: \${p.cars.join(', ')}\\n\` +
    \`💰 Narxi (1 dona): *\${p.salePrice.toLocaleString('ru-RU')} so'm*\\n\` +
    \`📦 Omborda qoldiq: *\${p.stock} dona*\`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '➕ 1 dona qo\\'shish', callback_data: \`add_\${p.id}_1\` },
            { text: '➕ 4 dona (Komplekt)', callback_data: \`add_\${p.id}_4\` }
          ]
        ]
      }
    }
  );
}

function showCart(chatId) {
  const cart = userCarts[chatId] || [];
  if (cart.length === 0) {
    bot.sendMessage(chatId, '🛒 Korzinkangiz hozircha bo\\'sh. Katalogdan kerakli shinalarni qo\\'shing.');
    return;
  }
  let total = 0;
  const lines = cart.map((c, idx) => {
    const sum = c.product.salePrice * c.qty;
    total += sum;
    return \`\${idx + 1}. *\${c.product.name}* (\${c.product.size})\\n   \${c.qty} dona x \${c.product.salePrice.toLocaleString('ru-RU')} = *\${sum.toLocaleString('ru-RU')} so'm*\`;
  });
  bot.sendMessage(
    chatId,
    \`🛒 *SIZNING KORZINKANGIZ:*\\n\\n\` + lines.join('\\n\\n') + \`\\n\\n💳 *Jami summa: \${total.toLocaleString('ru-RU')} so'm*\`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Buyurtmani tasdiqlash', callback_data: 'checkout_confirm' }],
          [{ text: '🗑 Korzinkani tozalash', callback_data: 'checkout_clear' }]
        ]
      }
    }
  );
}

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const data = query.data || '';

  if (data.startsWith('filter_')) {
    const rad = data.replace('filter_', '');
    const list = rad === 'ALL'
      ? products
      : products.filter((p) => p.radius === rad || (rad === 'R18' && (p.radius === 'R17' || p.radius === 'R18')));
    list.forEach((p) => sendProductCard(chatId, p));
  } else if (data.startsWith('add_')) {
    const [, pid, qtyStr] = data.split('_');
    const qty = parseInt(qtyStr, 10);
    const product = products.find((p) => p.id === pid);
    if (!product || product.stock < qty) {
      bot.answerCallbackQuery(query.id, { text: 'Omborda yetarli qoldiq yo\\'q!', show_alert: true });
      return;
    }
    if (!userCarts[chatId]) userCarts[chatId] = [];
    const existing = userCarts[chatId].find((i) => i.product.id === pid);
    if (existing) existing.qty += qty;
    else userCarts[chatId].push({ product, qty });

    bot.answerCallbackQuery(query.id, { text: \`\${product.name} (\${qty} dona) korzinkaga qo'shildi!\` });
  } else if (data === 'checkout_clear') {
    userCarts[chatId] = [];
    bot.sendMessage(chatId, '🗑 Korzinka tozalandi.');
  } else if (data === 'checkout_confirm') {
    const cart = userCarts[chatId] || [];
    if (cart.length === 0) return;

    let total = 0;
    cart.forEach((item) => {
      const p = products.find((x) => x.id === item.product.id);
      if (p && p.stock >= item.qty) {
        p.stock -= item.qty;
        p.totalSold += item.qty;
        total += p.salePrice * item.qty;
      }
    });
    saveProducts();
    userCarts[chatId] = [];

    bot.sendMessage(
      chatId,
      \`🎉 *Buyurtmangiz qabul qilindi!*\\nJami: *\${total.toLocaleString('ru-RU')} so'm*\\nOperatorimiz tez orada siz bilan bog'lanadi. Ombordan avtomatik chegirildi.\`,
      { parse_mode: 'Markdown' }
    );
  }
});

console.log('✅ Nam Avtoshina Telegram Boti 100% ishga tushdi!');
`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  let db = loadDb();

  if (activeBotToken) {
    startTelegramPolling(activeBotToken, () => db);
  }

  // GET /api/state
  app.get('/api/state', (_req, res) => {
    const summary = computeSummary(db);
    res.json({
      products: db.products,
      locations: db.locations,
      orders: db.orders,
      ledger: db.ledger,
      summary,
      botStatus: {
        hasEnvToken: Boolean(activeBotToken),
        pollingActive,
        botUsername,
        processedMessages,
      },
    });
  });

  // POST /api/orders (New order from Storefront Cart or Telegram Simulator)
  app.post('/api/orders', async (req, res) => {
    const {
      customerName,
      customerPhone,
      deliveryType,
      branchId,
      deliveryAddress,
      paymentMethod,
      items,
      source = 'Web Katalog',
    } = req.body as {
      customerName: string;
      customerPhone: string;
      deliveryType: 'Filialdan olib ketish' | 'Manzilga yetkazib berish';
      branchId: string;
      deliveryAddress: string;
      paymentMethod: 'Naqd' | 'Click' | 'Payme' | 'Uzcard / Humo';
      items: Array<{ productId: string; quantity: number }>;
      source?: 'Web Katalog' | 'Telegram Bot';
    };

    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Ism, telefon raqam va savatcha mahsulotlari kiritilishi shart.' });
      return;
    }

    // Validate stock availability first
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        res.status(404).json({ error: 'Mahsulot topilmadi.' });
        return;
      }
      if (product.stock < item.quantity) {
        res.status(400).json({
          error: `${product.name} (${product.size}) omborda faqat ${product.stock} dona qolgan.`,
        });
        return;
      }
    }

    const branch = db.locations.find((l) => l.id === branchId) || db.locations[0];
    const nowStr = formatNow();
    const orderNumber = `NAM-${4080 + db.orders.length + 1}`;
    let totalAmount = 0;
    let totalProfit = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId)!;
      product.stock -= item.quantity;
      product.totalSold += item.quantity;

      const lineTotal = product.salePrice * item.quantity;
      const lineProfit = (product.salePrice - product.costPrice) * item.quantity;
      totalAmount += lineTotal;
      totalProfit += lineProfit;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        size: product.size,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        unitCost: product.costPrice,
      });

      const ledgerEntry: LedgerTransaction = {
        id: `ldg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowStr,
        type: 'SOTUV',
        productId: product.id,
        productName: product.name,
        productSize: product.size,
        quantity: item.quantity,
        unitCostPrice: product.costPrice,
        unitSalePrice: product.salePrice,
        totalAmount: lineTotal,
        profitAmount: lineProfit,
        branchName: branch.name,
        customerOrSupplier: `${customerName} (${customerPhone})`,
        note: `Buyurtma #${orderNumber} (${paymentMethod})`,
        source,
      };
      db.ledger.unshift(ledgerEntry);
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: nowStr,
      customerName,
      customerPhone,
      deliveryType,
      branchId: branch.id,
      branchName: branch.name,
      deliveryAddress:
        deliveryType === 'Filialdan olib ketish' ? `${branch.name} (${branch.address})` : deliveryAddress,
      paymentMethod,
      items: orderItems,
      totalAmount,
      totalProfit,
      status: 'Yangi',
      source,
    };

    db.orders.unshift(newOrder);
    saveDb(db);

    const telegramMessage =
      `🔔 *YANGI BUYURTMA #${orderNumber}!*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Mijoz:* ${customerName}\n` +
      `📞 *Telefon:* \`${customerPhone}\`\n` +
      `🚚 *Yetkazish:* ${deliveryType}\n` +
      `📍 *Manzil:* ${newOrder.deliveryAddress}\n` +
      `💳 *To‘lov turi:* ${paymentMethod}\n\n` +
      `🛒 *Xarid qilingan mahsulotlar:*\n` +
      orderItems
        .map(
          (it, idx) =>
            `${idx + 1}. *${it.productName}* (${it.size})\n   ↳ ${it.quantity} dona × ${it.unitPrice.toLocaleString('ru-RU')} = *${(it.unitPrice * it.quantity).toLocaleString('ru-RU')} so‘m*`
        )
        .join('\n') +
      `\n\n💰 *JAMI SUMMA:* *${totalAmount.toLocaleString('ru-RU')} so‘m*\n` +
      `🕒 *Vaqt:* ${nowStr}\n` +
      `🏢 *Do‘kon:* Nam Avtoshina`;

    let telegramSent = false;
    if (activeBotToken && adminChatId) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: telegramMessage,
            parse_mode: 'Markdown',
          }),
        });
        const tgJson = (await tgRes.json()) as { ok: boolean };
        telegramSent = Boolean(tgJson.ok);
      } catch (err) {
        console.error('Telegram notification send error:', err);
      }
    }

    res.json({
      order: newOrder,
      telegramMessage,
      telegramSent,
      botUsername,
      products: db.products,
      orders: db.orders,
      ledger: db.ledger,
      summary: computeSummary(db),
    });
  });

  // POST /api/bot/configure
  app.post('/api/bot/configure', async (req, res) => {
    const { token, chatId } = req.body as { token?: string; chatId?: string | number };
    if (token !== undefined) {
      activeBotToken = token.trim();
      if (activeBotToken) {
        startTelegramPolling(activeBotToken, () => db);
      } else {
        pollingActive = false;
        botUsername = null;
      }
    }
    if (chatId !== undefined) {
      adminChatId = String(chatId).trim();
    }
    saveBotConfig({ token: activeBotToken, adminChatId: String(adminChatId) });

    res.json({
      ok: true,
      hasToken: Boolean(activeBotToken),
      adminChatId,
      botUsername,
      pollingActive,
    });
  });

  // POST /api/bot/test (Sinov xabari yuborish)
  app.post('/api/bot/test', async (req, res) => {
    const { token, chatId } = req.body as { token?: string; chatId?: string | number };
    const useToken = (token && token.trim()) || activeBotToken;
    const useChatId = (chatId && String(chatId).trim()) || adminChatId;

    if (!useToken || !useChatId) {
      res.status(400).json({
        ok: false,
        error: 'Telegram Bot Token yoki Admin Chat ID kiritilmagan!',
      });
      return;
    }

    try {
      const testMsg =
        `✅ *NAM AVTOSHINA TELEGRAM BOTI MUVAFFAQIYATLI ULANGAN!*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎉 Tabriklaymiz! Sizning Telegram botingiz Nam Avtoshina internet-do‘koni bilan to‘liq bog‘landi.\n\n` +
        `Endi xaridor saytdan harid qilishi bilan uning:\n` +
        `📱 Telefon raqami\n` +
        `👤 Ismi\n` +
        `🛞 Harid qilayotgan shina yoki akkumulyatorlari\n` +
        `💰 Jami to‘lov summasi\n` +
        `ushbu chatga bir soniyada yetib keladi!\n\n` +
        `⏰ *Sinov vaqti:* ${formatNow()}`;

      const tgRes = await fetch(`https://api.telegram.org/bot${useToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: useChatId,
          text: testMsg,
          parse_mode: 'Markdown',
        }),
      });

      const tgData = (await tgRes.json()) as { ok: boolean; description?: string };
      if (!tgData.ok) {
        res.status(400).json({
          ok: false,
          error: `Telegram xatosi: ${tgData.description || 'Xabar yuborilmadi'}`,
        });
        return;
      }

      res.json({
        ok: true,
        message: 'Sinov xabari muvaffaqiyatli yuborildi! Telegramingizni tekshiring.',
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Tarmoq xatosi',
      });
    }
  });

  // POST /api/inventory/adjust (Admin Kirim / Chiqim hisob-kitob amali)
  app.post('/api/inventory/adjust', (req, res) => {
    const {
      productId,
      type,
      quantity,
      unitCostPrice,
      unitSalePrice,
      customerOrSupplier,
      note,
      branchId,
    } = req.body as {
      productId: string;
      type: 'KIRIM' | 'SOTUV';
      quantity: number;
      unitCostPrice?: number;
      unitSalePrice?: number;
      customerOrSupplier?: string;
      note?: string;
      branchId?: string;
    };

    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      res.status(404).json({ error: 'Mahsulot topilmadi.' });
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      res.status(400).json({ error: 'Miqdor 0 dan katta bo‘lishi kerak.' });
      return;
    }

    if (type === 'SOTUV' && product.stock < qty) {
      res.status(400).json({
        error: `Omborda yetarli qoldiq yo‘q! Hozirgi qoldiq: ${product.stock} dona.`,
      });
      return;
    }

    if (unitCostPrice && unitCostPrice > 0) {
      product.costPrice = Number(unitCostPrice);
    }
    if (unitSalePrice && unitSalePrice > 0) {
      product.salePrice = Number(unitSalePrice);
    }

    if (type === 'KIRIM') {
      product.stock += qty;
      product.totalAdded += qty;
    } else {
      product.stock -= qty;
      product.totalSold += qty;
    }

    const branch =
      db.locations.find((l) => l.id === (branchId || product.branchId)) || db.locations[0];
    const nowStr = formatNow();
    const totalAmount =
      type === 'KIRIM' ? product.costPrice * qty : product.salePrice * qty;
    const profitAmount =
      type === 'SOTUV' ? (product.salePrice - product.costPrice) * qty : 0;

    const ledgerEntry: LedgerTransaction = {
      id: `ldg-${Date.now()}`,
      timestamp: nowStr,
      type,
      productId: product.id,
      productName: product.name,
      productSize: product.size,
      quantity: qty,
      unitCostPrice: product.costPrice,
      unitSalePrice: product.salePrice,
      totalAmount,
      profitAmount,
      branchName: branch.name,
      customerOrSupplier:
        customerOrSupplier ||
        (type === 'KIRIM' ? 'Asosiy Ta’minotchi Ombori' : 'Do‘kondan naqd xarid'),
      note:
        note ||
        (type === 'KIRIM'
          ? `Admin tomonidan +${qty} dona yangi partiya qo‘shildi`
          : `Admin tomonidan ${qty} dona to‘g‘ridan-to‘g‘ri sotuv kiritildi`),
      source: 'Admin Ombor',
    };

    db.ledger.unshift(ledgerEntry);
    saveDb(db);

    res.json({
      product,
      products: db.products,
      ledger: db.ledger,
      summary: computeSummary(db),
    });
  });

  // POST /api/products (Admin yangi shina/diska qo'shish)
  app.post('/api/products', (req, res) => {
    const {
      name,
      brand,
      category,
      size,
      radius,
      compatibleCars,
      costPrice,
      salePrice,
      initialStock,
      minStockAlert,
      branchId,
      imageType,
      imageUrl,
      speedIndex,
      warrantyMonths,
      tradeInDiscount,
    } = req.body as {
      name: string;
      brand: string;
      category: ProductCategory;
      size: string;
      radius: string;
      compatibleCars: string[];
      costPrice: number;
      salePrice: number;
      initialStock: number;
      minStockAlert?: number;
      branchId: string;
      imageType?: 'summer' | 'winter' | 'wheel' | 'hero' | 'battery' | 'accessory';
      imageUrl?: string;
      speedIndex?: string;
      warrantyMonths?: number;
      tradeInDiscount?: number;
    };

    if (!name || !brand || !size || !salePrice) {
      res.status(400).json({ error: 'Barcha majburiy maydonlarni to‘ldiring (Nomi, Brendi, O‘lchami, Sotuv narxi).' });
      return;
    }

    const cleanStock = Number(initialStock) || 0;
    const cleanCost = Number(costPrice) || Math.round(Number(salePrice) * 0.82);
    const cleanSale = Number(salePrice);

    const defaultImageType =
      imageType ||
      (category === 'Akkumulyator'
        ? 'battery'
        : category === 'Aksessuarlar'
        ? 'accessory'
        : category === 'Litye Diska'
        ? 'wheel'
        : category === 'Qishki shina'
        ? 'winter'
        : 'summer');

    const newProduct: Product = {
      id: `prd-${Date.now()}`,
      sku: `NAM-${brand.slice(0, 3).toUpperCase()}-${size.replace(/[^0-9A-Z]/gi, '')}`,
      name: name.trim(),
      brand: brand.trim(),
      category: category || '4 Fasl (All-Season)',
      size: size.trim(),
      radius: radius || (category === 'Akkumulyator' || category === 'Aksessuarlar' ? 'Universal' : 'R15'),
      compatibleCars:
        Array.isArray(compatibleCars) && compatibleCars.length > 0
          ? compatibleCars
          : ['Cobalt', 'Gentra'],
      costPrice: cleanCost,
      salePrice: cleanSale,
      stock: cleanStock,
      totalAdded: cleanStock,
      totalSold: 0,
      minStockAlert: Number(minStockAlert) || 10,
      branchId: branchId || 'loc-lola',
      imageType: defaultImageType,
      imageUrl: imageUrl && String(imageUrl).trim() ? String(imageUrl).trim() : undefined,
      speedIndex: speedIndex || (category === 'Akkumulyator' ? '540A (EN)' : '91H (210 km/s)'),
      warrantyMonths: Number(warrantyMonths) || 24,
      tradeInDiscount: tradeInDiscount !== undefined ? Number(tradeInDiscount) : undefined,
    };

    db.products.unshift(newProduct);

    if (cleanStock > 0) {
      const branch = db.locations.find((l) => l.id === newProduct.branchId) || db.locations[0];
      db.ledger.unshift({
        id: `ldg-${Date.now()}`,
        timestamp: formatNow(),
        type: 'KIRIM',
        productId: newProduct.id,
        productName: newProduct.name,
        productSize: newProduct.size,
        quantity: cleanStock,
        unitCostPrice: cleanCost,
        unitSalePrice: cleanSale,
        totalAmount: cleanCost * cleanStock,
        profitAmount: 0,
        branchName: branch.name,
        customerOrSupplier: 'Boshlang‘ich ombor kirimi',
        note: `Yangi mahsulot ochildi (+${cleanStock} dona kirim)`,
        source: 'Admin Ombor',
      });
    }

    saveDb(db);
    res.json({
      product: newProduct,
      products: db.products,
      ledger: db.ledger,
      summary: computeSummary(db),
    });
  });

  // PUT /api/products/:id (Admin mahsulotni to'liq tahrirlash - narxini va boshqa barcha parametrlarini)
  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const existingIndex = db.products.findIndex((p) => p.id === id);
    if (existingIndex === -1) {
      res.status(404).json({ error: 'Mahsulot topilmadi.' });
      return;
    }

    const prev = db.products[existingIndex];
    const updates = req.body as Partial<Product> & { initialStock?: number };

    // Update fields if provided
    if (updates.name !== undefined) prev.name = String(updates.name).trim();
    if (updates.brand !== undefined) prev.brand = String(updates.brand).trim();
    if (updates.category !== undefined) prev.category = updates.category;
    if (updates.size !== undefined) prev.size = String(updates.size).trim();
    if (updates.radius !== undefined) prev.radius = String(updates.radius).trim();
    if (updates.compatibleCars !== undefined && Array.isArray(updates.compatibleCars)) {
      prev.compatibleCars = updates.compatibleCars;
    }
    if (updates.costPrice !== undefined) prev.costPrice = Number(updates.costPrice);
    if (updates.salePrice !== undefined) prev.salePrice = Number(updates.salePrice);
    if (updates.stock !== undefined) {
      const newStock = Number(updates.stock);
      const diff = newStock - prev.stock;
      if (diff > 0) {
        prev.totalAdded += diff;
      }
      prev.stock = newStock;
    }
    if (updates.minStockAlert !== undefined) prev.minStockAlert = Number(updates.minStockAlert);
    if (updates.branchId !== undefined) prev.branchId = updates.branchId;
    if (updates.imageType !== undefined) prev.imageType = updates.imageType;
    if (updates.imageUrl !== undefined) {
      prev.imageUrl = updates.imageUrl && String(updates.imageUrl).trim() ? String(updates.imageUrl).trim() : undefined;
    }
    if (updates.speedIndex !== undefined) prev.speedIndex = String(updates.speedIndex);
    if (updates.warrantyMonths !== undefined) prev.warrantyMonths = Number(updates.warrantyMonths);
    if (updates.tradeInDiscount !== undefined) {
      prev.tradeInDiscount = updates.tradeInDiscount ? Number(updates.tradeInDiscount) : undefined;
    }

    db.products[existingIndex] = prev;
    saveDb(db);

    res.json({
      product: prev,
      products: db.products,
      summary: computeSummary(db),
    });
  });

  // DELETE /api/products/:id (Admin mahsulotni bazadan butunlay olib tashlash)
  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const existingIndex = db.products.findIndex((p) => p.id === id);
    if (existingIndex === -1) {
      res.status(404).json({ error: 'Mahsulot topilmadi.' });
      return;
    }

    const removedProduct = db.products[existingIndex];
    db.products.splice(existingIndex, 1);
    saveDb(db);

    res.json({
      ok: true,
      removedId: id,
      removedName: removedProduct.name,
      products: db.products,
      summary: computeSummary(db),
    });
  });

  // PATCH /api/orders/:id/status (Admin buyurtma holatini o'zgartirish)
  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body as { status: OrderStatus };
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Buyurtma topilmadi.' });
      return;
    }

    const prevStatus = order.status;
    if (prevStatus !== 'Bekor qilindi' && status === 'Bekor qilindi') {
      // Restore stock if cancelled
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stock += item.quantity;
          prod.totalSold = Math.max(0, prod.totalSold - item.quantity);
        }
      }
    } else if (prevStatus === 'Bekor qilindi' && status !== 'Bekor qilindi') {
      for (const item of order.items) {
        const prod = db.products.find((p) => p.id === item.productId);
        if (prod && prod.stock >= item.quantity) {
          prod.stock -= item.quantity;
          prod.totalSold += item.quantity;
        }
      }
    }

    order.status = status;
    saveDb(db);

    res.json({
      orders: db.orders,
      products: db.products,
      summary: computeSummary(db),
    });
  });

  // GET /api/export/bot-code (Returns ready-to-use VS Code bot.js with live products)
  app.get('/api/export/bot-code', (_req, res) => {
    res.json({
      botJs: generateStandaloneBotCode(db),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nam Avtoshina server running on http://localhost:${PORT}`);
  });
}

startServer();
