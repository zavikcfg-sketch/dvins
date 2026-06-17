import { useCallback, useEffect, useState } from "react";
import { apiSaveGallery, apiSaveContacts } from "./api";
import { subscribe } from "./sync";

export type GalleryItem = { id: string; src: string; alt: string };

export type Contacts = {
  phone: string;
  whatsapp: string; // digits only, e.g. 79184886968
  telegram: string; // username without @
  vk: string; // full url or empty
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

/* ----------------------------- gallery ----------------------------- */
function loadGallery(): GalleryItem[] {
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

const GALLERY_EVENT = "gallery-updated";

export function useGallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>(() =>
    typeof window === "undefined" ? defaultGallery : loadGallery(),
  );

  useEffect(() => {
    const sync = () => setGallery(loadGallery());
    window.addEventListener(GALLERY_EVENT, sync);
    window.addEventListener("storage", sync);
    const unsub = subscribe(sync);
    return () => {
      window.removeEventListener(GALLERY_EVENT, sync);
      window.removeEventListener("storage", sync);
      unsub();
    };
  }, []);

  const persist = useCallback((next: GalleryItem[]) => {
    try {
      localStorage.setItem(GALLERY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setGallery(next);
    window.dispatchEvent(new Event(GALLERY_EVENT));
    apiSaveGallery(next);
  }, []);

  const addPhoto = useCallback(
    (src: string, alt: string) => {
      persist([...loadGallery(), { id: `g${Date.now()}`, src, alt }]);
    },
    [persist],
  );

  const deletePhoto = useCallback(
    (id: string) => {
      persist(loadGallery().filter((g) => g.id !== id));
    },
    [persist],
  );

  const resetGallery = useCallback(() => persist(defaultGallery), [persist]);

  return { gallery, addPhoto, deletePhoto, resetGallery };
}

/* ----------------------------- contacts ----------------------------- */
function loadContacts(): Contacts {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return defaultContacts;
    return { ...defaultContacts, ...JSON.parse(raw) };
  } catch {
    return defaultContacts;
  }
}

const CONTACTS_EVENT = "contacts-updated";

export function useContacts() {
  const [contacts, setContacts] = useState<Contacts>(() =>
    typeof window === "undefined" ? defaultContacts : loadContacts(),
  );

  useEffect(() => {
    const sync = () => setContacts(loadContacts());
    window.addEventListener(CONTACTS_EVENT, sync);
    window.addEventListener("storage", sync);
    const unsub = subscribe(sync);
    return () => {
      window.removeEventListener(CONTACTS_EVENT, sync);
      window.removeEventListener("storage", sync);
      unsub();
    };
  }, []);

  const saveContacts = useCallback((next: Contacts) => {
    try {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setContacts(next);
    window.dispatchEvent(new Event(CONTACTS_EVENT));
    apiSaveContacts(next);
  }, []);

  return { contacts, saveContacts };
}
