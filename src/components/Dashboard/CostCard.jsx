export default function CostCard({ label, amount, delta, positive = true }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{amount}</p>
      <p className={`mt-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-rose-600"}`}>
        {delta}
      </p>
    </article>
  );
}
