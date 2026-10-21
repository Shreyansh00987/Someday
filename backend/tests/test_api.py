import pytest
from fastapi.testclient import TestClient
from main import app, db


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


def test_status_endpoint(client):
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert "is_watching" in data
    assert "active_model" in data


def test_config_lifecycle(client):
    # Fetch config
    res = client.get("/api/config")
    assert res.status_code == 200
    cfg = res.json()
    assert "watch_folder" in cfg

    # Update config
    cfg["recursive"] = True
    cfg["polling_interval_sec"] = 4.5
    post_res = client.post("/api/config", json=cfg)
    assert post_res.status_code == 200
    assert post_res.json()["status"] == "updated"

    # Verify update persisted
    verify_res = client.get("/api/config")
    assert verify_res.json()["recursive"] is True
    assert verify_res.json()["polling_interval_sec"] == 4.5


def test_items_crud_and_approval(client):
    # Seed a test item
    item_id = db.create_item({
        "id": "api-test-item-1",
        "source_path": "/tmp/api_test.png",
        "file_hash": "apihash999",
        "original_filename": "api_test.png",
        "detected_category": "event",
        "extracted_fields": {
            "event_title": "FastAPI Release Party",
            "start_time": "2026-10-25T19:00:00"
        },
        "raw_date_expression": "October 25 at 7 PM",
        "resolved_date": "2026-10-25T19:00:00",
        "validation_status": "valid",
        "processing_status": "completed",
        "approval_status": "pending"
    })

    # Get single item
    item_res = client.get(f"/api/items/{item_id}")
    assert item_res.status_code == 200
    assert item_res.json()["original_filename"] == "api_test.png"

    # List items with filter
    list_res = client.get("/api/items?category=event&approval_status=pending")
    assert list_res.status_code == 200
    assert list_res.json()["total_count"] >= 1

    # Approve item
    appr_res = client.post(f"/api/items/{item_id}/approve")
    assert appr_res.status_code == 200
    assert appr_res.json()["status"] == "approved"

    # Verify approved state
    check_res = client.get(f"/api/items/{item_id}")
    assert check_res.json()["approval_status"] == "approved"


def test_export_endpoints(client):
    # Ensure at least one approved event exists
    db.create_item({
        "id": "export-event-1",
        "source_path": "/tmp/exp.png",
        "file_hash": "exphash001",
        "original_filename": "exp.png",
        "detected_category": "event",
        "extracted_fields": {
            "event_title": "Test Hackathon Presentation",
            "start_time": "2026-10-28T14:00:00"
        },
        "resolved_date": "2026-10-28T14:00:00",
        "validation_status": "valid",
        "processing_status": "completed",
        "approval_status": "approved"
    })

    # Calendar export
    cal_res = client.get("/api/export/calendar?only_approved=true")
    assert cal_res.status_code == 200
    assert "BEGIN:VCALENDAR" in cal_res.text
    assert "Test Hackathon Presentation" in cal_res.text

    # Expense export
    exp_res = client.get("/api/export/expenses?only_approved=false")
    assert exp_res.status_code == 200
    assert "Merchant" in exp_res.text

    # Reading export
    read_res = client.get("/api/export/reading?format=json&only_approved=false")
    assert read_res.status_code == 200
