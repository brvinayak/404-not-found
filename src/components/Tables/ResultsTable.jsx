import NeighborhoodTable from "./NeighborhoodTable.jsx";
import WarehouseTable from "./WarehouseTable.jsx";

export default function ResultsTable({ warehouses = [], assignments = [], neighborhoods = [] }) {
  const pointsData = assignments.length > 0 ? assignments : neighborhoods;

  return (
    <div className="grid gap-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Optimal Warehouse Hubs</h3>
          <span className="text-xs text-slate-500">{warehouses.length} active hubs</span>
        </div>
        <WarehouseTable rows={warehouses} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Point Allocations & Cluster Status</h3>
          <span className="text-xs text-slate-500">{pointsData.length} locations mapped</span>
        </div>
        <NeighborhoodTable rows={pointsData} />
      </section>
    </div>
  );
}
