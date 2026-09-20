"""
algorithms/custom_optimizer.py
------------------------------
WarehouseIQ Optimization Algorithm implementation directly integrating the user's
DBSCAN clustering, Projected Planar Gradient Descent hub placement, and capacity-constrained
global reallocation pipeline.

Supports user-specified warehouse count (warehouse_count), strictly returning only that number
of warehouses for display on the interactive map.
"""

import math
import warnings
from typing import NamedTuple, List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd

from app.core.constants import (
    COL_AREA,
    COL_LATITUDE,
    COL_LONGITUDE,
    COL_ORDERS,
    DEFAULT_MAX_RADIUS_METERS,
    DEFAULT_LEARNING_RATE,
    DEFAULT_MAX_ITERATIONS,
    DEFAULT_TOLERANCE,
    DEFAULT_DBSCAN_EPS_METERS,
    DEFAULT_MIN_POINTS,
    DEFAULT_MAX_RECURSION_DEPTH,
    DEFAULT_FIXED_COST_PER_WAREHOUSE,
)
from app.utils.distance import (
    haversine_m,
    haversine_km,
    haversine_matrix,
    project_to_xy,
    backproject,
)
from app.utils.cost import (
    calculate_delivery_cost,
    calculate_baseline_cost,
    calculate_savings_percentage,
)

# ==============================================================================
# CLUSTER VISUALIZATION PALETTE
# ==============================================================================

_CLUSTER_COLOURS = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080"
]

def _get_cluster_colour(cluster_id: int) -> str:
    n = len(_CLUSTER_COLOURS)
    step = 7
    return _CLUSTER_COLOURS[(cluster_id * step) % n]


# ==============================================================================
# 1. GRADIENT DESCENT OPTIMIZATION
# ==============================================================================

_EPS = 1e-12  # avoids 0/0 when the warehouse sits exactly on a house


class Result(NamedTuple):
    position: np.ndarray   # optimal (x, y)
    error: float           # mean error E/N at that position
    iterations: int
    history: list          # mean error at every iteration


def _chunk_error_and_gradient(w: np.ndarray, pts: np.ndarray, loss: str = "distance") -> Tuple[float, np.ndarray]:
    """Error and gradient summed over one chunk of houses."""
    x = pts[:, 0].astype(np.float64, copy=False)
    y = pts[:, 1].astype(np.float64, copy=False)
    dx, dy = w[0] - x, w[1] - y

    if loss == "squared":
        grad = np.array([dx.sum(), dy.sum()])
        return 0.5 * float(dx @ dx + dy @ dy), grad

    r = np.maximum(np.hypot(dx, dy), _EPS)
    inv_r = 1.0 / r
    grad = np.array([dx @ inv_r, dy @ inv_r])
    return float(r.sum()), grad


def error_and_gradient(
    w: np.ndarray,
    houses: np.ndarray,
    loss: str = "distance",
    chunk_size: int = 1_000_000
) -> Tuple[float, np.ndarray]:
    """Mean error E/N and mean gradient over ALL houses, computed chunk by chunk."""
    n = len(houses)
    if n == 0:
        return 0.0, np.zeros(2)
    err, grad = 0.0, np.zeros(2)
    for s in range(0, n, chunk_size):
        e, g = _chunk_error_and_gradient(w, houses[s:s + chunk_size], loss)
        err += e
        grad += g
    return err / n, grad / n


