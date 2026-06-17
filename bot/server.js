/*
 * ============================================================================
 *  Единый сервер для BotHost: сайт + API + Telegram-бот (на Express)
 * ============================================================================
 *  - Раздаёт собранный сайт на домене BotHost
 *  - /api/* — общие данные для бота и сайта
 *  - Telegram-бот с кнопками и фото номеров
 *  Зависимости (express, node-telegram-bot-api) ставятся автоматически,
 *  если отсутствуют.
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/* ----------------------- автоустановка зависимостей ----------------------- */
function ensure(moduleName, spec) {
  try {
    return require(moduleName);
  } catch {
    console.log(`⏳ Устанавливаю отсутствующий модуль: ${moduleName} ...`);
    try {
      execSync(`npm install ${spec || moduleName} --no-save`, {
        cwd: __dirname,
        stdio: "inherit",
      });
      return require(moduleName);
    } catch (e) {
      console.error(`❌ Не удалось установить ${moduleName}:`, e && e.message);
      return null;
    }
  }
}

// Ставим именно Express 4 (в Express 5 изменён синтаксис маршрутов).
const express = ensure("express", "express@^4.19.2");
if (!express) {
  console.error("Критично: express недоступен. Останов.");
  process.exit(1);
}

/* ----------------------------- конфиг ----------------------------- */
const PORT = process.env.PORT || process.env.APP_PORT || process.env.HTTP_PORT || 3000;
const HOST = "0.0.0.0";
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TOKEN || process.env.TELEGRAM_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const ADMIN_PASS = process.env.ADMIN_PASS || "admin";
const SITE_URL = process.env.SITE_URL || "https://dvins.bothost.tech";

const DATA_DIR = path.join(__dirname, "data");

