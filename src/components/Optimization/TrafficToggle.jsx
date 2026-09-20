import { useOptimization } from "../../context/OptimizationContext.jsx";

export default function TrafficToggle() {
  const { config, setConfig } = useOptimization();

  return (
    <button
      type="button"
      onClick={() => setConfig((c) => ({ ...c, trafficEnabled: !c.trafficEnabled }))}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left"
    >
      <span>
        <span className="block text-sm font-semibold text-slate-900">Traffic impact</span>
        <span className="mt-1 block text-xs text-slate-500">
          Weight routes by peak-hour congestion across Bengaluru corridors.
        </span>
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          config.trafficEnabled ? "bg-indigo-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            config.trafficEnabled ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
