"""Application constants and default configurations for WarehouseIQ."""

# CSV Column Requirements (Only Latitude and Longitude are required)
COL_LATITUDE = "Latitude"
COL_LONGITUDE = "Longitude"
COL_AREA = "Area"
COL_ORDERS = "Orders"

REQUIRED_COLUMNS = [COL_LATITUDE, COL_LONGITUDE]

# 20 Cluster Colors matching warehouse.py
CLUSTER_COLOURS = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
    "#008080", "#e6beff", "#9a6324", "#fffac8", "#800000",
    "#aaffc3", "#808000", "#ffd8b1", "#000075", "#808080"
]

def get_cluster_colour(cluster_id: int) -> str:
    """Cluster color function matching warehouse.py."""
    return CLUSTER_COLOURS[(cluster_id * 7) % len(CLUSTER_COLOURS)]


# Geodesic and Physical Constants
EARTH_RADIUS_METERS = 6371000.0
EARTH_RADIUS_KM = 6371.0
EPSILON_COORDINATES = 1e-12

# Coordinate Bounds
MIN_LATITUDE = -90.0
MAX_LATITUDE = 90.0
MIN_LONGITUDE = -180.0
MAX_LONGITUDE = 180.0

# Logistics Cost Model Constants
DEFAULT_BASE_COST_PER_KM_PER_ORDER = 0.50  # Currency units per km per order
DEFAULT_FIXED_COST_PER_WAREHOUSE = 5000.0   # Fixed facility operational cost
DEFAULT_HANDLING_COST_PER_ORDER = 1.25     # In-facility handling cost per order
TRAFFIC_FACTOR_MULTIPLIER = 1.35            # Multiplier when traffic factor is active
CARBON_MODE_COST_MULTIPLIER = 1.20          # Multiplier for eco-routing & green compliance

# Default Optimization Parameters
DEFAULT_WAREHOUSE_COUNT = 3
DEFAULT_CAPACITY = 5000
DEFAULT_MAX_RADIUS_METERS = 2000.0
DEFAULT_MAX_CLUSTER_SIZE = 100
DEFAULT_MIN_POINTS = 15
DEFAULT_DBSCAN_EPS_METERS = 500.0
DEFAULT_MAX_RECURSION_DEPTH = 100
DEFAULT_LEARNING_RATE = 10.0
DEFAULT_MAX_ITERATIONS = 5000
DEFAULT_TOLERANCE = 0.5
