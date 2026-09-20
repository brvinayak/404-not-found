import { motion } from "framer-motion";
import { useOptimization } from "../../context/OptimizationContext.jsx";

export default function CSVPreview() {
  const { uploadedData, uploadStatus, uploadError, totalRowCount } = useOptimization();

  if (uploadStatus === "idle") {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Upload a CSV file with Latitude and Longitude columns to preview coordinates.
      </div>
    );
  }

  if (uploadStatus === "uploading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Parsing file coordinates…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          Parsed Coordinates Preview ({(totalRowCount || uploadedData.length).toLocaleString()} locations)
        </h3>
        <span className="text-[11px] font-medium text-slate-500">
          Columns: Latitude, Longitude only
        </span>
      </div>

      {uploadError && (
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {uploadError}
        </div>
      )}

      <div className="max-h-72 overflow-x-auto overflow-y-auto scrollbar-thin">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600 shadow-sm">
            <tr>
              <th className="px-4 py-2.5">Point #</th>
              <th className="px-4 py-2.5">Latitude</th>
              <th className="px-4 py-2.5">Longitude</th>
            </tr>
          </thead>
          <tbody>
            {uploadedData.slice(0, 100).map((row, i) => (
              <tr key={`point-${i}`} className="border-t border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-2 font-mono text-xs font-medium text-slate-700">#{i + 1}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{Number(row.Latitude).toFixed(6)}</td>
                <td className="px-4 py-2 font-mono text-xs text-slate-600">{Number(row.Longitude).toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {uploadedData.length > 100 && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">
          Showing first 100 of {uploadedData.length} location points.
        </div>
      )}
    </motion.div>
  );
}
