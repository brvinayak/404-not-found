export default function StatsCard({ title, items }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-3">
            <dt className="text-xs text-slate-500">{item.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
