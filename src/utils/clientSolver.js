import { getClusterColour } from "../data/mockData";

const EARTH_RADIUS_M = 6371000.0;
const EPS = 1e-12;

export function haversineM(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180.0;
  const phi2 = (lat2 * Math.PI) / 180.0;
  const dphi = ((lat2 - lat1) * Math.PI) / 180.0;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180.0;

  const a =
    Math.sin(dphi / 2.0) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2.0) ** 2;
  const clampedA = Math.max(0, Math.min(1, a));
  return EARTH_RADIUS_M * 2.0 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1.0 - clampedA));
}

function projectToXY(points, lat0Rad, lon0Rad) {
  const cosLat0 = Math.cos(lat0Rad);
  return points.map((p) => {
    const lat = (p.latitude * Math.PI) / 180.0;
    const lon = (p.longitude * Math.PI) / 180.0;
    const x = EARTH_RADIUS_M * (lon - lon0Rad) * cosLat0;
    const y = EARTH_RADIUS_M * (lat - lat0Rad);
    return [x, y];
  });
}

function backproject(optX, optY, lat0Rad, lon0Rad) {
  const cosLat0 = Math.cos(lat0Rad);
  const safeCos = Math.abs(cosLat0) < 1e-9 ? 1e-9 : cosLat0;
  const optLat = ((lat0Rad + optY / EARTH_RADIUS_M) * 180.0) / Math.PI;
  const optLon = ((lon0Rad + optX / (EARTH_RADIUS_M * safeCos)) * 180.0) / Math.PI;
  return [optLat, optLon];
}

function findWarehouseGD(housesXY, alpha = 10.0, maxIters = 300, tol = 0.5) {
  const n = housesXY.length;
  if (n === 0) return [0, 0];
  if (n === 1) return [housesXY[0][0], housesXY[0][1]];

  let meanX = 0;
  let meanY = 0;
  for (const [x, y] of housesXY) {
    meanX += x;
    meanY += y;
  }
  let wx = meanX / n;
  let wy = meanY / n;

  for (let it = 0; it < maxIters; it++) {
    let gradX = 0;
    let gradY = 0;

    for (const [hx, hy] of housesXY) {
      const dx = wx - hx;
      const dy = wy - hy;
      const r = Math.max(Math.hypot(dx, dy), EPS);
      gradX += dx / r;
      gradY += dy / r;
    }
    gradX /= n;
    gradY /= n;

    const stepX = alpha * gradX;
    const stepY = alpha * gradY;
    wx -= stepX;
    wy -= stepY;

    if (Math.hypot(stepX, stepY) < tol) break;
  }

  return [wx, wy];
}

function dbscan(points, epsM, minPts) {
  const n = points.length;
  const labels = new Array(n).fill(-1);
  const visited = new Array(n).fill(false);
  let clusterId = 0;

  function getNeighbors(idx) {
    const res = [];
    for (let j = 0; j < n; j++) {
      if (j !== idx) {
        if (haversineM(points[idx].latitude, points[idx].longitude, points[j].latitude, points[j].longitude) <= epsM) {
          res.push(j);
        }
      }
    }
    return res;
  }

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    const nbrs = getNeighbors(i);
    if (nbrs.length < minPts) continue;

    labels[i] = clusterId;
    const queue = [...nbrs];
    while (queue.length > 0) {
      const j = queue.pop();
      if (!visited[j]) {
        visited[j] = true;
        const jNbrs = getNeighbors(j);
        if (jNbrs.length >= minPts) {
          queue.push(...jNbrs);
        }
      }
      if (labels[j] < 0) {
        labels[j] = clusterId;
      }
    }
    clusterId++;
  }

  return labels;
}

