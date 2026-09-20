from pathlib import Path
from typing import Optional, Dict, Any
import pandas as pd
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.optimize_schema import OptimizeRequest
from app.schemas.response_schema import (
    OptimizationResponse,
    Warehouse,
    Assignment,
    Metrics,
)
from app.utils.csv_parser import parse_and_validate_csv, CSVValidationError
from app.algorithms.custom_optimizer import CustomWarehouseOptimizer


class OptimizationService:
    """
    Service responsible for loading datasets, running validations,
    invoking the CustomWarehouseOptimizer, and returning typed response models.
    """

    def __init__(self, optimizer: Optional[CustomWarehouseOptimizer] = None):
        self.optimizer = optimizer or CustomWarehouseOptimizer()
        self._latest_result: Optional[Dict[str, Any]] = None
        self._latest_dataframe: Optional[pd.DataFrame] = None

    @property
    def latest_csv_path(self) -> Path:
        return settings.PROCESSED_DIR / "latest.csv"

    def get_active_dataframe(self) -> pd.DataFrame:
        """
        Load and validate the currently active dataset.
        Checks in-memory cache, then processed/latest.csv, then any uploaded CSVs.
        """
        if self._latest_dataframe is not None and not self._latest_dataframe.empty:
            return self._latest_dataframe

        if self.latest_csv_path.is_file():
            try:
                df = parse_and_validate_csv(self.latest_csv_path)
                self._latest_dataframe = df
                return df
            except CSVValidationError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stored dataset is invalid: {e.message}"
                )

        # Look in uploads directory if latest.csv doesn't exist
        csv_files = list(settings.UPLOADS_DIR.glob("*.csv"))
        if csv_files:
            latest_upload = max(csv_files, key=lambda f: f.stat().st_mtime)
            try:
                df = parse_and_validate_csv(latest_upload)
                self._latest_dataframe = df
                return df
            except CSVValidationError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Uploaded dataset is invalid: {e.message}"
                )

        raise HTTPException(
            status_code=400,
            detail="No demand dataset has been uploaded yet. Please upload a CSV to POST /upload first."
        )

    def set_active_dataframe(self, df: pd.DataFrame) -> None:
        """Update active dataframe and persist to processed/latest.csv."""
        self._latest_dataframe = df
        settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        df.to_csv(self.latest_csv_path, index=False)

    def run_optimization(self, request: OptimizeRequest) -> OptimizationResponse:
        """
        Execute warehouse placement optimization on the active dataset.
        """
        df = self.get_active_dataframe()

        # Invoke custom optimizer matching warehouse.py
        raw_result = self.optimizer.optimize(
            dataframe=df,
            warehouse_count=request.warehouse_count,
            capacity=request.capacity,
            traffic_factor=request.traffic_factor,
            carbon_mode=request.carbon_mode,
            max_radius_m=request.max_radius_m,
            max_cluster_size=request.max_cluster_size or request.capacity,
            min_points=request.min_points,
            dbscan_eps_m=request.dbscan_eps_m,
        )


        # Cache the result for analytics and simulation services
        self._latest_result = raw_result

        # Format into typed Pydantic models
        warehouses = [Warehouse(**w) for w in raw_result.get("warehouses", [])]
        assignments = [Assignment(**a) for a in raw_result.get("assignments", [])]
        metrics = Metrics(**raw_result.get("metrics", {}))

        return OptimizationResponse(
            warehouses=warehouses,
            assignments=assignments,
            metrics=metrics,
        )

    def get_latest_result(self) -> Optional[Dict[str, Any]]:
        """Return raw cached dictionary of the latest optimization run."""
        return self._latest_result


# Singleton instance for dependency injection across routers
optimization_service = OptimizationService()
