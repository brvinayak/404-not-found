import time
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.core.config import settings
from app.schemas.upload_schema import UploadResponse
from app.utils.csv_parser import parse_and_validate_csv, CSVValidationError
from app.services.optimization_service import optimization_service

router = APIRouter(tags=["Dataset Upload"])


@router.get(
    "/upload",
    summary="Upload service status and dataset info"
)
async def get_upload_info():
    """Information endpoint for upload status. Use POST /upload to upload CSV files."""
    active_df = None
    try:
        active_df = optimization_service.get_active_dataframe()
    except Exception:
        pass

    return {
        "status": "active",
        "has_active_dataset": active_df is not None and not active_df.empty,
        "active_rows": len(active_df) if active_df is not None else 0,
        "message": "Upload service is active. Use POST /upload with multipart/form-data CSV to upload demand coordinates."
    }


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload neighborhood demand CSV dataset"
)
async def upload_csv_dataset(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload and validate CSV dataset.
    
    Required CSV columns:
    - Latitude (float, [-90, 90])
    - Longitude (float, [-180, 180])
    All other columns will be discarded.
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .csv files are supported."
        )

    try:
        content = await file.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded CSV file is empty."
            )

        # Parse and validate the content
        df = parse_and_validate_csv(content)
        row_count = len(df)

        # Persist copy to uploads directory
        timestamp = int(time.time())
        safe_filename = Path(file.filename).name
        target_path = settings.UPLOADS_DIR / f"{timestamp}_{safe_filename}"
        with open(target_path, "wb") as f:
            f.write(content)

        # Set active dataframe in optimization service and save to processed/latest.csv
        optimization_service.set_active_dataframe(df)

        return UploadResponse(
            success=True,
            rows=row_count,
            filename=target_path.name,
            message="CSV uploaded and validated successfully."
        )

    except CSVValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during upload: {str(e)}"
        )
    finally:
        await file.close()
