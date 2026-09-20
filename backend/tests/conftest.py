import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path so app modules are discoverable
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.core.config import settings


@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient for making HTTP requests."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_csv_path() -> Path:
    """Path to the valid sample_data.csv fixture."""
    return Path(__file__).parent / "sample_data.csv"
