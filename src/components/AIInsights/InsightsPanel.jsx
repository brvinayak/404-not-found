import { AlertTriangle, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { insights } from "../../data/mockData";

const icons = {
  warning: AlertTriangle,
  info: TrendingUp,
  success: Sparkles,
  alert: Lightbulb,
};

const tones = {
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  alert: "border-indigo-200 bg-indigo-50 text-indigo-800",
};

export default function InsightsPanel() {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">AI insights</h3>
      <p className="mt-1 text-xs text-slate-500">Static recommendations from mock network analysis.</p>
      <div className="mt-4 space-y-3">
        {insights.map((item) => {
          const Icon = icons[item.tone];
          return (
            <article key={item.id} className={`rounded-xl border p-3 ${tones[item.tone]}`}>
              <div className="flex items-start gap-2">
                <Icon size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 opacity-90">{item.body}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
