// Клиент для общения с сервером (bot/server.js).
// Если API недоступно (например, при локальной разработке без сервера),
// код молча откатывается на localStorage в самих стор-хуках.

export type ApiState = {
  rooms: unknown[];
  gallery: unknown[];
  contacts: unknown;
};

const PASS_KEY = "admin_pass";

export function getAdminPass(): string {
  return sessionStorage.getItem(PASS_KEY) || "";
}
export function setAdminPass(pass: string) {
  sessionStorage.setItem(PASS_KEY, pass);
}
export function clearAdminPass() {
  sessionStorage.removeItem(PASS_KEY);
}

async function jsonOrThrow(res: Response) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchState(): Promise<ApiState | null> {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    return (await jsonOrThrow(res)) as ApiState;
  } catch {
    return null; // нет сервера — работаем на localStorage
  }
}

export async function apiLogin(pass: string): Promise<boolean> {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass }),
    });
    const data = await jsonOrThrow(res);
    return !!data.ok;
  } catch {
    // нет сервера — сравниваем с дефолтным паролем локально
    return pass === "admin";
  }
}

async function put(path: string, payload: unknown): Promise<boolean> {
  try {
    const res = await fetch(path, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Pass": getAdminPass(),
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const apiSaveRooms = (rooms: unknown[]) => put("/api/rooms", { rooms });
export const apiSaveGallery = (gallery: unknown[]) => put("/api/gallery", { gallery });
export const apiSaveContacts = (contacts: unknown) => put("/api/contacts", { contacts });

/** Есть ли вообще сервер (для определения режима). */
export async function hasServer(): Promise<boolean> {
  return (await fetchState()) !== null;
}
