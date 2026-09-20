import { useMemo, useState } from "react";
import CostChart from "../components/Charts/CostChart.jsx";
import WarehouseLoadChart from "../components/Charts/WarehouseLoadChart.jsx";
import MetricCard from "../components/Dashboard/MetricCard.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import { useOptimization } from "../context/OptimizationContext.jsx";
import { costDistribution, kpis, warehouseLoad } from "../data/mockData";

function simulate({ demandIncrease, warehouseCount, capacity, trafficMultiplier }) {
  const demandFactor = 1 + demandIncrease / 100;
  const trafficPenalty = trafficMultiplier;
  const hubFactor = warehouseCount / 4;
  const capacityFactor = capacity / 14000;

  const simulatedOrders = Math.round(kpis.totalOrders * demandFactor);
  const simulatedCost = Math.round(
    (kpis.weightedCost * demandFactor * trafficPenalty) / Math.max(hubFactor, 0.5),
  );
  const simulatedDistance = Number(
    ((kpis.averageDeliveryDistance * trafficPenalty) / Math.sqrt(hubFactor)).toFixed(1),
  );
  const simulatedCoverage = Math.min(
    99.6,
    Number((kpis.coveragePercentage + (hubFactor - 1) * 3 - (demandFactor - 1) * 8).toFixed(1)),
  );
  const simulatedUtil = Math.min(
    99,
    Math.round((kpis.warehouseUtilization * demandFactor) / Math.max(capacityFactor, 0.4)),
  );
  const simulatedSavings = Math.round(
    kpis.estimatedSavings * hubFactor * (configCarbonBoost(trafficMultiplier)),
  );

  return {
    orders: simulatedOrders,
    cost: simulatedCost,
    distance: simulatedDistance,
    coverage: simulatedCoverage,
    utilization: simulatedUtil,
    savings: simulatedSavings,
    charts: {
      cost: costDistribution.map((c) => ({
        ...c,
        cost: Math.round((c.cost * demandFactor * trafficPenalty) / hubFactor),
      })),
      load: warehouseLoad.slice(0, warehouseCount).map((w) => ({
        ...w,
        assigned: Math.round(w.assigned * demandFactor),
        capacity,
      })),
    },
  };
}

function configCarbonBoost(traffic) {
  return traffic > 1.2 ? 0.92 : 1.04;
}

export default function ScenarioPage() {
  const { scenario, setScenario } = useOptimization();
  const [local, setLocal] = useState(scenario);

  const current = useMemo(
    () => ({
      orders: kpis.totalOrders,
      cost: kpis.weightedCost,
      distance: kpis.averageDeliveryDistance,
      coverage: kpis.coveragePercentage,
      utilization: kpis.warehouseUtilization,
      savings: kpis.estimatedSavings,
    }),
    [],
  );

  const simulated = useMemo(
    () =>
      local.ran
        ? simulate(local)
        : {
            ...current,
            charts: { cost: costDistribution, load: warehouseLoad },
          },
    [local, current],
  );

  const diff = (a, b, suffix = "") => {
    const d = b - a;
    const sign = d >= 0 ? "+" : "";
    return `${sign}${typeof d === "number" && !Number.isInteger(d) ? d.toFixed(1) : d}${suffix}`;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Scenario simulator</h2>
          <p className="mt-1 text-sm text-slate-500">
            Adjust local parameters and run a mock simulation. No API calls are made.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
            <label className="block text-sm">
              <div className="mb-2 flex justify-between">
                <span className="font-medium">Demand increase</span>
                <span>{local.demandIncrease}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={local.demandIncrease}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, demandIncrease: Number(e.target.value), ran: false }))
                }
                className="w-full accent-indigo-600"
              />
            </label>
            <label className="block text-sm">
              <div className="mb-2 flex justify-between">
                <span className="font-medium">Warehouse count</span>
                <span>{local.warehouseCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={local.warehouseCount}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, warehouseCount: Number(e.target.value), ran: false }))
                }
                className="w-full accent-indigo-600"
              />
            </label>
            <label className="block text-sm">
              <div className="mb-2 flex justify-between">
                <span className="font-medium">Capacity</span>
                <span>{local.capacity.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={local.capacity}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, capacity: Number(e.target.value), ran: false }))
                }
                className="w-full accent-indigo-600"
              />
            </label>
            <label className="block text-sm">
              <div className="mb-2 flex justify-between">
                <span className="font-medium">Traffic multiplier</span>
                <span>{local.trafficMultiplier.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.8"
                step="0.1"
                value={local.trafficMultiplier}
                onChange={(e) =>
                  setLocal((s) => ({
                    ...s,
                    trafficMultiplier: Number(e.target.value),
                    ran: false,
                  }))
                }
                className="w-full accent-indigo-600"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const next = { ...local, ran: true };
                setLocal(next);
                setScenario(next);
              }}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Run simulation
            </button>
          </section>

          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            <MetricCard label="Current orders" value={current.orders.toLocaleString()} />
            <MetricCard
              label="Simulated orders"
              value={simulated.orders.toLocaleString()}
              hint={local.ran ? diff(current.orders, simulated.orders) : "Run to compare"}
              accent="sky"
            />
            <MetricCard
              label="Difference"
              value={local.ran ? diff(current.orders, simulated.orders) : "—"}
              accent="amber"
            />
            <MetricCard label="Current cost" value={`₹${current.cost.toLocaleString()}`} />
            <MetricCard
              label="Simulated cost"
              value={`₹${simulated.cost.toLocaleString()}`}
              hint={local.ran ? diff(current.cost, simulated.cost) : "Run to compare"}
            />
            <MetricCard
              label="Distance delta"
              value={local.ran ? diff(current.distance, simulated.distance, " km") : "—"}
              hint={`Coverage ${local.ran ? diff(current.coverage, simulated.coverage, "%") : "awaiting run"}`}
              accent="emerald"
            />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Simulated cost mix</h3>
            <CostChart data={simulated.charts.cost} />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Simulated warehouse load</h3>
            <WarehouseLoadChart data={simulated.charts.load} />
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
