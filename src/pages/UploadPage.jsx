import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import CSVPreview from "../components/Upload/CSVPreview.jsx";
import UploadBox from "../components/Upload/UploadBox.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import { useOptimization } from "../context/OptimizationContext.jsx";

export default function UploadPage() {
  const { uploadStatus, uploadedData, totalRowCount, uploadError } = useOptimization();

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-medium text-indigo-600">Step 1</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">Upload demand dataset</h2>
          <p className="mt-2 text-sm text-slate-500">
            Upload your CSV file containing Latitude and Longitude points. The backend optimizer will cluster coordinates and place optimal warehouses.
          </p>
        </div>

        <UploadBox />

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          {uploadStatus === "uploading" && (
            <div className="flex items-center gap-2 text-indigo-600">
              <Loader2 className="animate-spin" size={16} /> Uploading and validating dataset…
            </div>
          )}
          {uploadStatus === "success" && (
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 size={16} /> {totalRowCount.toLocaleString()} locations verified and ready.
            </div>
          )}
          {uploadStatus === "error" && (
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle size={16} className="shrink-0" />
              <span className="font-medium">{uploadError || "Validation error occurred."}</span>
            </div>
          )}
          {uploadStatus === "ready" && (
            <div className="flex items-center gap-2 text-indigo-600">
              <CheckCircle2 size={16} /> Mock Bengaluru dataset preloaded.
            </div>
          )}
        </div>

        <CSVPreview />

        <div className="flex justify-end">
          <Link
            to="/optimize"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Continue to optimization
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
