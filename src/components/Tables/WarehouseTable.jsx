import { motion } from "framer-motion";

export default function WarehouseTable({ rows = [] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        No warehouses established. Run optimization to generate locations.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Warehouse Hub</th>
              <th className="px-4 py-3">Coordinates (Lat, Lon)</th>
              <th className="px-4 py-3">Standard Houses</th>
              <th className="px-4 py-3">Integrated Noise</th>
              <th className="px-4 py-3">Total Served</th>
              <th className="px-4 py-3">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = row.warehouse_id || row.id;
              const lat = row.latitude ?? row.location;
              const lon = row.longitude;
              const std = row.standard_count ?? row.assigned_orders ?? 0;
              const intg = row.integrated_count ?? 0;
              const total = row.assigned_orders ?? (std + intg);
              const cap = row.capacity || 100;
              const util = row.utilization_rate ?? Number(((total / cap) * 100).toFixed(1));
              const color = row.cluster_color || "#3b82f6";

              return (
                <tr key={`wh-row-${id}`} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold text-slate-800">Warehouse W{id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {typeof lat === "number" ? `${lat.toFixed(5)}, ${Number(lon).toFixed(5)}` : lat}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      {std} houses
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                      {intg} houses
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {total} <span className="text-xs font-normal text-slate-400">/ {cap}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{ width: `${Math.min(100, util)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700">{util}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
