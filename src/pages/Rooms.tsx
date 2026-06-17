import { useMemo, useState } from "react";
import { useRooms, type Room } from "../store/rooms";
import { Section } from "../components/ui";
import BookingModal from "../components/BookingModal";

type SortKey = "default" | "price-asc" | "price-desc" | "capacity";

export default function Rooms() {
  const { rooms } = useRooms();
  const [active, setActive] = useState<Room | null>(null);
  const [bookingRoom, setBookingRoom] = useState<Room | null>(null);
  const [sort, setSort] = useState<SortKey>("default");
  const [minCap, setMinCap] = useState(0);
  const [onlyFree, setOnlyFree] = useState(false);

  const visible = useMemo(() => {
    let list = rooms.filter((r) => r.capacity >= minCap);
    if (onlyFree) list = list.filter((r) => r.status === "free");
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "capacity") list = [...list].sort((a, b) => b.capacity - a.capacity);
    return list;
  }, [rooms, sort, minCap, onlyFree]);

  return (
    <>
      {/* Header band */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden pt-20">
        <img
          src="/images/guest-house.jpg"
          alt="Номера"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b2a]/80 via-[#0d1b2a]/55 to-[#0d1b2a]/85" />
        <div className="relative z-10 mx-auto max-w-3xl animate-fade-in-up px-5 text-center">
          <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur-sm">
            Каталог номеров
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Наши номера
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
            {rooms.length} вариантов размещения для комфортного отдыха —
            выберите подходящий именно вам.
          </p>
        </div>
      </section>

      {/* Filters + grid */}
      <Section className="bg-[#faf8f5] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          {/* toolbar */}
          <div className="mb-10 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-medium text-slate-500">Гостей от:</span>
              {[0, 2, 3, 4].map((c) => (
                <button
                  key={c}
                  onClick={() => setMinCap(c)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    minCap === c
                      ? "bg-amber-500 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c === 0 ? "Все" : `${c}+`}
                </button>
              ))}
              <button
                onClick={() => setOnlyFree((v) => !v)}
                className={`ml-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  onlyFree
                    ? "bg-emerald-500 text-white shadow"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {onlyFree ? "✓ " : ""}Только свободные
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">Сортировка:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-400"
              >
                <option value="default">По умолчанию</option>
                <option value="price-asc">Цена: дешевле</option>
                <option value="price-desc">Цена: дороже</option>
                <option value="capacity">Вместимость</option>
              </select>
            </div>
          </div>

          {/* grid */}
          {visible.length === 0 ? (
            <div className="rounded-3xl bg-white p-16 text-center text-slate-400 shadow-sm">
              Нет номеров, подходящих под выбранные фильтры.
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((r) => (
                <article
                  key={r.id}
                  className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={r.image}
                      alt={r.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 backdrop-blur">
                      до {r.capacity} гостей
                    </span>
                    <span
                      className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white shadow ${
                        r.status === "free" ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    >
                      {r.status === "free" ? "● Свободен" : "● Занят"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold tracking-tight text-slate-800">{r.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
                      {r.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.amenities.slice(0, 3).map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                        >
                          {a}
                        </span>
                      ))}
                      {r.amenities.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          +{r.amenities.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-6">
                      <div>
                        <span className="text-2xl font-bold text-amber-500">
                          {r.price.toLocaleString("ru-RU")} ₽
                        </span>
                        <span className="block text-xs text-slate-400">в сутки</span>
                      </div>
                      <button
                        onClick={() => setActive(r)}
                        className="rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-amber-500"
                      >
                        Подробнее
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Detail modal */}
      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl animate-scale-in overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg transition hover:bg-white"
            >
              ✕
            </button>

            <div className="grid md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto">
                <img src={active.image} alt={active.title} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col p-8">
                <h3 className="text-3xl font-bold tracking-tight text-slate-800">{active.title}</h3>
                <p className="mt-4 leading-relaxed text-slate-500">{active.description}</p>

                <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-400">Вместимость</dt>
                    <dd className="font-semibold text-slate-700">до {active.capacity} гостей</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Площадь</dt>
                    <dd className="font-semibold text-slate-700">{active.area} м²</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400">Кровати</dt>
                    <dd className="font-semibold text-slate-700">{active.beds}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-slate-400">Статус</dt>
                    <dd
                      className={`font-semibold ${
                        active.status === "free" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {active.status === "free" ? "● Свободен" : "● Занят"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Удобства:</p>
                  <div className="flex flex-wrap gap-2">
                    {active.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
                      >
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-6">
                  <div>
                    <span className="text-3xl font-bold text-amber-500">
                      {active.price.toLocaleString("ru-RU")} ₽
                    </span>
                    <span className="block text-xs text-slate-400">за номер в сутки</span>
                  </div>
                  {active.status === "free" ? (
                    <button
                      onClick={() => {
                        setBookingRoom(active);
                        setActive(null);
                      }}
                      className="rounded-full bg-amber-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all hover:scale-105 hover:bg-amber-600"
                    >
                      Забронировать →
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-7 py-3.5 text-sm font-bold text-slate-500">
                      Сейчас занят
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* footer */}
      <footer className="bg-[#0d1b2a] py-10 text-center text-sm text-white/40">
        <p>© 2026 Гостевой дом Голубицкая. TVIL объект №1170033.</p>
      </footer>

      {bookingRoom && (
        <BookingModal
          roomTitle={bookingRoom.title}
          onClose={() => setBookingRoom(null)}
        />
      )}
    </>
  );
}
