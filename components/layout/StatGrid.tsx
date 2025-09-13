export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      {children}
    </div>
  );
}