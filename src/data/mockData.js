export const neighborhoods = [
  {
    id: "n1",
    area: "Whitefield",
    latitude: 12.9698,
    longitude: 77.7499,
    orders: 4280,
    warehouseId: "W1",
    distanceKm: 2.4,
    weightedCost: 18420,
  },
  {
    id: "n2",
    area: "Marathahalli",
    latitude: 12.9592,
    longitude: 77.6974,
    orders: 3120,
    warehouseId: "W1",
    distanceKm: 6.1,
    weightedCost: 16240,
  },
  {
    id: "n3",
    area: "Bellandur",
    latitude: 12.9304,
    longitude: 77.6784,
    orders: 2680,
    warehouseId: "W1",
    distanceKm: 8.7,
    weightedCost: 14890,
  },
  {
    id: "n4",
    area: "Koramangala",
    latitude: 12.9352,
    longitude: 77.6245,
    orders: 3890,
    warehouseId: "W2",
    distanceKm: 1.8,
    weightedCost: 13210,
  },
  {
    id: "n5",
    area: "Indiranagar",
    latitude: 12.9784,
    longitude: 77.6408,
    orders: 3410,
    warehouseId: "W2",
    distanceKm: 3.2,
    weightedCost: 14180,
  },
  {
    id: "n6",
    area: "HSR Layout",
    latitude: 12.9121,
    longitude: 77.6446,
    orders: 3560,
    warehouseId: "W2",
    distanceKm: 4.1,
    weightedCost: 15560,
  },
  {
    id: "n7",
    area: "Jayanagar",
    latitude: 12.925,
    longitude: 77.5838,
    orders: 2740,
    warehouseId: "W2",
    distanceKm: 6.8,
    weightedCost: 12940,
  },
  {
    id: "n8",
    area: "Electronic City",
    latitude: 12.8452,
    longitude: 77.6602,
    orders: 4020,
    warehouseId: "W3",
    distanceKm: 2.1,
    weightedCost: 17110,
  },
  {
    id: "n9",
    area: "Bommanahalli",
    latitude: 12.8988,
    longitude: 77.6179,
    orders: 1980,
    warehouseId: "W3",
    distanceKm: 7.4,
    weightedCost: 9860,
  },
  {
    id: "n10",
    area: "Sarjapur Road",
    latitude: 12.901,
    longitude: 77.6874,
    orders: 2210,
    warehouseId: "W3",
    distanceKm: 8.9,
    weightedCost: 11240,
  },
  {
    id: "n11",
    area: "Yelahanka",
    latitude: 13.1007,
    longitude: 77.5963,
    orders: 2540,
    warehouseId: "W4",
    distanceKm: 2.6,
    weightedCost: 10880,
  },
  {
    id: "n12",
    area: "Hebbal",
    latitude: 13.0358,
    longitude: 77.597,
    orders: 2870,
    warehouseId: "W4",
    distanceKm: 4.9,
    weightedCost: 12150,
  },
  {
    id: "n13",
    area: "Rajajinagar",
    latitude: 12.9916,
    longitude: 77.5522,
    orders: 1760,
    warehouseId: "W4",
    distanceKm: 9.2,
    weightedCost: 9340,
  },
  {
    id: "n14",
    area: "Malleswaram",
    latitude: 13.0035,
    longitude: 77.5648,
    orders: 1640,
    warehouseId: "W4",
    distanceKm: 8.1,
    weightedCost: 8120,
  },
  {
    id: "n15",
    area: "MG Road",
    latitude: 12.975,
    longitude: 77.6066,
    orders: 2090,
    warehouseId: "W2",
    distanceKm: 3.9,
    weightedCost: 10110,
  },
  {
    id: "n16",
    area: "Banashankari",
    latitude: 12.9255,
    longitude: 77.5468,
    orders: 1880,
    warehouseId: "W3",
    distanceKm: 11.4,
    weightedCost: 10770,
  },
];

export const warehouses = [
  {
    id: "W1",
    name: "Warehouse W1",
    location: "Whitefield Hub",
    latitude: 12.9716,
    longitude: 77.7493,
    capacity: 12000,
    assignedOrders: 10080,
    utilization: 84,
    color: "#4f46e5",
  },
  {
    id: "W2",
    name: "Warehouse W2",
    location: "Koramangala Hub",
    latitude: 12.9358,
    longitude: 77.6241,
    capacity: 16000,
    assignedOrders: 14690,
    utilization: 92,
    color: "#0ea5e9",
  },
  {
    id: "W3",
    name: "Warehouse W3",
    location: "Electronic City Hub",
    latitude: 12.8482,
    longitude: 77.6618,
    capacity: 14000,
    assignedOrders: 10090,
    utilization: 72,
    color: "#10b981",
  },
  {
    id: "W4",
    name: "Warehouse W4",
    location: "Yelahanka Hub",
    latitude: 13.0846,
    longitude: 77.5946,
    capacity: 11000,
    assignedOrders: 8810,
    utilization: 80,
    color: "#f59e0b",
  },
];

