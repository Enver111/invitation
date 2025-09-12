import React, { useEffect, useMemo, useState } from "react";

interface DatePickerProps {
  value: string;
  onChange: (v: string) => void;
}

function toISO(date: Date) {
  return date.toISOString().split("T")[0];
}

function getMonthDays(year: number, month0: number) {
  const first = new Date(year, month0, 1);
  const last = new Date(year, month0 + 1, 0);
  const startWeekday = (first.getDay() + 6) % 7; // Mon=0
  const days = last.getDate();
  return { startWeekday, days };
}

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const initial = value ? new Date(value) : new Date();
  const [cursor, setCursor] = useState<Date>(
    new Date(initial.getFullYear(), initial.getMonth(), 1)
  );
  const [selected, setSelected] = useState<string>(value);

  useEffect(() => setSelected(value), [value]);

  const { year, month0 } = useMemo(
    () => ({ year: cursor.getFullYear(), month0: cursor.getMonth() }),
    [cursor]
  );
  const { startWeekday, days } = useMemo(
    () => getMonthDays(year, month0),
    [year, month0]
  );

  const weeks = useMemo(() => {
    const cells = Array.from(
      { length: startWeekday },
      () => null as number | null
    ).concat(Array.from({ length: days }, (_, i) => i + 1));
    while (cells.length % 7 !== 0) cells.push(null);
    const chunks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7)
      chunks.push(cells.slice(i, i + 7));
    return chunks;
  }, [startWeekday, days]);

  const handlePick = (d: number | null) => {
    if (!d) return;
    const picked = toISO(new Date(year, month0, d));
    setSelected(picked);
    onChange(picked);
  };

  const monthNames = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ];
  const weekNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="px-3 py-1 rounded-lg bg-gray-100"
          onClick={() => setCursor(new Date(year, month0 - 1, 1))}
        >
          ◀
        </button>
        <div className="font-marck text-lg">
          {monthNames[month0]} {year}
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded-lg bg-gray-100"
          onClick={() => setCursor(new Date(year, month0 + 1, 1))}
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
        {weekNames.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weeks.map((row, i) => (
          <React.Fragment key={i}>
            {row.map((d, j) => {
              const iso = d ? toISO(new Date(year, month0, d)) : "";
              const isSel = !!d && selected === iso;
              const base = d
                ? "h-9 rounded-full text-sm font-marck border"
                : "h-9";
              const colors = d
                ? isSel
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-white text-gray-800 border-gray-300"
                : "bg-transparent";
              return (
                <button
                  key={`${i}-${j}`}
                  type="button"
                  aria-selected={isSel}
                  onClick={() => handlePick(d)}
                  className={`${base} ${colors} active:scale-95`}
                >
                  {d || ""}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
