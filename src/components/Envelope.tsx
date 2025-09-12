import { useEffect, useRef, useState } from "react";
import PlaceInput from "./PlaceInput";
import DatePicker from "./DatePicker";

const LETTER_SLIDE_DELAY_MS = 450;

interface EnvelopeProps {
  onOpen?: () => void;
}

export default function Envelope({ onOpen }: EnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLetterOut, setShowLetterOut] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Overlay form state
  const [place, setPlace] = useState("");
  const [placePreset, setPlacePreset] = useState("");
  const [date, setDate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayCardRef = useRef<HTMLDivElement | null>(null);
  const buttonsWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setShowLetterOut(true), LETTER_SLIDE_DELAY_MS);
    return () => clearTimeout(t);
  }, [isOpen]);

  const handleLetterClick = () => {
    if (!isOpen) return;
    setFadeOut(true);
    setTimeout(() => setShowOverlay(true), 450);
  };

  const handleOpenClick = () => {
    if (isOpen) return;
    setIsOpen(true);
    onOpen?.();
  };

  const placeOk = place.trim().length > 0 || placePreset.trim().length > 0;
  const canSend = placeOk && !!date;

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleYes = async () => {
    setTouchedSubmit(true);
    if (isSending) return;
    if (!canSend) {
      const needPlace = !placeOk;
      const needDate = !date;
      const message =
        needPlace && needDate
          ? "Выберите место и дату"
          : needPlace
          ? "Пожалуйста, выберите место"
          : "Пожалуйста, выберите дату";
      showToast(message);
      return;
    }
    setIsSending(true);
    setSendError(null);
    try {
      const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      if (!BOT_TOKEN || !CHAT_ID) throw new Error("Нет Telegram настроек");
      const chosenPlace = placePreset || place;
      const msg = `\uD83C\uDF3A Приглашение\n\nПойдём гулять?\nГде: ${chosenPlace}\nКогда: ${date}`;
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg }),
      });
      if (!res.ok) throw new Error("Ошибка отправки");
      setSent(true);
    } catch (e: any) {
      setSendError(e?.message || "Неизвестная ошибка");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
      {/* Full letter overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="min-h-full flex justify-center px-2 py-4">
            <div
              ref={overlayCardRef}
              className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-8 max-w-sm w-full full-letter-enter envelope-shadow relative overflow-visible"
            >
              <h2 className="text-3xl font-ruslan text-center mb-2">
                Небольшая прогулка?
              </h2>
              <p className="font-marck text-lg leading-relaxed text-gray-800 text-center mb-3">
                Давай выберем место и день — совсем ненадолго, просто пройтись и
                вместе улыбнуться.
              </p>

              <PlaceInput
                place={place}
                setPlace={setPlace}
                preset={placePreset}
                setPreset={setPlacePreset}
                error={touchedSubmit && !placeOk}
              />

              <label className="block text-sm font-marck mt-4 mb-1">
                Когда?
              </label>
              <DatePicker value={date} onChange={setDate} />

              {sendError && (
                <div className="mt-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm">
                  {sendError}
                </div>
              )}
              {sent && (
                <div className="mt-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium">
                  Отправлено! Жду ответа в Telegram 💛
                </div>
              )}

              <div
                ref={buttonsWrapRef}
                className="mt-4 h-28 relative flex flex-col items-center justify-center"
              >
                {toast && (
                  <div className="absolute -top-2 translate-y-[-100%] px-3 py-2 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-marck text-sm shadow toast-appear">
                    {toast}
                  </div>
                )}
                <button
                  onClick={handleYes}
                  aria-disabled={!canSend}
                  className={`px-6 py-3 rounded-full border font-marck active:scale-95 ${
                    canSend
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-gray-100 text-gray-400 border-gray-200 opacity-90"
                  }`}
                >
                  Согласиться
                </button>
              </div>

              <div className="text-sm font-marck text-gray-800 text-center mt-4">
                P.S. Я очень жду ответа Enver O.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Envelope view */}
      <div
        ref={containerRef}
        className={`relative envelope-shadow perspective-1000 rounded-lg ${
          fadeOut ? "envelope-fade-out pointer-events-none" : ""
        }`}
        style={{ width: "86vw", maxWidth: 360, height: "54vw", maxHeight: 220 }}
      >
        {/* Back panel */}
        <div className="absolute inset-0 bg-[#DFB891] rounded-lg border border-gray-300 z-10" />

        {/* Letter (starts under pocket-front) */}
        <div
          className={`absolute left-3 right-3 top-3 bottom-3 bg-white rounded-md envelope-shadow flex items-center justify-center transition-transform z-20 ${
            showLetterOut ? "letter-slide-out" : ""
          }`}
          onClick={handleLetterClick}
          role="button"
          aria-label="Открыть письмо"
        >
          <div className="text-center select-none">
            <div className="text-2xl font-ruslan mb-1">Письмо для Вас</div>
            <div className="text-base font-marck text-gray-700">
              Нажмите на письмо, чтобы его открыть
            </div>
          </div>
        </div>

        {/* Pocket front (covers lower ~70%) */}
        <div
          className="absolute left-0 right-0 bg-[#DFB891] border-t border-gray-300 z-30"
          style={{
            top: "28%",
            bottom: 0,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        />

        {/* Top flap */}
        <div
          className={`absolute left-0 right-0 top-0 h-1/2 bg-[#DFB891] border-b border-black rounded-t-lg origin-top transition-transform duration-700 preserve-3d z-40 ${
            isOpen ? "flip-open" : ""
          }`}
          style={{ backfaceVisibility: "hidden" }}
        />

        {/* Icon button */}
        <button
          onClick={handleOpenClick}
          disabled={isOpen}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DFB891]  transition-all z-50 flex flex-col items-center justify-center ${
            isOpen
              ? "opacity-0 pointer-events-none scale-90"
              : "active:scale-95"
          }`}
          aria-label="Открыть конверт"
        >
          <img
            src="/src/assets/stamp.png"
            alt="icon"
            className="h-25 w-auto p-0"
          />
          <span className="text-xs font-marck text-white text-center absolute left-0 right-0 font-ruslan">
            Открыть <br /> конверт
          </span>
        </button>
      </div>
    </div>
  );
}
