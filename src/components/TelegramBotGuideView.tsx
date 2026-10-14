import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Copy,
  Check,
  Download,
  Terminal,
  Bot,
  ShoppingBag,
  MapPin,
  BarChart3,
  Search,
} from 'lucide-react';
import type { Product, BranchLocation, AccountingSummary, CartItem } from '../types';
import { formatUzs } from '../utils/format';

interface TelegramBotGuideViewProps {
  products: Product[];
  locations: BranchLocation[];
  summary: AccountingSummary;
  cart: CartItem[];
  onAddToCart: (productId: string, quantity: number) => void;
  onOpenCartDrawer: () => void;
  onAdjustInventory: (payload: {
    productId: string;
    type: 'KIRIM' | 'SOTUV';
    quantity: number;
    note?: string;
  }) => Promise<void>;
}

interface SimMessage {
  id: string;
  sender: 'bot' | 'user';
  time: string;
  text: string;
  products?: Product[];
  isCartView?: boolean;
}

export const TelegramBotGuideView: React.FC<TelegramBotGuideViewProps> = ({
  products,
  locations,
  summary,
  cart,
  onAddToCart,
  onOpenCartDrawer,
  onAdjustInventory,
}) => {
  const [botCode, setBotCode] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [chatIdInput, setChatIdInput] = useState('');
  const [botConfigStatus, setBotConfigStatus] = useState<{
    hasToken?: boolean;
    adminChatId?: string | number;
    botUsername?: string | null;
  }>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const nowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [messages, setMessages] = useState<SimMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      time: '09:00',
      text:
        'Assalomu alaykum! 🛞 NAM AVTOSHINA rasmiy savdo-sotiq va ombor hisob-kitob botiga xush kelibsiz!\n\n' +
        'Pastdagi tugmalardan birini bosing yoki shina razmeri / mashina nomini yozib qidiring (masalan: 195/65 R15, Cobalt, Gentra, Damas):',
    },
  ]);

  useEffect(() => {
    fetch('/api/export/bot-code')
      .then((r) => r.json())
      .then((data: { botJs?: string }) => {
        if (data.botJs) setBotCode(data.botJs);
      })
      .catch(() => {});

    fetch('/api/state')
      .then((r) => r.json())
      .then((data: { botStatus?: { hasEnvToken: boolean; botUsername: string | null } }) => {
        if (data.botStatus) {
          setBotConfigStatus({
            hasToken: data.botStatus.hasEnvToken,
            botUsername: data.botStatus.botUsername,
          });
        }
      })
      .catch(() => {});
  }, [products]);

  const handleSaveBotConfig = async () => {
    setIsSavingConfig(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/bot/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput, chatId: chatIdInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setBotConfigStatus({
          hasToken: data.hasToken,
          adminChatId: data.adminChatId,
          botUsername: data.botUsername,
        });
        setFeedbackMsg({
          text: data.hasToken
            ? `✅ Sozlamalar saqlandi! Bot @${data.botUsername || 'avtoshina_bot'} ga ulandi.`
            : '✅ Sozlamalar yangilandi!',
        });
      } else {
        setFeedbackMsg({ text: `Xatolik: ${data.error || 'Saqlanmadi'}`, isError: true });
      }
    } catch {
      setFeedbackMsg({ text: 'Tarmoq xatosi yuz berdi.', isError: true });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSendTestMessage = async () => {
    setIsSendingTest(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/bot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput, chatId: chatIdInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ text: '🎉 Ajoyib! Telegramingizga sinov xabari yetib bordi! Tekshirib ko‘ring.' });
      } else {
        setFeedbackMsg({ text: `❌ ${data.error || 'Xabar yuborib bo‘lmadi'}`, isError: true });
      }
    } catch {
      setFeedbackMsg({ text: 'Tarmoq xatosi yuz berdi.', isError: true });
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleBotCommand = async (commandText: string) => {
    const userMsg: SimMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      time: nowTime(),
      text: commandText,
    };

    const trimmed = commandText.trim();
    let botReply: SimMessage;

    if (trimmed === '/start') {
      botReply = {
        id: `b-${Date.now() + 1}`,
        sender: 'bot',
        time: nowTime(),
        text:
          '🛞 NAM AVTOSHINA Bosh menyusi yangilandi!\n' +
          '• Katalog va Filtr orqali razmer tanlang\n' +
          '• Qidiruv uchun razmer yoki avto nomini yozing\n' +
          '• Admin hisob-kitob tugmasi orqali qoldiq va sotuvlarni ko‘ring.',
      };
    } else if (trimmed === '🛞 Katalog va Filtr' || trimmed === '/katalog') {
      botReply = {
        id: `b-${Date.now() + 1}`,
        sender: 'bot',
        time: nowTime(),
        text: `🛞 NAM AVTOSHINA Katalogi (${products.length} xil shina va diska mavjud). Kerakli mahsulotni to‘g‘ridan-to‘g‘ri Korzinkaga qo‘shing:`,
        products: products.slice(0, 4),
      };
    } else if (trimmed.startsWith('Radius:')) {
      const rad = trimmed.replace('Radius:', '').trim();
      const matched = products.filter((p) => p.radius === rad);
      botReply = {
        id: `b-${Date.now() + 1}`,
        sender: 'bot',
        time: nowTime(),
        text: `🔎 ${rad} diametr bo‘yicha topilgan shina va diskalar (${matched.length} ta):`,
        products: matched,
      };
    } else if (trimmed === '📍 Do‘kon manzili' || trimmed === '📍 Filiallar va Lokatsiya' || trimmed === '/lokatsiya') {
      botReply = {
        id: `b-${Date.now() + 1}`,
        sender: 'bot',
        time: nowTime(),
        text:
          '📍 NAM AVTOSHINA DO‘KONI MANZILI:\n\n' +
          '🏛 Manzil: Namangan shahar, Islom Karimov ko‘chasi, 44-uy\n' +
          '🧭 Mo‘ljal: Lola avtobozori kirish darvozasi ro‘parasida\n' +
          '📞 Aloqa: +998 69 227 45 00 / +998 90 214 55 77\n' +
          '🕒 Ish vaqti: 08:00 – 20:00 (Har kuni, dam olish kunlarisiz)\n' +
          '🚚 Yetkazib berish: Namangan shahar bo‘ylab 1 soatda yetkazib o‘rnatib beramiz!',
      };
    } else if (trimmed === '🛒 Korzinka' || trimmed === '/savatcha') {
      const detailed = cart
        .map((c) => {
          const p = products.find((x) => x.id === c.productId);
          return p ? { p, qty: c.quantity } : null;
        })
        .filter((x): x is { p: Product; qty: number } => x !== null);

      if (detailed.length === 0) {
        botReply = {
          id: `b-${Date.now() + 1}`,
          sender: 'bot',
          time: nowTime(),
          text: '🛒 Korzinkangiz hozircha bo‘sh. Katalogdan shina tanlab "+4 komplekt" tugmasini bosing.',
        };
      } else {
        const total = detailed.reduce((acc, i) => acc + i.p.salePrice * i.qty, 0);
        const lines = detailed
          .map(
            (i, idx) =>
              `${idx + 1}. ${i.p.name} (${i.p.size}) × ${i.qty} dona = ${formatUzs(
                i.p.salePrice * i.qty
              )}`
          )
          .join('\n');
        botReply = {
          id: `b-${Date.now() + 1}`,
          sender: 'bot',
          time: nowTime(),
          text: `🛒 SIZNING KORZINKANGIZ:\n\n${lines}\n\n💳 Jami: ${formatUzs(total)}`,
          isCartView: true,
        };
      }
    } else if (trimmed === '📊 Admin: Hisob-kitob' || trimmed === '/hisobot') {
      const lines = products
        .map(
          (p) =>
            `• ${p.name} (${p.size}):\n  Qoldi: ${p.stock} ta | Sotildi: ${p.totalSold} ta | Qo‘shildi: +${p.totalAdded} ta`
        )
        .join('\n\n');

      botReply = {
        id: `b-${Date.now() + 1}`,
        sender: 'bot',
        time: nowTime(),
        text:
          `📊 NAM AVTOSHINA — ADMIN OMBOR HISOB-KITOBI:\n\n` +
          `📦 Hozir omborda qolgani: ${summary.totalStockUnits} dona\n` +
          `➕ Jami qo‘shilgan (Kirim): +${summary.totalAddedUnits} dona\n` +
          `🛒 Jami sotilgan (Chiqim): ${summary.totalSoldUnits} dona\n` +
          `💵 Jami tushum: ${formatUzs(summary.totalSalesRevenue)}\n` +
          `📈 Sof foyda: +${formatUzs(summary.totalNetProfit)}\n\n` +
          `Mahsulotlar kesimida:\n${lines}\n\n` +
          `💡 Bot orqali omborga shina qo‘shish uchun: "/qoshish prd-1 20" deb yozing!`,
      };
    } else if (trimmed.startsWith('/qoshish')) {
      const parts = trimmed.split(/\s+/);
      const pid = parts[1] || 'prd-1';
      const qty = parseInt(parts[2] || '10', 10);
      const target = products.find((p) => p.id === pid || p.sku.toLowerCase() === pid.toLowerCase());
      if (target && qty > 0) {
        await onAdjustInventory({
          productId: target.id,
          type: 'KIRIM',
          quantity: qty,
          note: 'Telegram Bot orqali Admin kirim qildi',
        });
        botReply = {
          id: `b-${Date.now() + 1}`,
          sender: 'bot',
          time: nowTime(),
          text: `✅ OMBORGA KIRIM QILINDI!\n\nMahsulot: ${target.name} (${target.size})\nQo‘shildi: +${qty} dona\nYangi qoldiq: ${target.stock + qty} dona`,
        };
      } else {
        botReply = {
          id: `b-${Date.now() + 1}`,
          sender: 'bot',
          time: nowTime(),
          text: '❌ Format: /qoshish prd-1 20 (Masalan prd-1 id raqamli shinaga 20 dona qo‘shish)',
        };
      }
    } else {
      // Search by size, car, or brand
      const q = trimmed.toLowerCase();
      const matched = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.radius.toLowerCase().includes(q) ||
          p.compatibleCars.some((c) => c.toLowerCase().includes(q))
      );

      if (matched.length > 0) {
        botReply = {
          id: `b-${Date.now() + 1}`,
          sender: 'bot',
          time: nowTime(),
          text: `🔎 "${trimmed}" qidiruvi bo‘yicha ${matched.length} ta mahsulot topildi:`,
          products: matched,
        };
      } else {
        botReply = {
          id: `b-${Date.now() + 1}`,
          sender: 'bot',
          time: nowTime(),
          text: `❌ "${trimmed}" bo‘yicha mahsulot topilmadi. Masalan: "Cobalt", "195/65 R15", "Damas" yoki "Michelin" deb yozib ko‘ring.`,
        };
      }
    }

    setMessages((prev) => [...prev, userMsg, botReply]);
  };

  const handleCopyBotCode = () => {
    if (!botCode) return;
    navigator.clipboard.writeText(botCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadBotJs = () => {
    if (!botCode) return;
    const blob = new Blob([botCode], { type: 'application/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bot.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500">
            Visual Studio Code (VS Code) + @BotFather integratsiyasi
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Nam Avtoshina Telegram Boti va VS Code O‘rnatish Qo‘llanmasi
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Chap tomonda botning barcha funksiyalarini jonli sinab ko‘ring. O‘ng tomonda esa tayyor{' '}
            <span className="font-mono text-slate-900 font-semibold">bot.js</span> kodini yuklab olib,
            3 daqiqada Visual Studio Code va Telegram <span className="font-mono text-slate-900">@BotFather</span> ga ulang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyBotCode}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'bot.js nusxalandi!' : 'bot.js kodini nusxalash'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadBotJs}
            className="px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>bot.js faylini yuklab olish</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left = Live Telegram Bot Simulator | Right = VS Code Step-by-Step Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Interactive Telegram Bot Simulator */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[700px]">
          {/* Telegram Header */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EA580C] flex items-center justify-center font-display font-bold text-sm">
                NA
              </div>
              <div>
                <h2 className="text-sm font-display font-bold leading-tight">
                  Nam Avtoshina Savdo Bot
                </h2>
                <p className="text-xs text-slate-400 font-mono">@NamAvtoshinaBot · Jonli simulyator</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleBotCommand('/start')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-md transition-colors"
            >
              /start
            </button>
          </div>

          {/* Quick Filter Strip inside Bot */}
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs text-slate-500 shrink-0">Filtr:</span>
            {['R12', 'R14', 'R15', 'R16', 'R18'].map((rad) => (
              <button
                key={rad}
                type="button"
                onClick={() => handleBotCommand(`Radius: ${rad}`)}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-mono font-medium text-slate-800 shrink-0 cursor-pointer"
              >
                {rad}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleBotCommand('Cobalt')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-medium text-slate-800 shrink-0 cursor-pointer"
            >
              Cobalt
            </button>
            <button
              type="button"
              onClick={() => handleBotCommand('Damas')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-md text-xs font-medium text-slate-800 shrink-0 cursor-pointer"
            >
              Damas
            </button>
          </div>

          {/* Chat Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F1F5F9]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2.5 ${
                    m.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Inline Product Cards inside Telegram Bot */}
                  {m.products && m.products.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {m.products.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                            <span>{p.size} · {p.category}</span>
                            <span className="text-emerald-700 font-semibold">Qoldi: {p.stock} ta</span>
                          </div>
                          <div className="font-display font-bold text-slate-900 text-xs">
                            {p.name}
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-mono font-bold text-[#EA580C] tabular-nums">
                              {formatUzs(p.salePrice)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onAddToCart(p.id, 4);
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    id: `b-add-${Date.now()}`,
                                    sender: 'bot',
                                    time: nowTime(),
                                    text: `✅ ${p.name} (${p.size}) — 4 dona komplekt Korzinkaga qo‘shildi!`,
                                  },
                                ]);
                              }}
                              className="px-2.5 py-1 bg-[#EA580C] text-white rounded-lg text-[11px] font-semibold hover:bg-[#C2410C] cursor-pointer"
                            >
                              + 4 ta Korzinkaga
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.isCartView && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onOpenCartDrawer}
                        className="w-full py-2 bg-[#EA580C] text-white font-semibold rounded-xl text-xs hover:bg-[#C2410C] cursor-pointer"
                      >
                        ✅ Buyurtmani tasdiqlash oynasini ochish
                      </button>
                    </div>
                  )}

                  <span
                    className={`block text-[10px] font-mono text-right ${
                      m.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Telegram Reply Keyboard Buttons + Input */}
          <div className="bg-white border-t border-slate-200 p-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleBotCommand('🛞 Katalog va Filtr')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-[#EA580C]" />
                🛞 Katalog va Filtr
              </button>
              <button
                type="button"
                onClick={() => handleBotCommand('🛒 Korzinka')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#EA580C]" />
                🛒 Korzinka
              </button>
              <button
                type="button"
                onClick={() => handleBotCommand('📍 Do‘kon manzili')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                📍 Do‘kon manzili
              </button>
              <button
                type="button"
                onClick={() => handleBotCommand('📊 Admin: Hisob-kitob')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#EA580C]" />
                📊 Admin: Hisob-kitob
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                handleBotCommand(chatInput);
                setChatInput('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Razmer yozing (195/65 R15) yoki /qoshish prd-1 20..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#EA580C]"
              />
              <button
                type="submit"
                className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Yuborish"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Step-by-Step Visual Studio Code & @BotFather Setup Guide */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Telegram Bot Connection Box */}
          <div className="bg-white border-2 border-[#EA580C]/30 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-50 text-[#EA580C] rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900">
                    Telegram Botni Saytga Ulash
                  </h2>
                  <p className="text-xs text-slate-500">
                    Xaridor saytdan harid qilishi bilan to‘g‘ridan-to‘g‘ri Telegramingizga xabar keladi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    botConfigStatus.hasToken ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span className="font-semibold text-slate-700">
                  {botConfigStatus.hasToken
                    ? `@${botConfigStatus.botUsername || 'Ulangan'}`
                    : 'Hali ulanmagan'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  1. Bot Token (@BotFather bergan token):
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Masalan: 7458123456:AAHzxy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#EA580C]"
                />
                <span className="block text-[11px] text-slate-400">
                  @BotFather da <code>/newbot</code> ochganda beriladi
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  2. Sizning Telegram Chat ID raqamingiz:
                </label>
                <input
                  type="text"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  placeholder="Masalan: 123456789"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-[#EA580C]"
                />
                <span className="block text-[11px] text-slate-400">
                  Telegramdagi <span className="font-semibold text-slate-600">@userinfobot</span> ga <code>/start</code> bosib o‘z ID raqamingizni bilib olasiz
                </span>
              </div>
            </div>

            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  feedbackMsg.isError
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {feedbackMsg.text}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSaveBotConfig}
                disabled={isSavingConfig}
                className="px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>{isSavingConfig ? 'Saqlanmoqda...' : '💾 Botni Saqlash'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendTestMessage}
                disabled={isSendingTest}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>{isSendingTest ? 'Yuborilmoqda...' : '📲 Sinov xabarini yuborish (Test)'}</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <Bot className="w-5 h-5 text-[#EA580C]" />
              <h2 className="text-lg font-display font-bold text-slate-900">
                Visual Studio Code (VS Code) ga joylash va Telegramga ulash (4 qadam)
              </h2>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <h3 className="font-display font-bold text-slate-900">
                  01. Telegramda @BotFather orqali yangi bot yarating
                </h3>
                <p>
                  1. Telegram qidiruviga <span className="font-mono font-semibold text-slate-900">@BotFather</span> deb yozing va kiring.<br />
                  2. <span className="font-mono font-semibold text-slate-900">/newbot</span> buyrug‘ini bosing.<br />
                  3. Bot nomiga: <span className="font-semibold text-slate-900">Nam Avtoshina Savdo</span> deb yozing.<br />
                  4. Username uchun: <span className="font-mono font-semibold text-slate-900">NamAvtoshinaSavdoBot</span> (oxiri <code>bot</code> bilan tugashi shart).<br />
                  5. @BotFather sizga uzun <span className="font-mono font-semibold text-[#EA580C]">HTTP API Token</span> beradi (masalan: <code>74123456:AAHxyz...</code>). Shu tokenni nusxalab oling.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <h3 className="font-display font-bold text-slate-900">
                  02. Visual Studio Code (VS Code) da loyihani ochish
                </h3>
                <p>
                  Ikki xil usulda ishlatishingiz mumkin:<br />
                  <strong>A-usul (To‘liq Web App + Server + Bot birga):</strong> Ushbu loyihani zip qilib yuklab oling, VS Code da oching va <code>.env</code> fayliga <code>TELEGRAM_BOT_TOKEN=&quot;TOKENINGIZ&quot;</code> deb yozib, terminalda <code>npm install</code> hamda <code>npm run dev</code> bering — sayt ham, bot ham avtomatik birga ishlaydi!<br />
                  <strong>B-usul (Alohida 1 ta faylli <code>bot.js</code>):</strong> Kompyuteringizda yangi <code>nam-avtoshina</code> papka ochib, uni VS Code ga tashlang va pastdagi <code>bot.js</code> faylini saqlang.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-slate-900">
                    03. VS Code Terminalda yoziladigan buyruqlar
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'npm init -y && npm install node-telegram-bot-api dotenv && node bot.js'
                      );
                      setCopiedCmd(true);
                      setTimeout(() => setCopiedCmd(false), 1500);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#EA580C] hover:underline cursor-pointer"
                  >
                    {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? 'Nusxalandi' : 'Buyruqni nusxalash'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
{`# 1. Kutubxonani o'rnatish:
npm init -y
npm install node-telegram-bot-api dotenv

# 2. Botni ishga tushirish:
node bot.js`}
                </pre>
              </div>
            </div>
          </div>

          {/* Complete Ready-to-Use bot.js Code Viewer */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#EA580C]" />
                <span className="text-xs font-mono font-semibold">
                  bot.js — 100% Tayyor VS Code Telegram Bot Kodi (Nam Avtoshina bazasi bilan)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyBotCode}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Nusxalandi!' : 'Kodni nusxalash'}</span>
              </button>
            </div>
            <pre className="p-5 bg-[#0F172A] text-slate-200 font-mono text-xs overflow-x-auto max-h-[340px] leading-relaxed">
              {botCode || '// Yuklanmoqda...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