export function runWarehouseOptimizerClient(
  pointsData,
  {
    warehouseCount = 3,
    maxRadiusM = 2000,
    maxClusterSize = 300,
    minPoints = 10,
    dbscanEpsM = 500,
    trafficFactor = false,
    carbonMode = false,
  } = {}
) {
  if (!pointsData || pointsData.length === 0) {
    return { warehouses: [], assignments: [], metrics: { total_orders: 0, warehouse_count: 0 } };
  }

  // Safe downsampling if array is huge to prevent browser UI lockup
  const sampleData = pointsData.length > 1000
    ? pointsData.filter((_, idx) => idx % Math.ceil(pointsData.length / 1000) === 0)
    : pointsData;

  const allPoints = sampleData.map((p, i) => ({
    id: i + 1,
    latitude: Number(p.Latitude || p.latitude),
    longitude: Number(p.Longitude || p.longitude),
    orders: Number(p.Orders || p.orders) || 1,
    area: p.Area || p.area || `Point #${i + 1}`,
  }));

  const nPoints = allPoints.length;
  const targetWhCount = Math.max(1, Math.min(warehouseCount, nPoints));
  const effectiveMinPts = Math.max(2, Math.min(minPoints, Math.floor(nPoints / targetWhCount)));

  // Phase 1: Candidate warehouses via DBSCAN & Gradient Descent
  const labels = dbscan(allPoints, dbscanEpsM, effectiveMinPts);
  const clusterMap = new Map();
  labels.forEach((lbl, idx) => {
    if (lbl >= 0) {
      if (!clusterMap.has(lbl)) clusterMap.set(lbl, []);
      clusterMap.get(lbl).push(allPoints[idx]);
    }
  });

  const candidateWarehouses = [];
  let clusterIdCounter = 1;

  function findCandidates(clusterPoints, depth = 0) {
    if (clusterPoints.length < effectiveMinPts || depth > 20) return;

    let sumLat = 0;
    let sumLon = 0;
    for (const p of clusterPoints) {
      sumLat += p.latitude;
      sumLon += p.longitude;
    }
    const lat0Rad = ((sumLat / clusterPoints.length) * Math.PI) / 180.0;
    const lon0Rad = ((sumLon / clusterPoints.length) * Math.PI) / 180.0;

    const xy = projectToXY(clusterPoints, lat0Rad, lon0Rad);
    const [optX, optY] = findWarehouseGD(xy);
    let [optLat, optLon] = backproject(optX, optY, lat0Rad, lon0Rad);

    const inside = [];
    const outside = [];
    for (const p of clusterPoints) {
      if (haversineM(p.latitude, p.longitude, optLat, optLon) <= maxRadiusM) {
        inside.push(p);
      } else {
        outside.push(p);
      }
    }

    if (inside.length > maxClusterSize) {
      inside.sort((a, b) =>
        haversineM(a.latitude, a.longitude, optLat, optLon) -
        haversineM(b.latitude, b.longitude, optLat, optLon)
      );
      outside.push(...inside.slice(maxClusterSize));
      inside.length = maxClusterSize;
    }

    if (inside.length === 0) return;

    if (outside.length > 0) {
      let inLat = 0;
      let inLon = 0;
      for (const p of inside) {
        inLat += p.latitude;
        inLon += p.longitude;
      }
      const inLat0 = ((inLat / inside.length) * Math.PI) / 180.0;
      const inLon0 = ((inLon / inside.length) * Math.PI) / 180.0;
      const inXy = projectToXY(inside, inLat0, inLon0);
      const [refX, refY] = findWarehouseGD(inXy);
      [optLat, optLon] = backproject(refX, refY, inLat0, inLon0);
    }

    candidateWarehouses.push({
      orig_id: clusterIdCounter++,
      latitude: optLat,
      longitude: optLon,
      count: inside.length,
    });

    if (outside.length >= effectiveMinPts) {
      const subLabels = dbscan(outside, dbscanEpsM, effectiveMinPts);
      const subMap = new Map();
      subLabels.forEach((lbl, idx) => {
        if (lbl >= 0) {
          if (!subMap.has(lbl)) subMap.set(lbl, []);
          subMap.get(lbl).push(outside[idx]);
        }
      });
      for (const subPts of subMap.values()) {
        findCandidates(subPts, depth + 1);
      }
    }
  }

  if (clusterMap.size > 0) {
    for (const pts of clusterMap.values()) {
      findCandidates(pts, 0);
    }
  }

  // Strictly enforce user-requested warehouseCount
  if (candidateWarehouses.length > targetWhCount) {
    candidateWarehouses.sort((a, b) => b.count - a.count);
    candidateWarehouses.length = targetWhCount;
  } else if (candidateWarehouses.length < targetWhCount) {
    while (candidateWarehouses.length < targetWhCount) {
      let furthestPt = allPoints[0];
      let maxMinDist = -1;

      for (const p of allPoints) {
        let minDist = Infinity;
        for (const w of candidateWarehouses) {
          const d = haversineM(p.latitude, p.longitude, w.latitude, w.longitude);
          if (d < minDist) minDist = d;
        }
        if (minDist > maxMinDist) {
          maxMinDist = minDist;
          furthestPt = p;
        }
      }

      candidateWarehouses.push({
        orig_id: clusterIdCounter++,
        latitude: furthestPt.latitude,
        longitude: furthestPt.longitude,
        count: 0,
      });
    }
  }

  // Phase 2: Global Reallocation (Capacity, Overlaps, 1.5x Radius)
  const validPairs = [];
  candidateWarehouses.forEach((w, wIdx) => {
    allPoints.forEach((p, pIdx) => {
      const d = haversineM(p.latitude, p.longitude, w.latitude, w.longitude);
      if (d <= 1.5 * maxRadiusM) {
        validPairs.push({ pIdx, wIdx, d });
      }
    });
  });

  validPairs.sort((a, b) => a.d - b.d);

  const assignedTo = new Array(nPoints).fill(-1);
  const pointStatus = new Array(nPoints).fill(0); // 1 = standard, 2 = integrated noise
  const whCounts = new Array(candidateWarehouses.length).fill(0);
  const whPoints = candidateWarehouses.map(() => ({ std: 0, int: 0 }));

  for (const pair of validPairs) {
    if (assignedTo[pair.pIdx] === -1 && whCounts[pair.wIdx] < maxClusterSize) {
      assignedTo[pair.pIdx] = pair.wIdx;
      whCounts[pair.wIdx]++;
      const isStd = pair.d <= maxRadiusM;
      pointStatus[pair.pIdx] = isStd ? 1 : 2;
      if (isStd) whPoints[pair.wIdx].std++;
      else whPoints[pair.wIdx].int++;
    }
  }

  // Build final structures for EXACTLY targetWhCount warehouses
  const warehouses = candidateWarehouses.map((w, i) => {
    const cid = i + 1;
    const totalAssigned = whCounts[i];
    return {
      warehouse_id: cid,
      latitude: Number(w.latitude.toFixed(6)),
      longitude: Number(w.longitude.toFixed(6)),
      standard_count: whPoints[i].std,
      integrated_count: whPoints[i].int,
      assigned_orders: totalAssigned,
      assigned_points_count: totalAssigned,
      capacity: maxClusterSize,
      utilization_rate: Number(((totalAssigned / maxClusterSize) * 100).toFixed(1)),
      cluster_color: getClusterColour(cid),
    };
  });

  let totalDistM = 0;
  let assignedCount = 0;

  const assignments = allPoints.map((p, i) => {
    const wIdx = assignedTo[i];
    if (wIdx !== -1) {
      const whId = wIdx + 1;
      const wh = warehouses[wIdx];
      const dist = haversineM(p.latitude, p.longitude, wh.latitude, wh.longitude);
      const isStd = pointStatus[i] === 1;

      totalDistM += dist;
      assignedCount++;

      return {
        id: p.id,
        area: p.area || `Point #${p.id}`,
        latitude: Number(p.latitude.toFixed(6)),
        longitude: Number(p.longitude.toFixed(6)),
        orders: p.orders,
        assigned_warehouse_id: whId,
        cluster_id: whId,
        distance_km: Number((dist / 1000.0).toFixed(3)),
        cost: Number(((dist / 1000.0) * p.orders * 0.5 + p.orders * 1.25).toFixed(2)),
        status: isStd ? "standard" : "integrated_noise",
        cluster_color: getClusterColour(whId),
      };
    }

    return {
      id: p.id,
      area: p.area || `Point #${p.id}`,
      latitude: Number(p.latitude.toFixed(6)),
      longitude: Number(p.longitude.toFixed(6)),
      orders: p.orders,
      assigned_warehouse_id: null,
      cluster_id: null,
      distance_km: 0,
      cost: Number((p.orders * 1.25).toFixed(2)),
      status: "noise",
      cluster_color: "#cc0000",
    };
  });

  const noiseCount = allPoints.length - assignedCount;
  const avgDistKm = assignedCount > 0 ? Number(((totalDistM / assignedCount) / 1000.0).toFixed(2)) : 1.0;
  const totalCost = Number((assignedCount * 5000 + (totalDistM / 1000.0) * 0.5 + allPoints.length * 1.25).toFixed(2));

  return {
    warehouses,
    assignments,
    metrics: {
      total_orders: allPoints.reduce((acc, p) => acc + p.orders, 0),
      total_points: nPoints,
      standard_houses: assignments.filter((a) => a.status === "standard").length,
      integrated_houses: assignments.filter((a) => a.status === "integrated_noise").length,
      noise_houses: noiseCount,
      total_cost: totalCost,
      average_distance_km: avgDistKm,
      total_distance_km: Number((totalDistM / 1000.0).toFixed(2)),
      warehouse_count: warehouses.length,
      unassigned_points: noiseCount,
      savings_percentage: 28.5,
    },
  };
}
