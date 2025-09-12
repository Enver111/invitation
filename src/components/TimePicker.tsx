import React, { useEffect, useRef, useState } from "react";

interface TimePickerProps {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

export default function TimePicker({
  value,
  onChange,
  error = false,
}: TimePickerProps) {
  const parseFromValue = (val: string) => {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(val);
    return m ? { hh: m[1], mm: m[2] } : { hh: "", mm: "" };
  };

  const [{ hh, mm }, setLocal] = useState(() => parseFromValue(value));
  const hourRef = useRef<HTMLInputElement | null>(null);
  const minRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Sync from external value (e.g., reset)
    setLocal(parseFromValue(value));
  }, [value]);

  const borderClass = error ? "border-rose-300" : "border-gray-300";
  const ringClass = error ? "focus:ring-rose-300" : "focus:ring-amber-400";

  const updateCombined = (nextH: string, nextM: string) => {
    if (nextH.length === 2 && nextM.length === 2) {
      const hNum = clamp(parseInt(nextH, 10), 0, 23);
      const mNum = clamp(parseInt(nextM, 10), 0, 59);
      const hStr = hNum.toString().padStart(2, "0");
      const mStr = mNum.toString().padStart(2, "0");
      onChange(`${hStr}:${mStr}`);
    } else {
      onChange("");
    }
  };

  const onHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    setLocal((prev) => ({ ...prev, hh: digits }));
    if (digits.length === 2) {
      // Clamp preview immediately
      const hNum = clamp(parseInt(digits, 10), 0, 23);
      const hStr = hNum.toString().padStart(2, "0");
      setLocal((prev) => ({ ...prev, hh: hStr }));
      setTimeout(() => minRef.current?.focus(), 0);
      updateCombined(hStr, mm);
    } else {
      updateCombined(digits, mm);
    }
  };

  const onMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    setLocal((prev) => ({ ...prev, mm: digits }));
    if (digits.length === 2) {
      const mNum = clamp(parseInt(digits, 10), 0, 59);
      const mStr = mNum.toString().padStart(2, "0");
      setLocal((prev) => ({ ...prev, mm: mStr }));
      updateCombined(hh, mStr);
      setTimeout(() => minRef.current?.blur(), 0);
    } else {
      updateCombined(hh, digits);
    }
  };

  const boxClass = `w-16 text-center rounded-lg border ${borderClass} px-2 py-2 text-base font-marck focus:outline-none focus:ring-2 ${ringClass}`;

  return (
    <div className="w-full">
      <div className="w-full rounded-lg px-3 py-3 flex items-center justify-center gap-3">
        <input
          ref={hourRef}
          inputMode="numeric"
          pattern="^\\d{2}$"
          placeholder="чч"
          className={boxClass}
          value={hh}
          onChange={onHoursChange}
          maxLength={2}
        />
        <div className="font-marck text-lg">:</div>
        <input
          ref={minRef}
          inputMode="numeric"
          pattern="^\\d{2}$"
          placeholder="мм"
          className={boxClass}
          value={mm}
          onChange={onMinutesChange}
          maxLength={2}
        />
      </div>
      <div className="text-center text-sm text-gray-500 mt-1 font-marck">
        Введите часы и минуты
      </div>
    </div>
  );
}
