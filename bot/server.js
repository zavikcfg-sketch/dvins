/*
 * ============================================================================
 *  Единый сервер для BotHost: сайт + API + Telegram-бот
 * ============================================================================
 *  - Раздаёт собранный сайт (папка ./public) на домене BotHost
 *  - Отдаёт/принимает данные через /api (общие для бота и сайта)
 *  - Запускает Telegram-бота, который управляет теми же данными
 *
 *  Запуск:  BOT_TOKEN=... ADMIN_ID=... ADMIN_PASS=... node server.js
 *  BotHost сам задаёт переменную PORT.
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TOKEN || process.env.TELEGRAM_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const ADMIN_PASS = process.env.ADMIN_PASS || "admin"; // пароль веб-админки

const DATA_DIR = path.join(__dirname, "data");
const PUBLIC_DIR = path.join(__dirname, "public");

const FILES = {
  rooms: path.join(DATA_DIR, "rooms.json"),
  gallery: path.join(DATA_DIR, "gallery.json"),
  contacts: path.join(DATA_DIR, "contacts.json"),
};

/* ----------------------------- defaults ----------------------------- */
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

/* ----------------------------- HTTP server ----------------------------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sendJson(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Pass",
  });
  res.end(JSON.stringify(obj));
}

function body(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 8e6) req.destroy(); // защита от огромных запросов (8MB)
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function authed(req) {
  return (req.headers["x-admin-pass"] || "") === ADMIN_PASS;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  // CORS preflight
  if (req.method === "OPTIONS") return sendJson(res, 200, {});

  /* ----------------------- API ----------------------- */
  if (pathname.startsWith("/api/")) {
    // PUBLIC: получить все данные
    if (pathname === "/api/state" && req.method === "GET") {
      return sendJson(res, 200, {
        rooms: read("rooms"),
        gallery: read("gallery"),
        contacts: read("contacts"),
      });
    }

    // PUBLIC: проверка пароля
    if (pathname === "/api/login" && req.method === "POST") {
      const b = await body(req);
      return sendJson(res, 200, { ok: b.pass === ADMIN_PASS });
    }

    // ===== Дальше — только для админа (нужен заголовок X-Admin-Pass) =====
    if (!authed(req)) return sendJson(res, 401, { error: "unauthorized" });

    // ROOMS
    if (pathname === "/api/rooms" && req.method === "PUT") {
      const b = await body(req);
      if (Array.isArray(b.rooms)) write("rooms", b.rooms);
      return sendJson(res, 200, { ok: true, rooms: read("rooms") });
    }
    // GALLERY
    if (pathname === "/api/gallery" && req.method === "PUT") {
      const b = await body(req);
      if (Array.isArray(b.gallery)) write("gallery", b.gallery);
      return sendJson(res, 200, { ok: true, gallery: read("gallery") });
    }
    // CONTACTS
    if (pathname === "/api/contacts" && req.method === "PUT") {
      const b = await body(req);
      if (b.contacts) write("contacts", b.contacts);
      return sendJson(res, 200, { ok: true, contacts: read("contacts") });
    }

    return sendJson(res, 404, { error: "not found" });
  }

  /* ----------------------- статический сайт ----------------------- */
  let filePath = path.join(PUBLIC_DIR, pathname);
  if (pathname === "/" || pathname === "") filePath = path.join(PUBLIC_DIR, "index.html");

  // защита от выхода за пределы папки
  if (!filePath.startsWith(PUBLIC_DIR)) filePath = path.join(PUBLIC_DIR, "index.html");

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA-фолбэк: всё неизвестное → index.html
      const indexFile = path.join(PUBLIC_DIR, "index.html");
      fs.readFile(indexFile, (e, data) => {
        if (e) {
          res.writeHead(404);
          return res.end("Not found");
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(data);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`🌐 Сайт + API запущены на порту ${PORT}`);
});

/* ----------------------------- Telegram bot ----------------------------- */
if (!BOT_TOKEN) {
  console.warn("⚠️  BOT_TOKEN не задан — бот не запущен (сайт работает).");
} else {
  startBot();
}

