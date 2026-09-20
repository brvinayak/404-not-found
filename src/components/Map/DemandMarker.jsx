import { CircleMarker, Popup } from "react-leaflet";
import { warehouses } from "../../data/mockData";

function demandColor(orders) {
  if (orders >= 3500) return "#ef4444";
  if (orders >= 2500) return "#f59e0b";
  return "#22c55e";
}

export default function DemandMarker({ point }) {
  const warehouse = warehouses.find((w) => w.id === point.warehouseId);
  return (
    <CircleMarker
      center={[point.latitude, point.longitude]}
      radius={8}
      pathOptions={{
        color: demandColor(point.orders),
        fillColor: demandColor(point.orders),
        fillOpacity: 0.85,
        weight: 1,
      }}
    >
      <Popup>
        <div className="min-w-40">
          <p className="font-semibold">{point.area}</p>
          <p>Orders: {point.orders.toLocaleString()}</p>
          <p>Assigned: {warehouse?.name || point.warehouseId}</p>
          <p>Distance: {point.distanceKm} km</p>
        </div>
      </Popup>
    </CircleMarker>
  );
}
