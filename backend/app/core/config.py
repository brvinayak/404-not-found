import os
from pathlib import Path
from pydantic import BaseModel, Field


def _load_env_file(dotenv_path: Path) -> None:
    """Simple parser to load key-value pairs from .env if present."""
    if not dotenv_path.is_file():
        return
    with open(dotenv_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip("\"'")
            if key not in os.environ:
                os.environ[key] = val


# Load .env before settings instantiation
_ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
_load_env_file(_ENV_PATH)


class Settings(BaseModel):
    APP_NAME: str = Field(default_factory=lambda: os.getenv("APP_NAME", "WarehouseIQ"))
    APP_ENV: str = Field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "True").lower() in ("true", "1", "yes"))
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    API_PREFIX: str = ""

    # Path configurations
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    APP_DIR: Path = BASE_DIR / "app"
    DATA_DIR: Path = BASE_DIR / "app" / "data"
    UPLOADS_DIR: Path = BASE_DIR / "app" / "data" / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "app" / "data" / "processed"

    # Default parameters
    DEFAULT_MAX_RADIUS_METERS: float = Field(
        default_factory=lambda: float(os.getenv("DEFAULT_MAX_RADIUS_METERS", "2000.0"))
    )
    DEFAULT_MAX_CLUSTER_SIZE: int = Field(
        default_factory=lambda: int(os.getenv("DEFAULT_MAX_CLUSTER_SIZE", "100"))
    )
    DEFAULT_MIN_POINTS: int = Field(
        default_factory=lambda: int(os.getenv("DEFAULT_MIN_POINTS", "15"))
    )
    DEFAULT_DBSCAN_EPS_METERS: float = Field(
        default_factory=lambda: float(os.getenv("DEFAULT_DBSCAN_EPS_METERS", "500.0"))
    )

    def init_directories(self) -> None:
        """Ensure all required runtime data directories exist."""
        self.DATA_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        self.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.init_directories()
