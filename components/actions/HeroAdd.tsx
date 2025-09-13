import { Plus } from "lucide-react";

export function HeroAdd({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={onClick}
        className="
          size-20 rounded-full
          bg-[#2563eb] text-white
          shadow-[0_20px_40px_rgba(37,99,235,0.35)]
          ring-8 ring-white
          active:scale-95 transition grid place-items-center
        "
      >
        <Plus className="size-8" />
      </button>
    </div>
  );
}