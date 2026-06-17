import { useEffect, useState } from "react";
import { navigate, type Route } from "../router";

const sourceUrl =
  "https://tvil.ru/city/golubickaya/hotels/1170033/?o%5Barrival%5D=2026-06-21&o%5Bdeparture%5D=2026-07-22&o%5BmaleCount%5D=1&o%5BchildData%5D%5B0%5D=7&from=search";

type Link = { label: string; action: () => void };

export default function Nav({ route }: { route: Route }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const transparent = route === "home" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goAnchor = (anchor: string) => () => {
    if (route !== "home") {
      navigate("home");
      setTimeout(() => {
        document.querySelector(anchor)?.scrollIntoView({ behavior: "smooth" });
      }, 120);
    } else {
      document.querySelector(anchor)?.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const links: Link[] = [
    { label: "О доме", action: goAnchor("#about") },
    { label: "Номера", action: () => { navigate("rooms"); setMenuOpen(false); } },
    { label: "Галерея", action: goAnchor("#gallery") },
    { label: "Контакты", action: goAnchor("#contacts") },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        transparent ? "bg-transparent" : "bg-white/90 shadow-lg shadow-black/3 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <button
          onClick={() => navigate("home")}
          className={`text-lg font-bold tracking-tight transition-colors duration-300 ${
            transparent ? "text-white" : "text-[#1e293b]"
          }`}
        >
          🏡 Гостевой дом
        </button>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={l.action}
              className={`transition-colors duration-300 hover:text-amber-500 ${
                transparent ? "text-white/90" : "text-slate-600"
              } ${l.label === "Номера" && route === "rooms" ? "text-amber-500" : ""}`}
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => navigate("admin")}
            className={`transition-colors duration-300 hover:text-amber-500 ${
              transparent ? "text-white/70" : "text-slate-400"
            } ${route === "admin" ? "text-amber-500" : ""}`}
          >
            Админ
          </button>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-amber-500 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-amber-200 transition-all hover:bg-amber-600 hover:shadow-xl"
          >
            Забронировать
          </a>
        </nav>

        <button
          className={`md:hidden ${transparent ? "text-white" : "text-slate-700"}`}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M3 12h18M3 19h18" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={`overflow-hidden bg-white/95 backdrop-blur-xl transition-all duration-400 md:hidden ${
          menuOpen ? "max-h-96 border-b border-slate-100" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col gap-4 px-5 py-6 text-sm font-medium">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={l.action}
              className="text-left text-slate-700 hover:text-amber-500"
            >
              {l.label}
            </button>
          ))}
          <button
            onClick={() => { navigate("admin"); setMenuOpen(false); }}
            className="text-left text-slate-400 hover:text-amber-500"
          >
            Админ-панель
          </button>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block w-fit rounded-full bg-amber-500 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
            onClick={() => setMenuOpen(false)}
          >
            Забронировать
          </a>
        </nav>
      </div>
    </header>
  );
}
