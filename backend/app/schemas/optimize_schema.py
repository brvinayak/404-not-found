from typing import Optional
from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    """Request payload for POST /optimize."""
    warehouse_count: int = Field(default=3, ge=1, description="Target number of warehouses to place")
    capacity: int = Field(default=5000, ge=1, description="Maximum capacity / points per warehouse")
    max_radius_m: float = Field(default=2000.0, ge=100.0, description="Delivery radius in meters")
    max_cluster_size: Optional[int] = Field(default=None, description="Max points per warehouse (alias for capacity)")
    min_points: int = Field(default=15, ge=1, description="DBSCAN minimum points per cluster")
    dbscan_eps_m: float = Field(default=500.0, ge=50.0, description="DBSCAN search radius in meters")
    traffic_factor: bool = Field(default=False, description="Consider traffic congestion multipliers")
    carbon_mode: bool = Field(default=False, description="Enable carbon-conscious eco-delivery penalties")

    model_config = {
        "json_schema_extra": {
            "example": {
                "warehouse_count": 3,
                "capacity": 5000,
                "max_radius_m": 2000.0,
                "min_points": 15,
                "dbscan_eps_m": 500.0,
                "traffic_factor": False,
                "carbon_mode": False
            }
        }
    }


class SimulationRequest(BaseModel):
    """Request payload for POST /simulate."""
    demand_growth: float = Field(default=20.0, description="Projected percentage growth in demand")
    warehouse_count: int = Field(default=4, ge=1, description="Simulated number of warehouses")

    model_config = {
        "json_schema_extra": {
            "example": {
                "demand_growth": 20.0,
                "warehouse_count": 4
            }
        }
    }
