from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Warehouse(BaseModel):
    """Optimal warehouse location and capacity metrics matching warehouse.py."""
    warehouse_id: int = Field(..., description="Unique identifier for the warehouse")
    latitude: float = Field(..., description="Geographic latitude coordinate")
    longitude: float = Field(..., description="Geographic longitude coordinate")
    standard_count: int = Field(default=0, description="Count of standard zone houses (<= 1.0x radius)")
    integrated_count: int = Field(default=0, description="Count of integrated noise houses (1.0x to 1.5x radius)")
    assigned_orders: int = Field(default=0, description="Total order volume assigned to this warehouse")
    assigned_points_count: int = Field(default=0, description="Total houses/points served by this warehouse")
    capacity: int = Field(default=100, description="Maximum points capacity limit (max_cluster_size)")
    utilization_rate: float = Field(default=0.0, description="Capacity utilization percentage (0-100)")
    cluster_color: Optional[str] = Field(default="#4363d8", description="Distinct color assigned to this warehouse cluster")


class Assignment(BaseModel):
    """Delivery assignment from neighborhood demand point to optimal warehouse."""
    id: Optional[int] = Field(default=None, description="Point sequence index")
    area: str = Field(..., description="Point identifier")
    latitude: float = Field(..., description="Area latitude coordinate")
    longitude: float = Field(..., description="Area longitude coordinate")
    orders: int = Field(default=1, description="Order demand volume for this point")
    assigned_warehouse_id: Optional[int] = Field(default=None, description="ID of the assigned warehouse (or None for unassigned noise)")
    cluster_id: Optional[int] = Field(default=None, description="Cluster ID (or None)")
    distance_km: float = Field(default=0.0, description="Great-circle distance in kilometers to assigned warehouse")
    cost: float = Field(default=0.0, description="Calculated logistics delivery cost")
    status: Optional[str] = Field(default="standard", description="Assignment status: standard, integrated_noise, or noise")
    cluster_color: Optional[str] = Field(default="#4363d8", description="Color code corresponding to cluster or red for noise")


class Metrics(BaseModel):
    """Overall logistics optimization metrics."""
    total_orders: int = Field(..., description="Total demand points/orders processed")
    total_points: int = Field(default=0, description="Total houses/points processed")
    standard_houses: int = Field(default=0, description="Houses served within standard delivery radius")
    integrated_houses: int = Field(default=0, description="Houses served in 1.0x to 1.5x noise integration zone")
    noise_houses: int = Field(default=0, description="Houses remaining unassigned / true noise")
    total_cost: float = Field(..., description="Total logistics operational cost")
    average_distance_km: float = Field(..., description="Weighted or mean delivery distance in km")
    total_distance_km: float = Field(default=0.0, description="Sum of all delivery distances in km")
    warehouse_count: int = Field(..., description="Number of warehouses active")
    unassigned_points: int = Field(default=0, description="Number of points that could not be assigned within constraints")
    savings_percentage: float = Field(default=0.0, description="Estimated percentage cost savings compared to single-hub baseline")



class OptimizationResponse(BaseModel):
    """Standard payload returned by POST /optimize."""
    warehouses: List[Warehouse] = Field(default_factory=list, description="List of established warehouse locations")
    assignments: List[Assignment] = Field(default_factory=list, description="List of neighborhood assignments")
    metrics: Metrics = Field(..., description="Aggregated logistics metrics")

    model_config = {
        "json_schema_extra": {
            "example": {
                "warehouses": [
                    {
                        "warehouse_id": 1,
                        "latitude": 12.9716,
                        "longitude": 77.5946,
                        "assigned_orders": 3400,
                        "assigned_points_count": 28,
                        "capacity": 5000,
                        "utilization_rate": 68.0
                    }
                ],
                "assignments": [
                    {
                        "area": "Downtown",
                        "latitude": 12.9720,
                        "longitude": 77.5950,
                        "orders": 120,
                        "assigned_warehouse_id": 1,
                        "distance_km": 0.06,
                        "cost": 3.6,
                        "status": "standard"
                    }
                ],
                "metrics": {
                    "total_orders": 12000,
                    "total_cost": 50000.0,
                    "average_distance_km": 4.3,
                    "total_distance_km": 516.0,
                    "warehouse_count": 3,
                    "unassigned_points": 0,
                    "savings_percentage": 28.0
                }
            }
        }
    }


class AnalyticsResponse(BaseModel):
    """Response payload for GET /analytics matching exact requirement."""
    total_orders: int = Field(..., description="Total order volume across all neighborhoods")
    total_cost: float = Field(..., description="Total logistics cost in currency units")
    average_distance: float = Field(..., description="Average delivery distance in kilometers")
    savings: float = Field(..., description="Calculated percentage cost savings")

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_orders": 12000,
                "total_cost": 50000.0,
                "average_distance": 4.3,
                "savings": 28.0
            }
        }
    }


class SimulationResponse(BaseModel):
    """Response payload for POST /simulate."""
    simulated_warehouses: int = Field(..., description="Simulated warehouse count")
    demand_growth: float = Field(..., description="Percentage demand growth applied")
    total_orders: int = Field(..., description="Simulated total orders")
    total_cost: float = Field(..., description="Simulated total cost")
    average_distance: float = Field(..., description="Simulated average delivery distance in km")
    savings: float = Field(..., description="Projected savings percentage")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Detailed scenario comparisons")

    model_config = {
        "json_schema_extra": {
            "example": {
                "simulated_warehouses": 4,
                "demand_growth": 20.0,
                "total_orders": 14400,
                "total_cost": 53500.0,
                "average_distance": 3.6,
                "savings": 32.5,
                "details": {
                    "baseline_orders": 12000,
                    "baseline_warehouses": 3,
                    "distance_reduction_pct": 16.3
                }
            }
        }
    }