def find_warehouse(
    houses: np.ndarray,
    loss: str = "distance",
    alpha: float = DEFAULT_LEARNING_RATE,
    max_iters: int = DEFAULT_MAX_ITERATIONS,
    tol: float = DEFAULT_TOLERANCE,
    init: Optional[np.ndarray] = None,
    chunk_size: int = 1_000_000,
    log_every: int = 0,
    seed: int = 0
) -> Result:
    """
    Gradient descent on the warehouse position.
    tol=0.5 stops optimization when the step is less than half a meter,
    preventing infinite loops and warnings on dense data.
    """
    if loss not in ("squared", "distance"):
        raise ValueError("loss must be 'squared' or 'distance'")

    houses = np.asarray(houses, dtype=np.float64)
    if houses.ndim != 2 or houses.shape[1] != 2:
        raise ValueError("houses must have shape (N, 2)")

    n = len(houses)
    if n == 1:
        return Result(houses[0].copy(), 0.0, 1, [0.0])

    rng = np.random.default_rng(seed)
    w = np.array(houses[rng.integers(len(houses))] if init is None else init, dtype=float)
    history = []
    step = np.zeros(2)

    for it in range(1, max_iters + 1):
        err, grad = error_and_gradient(w, houses, loss, chunk_size)
        history.append(err)

        if not np.isfinite(err) or (len(history) > 1 and err > 1e3 * history[0]):
            w = np.median(houses, axis=0)
            break

        step = alpha * grad
        w = w - step

        if np.linalg.norm(step) < tol:
            break
    else:
        warnings.warn(f"no convergence after {max_iters} iterations (last step {np.linalg.norm(step):.2e}); try a different alpha")

    final_err, _ = error_and_gradient(w, houses, loss, chunk_size)
    return Result(w, final_err, it, history)


# ==========================================
# 2. GEOGRAPHIC CLUSTERING & DISTANCE
# ==========================================

def _dbscan(points: List[Tuple[float, float]], eps_m: float, min_pts: int) -> List[int]:
    """
    DBSCAN over a list of (lat, lon) tuples.
    eps_m    : neighbour-search radius in metres (internal density parameter)
    min_pts  : minimum neighbours to be a core point
    Returns a label per point (-1 = noise).
    """
    n = len(points)
    labels = [-1] * n
    visited = [False] * n
    cluster_id = 0
    cache = {}

    def neighbors(idx):
        if idx not in cache:
            cache[idx] = [
                j for j in range(n)
                if j != idx
                and haversine_m(
                    points[idx][0], points[idx][1],
                    points[j][0],   points[j][1]
                ) <= eps_m
            ]
        return cache[idx]

    for i in range(n):
        if visited[i]:
            continue
        visited[i] = True
        nbrs = neighbors(i)
        if len(nbrs) < min_pts:
            continue
        labels[i] = cluster_id
        seed_set = set(nbrs)
        while seed_set:
            j = seed_set.pop()
            if not visited[j]:
                visited[j] = True
                j_nbrs = neighbors(j)
                if len(j_nbrs) >= min_pts:
                    seed_set.update(j_nbrs)
            if labels[j] < 0:
                labels[j] = cluster_id
        cluster_id += 1

    return labels


def cluster_geo_points(
    latitudes: List[float],
    longitudes: List[float],
    dbscan_eps_m: float,
    min_points: int
) -> Dict[str, Any]:
    """Cluster geographic points by density using DBSCAN with high-performance acceleration."""
    if len(latitudes) != len(longitudes):
        raise ValueError("Latitude and longitude lists must have the same length.")
    if not latitudes:
        return {"clusters": [], "unclustered": []}

    points = list(zip(latitudes, longitudes))
    try:
        from sklearn.cluster import DBSCAN
        coords_rad = np.radians(points)
        eps_rad = dbscan_eps_m / 6371000.0
        db = DBSCAN(eps=eps_rad, min_samples=min_points, metric="haversine", algorithm="ball_tree")
        labels = db.fit_predict(coords_rad).tolist()
    except Exception:
        labels = _dbscan(points, dbscan_eps_m, min_points)

    cluster_map = {}
    for idx, lbl in enumerate(labels):
        cluster_map.setdefault(lbl, []).append(points[idx])

    result = {"clusters": [], "unclustered": []}
    for new_id, key in enumerate(sorted(k for k in cluster_map if k >= 0), start=1):
        result["clusters"].append({
            "cluster_id": new_id,
            "points": [{"latitude": lat, "longitude": lon} for lat, lon in cluster_map[key]]
        })
    result["unclustered"] = [
        {"latitude": lat, "longitude": lon}
        for lat, lon in cluster_map.get(-1, [])
    ]
    return result