export const clusterRegions = [
  {
    id: "c1",
    warehouseId: "W1",
    color: "#4f46e5",
    positions: [
      [12.995, 77.72],
      [12.995, 77.78],
      [12.93, 77.78],
      [12.93, 77.72],
    ],
  },
  {
    id: "c2",
    warehouseId: "W2",
    color: "#0ea5e9",
    positions: [
      [12.995, 77.56],
      [12.995, 77.66],
      [12.91, 77.66],
      [12.91, 77.56],
    ],
  },
  {
    id: "c3",
    warehouseId: "W3",
    color: "#10b981",
    positions: [
      [12.91, 77.54],
      [12.91, 77.71],
      [12.83, 77.71],
      [12.83, 77.54],
    ],
  },
  {
    id: "c4",
    warehouseId: "W4",
    color: "#f59e0b",
    positions: [
      [13.12, 77.53],
      [13.12, 77.64],
      [12.995, 77.64],
      [12.995, 77.53],
    ],
  },
];

// 20-color cluster palette matching warehouse.py
export const CLUSTER_COLOURS = [
  "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
  "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
  "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
  "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080",
];

export function getClusterColour(clusterId) {
  if (!clusterId || clusterId < 1) return "#cc0000";
  const n = CLUSTER_COLOURS.length;
  const step = 7;
  return CLUSTER_COLOURS[(clusterId * step) % n];
}

// Single active algorithm from warehouse.py (all others removed)
export const algorithms = [
  {
    id: "dbscan-gradient-descent",
    name: "DBSCAN + Gradient Descent Optimizer",
    description:
      "Density-based spatial clustering (DBSCAN) combined with planar gradient descent warehouse positioning and global 1.5x delivery radius noise reallocation.",
    bestFor: "warehouse.py Algorithm",
  },
];


export const kpis = {
  totalOrders: 44670,
  totalWarehouses: 4,
  weightedCost: 204920,
  estimatedSavings: 87900,
  averageDeliveryDistance: 5.7,
  carbonReduction: 15.4,
  totalDemand: 44670,
  assignedDemand: 43670,
  costReduction: 30,
  coveragePercentage: 97.8,
  warehouseUtilization: 82,
};

export const demandDistribution = [
  { name: "Whitefield", orders: 4280 },
  { name: "Koramangala", orders: 3890 },
  { name: "Electronic City", orders: 4020 },
  { name: "HSR Layout", orders: 3560 },
  { name: "Indiranagar", orders: 3410 },
  { name: "Marathahalli", orders: 3120 },
  { name: "Hebbal", orders: 2870 },
  { name: "Jayanagar", orders: 2740 },
];

export const costDistribution = [
  { name: "W1", cost: 49550, baseline: 71200 },
  { name: "W2", cost: 66000, baseline: 94800 },
  { name: "W3", cost: 48980, baseline: 68100 },
  { name: "W4", cost: 40390, baseline: 58720 },
];

export const savingsTrend = [
  { month: "Jan", savings: 42 },
  { month: "Feb", savings: 48 },
  { month: "Mar", savings: 51 },
  { month: "Apr", savings: 58 },
  { month: "May", savings: 63 },
  { month: "Jun", savings: 71 },
  { month: "Jul", savings: 76 },
  { month: "Aug", savings: 82 },
  { month: "Sep", savings: 88 },
];

export const warehouseLoad = warehouses.map((w) => ({
  name: w.id,
  assigned: w.assignedOrders,
  capacity: w.capacity,
  utilization: w.utilization,
}));

export const insights = [
  {
    id: "i1",
    tone: "warning",
    title: "High utilization at W2",
    body: "Warehouse W2 is operating at 92% capacity. Consider redistributing overflow from Koramangala and HSR Layout.",
  },
  {
    id: "i2",
    tone: "info",
    title: "Demand hotspot",
    body: "Demand concentration detected in Whitefield. Last-mile density is 1.8x the city average.",
  },
  {
    id: "i3",
    tone: "success",
    title: "Coverage opportunity",
    body: "Adding one additional warehouse near Bellandur could improve east-side coverage by an estimated 6%.",
  },
  {
    id: "i4",
    tone: "alert",
    title: "Delivery load spike",
    body: "High delivery load observed in Electronic City during evening windows. Stagger outbound slots to reduce congestion.",
  },
];

export const defaultCsvRows = neighborhoods.map((n) => ({
  Latitude: n.latitude,
  Longitude: n.longitude,
}));


export const BENGALURU_CENTER = [12.9716, 77.5946];
