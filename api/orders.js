export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', message: 'Nam Avtoshina API' });
  }

  try {
    const payload = req.body || {};
    const token =
      process.env.TELEGRAM_BOT_TOKEN ||
      process.env.VITE_TELEGRAM_BOT_TOKEN ||
      '';
    const chatId =
      process.env.ADMIN_TELEGRAM_ID ||
      process.env.VITE_ADMIN_TELEGRAM_ID ||
      '';

    const items = payload.items || [];
    const orderNumber = payload.orderNumber || `NAM-${String(Date.now()).slice(-4)}`;
    const nowStr = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

    let itemsText = '';
    if (Array.isArray(items) && items.length > 0) {
      itemsText = items
        .map(
          (it, idx) =>
            `${idx + 1}. *${it.productName || it.name || 'Mahsulot'}* (${it.size || ''})\n` +
            `   ↳ ${it.quantity} dona × ${(it.unitPrice || 0).toLocaleString('ru-RU')} = *${((it.unitPrice || 0) * (it.quantity || 1)).toLocaleString('ru-RU')} so‘m*`
        )
        .join('\n');
    } else {
      itemsText = '• 1 dona mahsulot';
    }

    const totalAmount = (payload.totalAmount || 0).toLocaleString('ru-RU');

    const message =
      `📦 *YANGI BUYURTMA QABUL QILINDI!* (#${orderNumber})\n\n` +
      `👤 *Mijoz:* ${payload.customerName || 'Noma‘lum'}\n` +
      `📞 *Telefon:* ${payload.customerPhone || 'Kiritilmagan'}\n` +
      `🚚 *Yetkazib berish:* ${payload.deliveryType || 'Filialdan olib ketish'}\n` +
      `🏢 *Filial:* ${payload.branchName || 'Lola Bosh Markazi'}\n` +
      (payload.deliveryAddress ? `📍 *Manzil:* ${payload.deliveryAddress}\n` : '') +
      `💳 *To‘lov turi:* ${payload.paymentMethod || 'Naqd'}\n\n` +
      `🛒 *Buyurtma qilingan mahsulotlar:*\n` +
      itemsText +
      `\n\n💰 *JAMI SUMMA:* *${totalAmount} so‘m*\n` +
      `🕒 *Vaqt:* ${nowStr}\n` +
      `🏢 *Do‘kon:* Nam Avtoshina`;

    let telegramSent = false;
    let telegramError = null;

    if (token && chatId) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        });
        const tgData = await tgRes.json();
        telegramSent = Boolean(tgData.ok);
        if (!tgData.ok) {
          telegramError = tgData.description;
        }
      } catch (err) {
        telegramError = err.message;
      }
    } else {
      telegramError = 'TELEGRAM_BOT_TOKEN or ADMIN_TELEGRAM_ID missing in environment variables';
    }

    return res.status(200).json({
      success: true,
      telegramSent,
      telegramError,
      orderNumber,
      message: telegramSent ? 'Telegramga yuborildi' : 'Buyurtma qabul qilindi',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
