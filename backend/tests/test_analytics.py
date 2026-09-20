def test_analytics_endpoint(client, sample_csv_path):
    """Test GET /analytics returns proper schema and values."""
    # Seed dataset
    with open(sample_csv_path, "rb") as f:
        client.post(
            "/upload",
            files={"file": ("sample_data.csv", f, "text/csv")}
        )

    # Trigger optimization
    client.post("/optimize", json={"warehouse_count": 3, "capacity": 5000})

    # Fetch analytics
    response = client.get("/analytics")
    assert response.status_code == 200
    data = response.json()

    # Exact required fields check
    assert "total_orders" in data
    assert "total_cost" in data
    assert "average_distance" in data
    assert "savings" in data

    assert isinstance(data["total_orders"], int)
    assert isinstance(data["total_cost"], (int, float))
    assert isinstance(data["average_distance"], (int, float))
    assert isinstance(data["savings"], (int, float))

    assert data["total_orders"] > 0
    assert data["total_cost"] > 0
    assert data["average_distance"] > 0
    assert data["savings"] >= 0
