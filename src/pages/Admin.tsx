import { useRef, useState } from "react";
import { navigate } from "../router";
import { ALL_AMENITIES, useRooms, type Room } from "../store/rooms";
import { useGallery, useContacts, type Contacts } from "../store/site";

const ADMIN_PASS = "admin";

type FormState = Omit<Room, "id">;
type Tab = "rooms" | "gallery" | "contacts";

const emptyForm: FormState = {
  title: "",
  description: "",
  price: 2000,
  capacity: 2,
  beds: "",
  area: 16,
  image: "/images/room.jpg",
  amenities: [],
  status: "free",
};

export default function Admin() {
  const { rooms, addRoom, updateRoom, deleteRoom, resetRooms, toggleStatus } = useRooms();
  const { gallery, addPhoto, deletePhoto, resetGallery } = useGallery();
  const { contacts, saveContacts } = useContacts();

  const [tab, setTab] = useState<Tab>("rooms");

  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("admin_ok") === "1",
  );
  const [pass, setPass] = useState("");
  const [passErr, setPassErr] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // gallery form
  const [galAlt, setGalAlt] = useState("");
  const [galSrc, setGalSrc] = useState("");
  const galFileRef = useRef<HTMLInputElement>(null);

  // contacts form (local draft)
  const [draftContacts, setDraftContacts] = useState<Contacts>(contacts);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  /* ---------- auth gate ---------- */
  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b2a] px-5">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-2xl">
              🔐
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Админ-панель</h1>
            <p className="mt-2 text-sm text-slate-400">
              Введите пароль для управления номерами
            </p>
          </div>
          <input
            type="password"
            value={pass}
            placeholder="Пароль"
            onChange={(e) => {
              setPass(e.target.value);
              setPassErr(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (pass === ADMIN_PASS) {
                  sessionStorage.setItem("admin_ok", "1");
                  setAuthed(true);
                } else setPassErr(true);
              }
            }}
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${
              passErr ? "border-red-400" : "border-slate-200 focus:border-amber-400"
            }`}
          />
          {passErr && (
            <p className="mt-2 text-sm text-red-500">Неверный пароль (подсказка: admin)</p>
          )}
          <button
            onClick={() => {
              if (pass === ADMIN_PASS) {
                sessionStorage.setItem("admin_ok", "1");
                setAuthed(true);
              } else setPassErr(true);
            }}
            className="mt-4 w-full rounded-xl bg-amber-500 py-3 font-bold text-white transition hover:bg-amber-600"
          >
            Войти
          </button>
          <button
            onClick={() => navigate("home")}
            className="mt-3 w-full text-sm text-slate-400 hover:text-slate-600"
          >
            ← На главную
          </button>
        </div>
      </div>
    );
  }

  /* ---------- form helpers ---------- */
  const startNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (r: Room) => {
    setEditingId(r.id);
    const { id: _id, ...rest } = r;
    void _id;
    setForm(rest);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleAmenity = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter((x) => x !== a)
        : [...f.amenities, a],
    }));
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!form.title.trim()) {
      showToast("Введите название номера");
      return;
    }
    if (editingId) {
      updateRoom(editingId, form);
      showToast("Номер обновлён ✓");
    } else {
      addRoom(form);
      showToast("Номер добавлен ✓");
    }
    startNew();
  };

  const field =
    "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-amber-400";

  return (
    <div className="min-h-screen bg-[#f4f6f8] pb-24 pt-24">
      {/* top bar */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm">⚙️</span>
            Админ-панель
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("rooms")}
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
            >
              Открыть каталог
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("admin_ok");
                setAuthed(false);
              }}
              className="rounded-full bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5">
        {/* ---------- tabs ---------- */}
        <div className="mb-8 flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
          {([
            ["rooms", "🛏️ Номера"],
            ["gallery", "🖼️ Галерея"],
            ["contacts", "📞 Контакты"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition ${
                tab === key
                  ? "bg-amber-500 text-white shadow"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "rooms" && (
        <>
        {/* ---------- form ---------- */}
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {editingId ? "✏️ Редактирование номера" : "➕ Новый номер"}
            </h2>
            {editingId && (
              <button
                onClick={startNew}
                className="text-sm font-medium text-slate-400 hover:text-slate-600"
              >
                Отменить редактирование
              </button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* left: text fields */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Название</label>
                <input
                  className={field}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Двухместный «Стандарт»"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Описание</label>
                <textarea
                  className={`${field} h-24 resize-none`}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Краткое описание номера..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Цена, ₽/сутки</label>
                  <input
                    type="number"
                    className={field}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Площадь, м²</label>
                  <input
                    type="number"
                    className={field}
                    value={form.area}
                    onChange={(e) => setForm((f) => ({ ...f, area: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Вместимость</label>
                  <input
                    type="number"
                    className={field}
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">Кровати</label>
                  <input
                    className={field}
                    value={form.beds}
                    onChange={(e) => setForm((f) => ({ ...f, beds: e.target.value }))}
                    placeholder="2 односпальные"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Статус номера</label>
                <div className="flex gap-2">
                  {([
                    ["free", "● Свободен"],
                    ["busy", "● Занят"],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: val }))}
                      className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        form.status === val
                          ? val === "free"
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* right: image + amenities */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">Фото номера</label>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={form.image}
                    alt="preview"
                    className="h-40 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/room.jpg";
                    }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                  >
                    📁 Загрузить файл
                  </button>
                  {["/images/room.jpg", "/images/guest-house.jpg", "/images/pool.jpg", "/images/beach.jpg"].map((src) => (
                    <button
                      key={src}
                      onClick={() => setForm((f) => ({ ...f, image: src }))}
                      className={`h-10 w-10 overflow-hidden rounded-lg border-2 transition ${
                        form.image === src ? "border-amber-500" : "border-transparent"
                      }`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFile}
                />
                <input
                  className={`${field} mt-2`}
                  value={form.image.startsWith("data:") ? "" : form.image}
                  placeholder="или вставьте URL изображения"
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">Удобства</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_AMENITIES.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        form.amenities.includes(a)
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {form.amenities.includes(a) ? "✓ " : ""}
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={submit}
              className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600"
            >
              {editingId ? "Сохранить изменения" : "Добавить номер"}
            </button>
            {editingId && (
              <button
                onClick={startNew}
                className="rounded-xl bg-slate-100 px-6 py-3 font-medium text-slate-600 transition hover:bg-slate-200"
              >
                Очистить форму
              </button>
            )}
          </div>
        </div>

        {/* ---------- list ---------- */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Все номера <span className="text-slate-400">({rooms.length})</span>
          </h2>
          <button
            onClick={() => {
              if (confirm("Сбросить все номера к значениям по умолчанию?")) {
                resetRooms();
                showToast("Список сброшен");
              }
            }}
            className="text-sm font-medium text-slate-400 hover:text-red-500"
          >
            ↺ Сбросить к стандартным
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
            >
              <img
                src={r.image}
                alt={r.title}
                className="h-24 w-full rounded-xl object-cover sm:w-32"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">{r.title}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                      r.status === "free" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  >
                    {r.status === "free" ? "Свободен" : "Занят"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-slate-400">{r.description}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="font-semibold text-amber-500">
                    {r.price.toLocaleString("ru-RU")} ₽
                  </span>
                  <span>до {r.capacity} гостей</span>
                  <span>{r.area} м²</span>
                  <span>{r.amenities.length} удобств</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    toggleStatus(r.id);
                    showToast(r.status === "free" ? "Помечен занятым" : "Помечен свободным");
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    r.status === "free"
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
                >
                  {r.status === "free" ? "Занять" : "Освободить"}
                </button>
                <button
                  onClick={() => startEdit(r)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                >
                  ✏️ Изменить
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Удалить номер «${r.title}»?`)) {
                      deleteRoom(r.id);
                      showToast("Номер удалён");
                    }
                  }}
                  className="rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-100"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-400 shadow-sm">
              Номеров пока нет. Добавьте первый через форму выше.
            </div>
          )}
        </div>
        </>
        )}

        {/* ---------- GALLERY TAB ---------- */}
        {tab === "gallery" && (
          <>
            <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="mb-6 text-xl font-bold text-slate-800">🖼️ Добавить фото в галерею</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      Подпись к фото
                    </label>
                    <input
                      className={field}
                      value={galAlt}
                      onChange={(e) => setGalAlt(e.target.value)}
                      placeholder="Например: Вид на бассейн"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                      URL изображения
                    </label>
                    <input
                      className={field}
                      value={galSrc}
                      onChange={(e) => setGalSrc(e.target.value)}
                      placeholder="https://... или выберите файл"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => galFileRef.current?.click()}
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                      📁 Загрузить файл
                    </button>
                    {["/images/guest-house.jpg", "/images/pool.jpg", "/images/room.jpg", "/images/beach.jpg", "/images/hero.jpg"].map((src) => (
                      <button
                        key={src}
                        onClick={() => setGalSrc(src)}
                        className={`h-10 w-10 overflow-hidden rounded-lg border-2 transition ${
                          galSrc === src ? "border-amber-500" : "border-transparent"
                        }`}
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    ref={galFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setGalSrc(String(reader.result));
                      reader.readAsDataURL(file);
                    }}
                  />
                  <button
                    onClick={() => {
                      if (!galSrc) {
                        showToast("Выберите изображение");
                        return;
                      }
                      addPhoto(galSrc, galAlt || "Фото гостевого дома");
                      setGalSrc("");
                      setGalAlt("");
                      showToast("Фото добавлено ✓");
                    }}
                    className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600"
                  >
                    Добавить фото
                  </button>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-600">Предпросмотр</p>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {galSrc ? (
                      <img src={galSrc} alt="preview" className="h-48 w-full object-cover" />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-slate-300">
                        Нет изображения
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Фото галереи <span className="text-slate-400">({gallery.length})</span>
              </h2>
              <button
                onClick={() => {
                  if (confirm("Сбросить галерею к стандартной?")) {
                    resetGallery();
                    showToast("Галерея сброшена");
                  }
                }}
                className="text-sm font-medium text-slate-400 hover:text-red-500"
              >
                ↺ Сбросить
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map((g) => (
                <div key={g.id} className="group relative overflow-hidden rounded-2xl shadow-sm">
                  <img src={g.src} alt={g.alt} className="aspect-square w-full object-cover" />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                    <p className="text-xs font-medium text-white">{g.alt}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Удалить это фото?")) {
                        deletePhoto(g.id);
                        showToast("Фото удалено");
                      }
                    }}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow transition hover:bg-white"
                  >
                    🗑
                  </button>
                </div>
              ))}
              {gallery.length === 0 && (
                <div className="col-span-full rounded-2xl bg-white p-12 text-center text-slate-400 shadow-sm">
                  Галерея пуста. Добавьте первое фото выше.
                </div>
              )}
            </div>
          </>
        )}

        {/* ---------- CONTACTS TAB ---------- */}
        {tab === "contacts" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-2 text-xl font-bold text-slate-800">📞 Контакты для связи</h2>
            <p className="mb-6 text-sm text-slate-400">
              Эти данные показываются гостям при нажатии «Забронировать».
            </p>
            <div className="grid max-w-2xl gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Телефон (для звонка)
                </label>
                <input
                  className={field}
                  value={draftContacts.phone}
                  onChange={(e) => setDraftContacts((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="+7 (918) 000-00-00"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  WhatsApp (только цифры, с кодом страны)
                </label>
                <input
                  className={field}
                  value={draftContacts.whatsapp}
                  onChange={(e) => setDraftContacts((c) => ({ ...c, whatsapp: e.target.value.replace(/\D/g, "") }))}
                  placeholder="79180000000"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Telegram (username без @)
                </label>
                <input
                  className={field}
                  value={draftContacts.telegram}
                  onChange={(e) => setDraftContacts((c) => ({ ...c, telegram: e.target.value.replace(/^@/, "") }))}
                  placeholder="username"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  ВКонтакте (полная ссылка, необязательно)
                </label>
                <input
                  className={field}
                  value={draftContacts.vk}
                  onChange={(e) => setDraftContacts((c) => ({ ...c, vk: e.target.value }))}
                  placeholder="https://vk.com/..."
                />
              </div>
              <button
                onClick={() => {
                  saveContacts(draftContacts);
                  showToast("Контакты сохранены ✓");
                }}
                className="w-fit rounded-xl bg-amber-500 px-8 py-3 font-bold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600"
              >
                Сохранить контакты
              </button>
            </div>
          </div>
        )}
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 animate-fade-in-up rounded-full bg-slate-800 px-6 py-3 text-sm font-medium text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
