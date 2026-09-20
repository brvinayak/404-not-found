from fastapi import APIRouter, status, Depends
from app.schemas.optimize_schema import OptimizeRequest
from app.schemas.response_schema import OptimizationResponse
from app.services.optimization_service import optimization_service, OptimizationService

router = APIRouter(tags=["Optimization"])


@router.get(
    "/optimize",
    summary="Optimization service status"
)
async def get_optimize_status(
    service: OptimizationService = Depends(lambda: optimization_service)
):
    """Information endpoint for optimize status. Use POST /optimize to run optimization."""
    latest = service.get_latest_result()
    has_dataset = False
    try:
        df = service.get_active_dataframe()
        has_dataset = df is not None and not df.empty
    except Exception:
        pass

    return {
        "status": "active",
        "has_active_dataset": has_dataset,
        "has_optimized_result": latest is not None,
        "message": "Optimization service is running. Send a POST request with optimization parameters."
    }


@router.post(
    "/optimize",
    response_model=OptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Run warehouse placement optimization"
)
async def optimize_warehouses(
    request: OptimizeRequest = OptimizeRequest(),
    service: OptimizationService = Depends(lambda: optimization_service),
) -> OptimizationResponse:
    """
    Execute custom warehouse location and allocation optimization on the active dataset.
    
    Returns:
    - warehouses: List of optimal warehouse locations and capacities
    - assignments: Detailed mapping of each neighborhood to its assigned warehouse
    - metrics: Total orders, costs, average distance, and savings percentage
    """
    return service.run_optimization(request)
