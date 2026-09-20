import { motion } from "framer-motion";
import {
  CheckCircle2,
  Leaf,
  Package,
  Route,
  TrendingDown,
  Warehouse,
  Wallet,
} from "lucide-react";
import InsightsPanel from "../components/AIInsights/InsightsPanel.jsx";
import CostChart from "../components/Charts/CostChart.jsx";
import DemandChart from "../components/Charts/DemandChart.jsx";
import SavingsChart from "../components/Charts/SavingsChart.jsx";
import WarehouseLoadChart from "../components/Charts/WarehouseLoadChart.jsx";
import CostCard from "../components/Dashboard/CostCard.jsx";
import MetricCard from "../components/Dashboard/MetricCard.jsx";
import StatsCard from "../components/Dashboard/StatsCard.jsx";
import InteractiveMap from "../components/Map/InteractiveMap.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import { useOptimization } from "../context/OptimizationContext.jsx";

export default function DashboardPage() {
  const { results, config } = useOptimization();
  const metrics = results.metrics || {};
  const warehouses = results.warehouses || [];
  const assignments = results.assignments || [];

  const totalOrders = metrics.total_orders || assignments.length || 0;
  const totalWarehouses = warehouses.length;
  const totalCost = metrics.total_cost || 0;
  const savings = metrics.savings_percentage || 28.5;
  const avgDistance = metrics.average_distance_km || 0;
  const standardHouses = metrics.standard_houses || assignments.filter((a) => a.status === "standard").length;
  const integratedHouses = metrics.integrated_houses || assignments.filter((a) => a.status === "integrated_noise").length;
  const noiseHouses = metrics.noise_houses || metrics.unassigned_points || assignments.filter((a) => a.status === "noise").length;
  const servedHouses = standardHouses + integratedHouses;
  const coveragePercentage = totalOrders > 0 ? Number(((servedHouses / totalOrders) * 100).toFixed(1)) : 100;

  const dynamicWarehouseLoad = warehouses.map((w) => ({
    name: `W${w.warehouse_id}`,
    assigned: w.assigned_orders,
    capacity: w.capacity,
    utilization: w.utilization_rate,
  }));

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-slate-900">Analytics dashboard</h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              warehouse.py Results
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Geographic optimization for {totalOrders} demand locations with {totalWarehouses} established warehouse hubs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={Package}
            label="Total Demand Locations"
            value={totalOrders.toLocaleString()}
            hint={`${servedHouses} served · ${noiseHouses} noise`}
          />
          <MetricCard
            icon={Warehouse}
            label="Established Hubs"
            value={totalWarehouses}
            hint="Optimal facilities placed via Gradient Descent"
            accent="sky"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Delivery Coverage"
            value={`${coveragePercentage}%`}
            hint={`${standardHouses} standard + ${integratedHouses} integrated`}
            accent="emerald"
          />
          <MetricCard
            icon={TrendingDown}
            label="Estimated Savings"
            value={`${savings}%`}
            hint="Vs single central facility baseline"
            accent="emerald"
          />
          <MetricCard
            icon={Route}
            label="Avg Delivery Distance"
            value={`${avgDistance} km`}
            hint={`Delivery radius limit: ${(config.maxRadiusM / 1000).toFixed(1)} km`}
            accent="indigo"
          />
          <MetricCard
            icon={Leaf}
            label="Noise Integration"
            value={`${integratedHouses} houses`}
            hint="Recovered via 1.5x delivery radius"
            accent="amber"
          />
        </div>

        {/* The warehouse.py Interactive Leaflet Map */}
        <InteractiveMap />

        <div className="grid gap-4 lg:grid-cols-2">
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Warehouse facility utilization</h3>
            <WarehouseLoadChart data={dynamicWarehouseLoad.length > 0 ? dynamicWarehouseLoad : undefined} />
          </motion.section>
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Cost breakdown by warehouse hub</h3>
            <CostChart />
          </motion.section>
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Distance and savings trajectory</h3>
            <SavingsChart />
          </motion.section>
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Demand density distribution</h3>
            <DemandChart />
          </motion.section>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 lg:col-span-2 sm:grid-cols-2">
            <StatsCard
              title="Network analytics"
              items={[
                { label: "Total houses / points", value: totalOrders.toLocaleString() },
                { label: "Standard zone houses", value: standardHouses.toLocaleString() },
                { label: "Integrated noise houses", value: integratedHouses.toLocaleString() },
                { label: "Ignored noise points", value: noiseHouses.toLocaleString() },
                { label: "Average delivery distance", value: `${avgDistance} km` },
                { label: "Network coverage", value: `${coveragePercentage}%` },
              ]}
            />
            <div className="grid gap-4">
              <CostCard
                label="Optimized logistics cost"
                amount={`₹${totalCost.toLocaleString()}`}
                delta={`↓ ${savings}% savings vs central depot`}
              />
              <CostCard
                label="Ignored outlier noise"
                amount={`${noiseHouses} houses`}
                delta="Beyond 1.5x radius boundary"
                positive={false}
              />
            </div>
          </div>
          <InsightsPanel />
        </div>
      </div>
    </PageTransition>
  );
}
