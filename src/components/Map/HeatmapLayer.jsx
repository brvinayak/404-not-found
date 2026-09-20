import { Circle } from "react-leaflet";

function heatColor(orders) {
  if (orders >= 3500) return "#ef4444";
  if (orders >= 2500) return "#f59e0b";
  return "#22c55e";
}

export default function HeatmapLayer({ neighborhoods }) {
  return neighborhoods.map((n) => (
    <Circle
      key={`heat-${n.id}`}
      center={[n.latitude, n.longitude]}
      radius={900 + n.orders / 4}
      pathOptions={{
        color: heatColor(n.orders),
        fillColor: heatColor(n.orders),
        fillOpacity: 0.18,
        weight: 0,
      }}
    />
  ));
}
