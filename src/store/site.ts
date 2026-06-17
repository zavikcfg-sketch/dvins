import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPut } from "./api";

export type GalleryItem = { id: string; src: string; alt: string };

export type Contacts = {
  phone: string;
  whatsapp: string;
  telegram: string;
  vk: string;
};

const GALLERY_KEY = "golubickaya_gallery_v1";
const CONTACTS_KEY = "golubickaya_contacts_v1";

export const defaultGallery: GalleryItem[] = [
  { id: "g1", src: "/images/guest-house.jpg", alt: "Гостевой дом — фасад и двор" },
  { id: "g2", src: "/images/pool.jpg", alt: "Бассейн и зона отдыха" },
  { id: "g3", src: "/images/room.jpg", alt: "Уютный номер" },
  { id: "g4", src: "/images/beach.jpg", alt: "Пляж Азовского моря" },
];

export const defaultContacts: Contacts = {
  phone: "+7 (918) 488-69-68",
  whatsapp: "79184886968",
  telegram: "golubickaya_dom",
  vk: "",
};

/* ---------- gallery ---------- */
function loadGalleryLocal(): GalleryItem[] {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) return defaultGallery;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as GalleryItem[];
    return defaultGallery;
  } catch {
    return defaultGallery;
  }
}

function saveGalleryLocal(items: GalleryItem[]) {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

const GALLERY_EVENT = "gallery-updated";

export function useGallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>(() =>
    typeof window === "undefined" ? defaultGallery : loadGalleryLocal(),
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const sync = async () => {
      const data = await apiGet<GalleryItem[]>("/gallery", loadGalleryLocal);
      if (mounted.current) setGallery(data);
    };
    sync();
    const id = window.setInterval(sync, 7000);
    const onEvt = () => sync();
    window.addEventListener(GALLERY_EVENT, onEvt);
    window.addEventListener("storage", onEvt);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
      window.removeEventListener(GALLERY_EVENT, onEvt);
      window.removeEventListener("storage", onEvt);
    };
  }, []);

  const persist = useCallback(async (next: GalleryItem[]) => {
    saveGalleryLocal(next);
    setGallery(next);
    await apiPut<GalleryItem[]>("/gallery", next, () => next);
    window.dispatchEvent(new Event(GALLERY_EVENT));
  }, []);

  const addPhoto = useCallback(
    async (src: string, alt: string) => {
      const list = await apiGet<GalleryItem[]>("/gallery", loadGalleryLocal);
      await persist([...list, { id: `g${Date.now()}`, src, alt }]);
    },
    [persist],
  );

  const deletePhoto = useCallback(
    async (id: string) => {
      const list = await apiGet<GalleryItem[]>("/gallery", loadGalleryLocal);
      await persist(list.filter((g) => g.id !== id));
    },
    [persist],
  );

  const resetGallery = useCallback(async () => {
    await persist(defaultGallery);
  }, [persist]);

  return { gallery, addPhoto, deletePhoto, resetGallery };
}

/* ---------- contacts ---------- */
function loadContactsLocal(): Contacts {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return defaultContacts;
    return { ...defaultContacts, ...JSON.parse(raw) };
  } catch {
    return defaultContacts;
  }
}

function saveContactsLocal(c: Contacts) {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

const CONTACTS_EVENT = "contacts-updated";

export function useContacts() {
  const [contacts, setContacts] = useState<Contacts>(() =>
    typeof window === "undefined" ? defaultContacts : loadContactsLocal(),
  );
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const sync = async () => {
      const data = await apiGet<Contacts>("/contacts", loadContactsLocal);
      if (mounted.current) setContacts(data);
    };
    sync();
    const id = window.setInterval(sync, 15000);
    const onEvt = () => sync();
    window.addEventListener(CONTACTS_EVENT, onEvt);
    window.addEventListener("storage", onEvt);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
      window.removeEventListener(CONTACTS_EVENT, onEvt);
      window.removeEventListener("storage", onEvt);
    };
  }, []);

  const saveContacts = useCallback(async (next: Contacts) => {
    saveContactsLocal(next);
    setContacts(next);
    await apiPut<Contacts>("/contacts", next, () => next);
    window.dispatchEvent(new Event(CONTACTS_EVENT));
  }, []);

  return { contacts, saveContacts };
}
