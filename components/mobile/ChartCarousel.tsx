export function ChartCarousel({ slides }:{ slides: React.ReactNode[] }) {
  return (
    <div className="mt-4 overflow-x-auto snap-x snap-mandatory no-scrollbar flex gap-3">
      {slides.map((s, i) => (
        <div key={i} className="min-w-[calc(100%-0px)] snap-start rounded-2xl bg-white border border-gray-100 shadow p-4">
          {s}
        </div>
      ))}
    </div>
  );
}