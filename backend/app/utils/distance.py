import math
import numpy as np
from typing import List, Dict, Tuple
from app.core.constants import EARTH_RADIUS_METERS, EARTH_RADIUS_KM


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Great-circle distance between two (lat, lon) points in meters.
    Uses spherical law / haversine formulation.
    """
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    # Clamp 'a' to [0, 1] to avoid math domain errors
    a = max(0.0, min(1.0, a))
    return EARTH_RADIUS_METERS * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two (lat, lon) points in kilometers."""
    return haversine_m(lat1, lon1, lat2, lon2) / 1000.0


def haversine_matrix(
    pts_lat: np.ndarray,
    pts_lon: np.ndarray,
    wh_lat: np.ndarray,
    wh_lon: np.ndarray
) -> np.ndarray:
    """
    Vectorized Haversine distance calculation between N points and M warehouses.
    
    Args:
        pts_lat: 1D array of length N (latitudes in degrees)
        pts_lon: 1D array of length N (longitudes in degrees)
        wh_lat: 1D array of length M (warehouse latitudes in degrees)
        wh_lon: 1D array of length M (warehouse longitudes in degrees)
        
    Returns:
        (N, M) ndarray of pairwise distances in meters.
    """
    if len(pts_lat) == 0 or len(wh_lat) == 0:
        return np.empty((len(pts_lat), len(wh_lat)), dtype=np.float64)

    pts_lat_rad = np.radians(pts_lat)[:, np.newaxis]
    pts_lon_rad = np.radians(pts_lon)[:, np.newaxis]
    wh_lat_rad = np.radians(wh_lat)[np.newaxis, :]
    wh_lon_rad = np.radians(wh_lon)[np.newaxis, :]

    dlat = wh_lat_rad - pts_lat_rad
    dlon = wh_lon_rad - pts_lon_rad

    a = (
        np.sin(dlat / 2.0) ** 2
        + np.cos(pts_lat_rad) * np.cos(wh_lat_rad) * np.sin(dlon / 2.0) ** 2
    )
    a = np.clip(a, 0.0, 1.0)
    return EARTH_RADIUS_METERS * 2.0 * np.arcsin(np.sqrt(a))


def project_to_xy(
    points: List[Dict[str, float]],
    lat0_rad: float,
    lon0_rad: float,
    R: float = EARTH_RADIUS_METERS
) -> np.ndarray:
    """
    Project a list of {'latitude': float, 'longitude': float} dicts onto an equirectangular
    local XY plane centered at (lat0_rad, lon0_rad). Coordinates are in meters.
    """
    cos_lat0 = math.cos(lat0_rad)
    xy = []
    for p in points:
        lat = math.radians(p["latitude"])
        lon = math.radians(p["longitude"])
        x = R * (lon - lon0_rad) * cos_lat0
        y = R * (lat - lat0_rad)
        xy.append([x, y])
    return np.array(xy, dtype=np.float64)


def backproject(
    opt_x: float,
    opt_y: float,
    lat0_rad: float,
    lon0_rad: float,
    R: float = EARTH_RADIUS_METERS
) -> Tuple[float, float]:
    """
    Convert local planar XY coordinate (in meters) back to geographic (latitude, longitude) in degrees.
    """
    opt_lat = math.degrees(lat0_rad + opt_y / R)
    cos_lat0 = math.cos(lat0_rad)
    # Prevent division by zero near poles
    if abs(cos_lat0) < 1e-9:
        cos_lat0 = 1e-9 if cos_lat0 >= 0 else -1e-9
    opt_lon = math.degrees(lon0_rad + opt_x / (R * cos_lat0))
    return opt_lat, opt_lon