function startBot() {
  const TelegramBot = require("node-telegram-bot-api");
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  const addState = {};

  bot.on("polling_error", (e) => console.error("polling_error:", e.message));

  const isAdmin = (msg) => !ADMIN_ID || (msg.from && msg.from.id === ADMIN_ID);

  bot.onText(/\/start/, (msg) => {
    if (!isAdmin(msg)) return bot.sendMessage(msg.chat.id, "⛔ Доступ запрещён.");
    bot.sendMessage(
      msg.chat.id,
      [
        "🏡 *Управление гостевым домом*",
        "",
        "/list — список номеров",
        "/add — добавить номер",
        "/free `id` — пометить свободным",
        "/busy `id` — пометить занятым",
        "/price `id` `сумма` — изменить цену",
        "/del `id` — удалить номер",
        "",
        "🌐 Сайт: Dvin.bothost.tech",
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
  });

  bot.onText(/\/list/, (msg) => {
    if (!isAdmin(msg)) return;
    const rooms = read("rooms");
    if (!rooms.length) return bot.sendMessage(msg.chat.id, "Список номеров пуст.");
    const text = rooms
      .map(
        (r) =>
          `*${r.title}*\nID: \`${r.id}\`\n${r.price} ₽ · до ${r.capacity} гостей · ${
            r.status === "free" ? "🟢 Свободен" : "🔴 Занят"
          }`,
      )
      .join("\n\n");
    bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
  });

  const setStatus = (chatId, id, status) => {
    const rooms = read("rooms");
    const room = rooms.find((r) => r.id === id);
    if (!room) return bot.sendMessage(chatId, "Номер не найден. /list");
    room.status = status;
    write("rooms", rooms);
    bot.sendMessage(
      chatId,
      `✅ «${room.title}» → ${status === "free" ? "🟢 свободен" : "🔴 занят"}. Обновлено на сайте.`,
    );
  };

  bot.onText(/\/free (.+)/, (msg, m) => isAdmin(msg) && setStatus(msg.chat.id, m[1].trim(), "free"));
  bot.onText(/\/busy (.+)/, (msg, m) => isAdmin(msg) && setStatus(msg.chat.id, m[1].trim(), "busy"));

  bot.onText(/\/price (\S+) (\d+)/, (msg, m) => {
    if (!isAdmin(msg)) return;
    const rooms = read("rooms");
    const room = rooms.find((r) => r.id === m[1].trim());
    if (!room) return bot.sendMessage(msg.chat.id, "Номер не найден. /list");
    room.price = Number(m[2]);
    write("rooms", rooms);
    bot.sendMessage(msg.chat.id, `✅ Цена «${room.title}» теперь ${room.price} ₽. Обновлено на сайте.`);
  });

  bot.onText(/\/del (.+)/, (msg, m) => {
    if (!isAdmin(msg)) return;
    const id = m[1].trim();
    const rooms = read("rooms");
    const next = rooms.filter((r) => r.id !== id);
    if (next.length === rooms.length) return bot.sendMessage(msg.chat.id, "Номер не найден. /list");
    write("rooms", next);
    bot.sendMessage(msg.chat.id, "🗑 Номер удалён. Обновлено на сайте.");
  });

  bot.onText(/\/add/, (msg) => {
    if (!isAdmin(msg)) return;
    addState[msg.chat.id] = { step: "title", draft: {} };
    bot.sendMessage(msg.chat.id, "Введите *название* номера:", { parse_mode: "Markdown" });
  });

  bot.on("message", (msg) => {
    const st = addState[msg.chat.id];
    if (!st || (msg.text && msg.text.startsWith("/"))) return;
    const t = (msg.text || "").trim();

    if (st.step === "title") {
      st.draft.title = t;
      st.step = "price";
      return bot.sendMessage(msg.chat.id, "Введите *цену* (₽/сутки):", { parse_mode: "Markdown" });
    }
    if (st.step === "price") {
      st.draft.price = Number(t) || 0;
      st.step = "capacity";
      return bot.sendMessage(msg.chat.id, "Введите *вместимость* (гостей):", { parse_mode: "Markdown" });
    }
    if (st.step === "capacity") {
      st.draft.capacity = Number(t) || 2;
      st.step = "description";
      return bot.sendMessage(msg.chat.id, "Введите *описание*:", { parse_mode: "Markdown" });
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
      return bot.sendMessage(
        msg.chat.id,
        `✅ Номер «${room.title}» добавлен (ID: ${room.id}). Уже виден на сайте.`,
      );
    }
  });

  console.log("🤖 Telegram-бот запущен.");
}

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e && e.message));
