import { divIcon } from "leaflet";
import { Marker, Popup } from "react-leaflet";

export default function WarehouseMarker({ warehouse }) {
  const icon = divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:8px;background:${warehouse.color};border:2px solid white;box-shadow:0 4px 12px rgba(15,23,42,.25);display:flex;align-items:center;justify-content:center;color:white;font:700 10px Inter,sans-serif">${warehouse.id.replace("W", "")}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <Marker position={[warehouse.latitude, warehouse.longitude]} icon={icon}>
      <Popup>
        <div className="min-w-44">
          <p className="font-semibold">{warehouse.name}</p>
          <p>{warehouse.location}</p>
          <p>Capacity: {warehouse.capacity.toLocaleString()}</p>
          <p>Assigned: {warehouse.assignedOrders.toLocaleString()}</p>
          <p>Utilization: {warehouse.utilization}%</p>
        </div>
      </Popup>
    </Marker>
  );
}
