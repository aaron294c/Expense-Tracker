// components/_layout/Screen.tsx (presentational only)
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[480px] px-4 pt-3 pb-[96px] overflow-x-hidden">
      {children}
    </div>
  );
}