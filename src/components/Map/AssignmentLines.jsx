import { Polyline } from "react-leaflet";
import { warehouses } from "../../data/mockData";

export default function AssignmentLines({ neighborhoods }) {
  return neighborhoods.map((n) => {
    const warehouse = warehouses.find((w) => w.id === n.warehouseId);
    if (!warehouse) return null;
    return (
      <Polyline
        key={n.id}
        positions={[
          [n.latitude, n.longitude],
          [warehouse.latitude, warehouse.longitude],
        ]}
        pathOptions={{ color: warehouse.color, weight: 1.5, opacity: 0.45 }}
      />
    );
  });
}
