import math
from typing import Optional, Dict, Any
from app.schemas.optimize_schema import SimulationRequest
from app.schemas.response_schema import SimulationResponse
from app.services.analytics_service import analytics_service, AnalyticsService
from app.core.constants import (
    DEFAULT_BASE_COST_PER_KM_PER_ORDER,
    DEFAULT_FIXED_COST_PER_WAREHOUSE,
    DEFAULT_HANDLING_COST_PER_ORDER,
)


class SimulationService:
    """
    Service responsible for simulating what-if logistics scenarios:
    - Demand growth projections
    - Warehouse facility expansion or consolidation
    - Scenario impact analysis (distance reduction, cost variance, savings)
    """

    def __init__(self, an_service: Optional[AnalyticsService] = None):
        self.analytics_service = an_service or analytics_service

    def simulate_scenario(self, request: SimulationRequest) -> SimulationResponse:
        """
        Simulate impact of demand growth percentage and warehouse count adjustments.
        Uses logistics spatial scaling models to project delivery distances, operational costs,
        and estimated savings.
        """
        # Retrieve baseline metrics from active optimization or defaults
        base_analytics = self.analytics_service.get_analytics()
        base_orders = max(100, base_analytics.total_orders)
        base_avg_dist = max(1.0, base_analytics.average_distance)
        base_wh_count = 3

        growth_factor = 1.0 + (request.demand_growth / 100.0)
        simulated_orders = int(round(base_orders * max(0.1, growth_factor)))

        # Spatial distribution principle: Average delivery distance scales inversely
        # with the square root of the number of dispersed distribution nodes:
        # dist ~ 1 / sqrt(warehouse_count)
        dist_scaling = math.sqrt(max(1, base_wh_count) / max(1, request.warehouse_count))
        simulated_avg_distance = round(base_avg_dist * dist_scaling, 2)

        # Cost components
        variable_transport_cost = (
            simulated_orders * simulated_avg_distance * DEFAULT_BASE_COST_PER_KM_PER_ORDER
        )
        handling_cost = simulated_orders * DEFAULT_HANDLING_COST_PER_ORDER
        facility_fixed_cost = request.warehouse_count * DEFAULT_FIXED_COST_PER_WAREHOUSE

        simulated_total_cost = round(
            variable_transport_cost + handling_cost + facility_fixed_cost, 2
        )

        # Baseline single hub comparison at new demand volume
        single_hub_dist = base_avg_dist * 1.8
        baseline_cost_at_volume = round(
            (simulated_orders * single_hub_dist * DEFAULT_BASE_COST_PER_KM_PER_ORDER)
            + handling_cost
            + DEFAULT_FIXED_COST_PER_WAREHOUSE,
            2
        )

        if baseline_cost_at_volume > simulated_total_cost:
            projected_savings = round(
                ((baseline_cost_at_volume - simulated_total_cost) / baseline_cost_at_volume) * 100.0,
                1
            )
        else:
            projected_savings = 0.0

        details = {
            "baseline_orders": base_orders,
            "baseline_average_distance_km": base_avg_dist,
            "baseline_warehouse_count": base_wh_count,
            "simulated_fixed_facility_cost": facility_fixed_cost,
            "simulated_variable_transport_cost": round(variable_transport_cost, 2),
            "distance_reduction_pct": round((1.0 - dist_scaling) * 100.0, 1),
        }

        return SimulationResponse(
            simulated_warehouses=request.warehouse_count,
            demand_growth=request.demand_growth,
            total_orders=simulated_orders,
            total_cost=simulated_total_cost,
            average_distance=simulated_avg_distance,
            savings=projected_savings,
            details=details,
        )


simulation_service = SimulationService()
