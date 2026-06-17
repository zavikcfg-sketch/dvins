// Общий слой синхронизации: сервер (API) ↔ localStorage-кэш ↔ React.
// Если сервер доступен — он источник правды, кэшируем в localStorage.
// Если сервера нет — работаем только на localStorage (как раньше).

import { fetchState } from "./api";

type Listener = () => void;

const listeners = new Set<Listener>();
let serverAvailable = false;
let started = false;

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function isServerAvailable() {
  return serverAvailable;
}

// Применяем серверное состояние в localStorage-кэш (без записи обратно на сервер)
function applyToCache(state: {
  rooms?: unknown[];
  gallery?: unknown[];
  contacts?: unknown;
}) {
  let changed = false;
  try {
    if (state.rooms) {
      const next = JSON.stringify(state.rooms);
      if (localStorage.getItem("golubickaya_rooms_v1") !== next) {
        localStorage.setItem("golubickaya_rooms_v1", next);
        changed = true;
      }
    }
    if (state.gallery) {
      const next = JSON.stringify(state.gallery);
      if (localStorage.getItem("golubickaya_gallery_v1") !== next) {
        localStorage.setItem("golubickaya_gallery_v1", next);
        changed = true;
      }
    }
    if (state.contacts) {
      const next = JSON.stringify(state.contacts);
      if (localStorage.getItem("golubickaya_contacts_v1") !== next) {
        localStorage.setItem("golubickaya_contacts_v1", next);
        changed = true;
      }
    }
  } catch {
    /* ignore */
  }
  if (changed) emit();
}

async function pull() {
  const state = await fetchState();
  if (state) {
    serverAvailable = true;
    applyToCache(state);
  } else {
    serverAvailable = false;
  }
}

// Запускаем периодический опрос сервера (для появления изменений из бота)
export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  pull();
  setInterval(pull, 8000); // каждые 8 сек
  // при возврате на вкладку — сразу обновляем
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pull();
  });
}

// Принудительно обновить сейчас (например, после сохранения)
export function pullNow() {
  return pull();
}
