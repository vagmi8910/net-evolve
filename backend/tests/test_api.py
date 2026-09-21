"""
backend/tests/test_api.py

Automated pytest suite for NetEvolve Security Gateway backend endpoints.
"""
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["model_loaded"] is True
    assert "Normal" in data["active_classes"]


def test_model_info():
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "RoNeTC+"
    assert data["total_parameters"] == 186240
    assert data["open_set_threshold"] == 0.1844
    assert len(data["views"]) == 3


def test_demo_seeds_registry():
    response = client.get("/api/demo/seeds")
    assert response.status_code == 200
    data = response.json()
    assert data["total_seeds"] >= 100
    assert "Backdoor" in data["categories"]
    assert "Normal" in data["categories"]


def test_run_demo_seed_known():
    response = client.post("/api/demo/seeds/normal-001/run")
    assert response.status_code == 200
    event = response.json()
    assert event["decision"]["status"] == "ALLOWED"
    assert event["open_set"]["is_unknown"] is False
    assert event["open_set"]["uncertainty"] < 0.1844
    assert "ip" in event["views"]
    assert "fused" in event


def test_run_demo_seed_zero_day():
    response = client.post("/api/demo/seeds/backdoor-001/run")
    assert response.status_code == 200
    event = response.json()
    assert event["prediction"]["label"] == "UNKNOWN"
    assert event["decision"]["status"] == "BLOCKED"
    assert event["open_set"]["is_unknown"] is True
    assert event["open_set"]["uncertainty"] >= 0.1844


def test_incidents_management():
    # After running the backdoor seed, at least one incident should exist
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) >= 1
    first_inc = incidents[0]
    assert first_inc["status"] in ["NEW", "INVESTIGATING", "CONTAINED", "RESOLVED"]

    # Test patch
    patch_res = client.patch(
        f"/api/incidents/{first_inc['id']}",
        json={"status": "INVESTIGATING", "severity": "CRITICAL"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "INVESTIGATING"
    assert patch_res.json()["severity"] == "CRITICAL"


def test_discovery_clusters():
    response = client.get("/api/discovery/clusters?n_clusters=5")
    assert response.status_code == 200
    data = response.json()
    assert data["n_clusters"] == 5
    assert len(data["points"]) > 0
    assert data["metrics"]["cluster_purity"] == 0.7740
    assert len(data["profiles"]) == 5


def test_continual_learning_flow():
    response = client.post("/api/continual-learning/start")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_classes"] == 7
    assert "Analysis" in data["active_classes"]
    assert "Backdoor" in data["active_classes"]
    assert data["forgetting_rate"] == 0.0

    # Reset back to base
    reset_res = client.post("/api/continual-learning/reset")
    assert reset_res.status_code == 200


def test_continual_learning_candidate_selection():
    # Reset simulation and model
    client.post("/api/simulation/reset")

    # Before traffic, candidates for novel classes should be empty
    candidates_res = client.get("/api/continual-learning/candidates")
    assert candidates_res.status_code == 200
    candidates = candidates_res.json()["candidates"]
    assert len(candidates) == 0

    # Run a zero-day attack seed for Backdoor
    seed_res = client.post("/api/demo/seeds/backdoor-001/run")
    assert seed_res.status_code == 200

    # Now Backdoor should be in candidates from traffic
    candidates_res2 = client.get("/api/continual-learning/candidates")
    assert candidates_res2.status_code == 200
    cand_list = candidates_res2.json()["candidates"]
    cand_names = [c["name"] for c in cand_list]
    assert "Backdoor" in cand_names

    # Incrementally learn ONLY Backdoor
    learn_res = client.post("/api/continual-learning/start", json={"classes": ["Backdoor"]})
    assert learn_res.status_code == 200
    learn_data = learn_res.json()
    assert learn_data["success"] is True
    assert learn_data["total_classes"] == 6
    assert "Backdoor" in learn_data["active_classes"]

    # Reset model
    reset_res = client.post("/api/continual-learning/reset")
    assert reset_res.status_code == 200

