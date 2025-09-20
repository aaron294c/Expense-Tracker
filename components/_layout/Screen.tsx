// components/_layout/Screen.tsx (presentational only)
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[480px] px-6 pt-6 pb-[120px] overflow-x-hidden">
      {children}
    </div>
  );
}