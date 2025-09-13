export function StatCard({ icon, label, value, sub }:{
  icon: React.ReactNode; label:string; value:string; sub?:string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-4 flex flex-col justify-between">
      <div className="size-9 rounded-xl grid place-items-center bg-gray-50 text-gray-600">{icon}</div>
      <p className="mt-2 text-[12.5px] text-gray-500 truncate">{label}</p>
      <p className="mt-1 text-[18px] font-semibold tabular-nums text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-[12px] text-gray-500">{sub}</p>}
    </div>
  );
}