/**
 * ============================================================================
 * NAM AVTOSHINA — 100% ISHLAYDIGAN TELEGRAM SAVDO VA OMBOR HISOB-KITOB BOTI
 * ============================================================================
 * Terminalda ishga tushirish:
 *    node bot.mjs
 * 
 * Hech qanday qo'shimcha kutubxona o'rnatish SHART EMAS (Node 18+ ichidagi fetch ishlatiladi)!
 */

import fs from 'fs';
import path from 'path';

// 1. .env faylini o'qish (agar mavjud bo'lsa)
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

// Bot Token va Admin ID
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.VITE_TELEGRAM_BOT_TOKEN ||
  '';

const ADMIN_ID =
  process.env.ADMIN_TELEGRAM_ID ||
  process.env.VITE_ADMIN_TELEGRAM_ID ||
  '';

console.log('\n======================================================');
console.log('🛞  NAM AVTOSHINA — TELEGRAM BOT BOSHQARUV PANELI');
console.log('======================================================\n');

if (!BOT_TOKEN) {
  console.error('❌ XATOLIK: TELEGRAM_BOT_TOKEN topilmadi!');
  console.log('\nQanday sozlash kerak:');
  console.log('1. Telegramda @BotFather ga kiring va /newbot orqali bot yarating');
  console.log('2. Olingan tokenni .env fayliga yozing:');
  console.log('   TELEGRAM_BOT_TOKEN="BU_YERGA_TOKEN"');
  console.log('   ADMIN_TELEGRAM_ID="BU_YERGA_TELEGRAM_ID"');
  console.log('\nYoki buyruq bilan ishga tushiring:');
  console.log('   TELEGRAM_BOT_TOKEN="token" ADMIN_TELEGRAM_ID="chat_id" node bot.mjs\n');
  process.exit(1);
}

// Bazani yuklash (nam_avtoshina_db.json yoki data/...)
function getDb() {
  const paths = [
    path.resolve(process.cwd(), 'data', 'nam_avtoshina_db.json'),
    path.resolve(process.cwd(), 'nam_avtoshina_bot_db.json'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      } catch {}
    }
  }
  return { products: [], locations: [], orders: [], ledger: [] };
}

let db = getDb();

async function sendTelegram(chatId, text, replyMarkup) {
  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    console.error('Xabar yuborishda xatolik:', e.message);
  }
}

// Bot haqida ma'lumot olish
async function initBot() {
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const me = await meRes.json();
    if (!me.ok) {
      console.error('❌ Token yaroqsiz! Telegram javobi:', me.description);
      process.exit(1);
    }
    console.log(`✅ Telegram bot muvaffaqiyatli ulandi: @${me.result.username}`);
    console.log(`📦 Baza: ${db.products?.length || 0} ta mahsulot, ${db.locations?.length || 0} ta filial`);
    if (ADMIN_ID) {
      console.log(`👤 Admin ID: ${ADMIN_ID} (Xabarnomalar qabul qilinadi)`);
      sendTelegram(
        ADMIN_ID,
        `🤖 *NAM AVTOSHINA TELEGRAM BOTI ISHGA TUSHDI!*\n\n` +
          `• Bot: @${me.result.username}\n` +
          `• Mahsulotlar: ${db.products?.length || 0} ta\n` +
          `• Holat: Buyurtmalarni qabul qilishga tayyor! ✅`
      );
    }
    console.log('\n🚀 Bot xabarlarni kutmoqda... (To‘xtatish uchun Ctrl+C bosing)\n');
    startPolling();
  } catch (e) {
    console.error('Tarmoqqa ulanishda xatolik:', e.message);
  }
}

let lastOffset = 0;

