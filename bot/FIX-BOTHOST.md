# 🛠 Исправление ошибок запуска на BotHost

Из логов было:

```
Error: Cannot find module '/app/http-wrapper.js'
Error: Cannot find module 'node-telegram-bot-api'
```

Причина: BotHost запускается из папки `/app`, а файлы лежали в `/app/bot/`,
и зависимости не установились в нужном месте.

Что я уже сделал в коде, чтобы это починить:
1. Добавил `http-wrapper.js` И в корень проекта, И в папку `bot/`
   (BotHost найдёт его в `/app/http-wrapper.js`).
2. Корневой `http-wrapper.js` запускает `bot/server.js`.
3. `node-telegram-bot-api` добавлен в зависимости КОРНЕВОГО проекта,
   поэтому `npm install` в `/app` установит его, и бот его найдёт.
4. Сервер сам ищет папку сайта (`bot/public`, `dist`, или `public`),
   и не падает, если бот не установился.

---

## ✅ Что нужно сделать тебе (один раз)

### 1. Залить файлы на BotHost (в корень /app)

В корне `/app` должны оказаться:

```
/app
 ├── http-wrapper.js        ← точка входа (запускает bot/server.js)
 ├── package.json           ← корневой (Vite) — в нём уже есть node-telegram-bot-api
 ├── bot/
 │    ├── server.js
 │    ├── defaults/ (rooms.json, gallery.json, contacts.json)
 │    └── public/           ← собранный сайт (см. ниже)
 └── ...
```

### 2. Собрать сайт и положить в bot/public

На своём компьютере, в корне проекта:

```bash
npm install
npm run build
node bot/prepare-public.js
```

Скрипт создаст `bot/public/index.html` и `bot/public/images/`.
Эту папку `bot/public` тоже залей на BotHost.

### 3. Настройки BotHost

- **Команда установки:** `npm install`
- **Команда запуска:** `node http-wrapper.js`
  (можно и `npm start`, если стартовый скрипт корня это позволяет —
   но надёжнее именно `node http-wrapper.js`)
- **Node.js:** 18+ (у тебя 20 — отлично)
- **Рабочая папка:** корень `/app` (по умолчанию)

### 4. Переменные окружения

| Переменная   | Значение                          |
|--------------|-----------------------------------|
| `BOT_TOKEN`  | токен от @BotFather                |
| `ADMIN_ID`   | твой Telegram ID (@userinfobot)    |
| `ADMIN_PASS` | пароль для веб-админки             |

`PORT` BotHost задаёт сам.

---

## ✅ Проверка

В логах должно быть примерно:

```
📁 Папка сайта: /app/bot/public
🌐 Сайт + API запущены на порту XXXX
🤖 Telegram-бот запущен.
```

Открой **https://Dvin.bothost.tech** — сайт работает.
Напиши боту `/start`.

---

## Если всё ещё «Cannot find module 'node-telegram-bot-api'»

Значит `npm install` не поставил зависимости. Запусти вручную в консоли
BotHost (в корне /app):

```
npm install
```

Либо поставь точечно:

```
npm install node-telegram-bot-api
```

После этого перезапусти процесс.

---

## Альтернатива: запуск напрямую из папки bot

Если хочешь, можно вместо корня работать прямо в `bot/`:

- Рабочая папка: `bot`
- Установка: `npm install`  (в bot/ есть свой package.json с зависимостью)
- Запуск: `node server.js`

Тогда корневой `http-wrapper.js` не нужен.
