export function MonthPickerPill({
  label,
  onPrev,
  onNext,
}: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="mx-auto mt-3 flex w-fit items-center gap-4 rounded-full border border-gray-200 bg-white px-4 py-2 shadow">
      <button
        type="button"
        aria-label="Previous month"
        onClick={onPrev}
        className="p-1 rounded-full hover:bg-gray-50 active:scale-95 transition"
      >
        ‹
      </button>
      <span className="text-[15px] font-medium">{label}</span>
      <button
        type="button"
        aria-label="Next month"
        onClick={onNext}
        className="p-1 rounded-full hover:bg-gray-50 active:scale-95 transition"
      >
        ›
      </button>
    </div>
  );
}