import io
from pathlib import Path


def test_upload_valid_csv(client, sample_csv_path):
    """Test uploading a valid CSV file succeeds with row count."""
    with open(sample_csv_path, "rb") as f:
        response = client.post(
            "/upload",
            files={"file": ("sample_data.csv", f, "text/csv")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["rows"] == 20
    assert "sample_data.csv" in data["filename"]


def test_upload_only_lat_lon(client):
    """Test uploading CSV containing strictly only Latitude and Longitude succeeds."""
    csv_data = "Latitude,Longitude\n12.9716,77.5946\n12.9352,77.6245\n13.0031,77.5643\n"
    response = client.post(
        "/upload",
        files={"file": ("lat_lon_only.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["rows"] == 3


def test_upload_with_extra_columns(client):
    """Test uploading CSV with extra columns (Area, Address, Orders) succeeds and ignores extra columns."""
    csv_data = "Area,Latitude,Longitude,Orders,Notes\nDowntown,12.97,77.59,500,Near station\nSuburbs,12.98,77.60,300,Outer rim\n"
    response = client.post(
        "/upload",
        files={"file": ("extra_cols.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["rows"] == 2


def test_upload_non_csv_file(client):
    """Test uploading non-csv file extension is rejected with 400."""
    response = client.post(
        "/upload",
        files={"file": ("test.txt", b"some,random,text", "text/plain")}
    )
    assert response.status_code == 400
    assert "Only .csv files are supported" in response.json()["detail"]


def test_upload_empty_csv(client):
    """Test uploading an empty CSV file is rejected with 400."""
    response = client.post(
        "/upload",
        files={"file": ("empty.csv", b"", "text/csv")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_upload_missing_required_column(client):
    """Test uploading CSV missing Latitude column is rejected with 400."""
    csv_data = "Area,Longitude,Orders\nDowntown,77.59,100\nSuburbs,77.60,200\n"
    response = client.post(
        "/upload",
        files={"file": ("missing_lat.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 400
    assert "Missing required coordinate column" in response.json()["detail"]


def test_upload_missing_coordinates(client):
    """Test uploading CSV with empty coordinate cells."""
    csv_data = "Latitude,Longitude\n,77.59\n12.98,77.60\n"
    response = client.post(
        "/upload",
        files={"file": ("missing_coords.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 400
    assert "Missing Latitude" in response.json()["detail"]


def test_upload_invalid_coordinates(client):
    """Test uploading CSV with out-of-range coordinates (> 90 lat)."""
    csv_data = "Latitude,Longitude\n195.0,77.59\n"
    response = client.post(
        "/upload",
        files={"file": ("invalid_coords.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    )
    assert response.status_code == 400
    assert "Invalid Latitude" in response.json()["detail"]
