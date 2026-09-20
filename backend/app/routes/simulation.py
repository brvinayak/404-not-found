from fastapi import APIRouter, status, Depends
from app.schemas.optimize_schema import SimulationRequest
from app.schemas.response_schema import SimulationResponse
from app.services.simulation_service import simulation_service, SimulationService

router = APIRouter(tags=["Simulation"])


@router.post(
    "/simulate",
    response_model=SimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate logistics impact of demand growth and warehouse expansion"
)
async def run_simulation(
    request: SimulationRequest,
    service: SimulationService = Depends(lambda: simulation_service),
) -> SimulationResponse:
    """
    Run what-if scenario simulations for anticipated demand growth
    and warehouse count changes.
    """
    return service.simulate_scenario(request)
