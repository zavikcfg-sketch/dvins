import { useState } from "react";
import { navigate } from "../router";
import { Section, Stars } from "../components/ui";
import { useRooms } from "../store/rooms";
import { useGallery, useContacts } from "../store/site";
import BookingModal from "../components/BookingModal";

const sourceUrl =
  "https://tvil.ru/city/golubickaya/hotels/1170033/?o%5Barrival%5D=2026-06-21&o%5Bdeparture%5D=2026-07-22&o%5BmaleCount%5D=1&o%5BchildData%5D%5B0%5D=7&from=search";

const amenities = [
  { icon: "🌊", title: "Море рядом", desc: "Пляж в пешей доступности – тёплое Азовское море и песчано-ракушечный берег." },
  { icon: "🛏️", title: "Уютные номера", desc: "Кондиционер, ТВ, холодильник, собственная ванная комната в каждом номере." },
  { icon: "🍳", title: "Общая кухня", desc: "Всё необходимое для приготовления еды: плита, посуда, микроволновая печь." },
  { icon: "🏊", title: "Бассейн", desc: "Открытый бассейн с шезлонгами – идеально для жарких летних дней." },
  { icon: "🚗", title: "Парковка", desc: "Бесплатная охраняемая парковка на территории гостевого дома." },
  { icon: "👶", title: "Для семей", desc: "Детская площадка, спокойная территория, всё для отдыха с детьми." },
];

const bookingData = [
  ["Дата заезда", "21 июня 2026"],
  ["Дата выезда", "22 июля 2026"],
  ["Длительность", "31 ночь"],
  ["Гости", "1 взрослый + ребёнок 7 лет"],
  ["Тип жилья", "Гостевой дом"],
  ["Локация", "ст. Голубицкая, Краснодарский край"],
  ["Бронирование", "TVIL, объект №1170033"],
];

const reviews = [
  {
    text: "Прекрасное место для семейного отдыха! Чистые номера, приветливые хозяева, до моря рукой подать. Обязательно вернёмся!",
    author: "Елена, Москва",
    stars: 5,
  },
  {
    text: "Отдыхали с дочкой 7 лет — всё очень понравилось. Комнаты уютные, кухня оборудована, пляж отличный. Рекомендую!",
    author: "Светлана, Краснодар",
    stars: 5,
  },
  {
    text: "Тихое спокойное место. Бассейн и детская площадка — то, что нужно для отдыха с ребёнком. Хозяева очень гостеприимные.",
    author: "Андрей, Ростов-на-Дону",
    stars: 5,
  },
];

