/*
 * ============================================================================
 *  Сервер: Telegram-бот + статический сайт + REST API
 *  для хостинга на bot-hosting.net (Dvin.bothost.tech)
 * ============================================================================
 *
 *  Переменные окружения (задаются в панели BotHost):
 *    BOT_TOKEN   — токен от @BotFather  (обязательно)
 *    ADMIN_ID    — ваш Telegram ID      (обязательно, защита бота)
 *    ADMIN_PASS  — пароль админ-панели сайта (необязательно, по умолч. "admin")
 *    PORT        — порт HTTP-сервера    (BotHost задаёт автоматически)
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Автоматическая установка модуля, если его нет.
 * BotHost запускает `npm install` в /app/, а наш server.js — в /app/bot/,
 * поэтому ставим модули прямо в эту папку.
 */
function ensureModule(name) {
  try {
    return require(name);
  } catch (_) {
    console.log(`⏳ Модуль '${name}' не найден. Устанавливаю в ${__dirname}...`);
    try {
      execSync(`npm install ${name} --no-audit --no-fund --silent`, {
        cwd: __dirname,
        stdio: "inherit",
      });
      // очищаем кеш и пробуем снова
      Object.keys(require.cache).forEach((k) => delete require.cache[k]);
      return require(name);
    } catch (err) {
      console.error(`❌ Не удалось установить '${name}': ${err.message}`);
      return null;
    }
  }
}

const express = ensureModule("express");
const TelegramBot = ensureModule("node-telegram-bot-api");

if (!express) {
  console.error("❌ Без 'express' сервер не может работать. Завершаю.");
  process.exit(1);
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const ADMIN_PASS = process.env.ADMIN_PASS || "admin";
const PORT = Number(process.env.PORT || 3000);

const DATA_FILE = path.join(__dirname, "data.json");
const PUBLIC_DIR = path.join(__dirname, "public");

/* =========================================================================
 *  1. ДАННЫЕ
 * ========================================================================= */

const DEFAULT_DATA = {
  rooms: [
    {
      id: "r1",
      title: "Двухместный «Стандарт»",
      description: "Уютный номер для двоих с одной двуспальной или двумя односпальными кроватями.",
      price: 2200,
      capacity: 2,
      beds: "1 двуспальная или 2 односпальные",
      area: 16,
      image: "/images/room.jpg",
      amenities: ["Кондиционер", "Телевизор", "Холодильник", "Wi-Fi", "Душ / санузел"],
      status: "free",
    },
    {
      id: "r2",
      title: "Трёхместный «Комфорт»",
      description: "Просторный номер с тремя кроватями и собственной террасой.",
      price: 3200,
      capacity: 3,
      beds: "3 односпальные кровати",
      area: 20,
      image: "/images/guest-house.jpg",
      amenities: ["Кондиционер", "Телевизор", "Холодильник", "Wi-Fi", "Душ / санузел", "Балкон / терраса"],
      status: "free",
    },
    {
      id: "r3",
      title: "Семейный «Люкс»",
      description: "Двухкомнатный номер для семейного отдыха.",
      price: 4900,
      capacity: 4,
      beds: "1 двуспальная + 2 односпальные",
      area: 28,
      image: "/images/pool.jpg",
      amenities: ["Кондиционер", "Телевизор", "Холодильник", "Wi-Fi", "Душ / санузел", "Балкон / терраса", "Фен", "Электрочайник"],
      status: "busy",
    },
    {
      id: "r4",
      title: "Четырёхместный «Семейный»",
      description: "Большой светлый номер с видом на зелёную территорию.",
      price: 4200,
      capacity: 4,
      beds: "2 двуспальные кровати",
      area: 24,
      image: "/images/beach.jpg",
      amenities: ["Кондиционер", "Телевизор", "Холодильник", "Wi-Fi", "Душ / санузел", "Москитная сетка"],
      status: "free",
    },
  ],
  gallery: [
    { id: "g1", src: "/images/guest-house.jpg", alt: "Гостевой дом — фасад и двор" },
    { id: "g2", src: "/images/pool.jpg", alt: "Бассейн и зона отдыха" },
    { id: "g3", src: "/images/room.jpg", alt: "Уютный номер" },
    { id: "g4", src: "/images/beach.jpg", alt: "Пляж Азовского моря" },
  ],
  contacts: {
    phone: "+7 (918) 488-69-68",
    whatsapp: "79184886968",
    telegram: "golubickaya_dom",
    vk: "",
  },
};

function loadData() {
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return { ...DEFAULT_DATA, ...raw };
  } catch {
    saveData(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function patch(section, value) {
  const data = loadData();
  data[section] = value;
  saveData(data);
  return data[section];
}

/* =========================================================================
 *  2. HTTP-СЕРВЕР: сайт + API
 * ========================================================================= */

const app = express();
app.use(express.json({ limit: "20mb" })); // base64-картинки могут быть большими

// API
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/rooms", (_req, res) => res.json(loadData().rooms));
app.put("/api/rooms", (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "expected array" });
  res.json(patch("rooms", req.body));
});

app.get("/api/gallery", (_req, res) => res.json(loadData().gallery));
app.put("/api/gallery", (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "expected array" });
  res.json(patch("gallery", req.body));
});

