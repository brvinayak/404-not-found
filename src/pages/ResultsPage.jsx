import { useState } from "react";
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Table2,
  X,
} from "lucide-react";
import InsightsPanel from "../components/AIInsights/InsightsPanel.jsx";
import MetricCard from "../components/Dashboard/MetricCard.jsx";
import ResultsTable from "../components/Tables/ResultsTable.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import { useOptimization } from "../context/OptimizationContext.jsx";
import { algorithms } from "../data/mockData";

export default function ResultsPage() {
  const { results, config } = useOptimization();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const warehouses = results.warehouses || [];
  const assignments = results.assignments || [];
  const metrics = results.metrics || {};
  const algo = algorithms[0];

  const totalPoints = metrics.total_points || assignments.length || 0;
  const standardHouses = metrics.standard_houses || assignments.filter((a) => a.status === "standard").length;
  const integratedHouses = metrics.integrated_houses || assignments.filter((a) => a.status === "integrated_noise").length;
  const noiseHouses = metrics.noise_houses || metrics.unassigned_points || assignments.filter((a) => a.status === "noise").length;
  const totalCost = metrics.total_cost || 0;
  const avgDistance = metrics.average_distance_km || 0;
  const savingsPct = metrics.savings_percentage || 28.5;

  // 1. Download CSV functionality
  const handleDownloadCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Section 1: Warehouse Summary
    csvContent += "WAREHOUSE HUBS SUMMARY\n";
    csvContent += "Warehouse_ID,Latitude,Longitude,Standard_Houses,Integrated_Noise,Total_Served,Capacity,Utilization_Pct,Cluster_Color\n";
    warehouses.forEach((w) => {
      csvContent += `${w.warehouse_id},${w.latitude},${w.longitude},${w.standard_count},${w.integrated_count},${w.assigned_orders},${w.capacity},${w.utilization_rate}%,${w.cluster_color}\n`;
    });

    csvContent += "\n";

    // Section 2: Detailed House Allocations
    csvContent += "HOUSE ALLOCATIONS & CLUSTER ASSIGNMENTS\n";
    csvContent += "Point_ID,Latitude,Longitude,Assigned_Warehouse,Distance_km,Zone_Status\n";
    assignments.forEach((a) => {
      const wh = a.assigned_warehouse_id ? `Warehouse ${a.assigned_warehouse_id}` : "Unassigned";
      csvContent += `${a.id || a.area},${a.latitude},${a.longitude},${wh},${a.distance_km || 0},${a.status || "standard"}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `warehouseiq_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Download PDF functionality
  const handleDownloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to generate the PDF report.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>WarehouseIQ Optimization Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
            h1 { font-size: 22px; margin-bottom: 4px; color: #0f172a; }
            p { font-size: 13px; color: #64748b; margin-top: 0; }
            .badge { display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #3730a3; border-radius: 999px; font-size: 11px; font-weight: 600; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #f8fafc; }
            .card-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; }
            .card-value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: 600; color: #334155; }
            tr:nth-child(even) { background: #fafafa; }
            .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <span class="badge">warehouse.py Algorithm Report</span>
          <h1>WarehouseIQ Network Optimization Results</h1>
          <p>Generated: ${new Date().toLocaleString()} · Delivery Radius: ${(config.maxRadiusM / 1000).toFixed(1)} km · Max Cluster Size: ${config.maxClusterSize}</p>

          <div class="grid">
            <div class="card">
              <div class="card-label">Warehouses Established</div>
              <div class="card-value">${warehouses.length} Hubs</div>
            </div>
            <div class="card">
              <div class="card-label">Houses Served</div>
              <div class="card-value">${standardHouses + integratedHouses} / ${totalPoints}</div>
            </div>
            <div class="card">
              <div class="card-label">Avg Distance</div>
              <div class="card-value">${avgDistance} km</div>
            </div>
            <div class="card">
              <div class="card-label">Estimated Savings</div>
              <div class="card-value">${savingsPct}%</div>
            </div>
          </div>

          <h3>Established Warehouse Facilities</h3>
          <table>
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Standard Zone (≤1.0x)</th>
                <th>Integrated Noise (1.0x-1.5x)</th>
                <th>Total Served</th>
                <th>Capacity Utilization</th>
              </tr>
            </thead>
            <tbody>
              ${warehouses
                .map(
                  (w) => `
                <tr>
                  <td><strong>Warehouse W${w.warehouse_id}</strong></td>
                  <td>${Number(w.latitude).toFixed(6)}</td>
                  <td>${Number(w.longitude).toFixed(6)}</td>
                  <td>${w.standard_count} houses</td>
                  <td>${w.integrated_count} houses</td>
                  <td><strong>${w.assigned_orders}</strong> / ${w.capacity}</td>
                  <td>${w.utilization_rate}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            WarehouseIQ Optimization Engine · Autonomous Logistics Facility Optimization
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // 3. Export Report (Modal / Markdown)
  const generateMarkdownReport = () => {
    return `# WarehouseIQ Optimization Executive Report
**Algorithm:** ${algo.name} (warehouse.py)
**Generated:** ${new Date().toISOString()}
**Parameters:** Delivery Radius = ${config.maxRadiusM}m, Max Cluster Size = ${config.maxClusterSize}, DBSCAN eps = ${config.dbscanEpsM}m

## 1. Network Performance Summary
- **Total Locations Processed:** ${totalPoints} houses
- **Warehouses Established:** ${warehouses.length} hubs
- **Standard Zone Served (≤ 1.0x radius):** ${standardHouses} (${Math.round((standardHouses / Math.max(1, totalPoints)) * 100)}%)
- **Integrated Noise Served (1.0x - 1.5x radius):** ${integratedHouses} (${Math.round((integratedHouses / Math.max(1, totalPoints)) * 100)}%)
- **Ignored True Noise:** ${noiseHouses} houses
- **Average Delivery Distance:** ${avgDistance} km
- **Projected Cost Savings:** ${savingsPct}% vs single-hub baseline

## 2. Established Warehouse Facilities
| Hub ID | Latitude | Longitude | Standard Houses | Integrated Noise | Total Served | Capacity | Utilization |
|---|---|---|---|---|---|---|---|
${warehouses.map((w) => `| W${w.warehouse_id} | ${w.latitude} | ${w.longitude} | ${w.standard_count} | ${w.integrated_count} | ${w.assigned_orders} | ${w.capacity} | ${w.utilization_rate}% |`).join("\n")}

## 3. Algorithmic Pipeline & Methodology
1. **Density Clustering (DBSCAN):** Haversine spatial density scanning with eps=${config.dbscanEpsM}m and min_pts=${config.minPoints}.
2. **Gradient Descent Placement:** Planar local XY projection minimizing continuous distance loss.
3. **Capacity Enforced Splitting:** Clusters exceeding ${config.maxClusterSize} houses recursively partitioned into secondary candidate hubs.
4. **Global Reallocation:** Distance matrix pairing with 1.5x radius integration boundary and greedy closest-first priority.
`;
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReportFile = (format = "md") => {
    let content, mimeType, filename;
    if (format === "json") {
      content = JSON.stringify(results, null, 2);
      mimeType = "application/json";
      filename = `warehouseiq_report_${Date.now()}.json`;
    } else {
      content = generateMarkdownReport();
      mimeType = "text/markdown";
      filename = `warehouseiq_report_${Date.now()}.md`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-slate-900">Optimization results</h2>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                warehouse.py Solver
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Optimal warehouse locations, cluster assignments, and 1.5x noise reallocation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              <Table2 size={16} className="text-emerald-600" /> Download CSV
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              <Download size={16} className="text-rose-600" /> Download PDF
            </button>
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <FileText size={16} /> Export Report
            </button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Warehouses Established"
            value={`${warehouses.length} Hubs`}
            hint={`Max capacity: ${config.maxClusterSize} houses/hub`}
            accent="sky"
          />
          <MetricCard
            label="Houses Served"
            value={`${standardHouses + integratedHouses} / ${totalPoints}`}
            hint={`${standardHouses} standard + ${integratedHouses} integrated`}
            accent="emerald"
          />
          <MetricCard
            label="Average Delivery Distance"
            value={`${avgDistance} km`}
            hint={`Delivery radius: ${(config.maxRadiusM / 1000).toFixed(1)} km`}
            accent="indigo"
          />
          <MetricCard
            label="Estimated Savings"
            value={`${savingsPct}%`}
            hint="Vs single central facility baseline"
            accent="amber"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ResultsTable
              warehouses={warehouses}
              assignments={assignments}
            />
          </div>
          <InsightsPanel />
        </div>

        {/* Export Report Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-600" size={20} />
                  <h3 className="text-base font-semibold text-slate-900">Optimization Report Export</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 max-h-72 overflow-y-auto font-mono text-xs text-slate-700 whitespace-pre leading-relaxed scrollbar-thin">
                  {generateMarkdownReport()}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadReportFile("md")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Download size={14} /> Download .md
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadReportFile("json")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FileSpreadsheet size={14} /> Download .json
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check size={14} /> Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
