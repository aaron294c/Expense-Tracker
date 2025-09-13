export function SnapRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar">
      {children}
    </div>
  );
}