# ==========================================
# 3. UNIFIED OPTIMIZATION PIPELINE
# ==========================================

def _project_to_xy(points: List[Dict[str, float]], lat0_rad: float, lon0_rad: float, R: float = 6371000.0) -> np.ndarray:
    """Project a list of {'latitude', 'longitude'} dicts onto a local XY plane."""
    xy = []
    cos_lat0 = math.cos(lat0_rad)
    for p in points:
        lat = math.radians(p["latitude"])
        lon = math.radians(p["longitude"])
        x = R * (lon - lon0_rad) * cos_lat0
        y = R * (lat - lat0_rad)
        xy.append([x, y])
    return np.array(xy, dtype=np.float64)


def _backproject(opt_x: float, opt_y: float, lat0_rad: float, lon0_rad: float, R: float = 6371000.0) -> Tuple[float, float]:
    """Convert local XY back to lat/lon degrees."""
    opt_lat = math.degrees(lat0_rad + opt_y / R)
    cos_lat0 = math.cos(lat0_rad)
    if abs(cos_lat0) < 1e-9:
        cos_lat0 = 1e-9 if cos_lat0 >= 0 else -1e-9
    opt_lon = math.degrees(lon0_rad + opt_x / (R * cos_lat0))
    return opt_lat, opt_lon