function findPublicDir() {
  const candidates = [
    path.join(__dirname, "public"),
    path.join(__dirname, "..", "dist"),
    path.join(__dirname, "..", "public"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return candidates[0];
}
const PUBLIC_DIR = findPublicDir();
const IMAGES_FALLBACK = path.join(__dirname, "..", "public"); // на случай отдельной папки images
console.log("📁 Папка сайта:", PUBLIC_DIR);

const FILES = {
  rooms: path.join(DATA_DIR, "rooms.json"),
  gallery: path.join(DATA_DIR, "gallery.json"),
  contacts: path.join(DATA_DIR, "contacts.json"),
};

const DEFAULTS = {
  rooms: require("./defaults/rooms.json"),
  gallery: require("./defaults/gallery.json"),
  contacts: require("./defaults/contacts.json"),
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
for (const key of Object.keys(FILES)) {
  if (!fs.existsSync(FILES[key])) {
    fs.writeFileSync(FILES[key], JSON.stringify(DEFAULTS[key], null, 2), "utf8");
  }
}

/* ----------------------------- data helpers ----------------------------- */
function read(key) {
  try {
    return JSON.parse(fs.readFileSync(FILES[key], "utf8"));
  } catch {
    return DEFAULTS[key];
  }
}
function write(key, data) {
  fs.writeFileSync(FILES[key], JSON.stringify(data, null, 2), "utf8");
}

/* ============================== EXPRESS APP ============================== */
const app = express();
app.use(express.json({ limit: "10mb" }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Pass");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

function authed(req) {
  return (req.headers["x-admin-pass"] || "") === ADMIN_PASS;
}

/* ----------------------------- API ----------------------------- */
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    port: PORT,
    publicDir: PUBLIC_DIR,
    botToken: BOT_TOKEN ? "set" : "missing",
    time: new Date().toISOString(),
  });
});

app.get("/api/state", (_req, res) => {
  res.json({
    rooms: read("rooms"),
    gallery: read("gallery"),
    contacts: read("contacts"),
  });
});

app.post("/api/login", (req, res) => {
  res.json({ ok: (req.body && req.body.pass) === ADMIN_PASS });
});

app.put("/api/rooms", (req, res) => {
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  if (Array.isArray(req.body.rooms)) write("rooms", req.body.rooms);
  res.json({ ok: true, rooms: read("rooms") });
});

app.put("/api/gallery", (req, res) => {
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  if (Array.isArray(req.body.gallery)) write("gallery", req.body.gallery);
  res.json({ ok: true, gallery: read("gallery") });
});

app.put("/api/contacts", (req, res) => {
  if (!authed(req)) return res.status(401).json({ error: "unauthorized" });
  if (req.body.contacts) write("contacts", req.body.contacts);
  res.json({ ok: true, contacts: read("contacts") });
});

/* ----------------------------- статический сайт ----------------------------- */
app.use(express.static(PUBLIC_DIR));
app.use(express.static(IMAGES_FALLBACK)); // запасной источник для /images/*

// SPA-фолбэк: всё остальное → index.html
// (middleware без шаблона пути — совместимо с Express 4 и 5)
app.use((req, res) => {
  if (req.method !== "GET") return res.status(404).json({ error: "not found" });
  const indexFile = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res
    .status(503)
    .send(
      "Сайт ещё не загружен. Положите index.html в " +
        PUBLIC_DIR +
        " (см. bot/prepare-public.js).",
    );
});

app.listen(PORT, HOST, () => {
  console.log(`🌐 Сайт + API запущены на ${HOST}:${PORT}`);
  console.log("ℹ️  env.PORT =", process.env.PORT, "| открой", `${SITE_URL}/health`);
});

/* ============================== TELEGRAM BOT ============================== */
if (!BOT_TOKEN) {
  console.warn("⚠️  BOT_TOKEN не задан — бот не запущен (сайт работает).");
} else {
  try {
    startBot();
  } catch (e) {
    console.error("⚠️  Бот не запустился:", e && e.message, "(сайт работает)");
  }
}

function startBot() {
  const TelegramBot = ensure("node-telegram-bot-api", "node-telegram-bot-api@^0.66.0");
  if (!TelegramBot) {
    console.error("⚠️  node-telegram-bot-api недоступен — бот пропущен.");
    return;
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  const addState = {};

  bot.on("polling_error", (e) => console.error("polling_error:", e.message));

  const isAdmin = (msg) => !ADMIN_ID || (msg.from && msg.from.id === ADMIN_ID);
  const isAdminId = (id) => !ADMIN_ID || id === ADMIN_ID;

  function imagePath(image) {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    if (image.startsWith("data:")) return null;
    const rel = image.replace(/^\//, "");
    const candidates = [
      path.join(PUBLIC_DIR, rel),
      path.join(__dirname, "public", rel),
      path.join(__dirname, "..", "public", rel),
    ];
    for (const c of candidates) if (fs.existsSync(c)) return c;
    return null;
  }

  function escapeMd(s) {
    return String(s).replace(/([_*`\[\]])/g, "\\$1");
  }

  const mainMenu = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛏️ Список номеров", callback_data: "list" }],
        [
          { text: "➕ Добавить номер", callback_data: "add" },
          { text: "🔄 Обновить", callback_data: "refresh" },
        ],
        [{ text: "🌐 Открыть сайт", url: SITE_URL }],
      ],
    },
  };

  function roomKeyboard(room) {
    return {
      inline_keyboard: [
        [
          room.status === "free"
            ? { text: "🔴 Сделать занятым", callback_data: `busy:${room.id}` }
            : { text: "🟢 Сделать свободным", callback_data: `free:${room.id}` },
        ],
        [
          { text: "💰 Изменить цену", callback_data: `price:${room.id}` },
          { text: "🗑 Удалить", callback_data: `delask:${room.id}` },
        ],
        [{ text: "⬅️ К списку", callback_data: "list" }],
      ],
    };
  }

  function roomCaption(r) {
    const dot = r.status === "free" ? "🟢 Свободен" : "🔴 Занят";
    const lines = [
      `🏠 *${escapeMd(r.title)}*`,
      "",
      dot,
      `💰 *${Number(r.price).toLocaleString("ru-RU")} ₽* / сутки`,
      `👥 До ${r.capacity} гостей · 📐 ${r.area || "—"} м²`,
    ];
    if (r.beds) lines.push(`🛏️ ${escapeMd(r.beds)}`);
    if (r.description) lines.push("", `_${escapeMd(r.description)}_`);
    if (r.amenities && r.amenities.length)
      lines.push("", "✨ " + r.amenities.map(escapeMd).join(" · "));
    lines.push("", `\`ID: ${r.id}\``);
    return lines.join("\n");
  }

  async function sendRoomCard(chatId, room) {
    const img = imagePath(room.image);
    const opts = { parse_mode: "Markdown", reply_markup: roomKeyboard(room).reply_markup };
    try {
      if (img && !img.startsWith("http")) {
        await bot.sendPhoto(chatId, fs.createReadStream(img), { caption: roomCaption(room), ...opts });
      } else if (img) {
        await bot.sendPhoto(chatId, img, { caption: roomCaption(room), ...opts });
      } else {
        await bot.sendMessage(chatId, roomCaption(room), opts);
      }
    } catch {
      await bot.sendMessage(chatId, roomCaption(room), opts);
    }
  }

  async function sendList(chatId) {
    const rooms = read("rooms");
    if (!rooms.length) {
      return bot.sendMessage(chatId, "📭 Список номеров пуст.\nНажми «Добавить номер».", mainMenu);
    }
    const free = rooms.filter((r) => r.status === "free").length;
    await bot.sendMessage(
      chatId,
      `🛏️ *Номера* (${rooms.length})\n🟢 Свободно: ${free} · 🔴 Занято: ${rooms.length - free}`,
      { parse_mode: "Markdown" },
    );
    for (const r of rooms) {
      // eslint-disable-next-line no-await-in-loop
      await sendRoomCard(chatId, r);
    }
    await bot.sendMessage(chatId, "Что дальше?", mainMenu);
  }

  function showMenu(chatId) {
    bot.sendMessage(
      chatId,
      "🏡 *Гостевой дом «Голубицкая»*\nПанель управления\n\nВыбери действие 👇",
      { parse_mode: "Markdown", reply_markup: mainMenu.reply_markup },
    );
  }

  bot.onText(/\/start/, (msg) => {
    if (!isAdmin(msg)) return bot.sendMessage(msg.chat.id, "⛔ Доступ запрещён.");
    showMenu(msg.chat.id);
  });
  bot.onText(/\/menu/, (msg) => isAdmin(msg) && showMenu(msg.chat.id));
  bot.onText(/\/list/, (msg) => isAdmin(msg) && sendList(msg.chat.id));
  bot.onText(/\/add/, (msg) => {
    if (!isAdmin(msg)) return;
    addState[msg.chat.id] = { step: "title", draft: {} };
    bot.sendMessage(msg.chat.id, "📝 Введите *название* номера:", { parse_mode: "Markdown" });
  });

  bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;
    if (!isAdminId(q.from.id)) return bot.answerCallbackQuery(q.id, { text: "⛔ Доступ запрещён" });
    const [action, id] = (q.data || "").split(":");

    try {
      if (action === "list" || action === "refresh") {
        await bot.answerCallbackQuery(q.id, { text: action === "refresh" ? "Обновлено" : "" });
        return sendList(chatId);
      }
      if (action === "add") {
        await bot.answerCallbackQuery(q.id);
        addState[chatId] = { step: "title", draft: {} };
        return bot.sendMessage(chatId, "📝 Введите *название* номера:", { parse_mode: "Markdown" });
      }
      if (action === "free" || action === "busy") {
        const rooms = read("rooms");
        const room = rooms.find((r) => r.id === id);
        if (!room) return bot.answerCallbackQuery(q.id, { text: "Не найдено" });
        room.status = action === "free" ? "free" : "busy";
        write("rooms", rooms);
        await bot.answerCallbackQuery(q.id, {
          text: room.status === "free" ? "🟢 Свободен" : "🔴 Занят",
        });
        try {
          const editOpts = {
            chat_id: chatId,
            message_id: q.message.message_id,
            parse_mode: "Markdown",
            reply_markup: roomKeyboard(room).reply_markup,
          };
          if (q.message.photo) await bot.editMessageCaption(roomCaption(room), editOpts);
          else await bot.editMessageText(roomCaption(room), editOpts);
        } catch {
          /* ignore */
        }
        return;
      }
      if (action === "price") {
        await bot.answerCallbackQuery(q.id);
        addState[chatId] = { step: "editprice", id };
        return bot.sendMessage(chatId, "💰 Введите новую цену (число, ₽):");
      }
      if (action === "delask") {
        await bot.answerCallbackQuery(q.id);
        return bot.sendMessage(chatId, "Точно удалить этот номер?", {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ Да, удалить", callback_data: `del:${id}` },
                { text: "❌ Отмена", callback_data: "list" },
              ],
            ],
          },
        });
      }
      if (action === "del") {
        const rooms = read("rooms");
        write("rooms", rooms.filter((r) => r.id !== id));
        await bot.answerCallbackQuery(q.id, { text: "🗑 Удалено" });
        return bot.sendMessage(chatId, "🗑 Номер удалён. Обновлено на сайте.", mainMenu);
      }
    } catch (e) {
      console.error("callback error:", e && e.message);
    }
  });

  bot.on("message", (msg) => {
    const st = addState[msg.chat.id];
    if (!st || (msg.text && msg.text.startsWith("/"))) return;
    const t = (msg.text || "").trim();

    if (st.step === "editprice") {
      const rooms = read("rooms");
      const room = rooms.find((r) => r.id === st.id);
      delete addState[msg.chat.id];
      if (!room) return bot.sendMessage(msg.chat.id, "Номер не найден.");
      room.price = Number(t) || room.price;
      write("rooms", rooms);
      return bot.sendMessage(msg.chat.id, `✅ Цена «${room.title}» теперь ${room.price} ₽.`, mainMenu);
    }
    if (st.step === "title") {
      st.draft.title = t;
      st.step = "price";
      return bot.sendMessage(msg.chat.id, "💰 Введите *цену* (₽/сутки):", { parse_mode: "Markdown" });
    }
    if (st.step === "price") {
      st.draft.price = Number(t) || 0;
      st.step = "capacity";
      return bot.sendMessage(msg.chat.id, "👥 Введите *вместимость* (число гостей):", { parse_mode: "Markdown" });
    }
    if (st.step === "capacity") {
      st.draft.capacity = Number(t) || 2;
      st.step = "description";
      return bot.sendMessage(msg.chat.id, "📄 Введите *описание*:", { parse_mode: "Markdown" });
    }
    if (st.step === "description") {
      st.draft.description = t;
      const rooms = read("rooms");
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
      rooms.push(room);
      write("rooms", rooms);
      delete addState[msg.chat.id];
      return bot.sendMessage(msg.chat.id, `✅ Номер «${room.title}» добавлен! Уже виден на сайте.`, mainMenu);
    }
  });

  bot
    .setMyCommands([
      { command: "menu", description: "Главное меню" },
      { command: "list", description: "Список номеров" },
      { command: "add", description: "Добавить номер" },
    ])
    .catch(() => {});

  console.log("🤖 Telegram-бот запущен (кнопки + фото).");
}

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e && e.message));
