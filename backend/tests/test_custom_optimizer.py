import numpy as np
import pandas as pd
from app.algorithms.custom_optimizer import (
    CustomWarehouseOptimizer,
    find_warehouse,
    _dbscan,
    _chunk_error_and_gradient,
)
from app.utils.distance import (
    haversine_m,
    haversine_km,
    haversine_matrix,
    project_to_xy,
    backproject,
)


def test_haversine_m_and_km():
    """Test haversine geodesic distance calculation."""
    # Bangalore Indiranagar to Koramangala (~5 km apart)
    dist_m = haversine_m(12.9784, 77.6408, 12.9352, 77.6245)
    assert 4000 < dist_m < 6000
    assert abs(dist_m / 1000.0 - haversine_km(12.9784, 77.6408, 12.9352, 77.6245)) < 1e-6


def test_haversine_matrix_vectorized():
    """Test pairwise distance matrix vectorization."""
    pts_lat = np.array([12.9784, 12.9352])
    pts_lon = np.array([77.6408, 77.6245])
    wh_lat = np.array([12.9500, 12.9200])
    wh_lon = np.array([77.6300, 77.6100])

    mat = haversine_matrix(pts_lat, pts_lon, wh_lat, wh_lon)
    assert mat.shape == (2, 2)
    assert np.all(mat > 0)


def test_projection_roundtrip():
    """Test projecting to local XY and backprojecting returns original coordinates."""
    points = [{"latitude": 12.95, "longitude": 77.60}]
    lat0 = np.radians(12.95)
    lon0 = np.radians(77.60)
    xy = project_to_xy(points, lat0, lon0)
    assert abs(xy[0][0]) < 1e-4
    assert abs(xy[0][1]) < 1e-4

    back_lat, back_lon = backproject(xy[0][0], xy[0][1], lat0, lon0)
    assert abs(back_lat - 12.95) < 1e-5
    assert abs(back_lon - 77.60) < 1e-5


def test_find_warehouse_gradient_descent():
    """Test gradient descent placement converges to centroid for symmetric houses."""
    houses = np.array([
        [-100.0, 0.0],
        [100.0, 0.0],
        [0.0, -100.0],
        [0.0, 100.0],
    ])
    result = find_warehouse(houses, loss="distance", alpha=5.0, max_iters=200, tol=0.1)
    assert np.linalg.norm(result.position) < 5.0
    assert result.error > 0


def test_custom_warehouse_optimizer_direct():
    """Test direct invocation of CustomWarehouseOptimizer on a DataFrame."""
    df = pd.DataFrame([
        {"Latitude": 12.93, "Longitude": 77.62},
        {"Latitude": 12.94, "Longitude": 77.63},
        {"Latitude": 12.95, "Longitude": 77.64},
        {"Latitude": 12.96, "Longitude": 77.65},
    ])
    optimizer = CustomWarehouseOptimizer()
    result = optimizer.optimize(df, capacity=100)

    assert len(result["warehouses"]) >= 1
    assert len(result["assignments"]) == 4
    assert result["metrics"]["total_points"] == 4
    assert result["metrics"]["total_orders"] == 4


def test_warehouse_py_noise_and_radius_integration():
    """Test standard points, integrated noise (1x-1.5x radius), and true noise (>1.5x)."""
    # Create a dense cluster around (12.935, 77.624) within 500m
    base_lat, base_lon = 12.935, 77.624
    lats = [base_lat + i * 0.001 for i in range(16)]
    lons = [base_lon + i * 0.001 for i in range(16)]

    # Add an integrated noise point ~2.5km away from warehouse (between 2000m and 3000m)
    # 0.030 degrees from base_lat is ~2.5km from the cluster centroid (~12.9425)
    lats.append(base_lat + 0.030)
    lons.append(base_lon)


    # Add a distant noise point ~10km away (> 3000m)
    # 0.09 degrees lat is ~10 km
    lats.append(base_lat + 0.090)
    lons.append(base_lon)

    df = pd.DataFrame({"Latitude": lats, "Longitude": lons})
    optimizer = CustomWarehouseOptimizer()
    result = optimizer.optimize(
        df,
        warehouse_count=1,
        max_radius_m=2000.0,
        max_cluster_size=100,
        min_points=15,
        dbscan_eps_m=500.0
    )

    assert len(result["warehouses"]) == 1
    wh = result["warehouses"][0]
    assert wh["standard_count"] >= 15
    assert wh["integrated_count"] >= 1
    assert result["metrics"]["noise_houses"] >= 1
    assert "cluster_color" in wh

    statuses = [a["status"] for a in result["assignments"]]
    assert "standard" in statuses
    assert "integrated_noise" in statuses
    assert "noise" in statuses


