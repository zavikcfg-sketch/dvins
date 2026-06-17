/**
 * Универсальный API-клиент.
 * При первом обращении проверяет, доступен ли бэкенд.
 * Если да — все операции идут через HTTP. Если нет — фоллбэк на localStorage.
 */

let apiAvailable: boolean | null = null;

async function checkApi(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const res = await fetch("/api/health", { method: "GET" });
    apiAvailable = res.ok;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
}

/* ---------- generic helpers ---------- */
export async function apiGet<T>(path: string, fallback: () => T): Promise<T> {
  if (!(await checkApi())) return fallback();
  try {
    const res = await fetch(`/api${path}`);
    if (!res.ok) throw new Error("bad response");
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}

export async function apiPut<T>(path: string, body: unknown, fallback: () => T): Promise<T> {
  if (!(await checkApi())) return fallback();
  try {
    const res = await fetch(`/api${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("bad response");
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}

export function isApiMode(): boolean {
  return apiAvailable === true;
}
