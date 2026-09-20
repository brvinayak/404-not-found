def test_optimize_endpoint_success(client, sample_csv_path):
    """Test POST /optimize with a previously uploaded dataset."""
    # Ensure dataset is uploaded first
    with open(sample_csv_path, "rb") as f:
        client.post(
            "/upload",
            files={"file": ("sample_data.csv", f, "text/csv")}
        )

    # Run optimization
    payload = {
        "warehouse_count": 3,
        "capacity": 5000,
        "traffic_factor": False,
        "carbon_mode": False
    }
    response = client.post("/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Check top-level keys
    assert "warehouses" in data
    assert "assignments" in data
    assert "metrics" in data

    # Verify warehouses structure
    assert len(data["warehouses"]) == 3
    for w in data["warehouses"]:
        assert "warehouse_id" in w
        assert "latitude" in w
        assert "longitude" in w
        assert "assigned_orders" in w
        assert "assigned_points_count" in w
        assert "capacity" in w
        assert "utilization_rate" in w
        assert "standard_count" in w
        assert "integrated_count" in w
        assert "cluster_color" in w

    # Verify assignments structure
    assert len(data["assignments"]) == 20
    for a in data["assignments"]:
        assert "area" in a
        assert "latitude" in a
        assert "longitude" in a
        assert "orders" in a
        assert "assigned_warehouse_id" in a
        assert "distance_km" in a
        assert "cost" in a
        assert "status" in a
        assert a["status"] in ["standard", "integrated_noise", "noise"]

    # Verify metrics
    metrics = data["metrics"]
    assert metrics["total_points"] == 20
    assert metrics["total_orders"] > 0
    assert metrics["warehouse_count"] == 3
    assert metrics["total_cost"] > 0.0


def test_optimize_with_traffic_and_carbon_mode(client, sample_csv_path):
    """Test that enabling traffic_factor and carbon_mode adjusts logistics costs accordingly."""
    with open(sample_csv_path, "rb") as f:
        client.post(
            "/upload",
            files={"file": ("sample_data.csv", f, "text/csv")}
        )

    # Standard run
    base_res = client.post("/optimize", json={
        "warehouse_count": 2,
        "capacity": 6000,
        "traffic_factor": False,
        "carbon_mode": False
    })
    base_cost = base_res.json()["metrics"]["total_cost"]

    # Run with traffic and carbon penalties
    premium_res = client.post("/optimize", json={
        "warehouse_count": 2,
        "capacity": 6000,
        "traffic_factor": True,
        "carbon_mode": True
    })
    premium_cost = premium_res.json()["metrics"]["total_cost"]

    assert premium_cost > base_cost
