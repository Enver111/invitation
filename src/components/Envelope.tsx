import { useEffect, useRef, useState } from "react";
import PlaceInput from "./PlaceInput";
import DatePicker from "./DatePicker";
import TimePicker from "./TimePicker";
import ConfettiCanvas from "./ConfettiCanvas";
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
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [configToast, setConfigToast] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<number>(0);
  const [confettiOrigin, setConfettiOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
  const showConfigHint = (message: string) => {
    setConfigToast(message);
    setTimeout(() => setConfigToast(null), 2200);
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
    const btn = document.activeElement as HTMLElement | null;
    const rect = btn?.getBoundingClientRect();
    if (rect) {
      setConfettiOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
    setConfetti((n) => n + 1);
    setIsSending(true);
    setSendError(null);
    try {
      const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
      if (!BOT_TOKEN || !CHAT_ID) throw new Error("Нет Telegram настроек");
      const chosenPlace = placePreset || place;
      const msg = `\uD83C\uDF3A Приглашение\n\nПойдём гулять?\nГде: ${chosenPlace}\nКогда: ${date} ${time}`;
      const url = `/telegram/bot${BOT_TOKEN}/sendMessage`;
      const body = new URLSearchParams({ chat_id: String(CHAT_ID), text: msg });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body,
      });
      const data = await res.json().catch(() => null as any);
      if (!res.ok)
        throw new Error(
          data && data.description
            ? data.description
            : `Ошибка отправки (${res.status})`
        );
      setSent(true);
    } catch (e: any) {
      const msg = e?.message || "Неизвестная ошибка";
      if (msg.includes("Telegram")) {
        showConfigHint("Нет Telegram настроек");
      } else {
        setSendError(msg);
      }
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
              {confettiOrigin && (
                <ConfettiCanvas
                  origin={confettiOrigin}
                  onDone={() => setConfettiOrigin(null)}
                />
              )}
              {configToast && (
                <div className="absolute left-1/2 -translate-x-1/2 top-2 px-3 py-2 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-marck text-sm shadow toast-appear">
                  {configToast}
                </div>
              )}

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
                  style={{ position: "relative" }}
                >
                  Согласиться
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={`${confetti}-${i}`}
                      className="confetti-piece"
                      style={
                        {
                          left: "50%",
                          top: "50%",
                          backgroundColor: [
                            "#f59e0b",
                            "#fde68a",
                            "#fca5a5",
                            "#86efac",
                            "#93c5fd",
                          ][i % 5],
                          ["--dx" as any]: `${
                            Math.cos((i / 12) * 2 * Math.PI) * 60
                          }px`,
                          ["--dy" as any]: `${
                            Math.sin((i / 12) * 2 * Math.PI) * -60
                          }px`,
                          ["--rot" as any]: `${(i * 90) % 360}deg`,
                          ["--dur" as any]: `${700 + (i % 4) * 80}ms`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
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
