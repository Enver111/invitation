import { useEffect, useRef, useState } from "react";
import PlaceInput from "./PlaceInput";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
import stampPng from "../assets/stamp.png";

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
  const [time, setTime] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
  const dateOk = !!date;
  const canSend = placeOk && dateOk && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const handleYes = async () => {
    setTouchedSubmit(true);
    if (isSending) return;
    if (!canSend) {
      const needPlace = !placeOk;
      const needDate = !dateOk;
      const needTime = !/^([01]\d|2[0-3]):[0-5]\d$/.test(time);
      const parts: string[] = [];
      if (needPlace) parts.push("место");
      if (needDate) parts.push("дату");
      if (needTime) parts.push("время");
      const message = `Выберите: ${parts.join(", ")}`;
      showToast(message);
      return;
    }
    setIsSending(true);
    try {
      const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      if (!BOT_TOKEN || !CHAT_ID) throw new Error("Нет Telegram настроек");
      const chosenPlace = placePreset || place;
      const msg = `\uD83C\uDF3A Приглашение\n\nПойдём гулять?\nГде: ${chosenPlace}\nКогда: ${date} ${time}`;
      const url = `/telegram/bot${BOT_TOKEN}/sendMessage`;
      // Try 1: x-www-form-urlencoded
      let ok = false;
      let lastError: any = null;
      // form-encoded
      try {
        const body = new URLSearchParams({
          chat_id: String(CHAT_ID),
          text: msg,
        });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body,
        });
        const raw = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(raw);
        } catch {}
        if (!res.ok || (data && data.ok === false)) {
          console.warn("Telegram try1 form-urlencoded failed:", {
            status: res.status,
            raw,
            data,
          });
          lastError = data || raw || res.status;
        } else {
          ok = true;
        }
      } catch (e: any) {
        console.warn("Telegram try1 exception:", e?.message || e);
        lastError = e;
      }

      // Try 2: JSON
      if (!ok) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: Number(CHAT_ID), text: msg }),
          });
          const raw = await res.text();
          let data: any = null;
          try {
            data = JSON.parse(raw);
          } catch {}
          if (!res.ok || (data && data.ok === false)) {
            console.warn("Telegram try2 JSON failed:", {
              status: res.status,
              raw,
              data,
            });
            lastError = data || raw || res.status;
          } else {
            ok = true;
          }
        } catch (e: any) {
          console.warn("Telegram try2 exception:", e?.message || e);
          lastError = e;
        }
      }

      // Try 3: GET query (last resort)
      if (!ok) {
        try {
          const getUrl = `/telegram/bot${BOT_TOKEN}/sendMessage?chat_id=${encodeURIComponent(
            String(CHAT_ID)
          )}&text=${encodeURIComponent(msg)}`;
          const res = await fetch(getUrl, { method: "GET" });
          const raw = await res.text();
          let data: any = null;
          try {
            data = JSON.parse(raw);
          } catch {}
          if (!res.ok || (data && data.ok === false)) {
            console.error("Telegram try3 GET failed:", {
              status: res.status,
              raw,
              data,
            });
            lastError = data || raw || res.status;
          } else {
            ok = true;
          }
        } catch (e: any) {
          console.error("Telegram try3 exception:", e?.message || e);
          lastError = e;
        }
      }

      if (!ok) {
        throw new Error(
          (lastError && (lastError.description || String(lastError))) ||
            "Bad Request"
        );
      }
      setSent(true);
      setSuccessToast("Ураааааа! 💛");
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (e: any) {
      console.error("Telegram send exception:", e?.message || e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center">
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

              <label className="block text-sm font-marck mt-4 mb-1">
                Во сколько?
              </label>
              <TimePicker
                value={time}
                onChange={setTime}
                error={touchedSubmit && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)}
              />

              <div
                ref={buttonsWrapRef}
                className="mt-4 h-28 relative flex flex-col items-center justify-center"
              >
                {toast && (
                  <div className="absolute -top-2 translate-y-[-100%] px-3 py-2 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-marck text-sm shadow toast-appear">
                    {toast}
                  </div>
                )}
                {successToast && (
                  <div className="absolute -top-2 translate-y-[-100%] px-3 py-2 rounded-full bg-green-100 text-green-800 border border-green-300 font-marck text-sm shadow toast-appear">
                    {successToast}
                  </div>
                )}
                <button
                  onClick={handleYes}
                  aria-disabled={!canSend || isSending}
                  className={`px-6 py-3 rounded-full border font-marck transition-all ${
                    canSend && !isSending
                      ? "bg-amber-100 text-amber-800 border-amber-300 active:scale-95"
                      : "bg-gray-100 text-gray-400 border-gray-200 opacity-90"
                  }`}
                  disabled={isSending}
                >
                  {isSending ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="btn-spinner" />
                      <span>Отправляю…</span>
                    </span>
                  ) : (
                    "Согласиться"
                  )}
                </button>

                <div className="text-sm font-marck text-gray-800 text-center mt-4">
                  P.S. Я очень жду ответа Enver O.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative envelope-shadow perspective-1000 rounded-lg ${
          fadeOut ? "envelope-fade-out pointer-events-none" : ""
        }`}
        style={{ width: "86vw", maxWidth: 360, height: "54vw", maxHeight: 220 }}
      >
        <div className="absolute inset-0 bg-[#DFB891] rounded-lg border border-gray-300 z-10" />
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
        <div
          className="absolute left-0 right-0 bg-[#DFB891] border-t border-gray-300 z-30"
          style={{
            top: "28%",
            bottom: 0,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        />
        <div
          className={`absolute left-0 right-0 top-0 h-1/2 bg-[#DFB891] border-b border-black rounded-t-lg origin-top transition-transform duration-700 preserve-3d z-40 ${
            isOpen ? "flip-open" : ""
          }`}
          style={{ backfaceVisibility: "hidden" }}
        />
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
          <img src={stampPng} alt="icon" className="h-25 w-auto p-0" />
          <span className="text-xs font-marck text-white text-center absolute left-0 right-0 font-ruslan">
            Открыть <br /> конверт
          </span>
        </button>
      </div>
    </div>
  );
}
