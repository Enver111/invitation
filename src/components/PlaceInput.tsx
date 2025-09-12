interface PlaceInputProps {
  place: string;
  setPlace: (v: string) => void;
  preset: string;
  setPreset: (v: string) => void;
  presets?: string[];
  error?: boolean;
}

const defaultPresets = ["Парк", "Кино", "Кофейня", "Набережная"];

export default function PlaceInput({
  place,
  setPlace,
  preset,
  setPreset,
  presets = defaultPresets,
  error = false,
}: PlaceInputProps) {
  const handleChip = (val: string) => {
    setPreset(val);
    if (val) setPlace("");
  };

  const inputClass = `input-fluid rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 ${
    error
      ? "border-rose-300 focus:ring-rose-300"
      : "border-gray-300 focus:ring-amber-400"
  }`;

  return (
    <div className="w-full">
      <label className="block text-base font-marck mb-2">Где?</label>
      <input
        type="text"
        placeholder="На Ваше усмотрение"
        className={`${inputClass} font-marck`}
        value={place}
        onChange={(e) => {
          setPlace(e.target.value);
          if (preset) setPreset("");
        }}
      />
      <div className="text-center text-base text-gray-500 my-2 font-marck">
        или
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleChip(p)}
            className={`px-3 py-2 rounded-full border text-sm font-marck ${
              preset === p
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-white text-gray-800 border-gray-300"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleChip("")}
          className={`px-3 py-2 rounded-full border text-sm font-marck ${
            preset === ""
              ? "bg-rose-100 text-rose-800 border-rose-300"
              : "bg-white text-gray-800 border-gray-300"
          }`}
        >
          Другое
        </button>
      </div>
    </div>
  );
}
