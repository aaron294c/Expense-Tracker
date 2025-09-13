export function AccordionSection({ title, children }: any) {
  // purely presentational; wire to existing state if present
  return (
    <details className="rounded-2xl border border-gray-100 bg-white shadow p-3 open:pb-4">
      <summary className="cursor-pointer list-none flex items-center justify-between px-1 py-2">
        <span className="text-[16px] font-semibold">{title}</span>
        <span className="text-gray-400">▾</span>
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}