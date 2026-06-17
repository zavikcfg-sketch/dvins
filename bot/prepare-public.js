/*
 * Готовит папку bot/public для деплоя:
 *   - копирует dist/index.html        -> bot/public/index.html
 *   - копирует public/images/*        -> bot/public/images/
 *
 * Запуск из КОРНЯ проекта (после `npm run build`):
 *   node bot/prepare-public.js
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const distIndex = path.join(root, "dist", "index.html");
const srcImages = path.join(root, "public", "images");

const outDir = path.join(__dirname, "public");
const outImages = path.join(outDir, "images");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(distIndex)) {
  console.error("❌ Не найден dist/index.html. Сначала выполни: npm run build");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(distIndex, path.join(outDir, "index.html"));
console.log("✓ index.html скопирован");

if (fs.existsSync(srcImages)) {
  copyDir(srcImages, outImages);
  console.log("✓ images/ скопированы");
} else {
  console.warn("⚠️  Папка public/images не найдена — сайт будет без картинок.");
}

console.log("✅ Готово. Папка bot/public собрана для деплоя.");
