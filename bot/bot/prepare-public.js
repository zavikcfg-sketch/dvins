/*
 * Готовит папку bot/public для деплоя на BotHost:
 *   - dist/index.html   -> bot/public/index.html
 *   - public/images/*   -> bot/public/images/
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

console.log("\n=== Подготовка bot/public ===");

if (!fs.existsSync(distIndex)) {
  console.error("❌ Нет dist/index.html. Сначала выполни:  npm run build");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(distIndex, path.join(outDir, "index.html"));
console.log("✓ index.html  ->  bot/public/index.html");

if (fs.existsSync(srcImages)) {
  copyDir(srcImages, outImages);
  const n = fs.readdirSync(outImages).length;
  console.log(`✓ images/     ->  bot/public/images/ (${n} файлов)`);
} else {
  console.warn("⚠️  public/images не найдена — сайт будет без картинок.");
}

console.log("\n✅ Готово!");
console.log("Теперь залей на BotHost содержимое папки bot/ так, чтобы было:");
console.log("   /app/bot/server.js");
console.log("   /app/bot/package.json");
console.log("   /app/bot/defaults/*.json");
console.log("   /app/bot/public/index.html");
console.log("   /app/bot/public/images/*.jpg\n");
