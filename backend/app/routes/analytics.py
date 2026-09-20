from fastapi import APIRouter, status, Depends
from app.schemas.response_schema import AnalyticsResponse
from app.services.analytics_service import analytics_service, AnalyticsService

router = APIRouter(tags=["Analytics"])


@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get logistics KPIs, cost, average distance, and savings"
)
async def get_logistics_analytics(
    service: AnalyticsService = Depends(lambda: analytics_service),
) -> AnalyticsResponse:
    """
    Retrieve aggregated delivery metrics, total logistics costs,
    average delivery distance, and estimated cost savings.
    """
    return service.get_analytics()
