import { useCallback, useEffect, useState } from "react";
import { apiSaveRooms } from "./api";
import { subscribe } from "./sync";

export type RoomStatus = "free" | "busy";

export type Room = {
  id: string;
  title: string;
  description: string;
  price: number;
  capacity: number;
  beds: string;
  area: number;
  image: string;
  amenities: string[];
  status: RoomStatus;
};

const STORAGE_KEY = "golubickaya_rooms_v1";

export const ALL_AMENITIES = [
  "Кондиционер",
  "Телевизор",
  "Холодильник",
  "Wi-Fi",
  "Душ / санузел",
  "Балкон / терраса",
  "Кухня",
  "Фен",
  "Электрочайник",
  "Москитная сетка",
];

export const defaultRooms: Room[] = [
  {
    id: "r1",
    title: "Двухместный «Стандарт»",
    description:
      "Уютный номер для двоих с одной двуспальной или двумя односпальными кроватями. Идеален для пары.",
    price: 2200,
    capacity: 2,
    beds: "1 двуспальная или 2 односпальные",
    area: 16,
    image: "/images/room.jpg",
    amenities: ["Кондиционер", "Телевизор", "Холодильник", "Wi-Fi", "Душ / санузел"],
    status: "free",
  },
  {
    id: "r2",
    title: "Трёхместный «Комфорт»",
    description:
      "Просторный номер с тремя кроватями и собственной террасой. Отлично подходит для небольшой семьи.",
    price: 3200,
    capacity: 3,
    beds: "3 односпальные кровати",
    area: 20,
    image: "/images/guest-house.jpg",
    amenities: [
      "Кондиционер",
      "Телевизор",
      "Холодильник",
      "Wi-Fi",
      "Душ / санузел",
      "Балкон / терраса",
    ],
    status: "free",
  },
  {
    id: "r3",
    title: "Семейный «Люкс»",
    description:
      "Двухкомнатный номер для семейного отдыха. Просторная зона отдыха, всё необходимое для комфортного проживания с детьми.",
    price: 4900,
    capacity: 4,
    beds: "1 двуспальная + 2 односпальные",
    area: 28,
    image: "/images/pool.jpg",
    amenities: [
      "Кондиционер",
      "Телевизор",
      "Холодильник",
      "Wi-Fi",
      "Душ / санузел",
      "Балкон / терраса",
      "Фен",
      "Электрочайник",
    ],
    status: "busy",
  },
  {
    id: "r4",
    title: "Четырёхместный «Семейный»",
    description:
      "Большой светлый номер с видом на зелёную территорию. Достаточно места для всей семьи.",
    price: 4200,
    capacity: 4,
    beds: "2 двуспальные кровати",
    area: 24,
    image: "/images/beach.jpg",
    amenities: [
      "Кондиционер",
      "Телевизор",
      "Холодильник",
      "Wi-Fi",
      "Душ / санузел",
      "Москитная сетка",
    ],
    status: "free",
  },
];

function load(): Room[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultRooms;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.map((r) => ({ status: "free", ...r })) as Room[];
    return defaultRooms;
  } catch {
    return defaultRooms;
  }
}

function save(rooms: Room[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    /* ignore quota errors */
  }
}

// Simple cross-component sync via a custom event
const EVENT = "rooms-updated";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>(() =>
    typeof window === "undefined" ? defaultRooms : load(),
  );

  useEffect(() => {
    const sync = () => setRooms(load());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    const unsub = subscribe(sync); // обновления с сервера (бот и т.п.)
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
      unsub();
    };
  }, []);

  const persist = useCallback((next: Room[]) => {
    save(next);
    setRooms(next);
    window.dispatchEvent(new Event(EVENT));
    apiSaveRooms(next); // отправляем на сервер (если он есть)
  }, []);

  const addRoom = useCallback(
    (room: Omit<Room, "id">) => {
      const next = [...load(), { ...room, id: `r${Date.now()}` }];
      persist(next);
    },
    [persist],
  );

  const updateRoom = useCallback(
    (id: string, patch: Partial<Room>) => {
      const next = load().map((r) => (r.id === id ? { ...r, ...patch } : r));
      persist(next);
    },
    [persist],
  );

  const deleteRoom = useCallback(
    (id: string) => {
      persist(load().filter((r) => r.id !== id));
    },
    [persist],
  );

  const resetRooms = useCallback(() => {
    persist(defaultRooms);
  }, [persist]);

  const toggleStatus = useCallback(
    (id: string) => {
      const next = load().map((r) =>
        r.id === id ? { ...r, status: r.status === "free" ? "busy" : "free" } : r,
      ) as Room[];
      persist(next);
    },
    [persist],
  );

  return { rooms, addRoom, updateRoom, deleteRoom, resetRooms, toggleStatus };
}
