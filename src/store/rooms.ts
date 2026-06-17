import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPut } from "./api";

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

function loadLocal(): Room[] {
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

function saveLocal(rooms: Room[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    /* ignore */
  }
}

async function fetchRooms(): Promise<Room[]> {
  return apiGet<Room[]>("/rooms", loadLocal);
}

async function pushRooms(rooms: Room[]): Promise<Room[]> {
  saveLocal(rooms); // всегда кэшируем локально
  return apiPut<Room[]>("/rooms", rooms, () => rooms);
}

const EVENT = "rooms-updated";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>(() =>
    typeof window === "undefined" ? defaultRooms : loadLocal(),
  );
  const mounted = useRef(true);

  // первая загрузка + автопросинхронизация каждые 5 секунд
  useEffect(() => {
    mounted.current = true;
    const sync = async () => {
      const data = await fetchRooms();
      if (mounted.current) setRooms(data);
    };
    sync();
    const id = window.setInterval(sync, 5000);
    const onEvt = () => sync();
    window.addEventListener(EVENT, onEvt);
    window.addEventListener("storage", onEvt);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
      window.removeEventListener(EVENT, onEvt);
      window.removeEventListener("storage", onEvt);
    };
  }, []);

  const persist = useCallback(async (next: Room[]) => {
    setRooms(next);
    await pushRooms(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const addRoom = useCallback(
    async (room: Omit<Room, "id">) => {
      const next = [...(await fetchRooms()), { ...room, id: `r${Date.now()}` }];
      await persist(next);
    },
    [persist],
  );

  const updateRoom = useCallback(
    async (id: string, patch: Partial<Room>) => {
      const list = await fetchRooms();
      const next = list.map((r) => (r.id === id ? { ...r, ...patch } : r));
      await persist(next);
    },
    [persist],
  );

  const deleteRoom = useCallback(
    async (id: string) => {
      const list = await fetchRooms();
      await persist(list.filter((r) => r.id !== id));
    },
    [persist],
  );

  const resetRooms = useCallback(async () => {
    await persist(defaultRooms);
  }, [persist]);

  const toggleStatus = useCallback(
    async (id: string) => {
      const list = await fetchRooms();
      const next = list.map((r) =>
        r.id === id ? { ...r, status: r.status === "free" ? "busy" : "free" } : r,
      ) as Room[];
      await persist(next);
    },
    [persist],
  );

  return { rooms, addRoom, updateRoom, deleteRoom, resetRooms, toggleStatus };
}
