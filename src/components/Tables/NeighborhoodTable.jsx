import { motion } from "framer-motion";

export default function NeighborhoodTable({ rows = [] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
        No points assigned.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="max-h-96 overflow-x-auto overflow-y-auto scrollbar-thin">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-600 shadow-sm z-10">
            <tr>
              <th className="px-4 py-3">Point / House</th>
              <th className="px-4 py-3">Coordinates (Lat, Lon)</th>
              <th className="px-4 py-3">Assigned Hub</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Zone Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 150).map((row, i) => {
              const name = row.area || `House #${row.id || i + 1}`;
              const whId = row.assigned_warehouse_id || row.cluster_id || row.warehouseId;
              const dist = row.distance_km ?? row.distanceKm ?? 0;
              const status = row.status || (whId ? "standard" : "noise");
              const color = row.cluster_color || "#3b82f6";

              return (
                <tr key={`point-row-${row.id || i}`} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                    {Number(row.latitude).toFixed(5)}, {Number(row.longitude).toFixed(5)}
                  </td>
                  <td className="px-4 py-2.5">
                    {whId ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-slate-700">Warehouse W{whId}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-rose-500 font-medium">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                    {whId ? `${dist} km` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {status === "standard" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Standard Zone
                      </span>
                    )}
                    {status === "integrated_noise" && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Integrated Noise (1.0x-1.5x)
                      </span>
                    )}
                    {status === "noise" && (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                        Ignored Noise
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length > 150 && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">
          Showing first 150 of {rows.length} house assignments.
        </div>
      )}
    </motion.div>
  );
}