async function startPolling() {
  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastOffset + 1}&timeout=20`
      );
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastOffset = update.update_id;
          if (update.message) {
            handleMessage(update.message);
          }
        }
      }
    } catch {
      // pause briefly on network glitch
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '🛞 Katalog' }, { text: '🔍 Qidiruv' }],
    [{ text: '📍 Filiallarimiz' }, { text: '📞 Bog‘lanish' }],
    [{ text: '📊 Admin Hisobot' }],
  ],
  resize_keyboard: true,
};

function formatUzs(num) {
  return Number(num || 0).toLocaleString('ru-RU') + " so'm";
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const userName = msg.from?.first_name || 'Xaridor';

  // Yangilangan bazani tekshirish
  db = getDb();

  console.log(`[MSG] ${userName} (${chatId}): "${text}"`);

  if (text.startsWith('/start')) {
    const welcome =
      `Assalomu alaykum, *${userName}*!\n\n` +
      `🛞 *NAM AVTOSHINA* rasmiy savdo-sotiq botiga xush kelibsiz!\n\n` +
      `Bizda barcha turdagi avtomobillar uchun yuqori sifatli shinalar, diska va akkumulyatorlar mavjud.\n\n` +
      `Quyidagi tugmalardan birini bosing yoki kerakli razmerni yozing (masalan: *195/65 R15*, *Cobalt*, *Michelin*):`;

    await sendTelegram(chatId, welcome, MAIN_KEYBOARD);
    return;
  }

  if (text === '🛞 Katalog' || text.startsWith('/katalog')) {
    const prods = (db.products || []).slice(0, 10);
    const list = prods
      .map(
        (p, idx) =>
          `${idx + 1}. *${p.name}* (${p.size})\n   💰 Narxi: *${formatUzs(p.salePrice)}* | Ombor: ${p.stock} dona\n   🚘 Mos: ${p.compatibleCars?.join(', ') || 'Barcha avto'}`
      )
      .join('\n\n');

    const msgText =
      `🛞 *NAM AVTOSHINA — KATALOG (Top mahsulotlar):*\n\n` +
      list +
      `\n\n🌐 *Barcha 37+ mahsulotlarni rasmlari bilan ko‘rish va onlayn buyurtma berish uchun saytimizga kiring:*` +
      `\n👉 https://nam-aftoshina-store.vercel.app`;

    await sendTelegram(chatId, msgText, MAIN_KEYBOARD);
    return;
  }

  if (text === '📍 Filiallarimiz' || text.startsWith('/lokatsiya') || text.startsWith('/filiallar')) {
    const locs = db.locations || [
      { name: 'Lola Bosh Markazi', address: 'Islom Karimov ko‘chasi, 44-uy', phone: '+998 69 227 45 00' },
      { name: 'Kosonsoy Filiali', address: 'Kosonsoy shoh ko‘chasi, 12-uy', phone: '+998 90 214 55 77' },
      { name: 'Chortoq Filiali', address: 'Chortoq yo‘li, 5-uy', phone: '+998 91 360 88 44' },
      { name: 'Yangiqo‘rg‘on Filiali', address: 'Yangiqo‘rg‘on markazi, 18-uy', phone: '+998 93 490 11 22' },
    ];

    const lines = locs
      .map((l, i) => `${i + 1}. 📍 *${l.name}*\n   Manzil: ${l.address}\n   📞 Tel: ${l.phone}`)
      .join('\n\n');

    await sendTelegram(chatId, `📍 *NAM AVTOSHINA FILIALLARI:*\n\n` + lines, MAIN_KEYBOARD);
    return;
  }

  if (text === '📞 Bog‘lanish') {
    await sendTelegram(
      chatId,
      `📞 *NAM AVTOSHINA BILAN ALOQA:*\n\n` +
        `📱 Tel: +998 69 227 45 00\n` +
        `📱 Tel: +998 90 214 55 77\n` +
        `🕒 Ish vaqti: 08:00 – 20:00 (Har kuni)\n` +
        `🌐 Rasmiy sayt: https://nam-aftoshina-store.vercel.app`,
      MAIN_KEYBOARD
    );
    return;
  }

  if (text === '📊 Admin Hisobot' || text.startsWith('/hisobot') || text.startsWith('/admin')) {
    const prods = db.products || [];
    const totalStock = prods.reduce((a, b) => a + (b.stock || 0), 0);
    const totalSold = prods.reduce((a, b) => a + (b.totalSold || 0), 0);
    const totalRev = (db.orders || []).reduce((a, b) => a + (b.totalAmount || 0), 0);

    const report =
      `📊 *NAM AVTOSHINA — OMBOR VA SAVDO HISOBOTI:*\n\n` +
      `📦 Ombordagi jami mahsulot: *${totalStock} dona*\n` +
      `🛒 Jami buyurtmalar: *${(db.orders || []).length} ta*\n` +
      `📈 Jami sotilgan shinalar: *${totalSold} dona*\n` +
      `💰 Umumiy tushum: *${formatUzs(totalRev)}*\n\n` +
      `🌐 Boshqaruv: https://nam-aftoshina-store.vercel.app`;

    await sendTelegram(chatId, report, MAIN_KEYBOARD);
    return;
  }

  // Qidiruv
  const q = text.toLowerCase();
  const matched = (db.products || []).filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.size?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.radius?.toLowerCase().includes(q) ||
      (p.compatibleCars && p.compatibleCars.some((c) => c.toLowerCase().includes(q)))
  );

  if (matched.length > 0) {
    const results = matched
      .slice(0, 5)
      .map(
        (p) =>
          `🛞 *${p.name}* (${p.size})\n` +
          `💰 Narxi: *${formatUzs(p.salePrice)}* (Omborda: ${p.stock} dona)\n` +
          `🚘 Mos: ${p.compatibleCars?.join(', ')}`
      )
      .join('\n\n');

    await sendTelegram(
      chatId,
      `🔎 *"${text}" bo‘yicha topilgan mahsulotlar (${matched.length} ta):*\n\n` +
        results +
        `\n\n🛒 *Buyurtma berish uchun saytga kiring:*\nhttps://nam-aftoshina-store.vercel.app`,
      MAIN_KEYBOARD
    );
  } else {
    await sendTelegram(
      chatId,
      `❌ "${text}" bo‘yicha mahsulot topilmadi.\n\nMasalan shunday yozing: *195/65 R15*, *Cobalt*, *Gentra*, *Michelin* yoki /katalog tugmasini bosing.`,
      MAIN_KEYBOARD
    );
  }
}

initBot();
