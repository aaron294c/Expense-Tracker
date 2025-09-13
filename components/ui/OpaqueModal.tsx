// components/ui/OpaqueModal.tsx
export function OpaqueModal({ open, onClose, children }:{
  open:boolean; onClose:()=>void; children:React.ReactNode
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="
        fixed inset-x-0 bottom-0 z-50
        mx-auto max-w-[480px]
        rounded-t-3xl bg-white
        border border-gray-100
        shadow-[0_-20px_60px_rgba(0,0,0,0.25)]
      ">
        <div className="mx-auto my-2 h-1.5 w-10 rounded-full bg-gray-300" />
        <div className="max-h-[85dvh] overflow-y-auto px-4 pb-6">
          {children}
        </div>
      </div>
    </>
  );
}