import { useEffect, useRef, useState } from "react";

const LETTER_SLIDE_DELAY_MS = 450;

export default function Envelope() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLetterOut, setShowLetterOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => setShowLetterOut(true), LETTER_SLIDE_DELAY_MS);
    return () => clearTimeout(t);
  }, [isOpen]);

  return (
    <div className="w-full flex items-center justify-center">
      <div
        ref={containerRef}
        className="relative envelope-shadow perspective-1000 rounded-lg"
        style={{ width: "86vw", maxWidth: 360, height: "54vw", maxHeight: 220 }}
      >
        {/* Back panel */}
        <div className="absolute inset-0 bg-[#DFB891] rounded-lg border border-gray-300 z-10" />

        {/* Letter (starts under pocket-front) */}
        <div
          className={`absolute left-3 right-3 top-3 bottom-3 bg-white rounded-md envelope-shadow flex items-center justify-center transition-transform z-20 ${
            showLetterOut ? "letter-slide-out" : ""
          }`}
        >
          <div className="text-center">
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
          onClick={() => setIsOpen(true)}
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
