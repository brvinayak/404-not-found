def test_simulate_endpoint(client):
    """Test POST /simulate scenario projection."""
    payload = {
        "demand_growth": 20.0,
        "warehouse_count": 4
    }
    response = client.post("/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["simulated_warehouses"] == 4
    assert data["demand_growth"] == 20.0
    assert data["total_orders"] > 0
    assert data["total_cost"] > 0.0
    assert data["average_distance"] > 0.0
    assert "savings" in data
    assert "details" in data


def test_simulate_warehouse_scaling_impact(client):
    """Test that increasing warehouse count reduces average delivery distance."""
    res_few = client.post("/simulate", json={"demand_growth": 10.0, "warehouse_count": 2})
    res_many = client.post("/simulate", json={"demand_growth": 10.0, "warehouse_count": 6})

    assert res_few.status_code == 200
    assert res_many.status_code == 200

    few_dist = res_few.json()["average_distance"]
    many_dist = res_many.json()["average_distance"]

    assert many_dist < few_dist
