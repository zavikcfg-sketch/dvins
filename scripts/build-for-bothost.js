#!/usr/bin/env node
/**
 * Собирает сайт и копирует его в bot/public/
 * Запуск: node scripts/build-for-bothost.js
 * (или: npm run build:bothost)
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const targetDir = path.join(root, "bot", "public");

console.log("📦  1/3  Сборка сайта (vite build)...");
execSync("npm run build", { cwd: root, stdio: "inherit" });

console.log("🧹  2/3  Очистка bot/public ...");
if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

console.log("📂  3/3  Копирование dist → bot/public ...");
function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dst, item));
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}
copyRecursive(distDir, targetDir);

console.log("\n✅  Готово! Содержимое bot/ можно загружать на BotHost.");
console.log(`   Папка для деплоя: ${path.relative(root, path.join(root, "bot"))}`);
