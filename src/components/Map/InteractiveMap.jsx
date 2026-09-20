import { useEffect, useMemo, useState } from "react";
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { divIcon } from "leaflet";
import { Layers, MapPin, Warehouse as WarehouseIcon } from "lucide-react";
import { useOptimization } from "../../context/OptimizationContext.jsx";
import { BENGALURU_CENTER } from "../../data/mockData";

const tiles = {
  streets: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  cartoLight: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

function MapBoundsUpdater({ coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates || coordinates.length === 0) return;
    const lats = coordinates.map((c) => c[0]);
    const lons = coordinates.map((c) => c[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    if (Number.isFinite(minLat) && Number.isFinite(maxLat)) {
      map.fitBounds(
        [
          [minLat, minLon],
          [maxLat, maxLon],
        ],
        { padding: [50, 50], maxZoom: 15 }
      );
    }
  }, [coordinates, map]);

  return null;
}

export default function InteractiveMap() {
  const { results, config } = useOptimization();
  const [layers, setLayers] = useState({
    warehouses: true,
    standard: true,
    integrated: true,
    noise: true,
    radii: true,
  });
  const [basemap, setBasemap] = useState("streets");

  const warehouses = results.warehouses || [];
  const assignments = results.assignments || [];
  const radiusM = config.maxRadiusM || 2000;
  const radius15M = radiusM * 1.5;

  const standardPoints = useMemo(
    () => assignments.filter((a) => a.status === "standard"),
    [assignments]
  );
  const integratedPoints = useMemo(
    () => assignments.filter((a) => a.status === "integrated_noise"),
    [assignments]
  );
  const noisePoints = useMemo(
    () => assignments.filter((a) => a.status === "noise" || a.assigned_warehouse_id === null),
    [assignments]
  );

  const displayStandardPoints = useMemo(() => {
    if (standardPoints.length <= 2500) return standardPoints;
    const step = Math.ceil(standardPoints.length / 2500);
    return standardPoints.filter((_, idx) => idx % step === 0);
  }, [standardPoints]);

  const displayIntegratedPoints = useMemo(() => {
    if (integratedPoints.length <= 1500) return integratedPoints;
    const step = Math.ceil(integratedPoints.length / 1500);
    return integratedPoints.filter((_, idx) => idx % step === 0);
  }, [integratedPoints]);

  const displayNoisePoints = useMemo(() => {
    if (noisePoints.length <= 1500) return noisePoints;
    const step = Math.ceil(noisePoints.length / 1500);
    return noisePoints.filter((_, idx) => idx % step === 0);
  }, [noisePoints]);

  const allCoords = useMemo(() => {
    const coords = [];
    warehouses.forEach((w) => coords.push([w.latitude, w.longitude]));
    assignments.forEach((a) => coords.push([a.latitude, a.longitude]));
    return coords.length > 0 ? coords : [BENGALURU_CENTER];
  }, [warehouses, assignments]);

  const mapCenter = useMemo(() => {
    if (warehouses.length > 0) {
      const avgLat = warehouses.reduce((acc, w) => acc + w.latitude, 0) / warehouses.length;
      const avgLon = warehouses.reduce((acc, w) => acc + w.longitude, 0) / warehouses.length;
      return [avgLat, avgLon];
    }
    if (assignments.length > 0) {
      const avgLat = assignments.reduce((acc, a) => acc + a.latitude, 0) / assignments.length;
      const avgLon = assignments.reduce((acc, a) => acc + a.longitude, 0) / assignments.length;
      return [avgLat, avgLon];
    }
    return BENGALURU_CENTER;
  }, [warehouses, assignments]);

  const toggleLayer = (key) => setLayers((l) => ({ ...l, [key]: !l[key] }));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Map Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Optimization Delivery Map</h3>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
              warehouse.py Visualization
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {warehouses.length} Warehouses Established · {standardPoints.length} Standard (≤{(radiusM / 1000).toFixed(1)}km) · {integratedPoints.length} Integrated (≤{(radius15M / 1000).toFixed(1)}km) · {noisePoints.length} Ignored Noise
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => toggleLayer("warehouses")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                layers.warehouses ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Warehouses ({warehouses.length})
            </button>
            <button
              type="button"
              onClick={() => toggleLayer("standard")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                layers.standard ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Standard ({standardPoints.length})
            </button>
            <button
              type="button"
              onClick={() => toggleLayer("integrated")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                layers.integrated ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Integrated ({integratedPoints.length})
            </button>
            <button
              type="button"
              onClick={() => toggleLayer("noise")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                layers.noise ? "bg-rose-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Noise ({noisePoints.length})
            </button>
            <button
              type="button"
              onClick={() => toggleLayer("radii")}
              className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                layers.radii ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Radii (1.0x & 1.5x)
            </button>
          </div>

          <select
            value={basemap}
            onChange={(e) => setBasemap(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-2xs cursor-pointer text-xs"
          >
            <option value="streets">Streets</option>
            <option value="satellite">Satellite</option>
            <option value="cartoLight">Clean Light</option>
          </select>
        </div>
      </div>

      {/* Map View */}
      <div className="relative h-[30rem] md:h-[38rem]">
        <MapContainer
          center={mapCenter}
          zoom={12}
          zoomControl={false}
          preferCanvas={true}
          className="h-full w-full"
        >
          <TileLayer attribution="&copy; OpenStreetMap contributors" url={tiles[basemap]} />
          <ZoomControl position="bottomright" />
          <MapBoundsUpdater coordinates={allCoords} />

          {/* 1.0x and 1.5x Radius Circles around Warehouses */}
          {layers.radii &&
            warehouses.map((w) => (
              <span key={`radii-${w.warehouse_id}`}>
                {/* 1.0x Standard delivery radius (Solid line) */}
                <Circle
                  center={[w.latitude, w.longitude]}
                  radius={radiusM}
                  pathOptions={{
                    color: w.cluster_color || "#3b82f6",
                    weight: 1.5,
                    fillColor: w.cluster_color || "#3b82f6",
                    fillOpacity: 0.05,
                  }}
                />
                {/* 1.5x Integrated noise boundary (Dashed line) */}
                <Circle
                  center={[w.latitude, w.longitude]}
                  radius={radius15M}
                  pathOptions={{
                    color: w.cluster_color || "#3b82f6",
                    weight: 1.5,
                    dashArray: "5, 6",
                    fillColor: w.cluster_color || "#3b82f6",
                    fillOpacity: 0.02,
                  }}
                />
              </span>
            ))}

          {/* 1. Standard Points (Solid Fill matching warehouse.py) */}
          {layers.standard &&
            displayStandardPoints.map((pt) => (
              <CircleMarker
                key={`std-${pt.id}`}
                center={[pt.latitude, pt.longitude]}
                radius={4}
                pathOptions={{
                  color: pt.cluster_color || "#3b82f6",
                  fill: true,
                  fillColor: pt.cluster_color || "#3b82f6",
                  fillOpacity: 0.75,
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{pt.area || `House #${pt.id}`}</p>
                    <p className="text-slate-600">Assigned: Warehouse {pt.cluster_id}</p>
                    <p className="text-slate-600">Distance: {pt.distance_km} km</p>
                    <span className="inline-block mt-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Standard Zone (≤ {(radiusM / 1000).toFixed(1)} km)
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* 2. Integrated Noise Points (Hollow / White Fill matching warehouse.py) */}
          {layers.integrated &&
            displayIntegratedPoints.map((pt) => (
              <CircleMarker
                key={`int-${pt.id}`}
                center={[pt.latitude, pt.longitude]}
                radius={4}
                pathOptions={{
                  color: pt.cluster_color || "#3b82f6",
                  weight: 2,
                  fill: true,
                  fillColor: "#ffffff",
                  fillOpacity: 1.0,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{pt.area || `House #${pt.id}`}</p>
                    <p className="text-slate-600">Assigned: Warehouse {pt.cluster_id}</p>
                    <p className="text-slate-600">Distance: {pt.distance_km} km</p>
                    <span className="inline-block mt-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      Integrated Noise (1.0x to 1.5x Radius)
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* 3. Ignored True Noise Points (Solid Red matching warehouse.py) */}
          {layers.noise &&
            displayNoisePoints.map((pt) => (
              <CircleMarker
                key={`noise-${pt.id}`}
                center={[pt.latitude, pt.longitude]}
                radius={3}
                pathOptions={{
                  color: "#cc0000",
                  fill: true,
                  fillColor: "#cc0000",
                  fillOpacity: 0.6,
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-rose-900">{pt.area || `House #${pt.id}`}</p>
                    <p className="text-slate-600">Lat: {pt.latitude}, Lon: {pt.longitude}</p>
                    <span className="inline-block mt-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                      Ignored Noise (Beyond 1.5x Radius or Full)
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* 4. Warehouses (Blue marker with home/W# icon matching warehouse.py) */}
          {layers.warehouses &&
            warehouses.map((w) => {
              const icon = divIcon({
                className: "",
                html: `<div style="width:34px;height:34px;border-radius:10px;background:#2563eb;border:2.5px solid white;box-shadow:0 4px 14px rgba(37,99,235,0.45);display:flex;align-items:center;justify-content:center;color:white;font:700 12px Inter,sans-serif">W${w.warehouse_id}</div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17],
              });

              return (
                <Marker
                  key={`wh-${w.warehouse_id}`}
                  position={[w.latitude, w.longitude]}
                  icon={icon}
                >
                  <Popup>
                    <div className="min-w-44 text-xs">
                      <p className="text-sm font-bold text-slate-900">
                        Warehouse – Cluster {w.warehouse_id}
                      </p>
                      <div className="mt-1 space-y-0.5 text-slate-600">
                        <p>Standard Houses: <strong>{w.standard_count}</strong></p>
                        <p>Integrated Noise: <strong>{w.integrated_count}</strong></p>
                        <p>Total Served: <strong>{w.assigned_orders}</strong> (Max {w.capacity})</p>
                        <p>Utilization: <strong>{w.utilization_rate}%</strong></p>
                        <p className="text-[11px] text-slate-500">
                          Coords: {w.latitude.toFixed(4)}, {w.longitude.toFixed(4)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 pt-1 border-t border-slate-100">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: w.cluster_color }}
                        />
                        <span className="text-[11px] font-medium text-slate-700">Cluster Color</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* Floating Legend matching warehouse.py */}
        <div className="absolute bottom-4 left-4 z-[400] rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-lg backdrop-blur-md text-xs">
          <p className="mb-2 font-semibold text-slate-900">warehouse.py Map Legend</p>
          <div className="space-y-1.5 text-slate-700">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-bold text-white shadow-2xs">
                W1
              </span>
              <span>Optimal Warehouse Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-indigo-500 shadow-2xs" />
              <span>Standard Houses (Solid, ≤ {(radiusM / 1000).toFixed(1)} km)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-indigo-500 bg-white shadow-2xs" />
              <span>Integrated Noise (Hollow, 1.0x to 1.5x)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shadow-2xs" />
              <span>Ignored Noise (Beyond 1.5x or Full)</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="h-0.5 w-4 bg-slate-400" />
              <span>1.0x Delivery Radius</span>
              <span className="h-0.5 w-4 border-b border-dashed border-slate-400" />
              <span>1.5x Noise Limit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