app.get("/api/contacts", (_req, res) => res.json(loadData().contacts));
app.put("/api/contacts", (req, res) => {
  if (!req.body || typeof req.body !== "object")
    return res.status(400).json({ error: "expected object" });
  res.json(patch("contacts", req.body));
});

// Простая проверка пароля админки сайта (опционально)
app.post("/api/admin/login", (req, res) => {
  if (req.body && req.body.pass === ADMIN_PASS) res.json({ ok: true });
  else res.status(401).json({ ok: false });
});

// Раздача статического сайта
const indexFile = path.join(PUBLIC_DIR, "index.html");
const hasSite = fs.existsSync(indexFile);

if (hasSite) {
  app.use(express.static(PUBLIC_DIR));
  // SPA fallback (для хеш-роутинга не обязательно, но не помешает)
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(indexFile);
  });
} else {
  app.get("/", (_req, res) =>
    res.status(200).send(`
      <html><head><meta charset="utf-8"><title>Сайт не загружен</title></head>
      <body style="font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 20px;line-height:1.6">
        <h2>⚠️ Сайт ещё не загружен</h2>
        <p>Сервер работает, но в папке <code>public/</code> нет файла <code>index.html</code>.</p>
        <p><b>Ожидаемый путь:</b> <code>${indexFile}</code></p>
        <p>Загрузите содержимое локальной папки <code>bot/public/</code> на хост рядом с <code>server.js</code>.</p>
        <hr/>
        <p>API всё равно работает: <a href="/api/health">/api/health</a></p>
      </body></html>
    `),
  );
}

// Слушаем на 0.0.0.0 — иначе хост-домен не сможет до нас достучаться.
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log("");
  console.log("===========================================================");
  console.log(`🌐 HTTP сервер слушает: ${HOST}:${PORT}`);
  console.log(`📁 Папка сайта:        ${PUBLIC_DIR}`);
  console.log(`   index.html ${hasSite ? "найден ✅" : "НЕ НАЙДЕН ❌ — нужно загрузить!"}`);
  console.log(`💾 Файл данных:        ${DATA_FILE}`);
  console.log("===========================================================");
  if (process.env.SITE_URL) {
    console.log(`👉 Ваш сайт должен открываться по адресу: ${process.env.SITE_URL}`);
  }
  // Диагностика: показываем все потенциально нужные переменные окружения хоста
  console.log("");
  console.log("🔍 Диагностика переменных окружения BotHost:");
  const interesting = Object.keys(process.env).filter((k) =>
    /port|host|domain|url|public|web|http|app/i.test(k),
  );
  if (interesting.length === 0) {
    console.log("   (никаких port/host/domain переменных нет)");
  } else {
    interesting.sort().forEach((k) => {
      const v = process.env[k];
      const short = v && v.length > 80 ? v.slice(0, 77) + "..." : v;
      console.log(`   ${k} = ${short}`);
    });
  }
  console.log("");
});