class CustomWarehouseOptimizer:
    """
    Custom Warehouse Optimizer for WarehouseIQ.
    
    Integrates:
    - DBSCAN density clustering & recursive gradient descent placement
    - User-specified warehouse_count option: strictly enforces that only that exact number of warehouses are placed!
    - Global reallocation respecting max_radius_m and capacity limit.
    """

    def optimize(
        self,
        dataframe: pd.DataFrame,
        warehouse_count: Optional[int] = 3,
        capacity: int = 5000,
        traffic_factor: bool = False,
        carbon_mode: bool = False,
        max_radius_m: float = DEFAULT_MAX_RADIUS_METERS,
        dbscan_eps_m: float = DEFAULT_DBSCAN_EPS_METERS,
        min_points: int = DEFAULT_MIN_POINTS,
        max_cluster_size: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Execute warehouse placement optimization on neighborhood demand dataset.
        """
        if dataframe.empty:
            return {"warehouses": [], "assignments": [], "metrics": {}}

        effective_capacity = max_cluster_size if max_cluster_size is not None else capacity
        if effective_capacity <= 0:
            effective_capacity = 300

        n_points = len(dataframe)
        pts_records = dataframe.to_dict(orient="records")

        latitudes = [float(p[COL_LATITUDE]) for p in pts_records]
        longitudes = [float(p[COL_LONGITUDE]) for p in pts_records]
        all_points = [
            {
                "id": i + 1,
                "area": str(p.get(COL_AREA, f"House #{i + 1}")),
                "latitude": float(p[COL_LATITUDE]),
                "longitude": float(p[COL_LONGITUDE]),
                "orders": int(p.get(COL_ORDERS, 1)),
            }
            for i, p in enumerate(pts_records)
        ]

        R = 6371000.0
        learning_rate = DEFAULT_LEARNING_RATE
        MAX_DEPTH = DEFAULT_MAX_RECURSION_DEPTH

        target_count = warehouse_count if warehouse_count is not None else None
        effective_min_points = max(2, min(min_points, n_points // max(1, target_count or 1)))

        # ── Phase 1: Find Candidate Warehouse Locations ─────────────────────────
        optimal_warehouses_temp = []
        cluster_id_counter = 1

        initial = cluster_geo_points(latitudes, longitudes, dbscan_eps_m, effective_min_points)

        def find_warehouse_locations(points, depth=0):
            nonlocal cluster_id_counter
            if len(points) < effective_min_points or depth > MAX_DEPTH:
                return

            lat0 = math.radians(sum(p["latitude"] for p in points) / len(points))
            lon0 = math.radians(sum(p["longitude"] for p in points) / len(points))
            houses_arr = _project_to_xy(points, lat0, lon0, R)

            res = find_warehouse(houses_arr, loss="distance", alpha=learning_rate)
            opt_lat, opt_lon = _backproject(res.position[0], res.position[1], lat0, lon0, R)

            inside, outside = [], []
            for p in points:
                if haversine_m(p["latitude"], p["longitude"], opt_lat, opt_lon) <= max_radius_m:
                    inside.append(p)
                else:
                    outside.append(p)

            # ENFORCE CAPACITY IN PHASE 1:
            if len(inside) > effective_capacity:
                inside.sort(key=lambda p: haversine_m(p["latitude"], p["longitude"], opt_lat, opt_lon))
                outside.extend(inside[effective_capacity:])
                inside = inside[:effective_capacity]

            if not inside:
                return

            if outside:
                lat0 = math.radians(sum(p["latitude"] for p in inside) / len(inside))
                lon0 = math.radians(sum(p["longitude"] for p in inside) / len(inside))
                houses_arr = _project_to_xy(inside, lat0, lon0, R)
                res = find_warehouse(houses_arr, loss="distance", alpha=learning_rate)
                opt_lat, opt_lon = _backproject(res.position[0], res.position[1], lat0, lon0, R)

            optimal_warehouses_temp.append({
                "cluster_id": cluster_id_counter,
                "warehouse_latitude": opt_lat,
                "warehouse_longitude": opt_lon,
                "initial_point_count": len(inside),
            })
            cluster_id_counter += 1

            if len(outside) >= effective_min_points:
                out_lats = [p["latitude"] for p in outside]
                out_lons = [p["longitude"] for p in outside]
                sub = cluster_geo_points(out_lats, out_lons, dbscan_eps_m, effective_min_points)
                for sub_cluster in sub["clusters"]:
                    find_warehouse_locations(sub_cluster["points"], depth + 1)

        for cluster in initial["clusters"]:
            find_warehouse_locations(cluster["points"], depth=0)

        # ----------------------------------------------------------------------
        # Enforce User-Selected warehouse_count if specified
        # ----------------------------------------------------------------------
        if target_count is not None:
            clamped_target = max(1, min(target_count, n_points))
            if len(optimal_warehouses_temp) > clamped_target:
                optimal_warehouses_temp.sort(key=lambda w: w.get("initial_point_count", 0), reverse=True)
                optimal_warehouses_temp = optimal_warehouses_temp[:clamped_target]
            elif len(optimal_warehouses_temp) < clamped_target:
                pts_lat_arr = np.array([p["latitude"] for p in all_points])
                pts_lon_arr = np.array([p["longitude"] for p in all_points])

                while len(optimal_warehouses_temp) < clamped_target:
                    if optimal_warehouses_temp:
                        curr_wh_lats = np.array([w["warehouse_latitude"] for w in optimal_warehouses_temp])
                        curr_wh_lons = np.array([w["warehouse_longitude"] for w in optimal_warehouses_temp])
                        d_mat = haversine_matrix(pts_lat_arr, pts_lon_arr, curr_wh_lats, curr_wh_lons)
                        min_dists = np.min(d_mat, axis=1)
                        furthest_idx = int(np.argmax(min_dists))
                        seed_p = all_points[furthest_idx]
                    else:
                        seed_p = {
                            "latitude": float(np.median(pts_lat_arr)),
                            "longitude": float(np.median(pts_lon_arr)),
                        }

                    optimal_warehouses_temp.append({
                        "cluster_id": cluster_id_counter,
                        "warehouse_latitude": seed_p["latitude"],
                        "warehouse_longitude": seed_p["longitude"],
                        "initial_point_count": 0,
                    })
                    cluster_id_counter += 1

        if not optimal_warehouses_temp:
            # Fallback to centroid
            avg_lat = sum(latitudes) / len(latitudes)
            avg_lon = sum(longitudes) / len(longitudes)
            optimal_warehouses_temp.append({
                "cluster_id": 1,
                "warehouse_latitude": avg_lat,
                "warehouse_longitude": avg_lon,
                "initial_point_count": len(all_points),
            })

        # ── Phase 2: Global Reallocation (Capacity & Overlaps) ───────────
        pts_lat = np.array([p["latitude"] for p in all_points], dtype=np.float64)
        pts_lon = np.array([p["longitude"] for p in all_points], dtype=np.float64)
        wh_lat = np.array([w["warehouse_latitude"] for w in optimal_warehouses_temp], dtype=np.float64)
        wh_lon = np.array([w["warehouse_longitude"] for w in optimal_warehouses_temp], dtype=np.float64)

        # N x M distance matrix in meters
        distances = haversine_matrix(pts_lat, pts_lon, wh_lat, wh_lon)

        point_assigned_to = np.full(len(all_points), -1, dtype=int)
        point_status = np.full(len(all_points), 0, dtype=int) # 1 = standard, 2 = integrated
        warehouse_counts = np.zeros(len(optimal_warehouses_temp), dtype=int)

        # Allow assignment up to 1.5x max_radius_m (standard <= 1.0x, integrated <= 1.5x)
        max_assign_radius = 1.5 * max_radius_m
        valid_mask = distances <= max_assign_radius

        if not np.any(valid_mask):
            valid_mask = np.ones_like(distances, dtype=bool)

        point_indices, wh_indices = np.where(valid_mask)
        valid_distances = distances[valid_mask]

        sorted_order = np.argsort(valid_distances)
        point_indices = point_indices[sorted_order]
        wh_indices = wh_indices[sorted_order]
        valid_distances = valid_distances[sorted_order]

        for p_idx, w_idx, dist in zip(point_indices, wh_indices, valid_distances):
            if point_assigned_to[p_idx] == -1 and warehouse_counts[w_idx] < effective_capacity:
                point_assigned_to[p_idx] = w_idx
                warehouse_counts[w_idx] += 1
                point_status[p_idx] = 1 if dist <= max_radius_m else 2

        # ----------------------------------------------------------------------
        # Phase 3: Build Final Structures
        # ----------------------------------------------------------------------
        final_warehouses = []
        for i, w in enumerate(optimal_warehouses_temp):
            final_warehouses.append({
                "cluster_id": i + 1,
                "warehouse_id": i + 1,
                "warehouse_latitude": round(float(w["warehouse_latitude"]), 6),
                "warehouse_longitude": round(float(w["warehouse_longitude"]), 6),
                "points": [],
                "integrated_points": [],
                "cluster_size": 0,
                "cluster_color": _get_cluster_colour(i + 1),
            })

        final_noise = []
        for i, p in enumerate(all_points):
            w_idx = point_assigned_to[i]
            if w_idx != -1:
                if point_status[i] == 1:
                    final_warehouses[w_idx]["points"].append(p)
                else:
                    final_warehouses[w_idx]["integrated_points"].append(p)
                final_warehouses[w_idx]["cluster_size"] += 1
            else:
                final_noise.append(p)

        # Build output warehouses
        warehouses_output = []
        for i, w in enumerate(final_warehouses):
            std_ct = len(w["points"])
            int_ct = len(w["integrated_points"])
            served_count = w["cluster_size"]
            assigned_orders = sum(pt["orders"] for pt in w["points"] + w["integrated_points"])
            utilization = round((served_count / effective_capacity) * 100.0, 1) if effective_capacity > 0 else 0.0

            warehouses_output.append({
                "warehouse_id": i + 1,
                "latitude": w["warehouse_latitude"],
                "longitude": w["warehouse_longitude"],
                "standard_count": std_ct,
                "integrated_count": int_ct,
                "assigned_orders": assigned_orders if assigned_orders > 0 else served_count,
                "assigned_points_count": served_count,
                "capacity": effective_capacity,
                "utilization_rate": utilization,
                "cluster_color": _get_cluster_colour(i + 1),
            })

        assignments_output = []
        total_transport_cost = 0.0
        weighted_distance_sum = 0.0
        total_orders_sum = 0
        assigned_orders_sum = 0

        for i, p in enumerate(all_points):
            w_idx = point_assigned_to[i]
            total_orders_sum += p["orders"]

            if w_idx != -1:
                wh_id = w_idx + 1
                dist_m = float(distances[i, w_idx])
                dist_km = round(dist_m / 1000.0, 3)
                cost = calculate_delivery_cost(
                    distance_km=dist_km,
                    orders=p["orders"],
                    traffic_factor=traffic_factor,
                    carbon_mode=carbon_mode,
                )
                status_str = "standard" if point_status[i] == 1 else "integrated_noise"
                assignments_output.append({
                    "id": p["id"],
                    "area": p["area"],
                    "latitude": p["latitude"],
                    "longitude": p["longitude"],
                    "orders": p["orders"],
                    "assigned_warehouse_id": wh_id,
                    "cluster_id": wh_id,
                    "distance_km": dist_km,
                    "cost": cost,
                    "status": status_str,
                    "cluster_color": _get_cluster_colour(wh_id),
                })
                total_transport_cost += cost
                weighted_distance_sum += dist_km * p["orders"]
                assigned_orders_sum += p["orders"]
            else:
                cost = calculate_delivery_cost(
                    distance_km=0.0,
                    orders=p["orders"],
                    traffic_factor=traffic_factor,
                    carbon_mode=carbon_mode,
                )
                assignments_output.append({
                    "id": p["id"],
                    "area": p["area"],
                    "latitude": p["latitude"],
                    "longitude": p["longitude"],
                    "orders": p["orders"],
                    "assigned_warehouse_id": None,
                    "cluster_id": None,
                    "distance_km": 0.0,
                    "cost": cost,
                    "status": "noise",
                    "cluster_color": "#cc0000",
                })
                total_transport_cost += cost

        std_count = len([a for a in assignments_output if a["status"] == "standard"])
        int_count = len([a for a in assignments_output if a["status"] == "integrated_noise"])
        noise_count = len(final_noise)

        avg_distance_km = (
            round(weighted_distance_sum / max(1, assigned_orders_sum), 2)
            if assigned_orders_sum > 0 else 1.0
        )
        total_distance_km = round(sum(a["distance_km"] for a in assignments_output), 2)

        total_operational_cost = round(total_transport_cost + (len(warehouses_output) * DEFAULT_FIXED_COST_PER_WAREHOUSE), 2)
        baseline_cost, _ = calculate_baseline_cost(dataframe, traffic_factor, carbon_mode)
        savings_pct = calculate_savings_percentage(total_operational_cost, baseline_cost)

        metrics_output = {
            "total_orders": total_orders_sum,
            "total_points": n_points,
            "standard_houses": std_count,
            "integrated_houses": int_count,
            "noise_houses": noise_count,
            "total_cost": total_operational_cost,
            "average_distance_km": avg_distance_km,
            "total_distance_km": total_distance_km,
            "warehouse_count": len(warehouses_output),
            "unassigned_points": noise_count,
            "savings_percentage": savings_pct,
        }

        return {
            "warehouses": warehouses_output,
            "assignments": assignments_output,
            "metrics": metrics_output,
        }
