import { CheckCircle2, Sparkles } from "lucide-react";
import { algorithms } from "../../data/mockData";
import { useOptimization } from "../../context/OptimizationContext.jsx";

export default function AlgorithmSelector() {
  const { config } = useOptimization();
  const algo = algorithms[0];

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-base font-semibold text-slate-900">{algo.name}</p>
              <p className="text-xs font-medium text-indigo-700">warehouse.py Algorithm</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            <CheckCircle2 size={13} /> Active Solver
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          {algo.description}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3 text-[11px]">
          <div className="rounded-xl border border-indigo-100 bg-white p-2.5">
            <p className="font-semibold text-indigo-950">Phase 1: DBSCAN Clustering</p>
            <p className="mt-0.5 text-slate-500">Groups spatial points by density threshold within search radius.</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-2.5">
            <p className="font-semibold text-indigo-950">Phase 2: Gradient Descent</p>
            <p className="mt-0.5 text-slate-500">Planar local XY projection optimizing continuous hub coordinates.</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-white p-2.5">
            <p className="font-semibold text-indigo-950">Phase 3: 1.5x Reallocation</p>
            <p className="mt-0.5 text-slate-500">Integrates noise up to 1.5x delivery radius while strictly enforcing capacity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
