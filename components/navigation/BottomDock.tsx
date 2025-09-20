import Link from "next/link";
import { useRouter } from "next/router";
import { Home, CreditCard, Target, LineChart, Plus } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Home", Icon: Home },
  { href: "/transactions", label: "Transactions", Icon: CreditCard },
  { href: "/budgets", label: "Budgets", Icon: Target },
  { href: "/insights", label: "Insights", Icon: LineChart },
];

export function BottomDock({ onAdd }: { onAdd: () => void }) {
  const router = useRouter();

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-40
        overflow-visible
      "
      aria-label="Primary"
    >
      <div
        className="
          mx-auto max-w-[480px]
          rounded-t-3xl bg-white/95 backdrop-blur
          border-t border-gray-100/50
          shadow-[0_-12px_40px_rgba(0,0,0,0.08)]
          relative
          h-[80px]
          pb-[calc(env(safe-area-inset-bottom))]
          isolation-auto
        "
      >
        {/* Semicircle 'sunset' notch behind the FAB */}
        <div
          aria-hidden
          className="
            pointer-events-none
            absolute -top-8 left-1/2 -translate-x-1/2
            w-32 h-16 rounded-t-[9999px]
            bg-white/95 backdrop-blur
            border border-gray-100/50
            shadow-[0_-12px_28px_rgba(0,0,0,0.1)]
            z-10
          "
        />

        {/* Raised center FAB (+) */}
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add"
          className="
            absolute left-1/2 -translate-x-1/2 -top-10
            size-[72px] rounded-full
            bg-gradient-to-br from-blue-500 to-blue-600 text-white
            grid place-items-center
            ring-8 ring-white/80
            shadow-[0_20px_40px_rgba(37,99,235,0.4)]
            active:scale-95 transition-all duration-200
            hover:shadow-[0_24px_48px_rgba(37,99,235,0.5)]
            z-20
          "
        >
          <Plus className="size-8" />
        </button>

        {/* Tabs (grid of five; center column reserved for FAB space) */}
        <div className="grid grid-cols-5 h-full items-end">
          <Tab {...TABS[0]} active={router.pathname.startsWith(TABS[0].href)} />
          <Tab {...TABS[1]} active={router.pathname.startsWith(TABS[1].href)} />

          {/* Empty center cell to keep spacing symmetrical under the FAB */}
          <div />

          <Tab {...TABS[2]} active={router.pathname.startsWith(TABS[2].href)} />
          <Tab {...TABS[3]} active={router.pathname.startsWith(TABS[3].href)} />
        </div>
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: any;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative h-full flex flex-col items-center justify-center pt-2"
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span className="absolute top-2 h-1 w-10 rounded-full bg-blue-600" />
      )}
      <Icon className={`size-7 transition-colors ${active ? "text-blue-600" : "text-gray-400"}`} />
      <span className={`mt-2 text-xs font-medium transition-colors ${active ? "text-blue-600" : "text-gray-500"}`}>
        {label}
      </span>
    </Link>
  );
}