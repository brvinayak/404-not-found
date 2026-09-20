import { useOptimization } from "../../context/OptimizationContext.jsx";

export default function CapacitySlider() {
  const { config, setConfig } = useOptimization();

  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Max Houses per Warehouse</span>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          {config.maxClusterSize} houses
        </span>
      </div>
      <input
        type="range"
        min="10"
        max="500"
        step="10"
        value={config.maxClusterSize}
        onChange={(e) =>
          setConfig((c) => ({
            ...c,
            maxClusterSize: Number(e.target.value),
            capacity: Number(e.target.value),
          }))
        }
        className="w-full accent-indigo-600"
      />
      <div className="mt-1 flex justify-between text-[11px] text-slate-400">
        <span>10</span>
        <span>Default: 100</span>
        <span>500</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Strict capacity limit per warehouse hub.
      </p>
    </label>
  );
}
