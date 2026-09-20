import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AlgorithmSelector from "../components/Optimization/AlgorithmSelector.jsx";
import CapacitySlider from "../components/Optimization/CapacitySlider.jsx";
import CarbonToggle from "../components/Optimization/CarbonToggle.jsx";
import TrafficToggle from "../components/Optimization/TrafficToggle.jsx";
import WarehouseSelector from "../components/Optimization/WarehouseSelector.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import { useOptimization } from "../context/OptimizationContext.jsx";
import { algorithms } from "../data/mockData";

export default function OptimizationPage() {
  const { config, setConfig, runOptimization, isOptimizing } = useOptimization();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const algo = algorithms[0];

  const handleOptimize = async () => {
    setLoading(true);
    try {
      await runOptimization();
      navigate("/dashboard");
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-medium text-indigo-600">Step 2</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Optimization settings</h2>
          <p className="mt-2 text-sm text-slate-500">
            Configure the warehouse.py solver. Solves density clusters, continuous gradient descent hub placement, and 1.5x noise reallocation.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Optimization algorithm</h3>
          <AlgorithmSelector />
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <WarehouseSelector />
            <CapacitySlider />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="block">
                <div className="mb-1 text-xs font-medium text-slate-700">DBSCAN Search Radius</div>
                <input
                  type="number"
                  min="100"
                  max="5000"
                  step="50"
                  value={config.dbscanEpsM}
                  onChange={(e) => setConfig((c) => ({ ...c, dbscanEpsM: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <span className="text-[10px] text-slate-400">Default: 500 meters</span>
              </label>

              <label className="block">
                <div className="mb-1 text-xs font-medium text-slate-700">Min Cluster Points</div>
                <input
                  type="number"
                  min="2"
                  max="100"
                  step="1"
                  value={config.minPoints}
                  onChange={(e) => setConfig((c) => ({ ...c, minPoints: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <span className="text-[10px] text-slate-400">Default: 15 houses</span>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <TrafficToggle />
            <CarbonToggle />
            <article className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <h3 className="text-sm font-semibold">Configuration summary</h3>
              <dl className="mt-4 space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <dt>Algorithm</dt>
                  <dd className="text-white font-medium">{algo?.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Target Warehouses</dt>
                  <dd className="text-white font-semibold">{config.warehouseCount || 3} Hubs</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Standard Radius (1.0x)</dt>
                  <dd className="text-white">{(config.maxRadiusM / 1000).toFixed(1)} km ({config.maxRadiusM}m)</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Noise Radius (1.5x)</dt>
                  <dd className="text-white">{((config.maxRadiusM * 1.5) / 1000).toFixed(1)} km ({config.maxRadiusM * 1.5}m)</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Max Capacity per Hub</dt>
                  <dd className="text-white">{config.maxClusterSize} houses</dd>
                </div>
                <div className="flex justify-between">
                  <dt>DBSCAN Radius</dt>
                  <dd className="text-white">{config.dbscanEpsM} m</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Min Cluster Neighbours</dt>
                  <dd className="text-white">{config.minPoints} points</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Traffic Multiplier</dt>
                  <dd className="text-white">{config.trafficEnabled ? "Active (1.35x)" : "Off"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Eco Routing</dt>
                  <dd className="text-white">{config.carbonEnabled ? "Active (1.20x)" : "Off"}</dd>
                </div>
              </dl>
              <button
                type="button"
                disabled={loading || isOptimizing}
                onClick={handleOptimize}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50 shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                {loading || isOptimizing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Running warehouse.py solver…
                  </>
                ) : (
                  "Run Optimization"
                )}
              </button>
            </article>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