export default function Home() {
  const { rooms } = useRooms();
  const { gallery } = useGallery();
  const { contacts } = useContacts();
  const [booking, setBooking] = useState(false);
  const minPrice = rooms.length ? Math.min(...rooms.map((r) => r.price)) : 2200;
  const phoneNumber = contacts.phone;

  return (
    <>
      {/* ==================== HERO ==================== */}
      <section
        id="hero"
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
      >
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/images/hero.jpg"
          alt="Азовское море, Голубицкая"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d1b2a]/70 via-[#0d1b2a]/40 to-[#0d1b2a]/75" />

        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
          <div className="animate-fade-in-up space-y-6">
            <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white backdrop-blur-sm">
              Станица Голубицкая · Азовское море
            </span>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Гостевой дом
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
                у самого моря
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              Семейный отдых на Азовском побережье. Уютные номера, бассейн,
              детская площадка и тёплое море в нескольких минутах ходьбы.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <button
                onClick={() => navigate("rooms")}
                className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-800 shadow-2xl shadow-black/20 transition-all hover:scale-105 hover:shadow-amber-200/40"
              >
                Посмотреть номера
                <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
              </button>
              <a
                href="#about"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/10"
              >
                <span>⌄</span> Узнать больше
              </a>
            </div>
          </div>

          <div className="mt-20 animate-bounce">
            <span className="text-3xl text-white/50">⌄</span>
          </div>
        </div>
      </section>

      {/* ==================== ABOUT ==================== */}
      <Section id="about" className="-mt-1 bg-[#faf8f5] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
                О гостевом доме
              </span>
              <h2 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Ваш идеальный
                <br />
                отдых на Азовском
                <br />
                побережье
              </h2>
              <p className="max-w-lg text-lg leading-relaxed text-slate-500">
                Наш гостевой дом расположен в живописной станице Голубицкая —
                одном из лучших курортов Азовского моря. Здесь вас ждут
                комфортабельные номера, благоустроенная территория и
                по-настоящему домашняя атмосфера.
              </p>
              <p className="max-w-lg text-lg leading-relaxed text-slate-500">
                Тёплое море, песчано-ракушечные пляжи, знаменитые грязевые
                вулканы и свежий морской воздух — всё это в шаговой доступности
                от гостевого дома.
              </p>

              <div className="flex flex-wrap gap-6 pt-4">
                {[
                  { v: "100 м", l: "до моря" },
                  { v: `${rooms.length}`, l: "номеров" },
                  { v: "4.9", l: "рейтинг" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div className="text-3xl font-bold text-amber-500">{s.v}</div>
                    <div className="text-sm text-slate-400">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                className="aspect-[4/5] w-full rounded-3xl object-cover shadow-2xl"
                src="/images/guest-house.jpg"
                alt="Гостевой дом"
              />
              <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-5 shadow-xl sm:p-6">
                <p className="text-sm font-bold text-slate-800">★ 4.9 / 5.0</p>
                <p className="text-xs text-slate-400">Оценка гостей</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ==================== AMENITIES ==================== */}
      <Section className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
              Удобства
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Всё для комфортного отдыха
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Мы позаботились о том, чтобы ваш отпуск прошёл без забот.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((a) => (
              <div
                key={a.title}
                className="group rounded-2xl border border-slate-100 bg-[#faf8f5] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-100/50"
              >
                <span className="text-4xl">{a.icon}</span>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-800">
                  {a.title}
                </h3>
                <p className="mt-3 leading-relaxed text-slate-500">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ==================== ROOMS TEASER ==================== */}
      <Section className="bg-[#faf8f5] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
                Наши номера
              </span>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Выберите идеальный номер
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                От уютных двухместных до просторных семейных люксов — от {minPrice.toLocaleString("ru-RU")} ₽ в сутки.
              </p>
            </div>
            <button
              onClick={() => navigate("rooms")}
              className="shrink-0 rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all hover:bg-amber-600"
            >
              Все номера →
            </button>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.slice(0, 3).map((r) => (
              <button
                key={r.id}
                onClick={() => navigate("rooms")}
                className="group overflow-hidden rounded-3xl bg-white text-left shadow-lg shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={r.image}
                    alt={r.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-800">{r.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{r.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-amber-500">
                      {r.price.toLocaleString("ru-RU")} ₽
                    </span>
                    <span className="text-sm text-slate-400">до {r.capacity} гостей</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ==================== GALLERY ==================== */}
      <Section id="gallery" className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
              Галерея
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Посмотрите, как у нас красиво
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {gallery.map((img, i) => (
              <div
                key={img.alt}
                className={`group relative overflow-hidden rounded-3xl shadow-lg transition-all duration-500 hover:shadow-2xl ${
                  i === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <img
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    i === 0 ? "aspect-[21/9]" : "aspect-[4/3]"
                  }`}
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <p className="text-lg font-semibold text-white">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ==================== BOOKING INFO ==================== */}
      <Section
        id="booking"
        className="bg-gradient-to-br from-[#0d1b2a] to-[#1b3a4b] py-24 text-white sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
              Бронирование
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Данные вашего бронирования
            </h2>
            <p className="mt-4 text-lg text-white/60">
              Информация из ссылки TVIL. Актуальные цены уточняйте при бронировании.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
            {bookingData.map(([label, value], i) => (
              <div
                key={label}
                className={`flex flex-col gap-1 border-b border-white/8 px-8 py-5 last:border-b-0 sm:flex-row sm:justify-between sm:gap-4 ${
                  i % 2 === 0 ? "bg-white/[0.02]" : ""
                }`}
              >
                <dt className="text-sm font-semibold uppercase tracking-wider text-amber-400/80">
                  {label}
                </dt>
                <dd className="text-lg font-medium text-white">{value}</dd>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => setBooking(true)}
              className="group inline-flex items-center gap-3 rounded-full bg-amber-500 px-10 py-5 text-base font-bold text-white shadow-2xl shadow-amber-500/20 transition-all hover:scale-105 hover:shadow-amber-500/40"
            >
              <span className="text-xl">📞</span>
              Забронировать — связаться
              <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
            </button>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-5 text-base font-semibold text-white/90 transition-all hover:border-white hover:bg-white/10"
            >
              Через TVIL →
            </a>
          </div>
        </div>
      </Section>

      {/* ==================== REVIEWS ==================== */}
      <Section className="bg-[#faf8f5] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500">
              Отзывы
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Что говорят наши гости
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="group rounded-3xl bg-white p-8 shadow-lg shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-100/50"
              >
                <Stars n={r.stars} />
                <p className="mt-4 leading-relaxed text-slate-600">{r.text}</p>
                <p className="mt-5 text-sm font-bold text-slate-800">{r.author}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ==================== CTA BANNER ==================== */}
      <Section className="relative overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 py-24 sm:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Готовы к отпуску?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
            Забронируйте номер прямо сейчас и начните планировать свой идеальный
            отдых на Азовском море!
          </p>
          <button
            onClick={() => setBooking(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-10 py-5 text-base font-bold text-slate-800 shadow-2xl transition-all hover:scale-105 hover:shadow-white/30"
          >
            Забронировать →
          </button>
        </div>
      </Section>

      {/* ==================== CONTACTS ==================== */}
      <Section id="contacts" className="bg-[#0d1b2a] py-24 text-white sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
                Контакты
              </span>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Свяжитесь с нами
              </h2>
              <p className="max-w-md text-lg leading-relaxed text-white/60">
                Есть вопросы? Мы всегда на связи и готовы помочь с выбором
                номера и организацией отдыха.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span className="text-white/80">
                    Краснодарский край, Темрюкский район,
                    <br />
                    станица Голубицкая
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📞</span>
                  <a
                    href={`tel:${phoneNumber}`}
                    className="text-lg font-semibold text-white transition-colors hover:text-amber-400"
                  >
                    {phoneNumber}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/80 underline underline-offset-4 transition-colors hover:text-amber-400"
                  >
                    Страница на TVIL.ru
                  </a>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl">
              <div className="aspect-[4/3] w-full bg-white/5">
                <iframe
                  title="Карта"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44998.621689104784!2d37.3114!3d45.3314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40e6df11c3f7c4b3%3A0xa6c5c7a9b3c5b1a2!2z0JPQvtC70YPQsdC40YbQutCw0Y8sINCa0YDQsNGB0L3QvtC00LDRgNGB0LrQuNC5INC60YDQsNC5!5e0!3m2!1sru!2sru!4v1"
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-white/5 bg-[#0d1b2a] py-10 text-center text-sm text-white/40">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <p>
            © 2026 Гостевой дом Голубицкая. TVIL объект №1170033.{" "}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-amber-400"
            >
              Оригинальное объявление
            </a>
          </p>
        </div>
      </footer>

      {booking && <BookingModal onClose={() => setBooking(false)} />}
    </>
  );
}
