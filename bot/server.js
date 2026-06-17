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

// BotHost/хостинги передают порт через PORT (иногда APP_PORT/HTTP_PORT).
const PORT = process.env.PORT || process.env.APP_PORT || process.env.HTTP_PORT || 3000;
const HOST = "0.0.0.0"; // слушаем на всех интерфейсах (нужно для домена/контейнера)
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TOKEN || process.env.TELEGRAM_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const ADMIN_PASS = process.env.ADMIN_PASS || "admin"; // пароль веб-админки

const DATA_DIR = path.join(__dirname, "data");

// Ищем папку с собранным сайтом (index.html) в нескольких местах:
//  1. bot/public        (рекомендуется, см. prepare-public.js)
//  2. ../dist           (если сайт собран в корне через `npm run build`)
//  3. ../public         (исходная папка с картинками + если index туда положили)
function findPublicDir() {
  const candidates = [
    path.join(__dirname, "public"),
    path.join(__dirname, "..", "dist"),
    path.join(__dirname, "..", "public"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) return dir;
  }
  return candidates[0]; // по умолчанию bot/public
}
const PUBLIC_DIR = findPublicDir();
console.log("📁 Папка сайта:", PUBLIC_DIR);

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

  //健康-проверка: открой https://Dvin.bothost.tech/health
  if (pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      port: PORT,
      publicDir: PUBLIC_DIR,
      botToken: BOT_TOKEN ? "set" : "missing",
      time: new Date().toISOString(),
    });
  }

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
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const rel = safePath === "/" || safePath === "" || safePath === "\\" ? "index.html" : safePath.replace(/^[/\\]/, "");

  // Где искать файлы: основная папка сайта + запасная папка с картинками
  const searchDirs = [PUBLIC_DIR, path.join(__dirname, "..", "public")];

  function tryServe(i) {
    if (i >= searchDirs.length) {
      // SPA-фолбэк: всё неизвестное → index.html (из любой папки, где он есть)
      for (const dir of searchDirs) {
        const indexFile = path.join(dir, "index.html");
        if (fs.existsSync(indexFile)) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          return fs.createReadStream(indexFile).pipe(res);
        }
      }
      res.writeHead(404);
      return res.end("Not found");
    }
    const filePath = path.join(searchDirs[i], rel);
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) return tryServe(i + 1);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    });
  }
  tryServe(0);
});

server.listen(PORT, HOST, () => {
  console.log(`🌐 Сайт + API запущены на ${HOST}:${PORT}`);
});

/* ----------------------------- Telegram bot ----------------------------- */
if (!BOT_TOKEN) {
  console.warn("⚠️  BOT_TOKEN не задан — бот не запущен (сайт работает).");
} else {
  try {
    startBot();
  } catch (e) {
    console.error(
      "⚠️  Не удалось запустить бота:",
      e && e.message,
      "\n   Сайт продолжает работать. Проверьте, что выполнен `npm install`.",
    );
  }
}

function loadTelegram() {
  try {
    return require("node-telegram-bot-api");
  } catch {
    return null;
  }
}

function startBot() {
  let TelegramBot = loadTelegram();

  // Если модуль не найден — пробуем установить его на лету
  if (!TelegramBot) {
    console.log("⏳ Модуль 'node-telegram-bot-api' не найден. Устанавливаю...");
    try {
      const { execSync } = require("child_process");
      execSync("npm install node-telegram-bot-api@^0.66.0 --no-save", {
        cwd: __dirname,
        stdio: "inherit",
      });
      TelegramBot = loadTelegram();
    } catch (e) {
      console.error("❌ Автоустановка не удалась:", e && e.message);
    }
  }

  if (!TelegramBot) {
    console.error(
      "⚠️  'node-telegram-bot-api' недоступен — бот пропущен (сайт работает).\n" +
        "   Запустите вручную: cd " + __dirname + " && npm install",
    );
    return;
  }

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
