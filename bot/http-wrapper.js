// Точка входа для BotHost (запускается из корня /app).
// Запускает наш единый сервер (сайт + API + Telegram-бот).
// Сервер сам доустановит express и node-telegram-bot-api, если их нет.
require("./bot/server.js");
