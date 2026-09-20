from typing import Optional
from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    """Response model for POST /upload."""
    success: bool = Field(default=True, description="Whether the file upload and parsing succeeded")
    rows: int = Field(..., ge=0, description="Number of valid rows parsed and stored")
    filename: Optional[str] = Field(default=None, description="Stored filename in uploads directory")
    message: Optional[str] = Field(default=None, description="Optional informational message")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "rows": 120
            }
        }
    }
