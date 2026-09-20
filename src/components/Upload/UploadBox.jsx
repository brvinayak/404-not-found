import { FileSpreadsheet, UploadCloud, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { useOptimization } from "../../context/OptimizationContext.jsx";
import { defaultCsvRows } from "../../data/mockData";

function parseCsvPreview(text, maxRows = 200) {
  // Normalize text and strip BOM
  const cleanText = text.replace(/^\ufeff/, "").trim();
  const rawLines = cleanText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    throw new Error("CSV file is empty.");
  }

  // Detect delimiter (comma, semicolon, or tab)
  const firstLine = rawLines[0];
  let delimiter = ",";
  if (firstLine.includes(";") && !firstLine.includes(",")) delimiter = ";";
  else if (firstLine.includes("\t") && !firstLine.includes(",")) delimiter = "\t";

  const rawHeaders = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

  let latIndex = rawHeaders.findIndex((h) =>
    ["latitude", "lat", "latitudes", "y", "coord_lat"].includes(h)
  );
  let lonIndex = rawHeaders.findIndex((h) =>
    ["longitude", "lon", "lng", "long", "longitudes", "x", "coord_lon"].includes(h)
  );

  let startLine = 1;

  // Headerless detection: If first line contains 2 valid numbers
  if (latIndex === -1 || lonIndex === -1) {
    const p0 = Number(rawHeaders[0]);
    const p1 = Number(rawHeaders[1]);
    if (!Number.isNaN(p0) && !Number.isNaN(p1)) {
      if (Math.abs(p0) <= 90 && Math.abs(p1) <= 180) {
        latIndex = 0;
        lonIndex = 1;
        startLine = 0;
      }
    }
  }

  if (latIndex === -1 || lonIndex === -1) {
    throw new Error(
      `Could not find Latitude and Longitude columns in header: "${firstLine}". Please ensure the CSV contains Latitude and Longitude headers.`
    );
  }

  const previewRows = [];
  let validCount = 0;

  for (let i = startLine; i < rawLines.length; i++) {
    const cols = rawLines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    if (cols.length <= Math.max(latIndex, lonIndex)) continue;

    const lat = Number(cols[latIndex]);
    const lon = Number(cols[lonIndex]);

    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    validCount++;
    if (previewRows.length < maxRows) {
      previewRows.push({
        Latitude: lat,
        Longitude: lon,
      });
    }
  }

  if (validCount === 0) {
    throw new Error("No valid coordinates found within geographic range [-90, 90], [-180, 180].");
  }

  return { previewRows, totalCount: validCount };
}

export default function UploadBox() {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const {
    setUploadedData,
    setTotalRowCount,
    totalRowCount,
    setUploadStatus,
    setUploadError,
    setFileName,
    fileName,
    uploadStatus,
  } = useOptimization();

  const handleFiles = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadStatus("error");
      setUploadError("Only CSV files (.csv) are supported.");
      return;
    }

    setFileName(file.name);
    setUploadStatus("uploading");
    setUploadError("");

    try {
      // 1. Upload to backend first
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      let backendSuccess = false;
      let backendRows = 0;

      if (res.ok) {
        const data = await res.json();
        backendSuccess = true;
        backendRows = data.rows || 0;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Upload failed with HTTP ${res.status}`);
      }

      // 2. Parse client preview for display
      const text = await file.text();
      const { previewRows, totalCount } = parseCsvPreview(text, 200);

      const finalCount = backendRows > 0 ? backendRows : totalCount;
      setUploadedData(previewRows);
      setTotalRowCount(finalCount);
      setUploadStatus("success");
      setUploadError("");
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("error");
      setUploadError(err.message || "Could not process CSV dataset.");
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files[0]);
      }}
      className={`rounded-3xl border-2 border-dashed p-8 text-center transition ${
        dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white"
      }`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <UploadCloud size={22} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">Drop coordinates CSV here</h2>
      <p className="mt-1 text-sm text-slate-500">
        Upload <strong>Latitude</strong> & <strong>Longitude</strong> points (or full Area & Orders dataset).
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 cursor-pointer"
        >
          Browse file
        </button>
        <button
          type="button"
          onClick={() => {
            setFileName("bengaluru-locations.csv");
            setUploadedData(defaultCsvRows);
            setTotalRowCount(defaultCsvRows.length);
            setUploadStatus("success");
            setUploadError("");
          }}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          Use sample coordinates
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files?.[0])}
      />
      <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
        <FileSpreadsheet size={14} />
        <span>{fileName}</span>
        {uploadStatus === "success" && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle2 size={13} /> {totalRowCount.toLocaleString()} points ready
          </span>
        )}
      </div>
    </div>
  );
}
