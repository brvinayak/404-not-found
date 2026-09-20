import { useOptimization } from "../../context/OptimizationContext.jsx";
import { Warehouse } from "lucide-react";

export default function WarehouseSelector() {
  const { config, setConfig } = useOptimization();
  const currentCount = config.warehouseCount || 3;
  const presets = [2, 3, 4, 5, 8];

  return (
    <div className="space-y-4">
      {/* 1. Target Number of Warehouses */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium text-slate-900">
            <Warehouse size={16} className="text-indigo-600" />
            Number of Warehouses
          </span>
          <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white shadow-2xs">
            {currentCount} {currentCount === 1 ? "Warehouse" : "Warehouses"}
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="15"
          step="1"
          value={currentCount}
          onChange={(e) =>
            setConfig((c) => ({ ...c, warehouseCount: Number(e.target.value) }))
          }
          className="w-full accent-indigo-600 cursor-pointer"
        />

        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>1 Hub</span>
          <span>5 Hubs</span>
          <span>10 Hubs</span>
          <span>15 Hubs</span>
        </div>

        {/* Quick Select Buttons */}
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">Presets:</span>
          {presets.map((count) => (
            <button
              key={`preset-${count}`}
              type="button"
              onClick={() => setConfig((c) => ({ ...c, warehouseCount: count }))}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                currentCount === count
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          Optimization will establish and display <strong>exactly {currentCount}</strong> warehouses on the map.
        </p>
      </div>

      {/* 2. Delivery Radius */}
      <div className="pt-2 border-t border-slate-100">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Delivery Radius</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {(config.maxRadiusM / 1000).toFixed(1)} km ({config.maxRadiusM} m)
          </span>
        </div>
        <input
          type="range"
          min="500"
          max="10000"
          step="250"
          value={config.maxRadiusM}
          onChange={(e) =>
            setConfig((c) => ({ ...c, maxRadiusM: Number(e.target.value) }))
          }
          className="w-full accent-indigo-600 cursor-pointer"
        />
        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
          <span>0.5 km</span>
          <span>Standard: 2.0 km</span>
          <span>10 km</span>
        </div>
      </div>
    </div>
  );
}
