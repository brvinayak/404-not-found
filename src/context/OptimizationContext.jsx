import { createContext, useContext, useEffect, useState } from "react";
import { algorithms, defaultCsvRows } from "../data/mockData";
import { runWarehouseOptimizerClient } from "../utils/clientSolver";

const OptimizationContext = createContext(null);

const defaultConfig = {
  algorithm: algorithms[0].id,
  warehouseCount: 3,
  maxRadiusM: 2000,
  maxClusterSize: 300,
  capacity: 300,
  minPoints: 10,
  dbscanEpsM: 500,
  trafficEnabled: false,
  carbonEnabled: false,
  demandGrowth: 15,
};

export function OptimizationProvider({ children }) {
  const [uploadedData, setUploadedData] = useState(defaultCsvRows);
  const [totalRowCount, setTotalRowCount] = useState(defaultCsvRows.length);
  const [uploadStatus, setUploadStatus] = useState("ready");
  const [uploadError, setUploadError] = useState("");
  const [fileName, setFileName] = useState("bengaluru-locations.csv");
  const [config, setConfig] = useState(defaultConfig);
  const [optimized, setOptimized] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Initialize results using sample data
  const [results, setResults] = useState(() =>
    runWarehouseOptimizerClient(defaultCsvRows, defaultConfig)
  );

  const [scenario, setScenario] = useState({
    demandIncrease: 15,
    warehouseCount: 4,
    capacity: 300,
    trafficMultiplier: 1.1,
    ran: false,
  });

  // Re-calculate when uploadedData changes for small datasets only
  useEffect(() => {
    if (uploadedData && uploadedData.length > 0 && uploadedData.length <= 500) {
      try {
        const initialRun = runWarehouseOptimizerClient(uploadedData, config);
        setResults(initialRun);
      } catch (e) {
        console.warn("Client initial run error:", e);
      }
    }
  }, [uploadedData]);

  const runOptimization = async (customConfig = null) => {
    setIsOptimizing(true);
    const activeConfig = customConfig || config;

    const payload = {
      warehouse_count: Number(activeConfig.warehouseCount) || 3,
      capacity: Number(activeConfig.maxClusterSize || activeConfig.capacity) || 300,
      max_radius_m: Number(activeConfig.maxRadiusM) || 2000,
      max_cluster_size: Number(activeConfig.maxClusterSize || activeConfig.capacity) || 300,
      min_points: Number(activeConfig.minPoints) || 10,
      dbscan_eps_m: Number(activeConfig.dbscanEpsM) || 500,
      traffic_factor: Boolean(activeConfig.trafficEnabled),
      carbon_mode: Boolean(activeConfig.carbonEnabled),
    };

    try {
      const res = await fetch("/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setOptimized(true);
        setIsOptimizing(false);
        return data;
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn("Backend optimization response not OK:", errJson.detail || res.statusText);
      }
    } catch (err) {
      console.info("Backend unreachable or error, falling back to client solver:", err);
    }

    // Fallback to client-side solver
    const localResult = runWarehouseOptimizerClient(uploadedData, activeConfig);
    setResults(localResult);
    setOptimized(true);
    setIsOptimizing(false);
    return localResult;
  };

  const value = {
    uploadedData,
    setUploadedData,
    totalRowCount,
    setTotalRowCount,
    uploadStatus,
    setUploadStatus,
    uploadError,
    setUploadError,
    fileName,
    setFileName,
    config,
    setConfig,
    optimized,
    setOptimized,
    isOptimizing,
    runOptimization,
    results,
    setResults,
    scenario,
    setScenario,
  };

  return (
    <OptimizationContext.Provider value={value}>
      {children}
    </OptimizationContext.Provider>
  );
}

export function useOptimization() {
  const ctx = useContext(OptimizationContext);
  if (!ctx) {
    throw new Error("useOptimization must be used within OptimizationProvider");
  }
  return ctx;
}