/* =========================================================================
 *  3. TELEGRAM-БОТ
 * ========================================================================= */

if (!BOT_TOKEN) {
  console.warn("⚠️  BOT_TOKEN не задан — Telegram-бот не запущен. Сайт работает.");
} else if (!TelegramBot) {
  console.warn("⚠️  Telegram-бот пропущен (нет node-telegram-bot-api).");
} else {
  startBot();
}

function startBot() {
  if (!ADMIN_ID) {
    console.warn("⚠️  ADMIN_ID не задан — бот доступен всем (НЕБЕЗОПАСНО).");
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  const addState = {};
  const SITE_URL = process.env.SITE_URL || "https://Dvin.bothost.tech";

  function isAdmin(msg) {
    if (!ADMIN_ID) return true;
    const id = msg.from?.id || msg.chat?.id;
    return id === ADMIN_ID;
  }

  /* ---------- helpers для картинок ---------- */
  function resolveImage(src) {
    if (!src) return null;
    // data:image/...;base64,xxx — загруженный через админку файл
    if (src.startsWith("data:")) {
      const m = src.match(/^data:(image\/[\w+]+);base64,(.+)$/);
      if (!m) return null;
      return { type: "buffer", buffer: Buffer.from(m[2], "base64"), mime: m[1] };
    }
    // абсолютный URL — отдаём напрямую
    if (/^https?:\/\//i.test(src)) return { type: "url", url: src };
    // путь вида /images/room.jpg — берём с диска public/
    if (src.startsWith("/")) {
      const full = path.join(PUBLIC_DIR, src);
      if (fs.existsSync(full)) {
        return { type: "stream", stream: fs.createReadStream(full) };
      }
      // fallback — пробуем по SITE_URL
      return { type: "url", url: SITE_URL.replace(/\/$/, "") + src };
    }
    return null;
  }

  async function sendPhotoSafe(chatId, src, opts) {
    const img = resolveImage(src);
    try {
      if (img?.type === "buffer") {
        return await bot.sendPhoto(chatId, img.buffer, opts, { contentType: img.mime, filename: "photo.jpg" });
      }
      if (img?.type === "stream") {
        return await bot.sendPhoto(chatId, img.stream, opts);
      }
      if (img?.type === "url") {
        return await bot.sendPhoto(chatId, img.url, opts);
      }
    } catch (e) {
      console.error("sendPhoto error:", e.message);
    }
    // fallback — текстом
    return bot.sendMessage(chatId, opts.caption || "(нет фото)", {
      parse_mode: opts.parse_mode,
      reply_markup: opts.reply_markup,
    });
  }

  /* ---------- меню ---------- */
  function mainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📋 Список номеров", callback_data: "list" }],
          [
            { text: "➕ Добавить номер", callback_data: "add" },
            { text: "🖼 Галерея", callback_data: "gallery" },
          ],
          [
            { text: "📞 Контакты", callback_data: "contacts" },
            { text: "📊 Статистика", callback_data: "stats" },
          ],
          [{ text: "🌐 Открыть сайт", url: SITE_URL }],
          [{ text: "ℹ️ Помощь", callback_data: "help" }],
        ],
      },
      parse_mode: "Markdown",
    };
  }

  function roomKeyboard(room, idx, total) {
    const navRow = [];
    if (total > 1) {
      navRow.push({ text: "⬅️", callback_data: `view:${prevId(room.id)}` });
      navRow.push({ text: `${idx + 1} / ${total}`, callback_data: "noop" });
      navRow.push({ text: "➡️", callback_data: `view:${nextId(room.id)}` });
    }
    return {
      reply_markup: {
        inline_keyboard: [
          ...(navRow.length ? [navRow] : []),
          [
            {
              text: room.status === "free" ? "🔴 Занять номер" : "🟢 Освободить",
              callback_data: `toggle:${room.id}`,
            },
          ],
          [
            { text: "💰 Цена", callback_data: `price:${room.id}` },
            { text: "✏️ Описание", callback_data: `desc:${room.id}` },
          ],
          [
            { text: "📸 Фото", callback_data: `photo:${room.id}` },
            { text: "🗑 Удалить", callback_data: `del:${room.id}` },
          ],
          [{ text: "« К списку", callback_data: "list" }],
        ],
      },
      parse_mode: "Markdown",
    };
  }

  function prevId(id) {
    const rooms = loadData().rooms;
    const i = rooms.findIndex((r) => r.id === id);
    return rooms[(i - 1 + rooms.length) % rooms.length].id;
  }
  function nextId(id) {
    const rooms = loadData().rooms;
    const i = rooms.findIndex((r) => r.id === id);
    return rooms[(i + 1) % rooms.length].id;
  }

  function md(s) {
    // экранирование для Markdown (легаси)
    return String(s ?? "").replace(/([_*`\[\]])/g, "\\$1");
  }

  function formatRoomCaption(r) {
    const statusBadge = r.status === "free" ? "🟢 *СВОБОДЕН*" : "🔴 *ЗАНЯТ*";
    const amen =
      r.amenities && r.amenities.length
        ? "\n\n✨ " + r.amenities.map((a) => `_${md(a)}_`).join(" · ")
        : "";
    return [
      `🏡 *${md(r.title)}*`,
      statusBadge,
      "",
      r.description ? `${md(r.description)}` : "_без описания_",
      "",
      `💰  *${Number(r.price).toLocaleString("ru-RU")} ₽* / сутки`,
      `👥  До *${r.capacity}* гостей${r.beds ? ` · 🛏 ${md(r.beds)}` : ""}`,
      r.area ? `📐  ${r.area} м²` : "",
      amen,
    ]
      .filter(Boolean)
      .join("\n");
  }

  function helpText() {
    return [
      "🤖 *Команды бота:*",
      "",
      "/start — главное меню",
      "/list — список номеров",
      "/add — добавить новый номер",
      "/gallery — фото галереи",
      "/contacts — контакты для брони",
      "/help — эта подсказка",
      "/cancel — отменить ввод",
      "",
      "💡 _Удобнее всего пользоваться кнопками._",
    ].join("\n");
  }

  /* ---------- ОТПРАВКА СПИСКА ---------- */
  async function sendList(chatId, messageId = null) {
    const rooms = loadData().rooms;
    if (!rooms.length) {
      const opts = mainMenu();
      const t = "📭 Список номеров пуст.\nНажмите *➕ Добавить номер*.";
      return messageId
        ? bot.editMessageText(t, { chat_id: chatId, message_id: messageId, ...opts }).catch(() =>
            bot.sendMessage(chatId, t, opts),
          )
        : bot.sendMessage(chatId, t, opts);
    }
    const keyboard = rooms.map((r) => [
      {
        text: `${r.status === "free" ? "🟢" : "🔴"} ${r.title} · ${Number(r.price).toLocaleString("ru-RU")}₽`,
        callback_data: `view:${r.id}`,
      },
    ]);
    keyboard.push([{ text: "➕ Добавить номер", callback_data: "add" }]);
    keyboard.push([{ text: "« Главное меню", callback_data: "menu" }]);
    const free = rooms.filter((r) => r.status === "free").length;
    const text = [
      `🏡 *Номера гостевого дома*`,
      ``,
      `Всего: *${rooms.length}*  ·  🟢 свободно: *${free}*  ·  🔴 занято: *${rooms.length - free}*`,
      ``,
      `_Нажмите на номер для управления._`,
    ].join("\n");
    const opts = { parse_mode: "Markdown", reply_markup: { inline_keyboard: keyboard } };
    if (messageId) {
      try {
        return await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...opts });
      } catch {
        // если предыдущее сообщение было фото — нельзя editMessageText, удалим и пошлём новое
        try {
          await bot.deleteMessage(chatId, messageId);
        } catch {}
        return bot.sendMessage(chatId, text, opts);
      }
    }
    return bot.sendMessage(chatId, text, opts);
  }

  /* ---------- ПОКАЗАТЬ ОДИН НОМЕР С ФОТО ---------- */
  async function sendRoomCard(chatId, room, deleteMessageId = null) {
    const rooms = loadData().rooms;
    const idx = rooms.findIndex((r) => r.id === room.id);
    const opts = {
      caption: formatRoomCaption(room),
      parse_mode: "Markdown",
      reply_markup: roomKeyboard(room, idx, rooms.length).reply_markup,
    };
    if (deleteMessageId) {
      try {
        await bot.deleteMessage(chatId, deleteMessageId);
      } catch {}
    }
    return sendPhotoSafe(chatId, room.image, opts);
  }

  /* ---------- ГАЛЕРЕЯ ---------- */
  async function sendGallery(chatId, messageId = null) {
    const gallery = loadData().gallery || [];
    if (!gallery.length) {
      const t = "🖼 Галерея пуста.";
      return messageId
        ? bot.editMessageText(t, { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [[{ text: "« Меню", callback_data: "menu" }]] } }).catch(() => bot.sendMessage(chatId, t))
        : bot.sendMessage(chatId, t);
    }
    if (messageId) {
      try {
        await bot.deleteMessage(chatId, messageId);
      } catch {}
    }
    // отправляем медиагруппой (до 10 фото)
    const items = gallery.slice(0, 10);
    try {
      const media = [];
      for (let i = 0; i < items.length; i++) {
        const g = items[i];
        const img = resolveImage(g.src);
        if (!img) continue;
        const item = {
          type: "photo",
          caption: i === 0 ? `🖼 *Галерея гостевого дома* (${gallery.length} фото)` : undefined,
          parse_mode: i === 0 ? "Markdown" : undefined,
        };
        if (img.type === "url") item.media = img.url;
        else if (img.type === "stream" || img.type === "buffer") {
          // mediaGroup поддерживает локальные файлы тоже
          item.media = img.type === "stream" ? img.stream : img.buffer;
        }
        media.push(item);
      }
      if (media.length) await bot.sendMediaGroup(chatId, media);
    } catch (e) {
      console.error("mediaGroup error:", e.message);
      // fallback — по одной картинке
      for (const g of items) {
        await sendPhotoSafe(chatId, g.src, { caption: g.alt, parse_mode: "Markdown" });
      }
    }
    return bot.sendMessage(chatId, `Всего фото: *${gallery.length}*`, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[{ text: "« Главное меню", callback_data: "menu" }]] },
    });
  }

  /* ---------- КОНТАКТЫ ---------- */
  async function sendContacts(chatId, messageId = null) {
    const c = loadData().contacts || {};
    const lines = [
      "📞 *Контакты для брони*",
      "",
      c.phone ? `☎️  ${md(c.phone)}` : null,
      c.whatsapp ? `💬  WhatsApp: \`+${md(c.whatsapp)}\`` : null,
      c.telegram ? `✈️  Telegram: @${md(c.telegram)}` : null,
      c.vk ? `🟦  ВКонтакте: ${md(c.vk)}` : null,
      "",
      "_Эти данные показываются гостям при нажатии «Забронировать» на сайте._",
    ].filter(Boolean);
    const opts = {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[{ text: "« Главное меню", callback_data: "menu" }]] },
    };
    if (messageId) {
      try {
        return await bot.editMessageText(lines.join("\n"), { chat_id: chatId, message_id: messageId, ...opts });
      } catch {
        try { await bot.deleteMessage(chatId, messageId); } catch {}
      }
    }
    return bot.sendMessage(chatId, lines.join("\n"), opts);
  }

  /* ---------- СТАТИСТИКА ---------- */
  async function sendStats(chatId, messageId = null) {
    const data = loadData();
    const rooms = data.rooms || [];
    const free = rooms.filter((r) => r.status === "free").length;
    const busy = rooms.length - free;
    const totalCap = rooms.reduce((s, r) => s + Number(r.capacity || 0), 0);
    const avgPrice = rooms.length
      ? Math.round(rooms.reduce((s, r) => s + Number(r.price || 0), 0) / rooms.length)
      : 0;
    const minPrice = rooms.length ? Math.min(...rooms.map((r) => Number(r.price || 0))) : 0;
    const maxPrice = rooms.length ? Math.max(...rooms.map((r) => Number(r.price || 0))) : 0;

    const text = [
      "📊 *Статистика гостевого дома*",
      "",
      `🏡 Всего номеров: *${rooms.length}*`,
      `🟢 Свободно: *${free}*`,
      `🔴 Занято: *${busy}*`,
      `👥 Общая вместимость: *${totalCap}* гостей`,
      "",
      `💰 Минимальная цена: *${minPrice.toLocaleString("ru-RU")} ₽*`,
      `💰 Максимальная: *${maxPrice.toLocaleString("ru-RU")} ₽*`,
      `💰 Средняя: *${avgPrice.toLocaleString("ru-RU")} ₽*`,
      "",
      `🖼 Фото в галерее: *${(data.gallery || []).length}*`,
    ].join("\n");
    const opts = {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: [[{ text: "« Главное меню", callback_data: "menu" }]] },
    };
    if (messageId) {
      try {
        return await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...opts });
      } catch {
        try { await bot.deleteMessage(chatId, messageId); } catch {}
      }
    }
    return bot.sendMessage(chatId, text, opts);
  }

  /* ---------- КОМАНДЫ ---------- */
  bot.onText(/\/start/, (msg) => {
    if (!isAdmin(msg)) return bot.sendMessage(msg.chat.id, "⛔ Доступ запрещён.");
    bot.sendMessage(
      msg.chat.id,
      "👋 *Добро пожаловать в админ-бот!*\n\n🏡 Здесь вы управляете номерами гостевого дома, видите фото и быстро меняете статусы.\n\nВыберите действие:",
      mainMenu(),
    );
  });
  bot.onText(/\/list/, (msg) => isAdmin(msg) && sendList(msg.chat.id));
  bot.onText(/\/add/, (msg) => isAdmin(msg) && startAddFlow(msg.chat.id));
  bot.onText(/\/gallery/, (msg) => isAdmin(msg) && sendGallery(msg.chat.id));
  bot.onText(/\/contacts/, (msg) => isAdmin(msg) && sendContacts(msg.chat.id));
  bot.onText(/\/help/, (msg) =>
    isAdmin(msg) && bot.sendMessage(msg.chat.id, helpText(), { parse_mode: "Markdown" }),
  );
  bot.onText(/\/cancel/, (msg) => {
    if (addState[msg.chat.id]) {
      delete addState[msg.chat.id];
      bot.sendMessage(msg.chat.id, "❌ Отменено.", mainMenu());
    }
  });

  /* ---------- CALLBACK ---------- */
  bot.on("callback_query", async (q) => {
    if (!isAdmin(q)) return bot.answerCallbackQuery(q.id, { text: "⛔ Доступ запрещён" });
    const chatId = q.message.chat.id;
    const messageId = q.message.message_id;
    const [action, id] = (q.data || "").split(":");
    try {
      await bot.answerCallbackQuery(q.id).catch(() => {});

      if (action === "noop") return;
      if (action === "menu") {
        try { await bot.deleteMessage(chatId, messageId); } catch {}
        return bot.sendMessage(chatId, "🏡 *Главное меню*", mainMenu());
      }
      if (action === "list") return sendList(chatId, messageId);
      if (action === "gallery") return sendGallery(chatId, messageId);
      if (action === "contacts") return sendContacts(chatId, messageId);
      if (action === "stats") return sendStats(chatId, messageId);
      if (action === "help") {
        try {
          return await bot.editMessageText(helpText(), {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: { inline_keyboard: [[{ text: "« Меню", callback_data: "menu" }]] },
          });
        } catch {
          return bot.sendMessage(chatId, helpText(), { parse_mode: "Markdown" });
        }
      }

      if (action === "view") {
        const room = loadData().rooms.find((r) => r.id === id);
        if (!room) return bot.sendMessage(chatId, "Номер не найден.");
        return sendRoomCard(chatId, room, messageId);
      }
      if (action === "toggle") {
        const data = loadData();
        const room = data.rooms.find((r) => r.id === id);
        if (!room) return;
        room.status = room.status === "free" ? "busy" : "free";
        saveData(data);
        await bot.answerCallbackQuery(q.id, { text: room.status === "free" ? "🟢 Свободен" : "🔴 Занят" }).catch(() => {});
        // редактируем caption фото-сообщения
        try {
          const rooms = data.rooms;
          const idx = rooms.findIndex((r) => r.id === room.id);
          await bot.editMessageCaption(formatRoomCaption(room), {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: roomKeyboard(room, idx, rooms.length).reply_markup,
          });
        } catch {
          return sendRoomCard(chatId, room, messageId);
        }
        return;
      }
      if (action === "del") {
        const data = loadData();
        const room = data.rooms.find((r) => r.id === id);
        if (!room) return;
        data.rooms = data.rooms.filter((r) => r.id !== id);
        saveData(data);
        try { await bot.deleteMessage(chatId, messageId); } catch {}
        await bot.sendMessage(chatId, `🗑 Номер *«${md(room.title)}»* удалён.`, { parse_mode: "Markdown" });
        return sendList(chatId);
      }
      if (action === "price") {
        addState[chatId] = { step: "price_new", roomId: id };
        return bot.sendMessage(chatId, "💰 Введите *новую цену* (₽):\n\n/cancel — отмена", { parse_mode: "Markdown" });
      }
      if (action === "desc") {
        addState[chatId] = { step: "desc_new", roomId: id };
        return bot.sendMessage(chatId, "✏️ Введите *новое описание*:\n\n/cancel — отмена", { parse_mode: "Markdown" });
      }
      if (action === "photo") {
        addState[chatId] = { step: "photo_new", roomId: id };
        return bot.sendMessage(
          chatId,
          "📸 *Отправьте фото* (как картинку, не файлом).\n\nИли пришлите URL картинки.\n/cancel — отмена",
          { parse_mode: "Markdown" },
        );
      }
      if (action === "add") return startAddFlow(chatId);
    } catch (e) {
      console.error("callback error:", e.message);
    }
  });

  /* ---------- ДОБАВЛЕНИЕ НОМЕРА ---------- */
  function startAddFlow(chatId) {
    addState[chatId] = { step: "title", draft: { status: "free" } };
    bot.sendMessage(chatId, "📝 *Создание номера*\n\nВведите *название*:\n\n/cancel — отмена", { parse_mode: "Markdown" });
  }

  /* ---------- ОБРАБОТКА ВВОДА ТЕКСТА ---------- */
  bot.on("message", async (msg) => {
    const st = addState[msg.chat.id];
    if (!st) return;

    // фото — для action=photo
    if (st.step === "photo_new" && msg.photo) {
      try {
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileLink = await bot.getFileLink(fileId);
        const data = loadData();
        const room = data.rooms.find((r) => r.id === st.roomId);
        if (room) {
          room.image = fileLink;
          saveData(data);
          await bot.sendMessage(msg.chat.id, `✅ Фото номера *«${md(room.title)}»* обновлено.`, { parse_mode: "Markdown" });
          delete addState[msg.chat.id];
          return sendRoomCard(msg.chat.id, room);
        }
      } catch (e) {
        console.error("photo save:", e.message);
        return bot.sendMessage(msg.chat.id, "Не удалось сохранить фото.");
      }
    }

    if (!msg.text || msg.text.startsWith("/")) return;
    const t = msg.text.trim();

    if (st.step === "price_new") {
      const price = Number(t.replace(/\D/g, ""));
      if (!price) return bot.sendMessage(msg.chat.id, "Введите число.");
      const data = loadData();
      const room = data.rooms.find((r) => r.id === st.roomId);
      if (room) {
        room.price = price;
        saveData(data);
        await bot.sendMessage(msg.chat.id, `✅ Цена *«${md(room.title)}»* теперь *${price.toLocaleString("ru-RU")} ₽*`, { parse_mode: "Markdown" });
        delete addState[msg.chat.id];
        return sendRoomCard(msg.chat.id, room);
      }
      delete addState[msg.chat.id];
      return;
    }

    if (st.step === "desc_new") {
      const data = loadData();
      const room = data.rooms.find((r) => r.id === st.roomId);
      if (room) {
        room.description = t;
        saveData(data);
        await bot.sendMessage(msg.chat.id, `✅ Описание обновлено.`);
        delete addState[msg.chat.id];
        return sendRoomCard(msg.chat.id, room);
      }
      delete addState[msg.chat.id];
      return;
    }

    if (st.step === "photo_new") {
      // прислали URL
      if (/^https?:\/\//i.test(t)) {
        const data = loadData();
        const room = data.rooms.find((r) => r.id === st.roomId);
        if (room) {
          room.image = t;
          saveData(data);
          await bot.sendMessage(msg.chat.id, `✅ Фото обновлено.`);
          delete addState[msg.chat.id];
          return sendRoomCard(msg.chat.id, room);
        }
      } else {
        return bot.sendMessage(msg.chat.id, "Отправьте *картинку* или URL.", { parse_mode: "Markdown" });
      }
    }

    // === пошаговое добавление ===
    if (st.step === "title") {
      st.draft.title = t;
      st.step = "price";
      return bot.sendMessage(msg.chat.id, "💰 Введите *цену* (₽/сутки):", { parse_mode: "Markdown" });
    }
    if (st.step === "price") {
      const price = Number(t.replace(/\D/g, ""));
      if (!price) return bot.sendMessage(msg.chat.id, "Введите число.");
      st.draft.price = price;
      st.step = "capacity";
      return bot.sendMessage(msg.chat.id, "👥 Введите *вместимость* (гостей):", { parse_mode: "Markdown" });
    }
    if (st.step === "capacity") {
      const cap = Number(t.replace(/\D/g, ""));
      if (!cap) return bot.sendMessage(msg.chat.id, "Введите число.");
      st.draft.capacity = cap;
      st.step = "description";
      return bot.sendMessage(msg.chat.id, "📝 *Описание* (или `-` чтобы пропустить):", { parse_mode: "Markdown" });
    }
    if (st.step === "description") {
      st.draft.description = t === "-" ? "" : t;
      const data = loadData();
      const room = {
        id: "r" + Date.now(),
        title: st.draft.title,
        description: st.draft.description,
        price: st.draft.price,
        capacity: st.draft.capacity,
        beds: "",
        area: 16,
        image: "/images/room.jpg",
        amenities: [],
        status: "free",
      };
      data.rooms.push(room);
      saveData(data);
      delete addState[msg.chat.id];
      await bot.sendMessage(msg.chat.id, `✅ Номер *«${md(room.title)}»* создан!`, { parse_mode: "Markdown" });
      return sendRoomCard(msg.chat.id, room);
    }
  });

  console.log("🤖 Telegram-бот запущен.");
  if (ADMIN_ID) console.log(`👤 Админ ID: ${ADMIN_ID}`);
}

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
