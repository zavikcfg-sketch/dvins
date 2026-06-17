import { useContacts } from "../store/site";

const sourceUrl =
  "https://tvil.ru/city/golubickaya/hotels/1170033/?o%5Barrival%5D=2026-06-21&o%5Bdeparture%5D=2026-07-22&o%5BmaleCount%5D=1&o%5BchildData%5D%5B0%5D=7&from=search";

export default function BookingModal({
  roomTitle,
  onClose,
}: {
  roomTitle?: string;
  onClose: () => void;
}) {
  const { contacts } = useContacts();

  const phoneDigits = contacts.phone.replace(/[^\d+]/g, "");
  const waText = encodeURIComponent(
    `Здравствуйте! Хочу забронировать${roomTitle ? ` номер «${roomTitle}»` : ""} в гостевом доме (Голубицкая).`,
  );

  const channels: { label: string; sub: string; href: string; icon: string; color: string }[] = [
    {
      label: "Позвонить",
      sub: contacts.phone,
      href: `tel:${phoneDigits}`,
      icon: "📞",
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
  ];

  if (contacts.whatsapp)
    channels.push({
      label: "WhatsApp",
      sub: "Написать в WhatsApp",
      href: `https://wa.me/${contacts.whatsapp}?text=${waText}`,
      icon: "💬",
      color: "bg-green-500 hover:bg-green-600",
    });

  if (contacts.telegram)
    channels.push({
      label: "Telegram",
      sub: `@${contacts.telegram}`,
      href: `https://t.me/${contacts.telegram}`,
      icon: "✈️",
      color: "bg-sky-500 hover:bg-sky-600",
    });

  if (contacts.vk)
    channels.push({
      label: "ВКонтакте",
      sub: "Написать ВКонтакте",
      href: contacts.vk,
      icon: "🟦",
      color: "bg-blue-600 hover:bg-blue-700",
    });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md animate-scale-in rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-2xl">
            🏡
          </div>
          <h3 className="text-2xl font-bold text-slate-800">Забронировать</h3>
          {roomTitle && (
            <p className="mt-1 text-sm font-medium text-amber-600">{roomTitle}</p>
          )}
          <p className="mt-2 text-sm text-slate-500">
            Свяжитесь с нами любым удобным способом — поможем с выбором и
            подтвердим бронь.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className={`flex items-center gap-4 rounded-2xl px-5 py-4 text-white shadow-lg transition-all hover:scale-[1.02] ${c.color}`}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="flex-1 text-left">
                <span className="block font-bold">{c.label}</span>
                <span className="block text-sm text-white/85">{c.sub}</span>
              </span>
              <span className="text-lg">→</span>
            </a>
          ))}
        </div>

        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block rounded-2xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-600 transition hover:border-amber-400 hover:text-amber-600"
        >
          Или забронировать через TVIL.ru →
        </a>
      </div>
    </div>
  );
}
