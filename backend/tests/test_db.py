import os
import pytest
from pathlib import Path
from database import Database


@pytest.fixture
def test_db(tmp_path):
    db_file = tmp_path / "test_someday.db"
    return Database(db_path=db_file)


def test_create_and_get_item(test_db):
    item_data = {
        "id": "test-uuid-1",
        "source_path": "/tmp/test.png",
        "file_hash": "hash123456",
        "original_filename": "test.png",
        "detected_category": "event",
        "extracted_fields": {"event_title": "Local Meetup"},
        "raw_date_expression": "Tomorrow",
        "resolved_date": "2026-10-22T09:00:00",
        "validation_status": "valid",
        "processing_status": "completed",
        "approval_status": "pending"
    }

    item_id = test_db.create_item(item_data)
    assert item_id == "test-uuid-1"

    fetched = test_db.get_item_by_id(item_id)
    assert fetched is not None
    assert fetched["file_hash"] == "hash123456"
    assert fetched["extracted_fields"]["event_title"] == "Local Meetup"


def test_approval_and_bulk(test_db):
    for i in range(3):
        test_db.create_item({
            "id": f"item-{i}",
            "source_path": f"/tmp/test_{i}.png",
            "file_hash": f"hash_{i}",
            "original_filename": f"test_{i}.png",
            "detected_category": "receipt",
            "extracted_fields": {"total_amount": 10.0 + i},
            "validation_status": "valid",
            "processing_status": "completed"
        })

    # Approve one
    test_db.approve_item("item-0")
    assert test_db.get_item_by_id("item-0")["approval_status"] == "approved"
    assert test_db.get_item_by_id("item-1")["approval_status"] == "pending"

    # Bulk approve remaining
    approved_count = test_db.bulk_approve(["item-1", "item-2"])
    assert approved_count == 2
    assert test_db.get_item_by_id("item-1")["approval_status"] == "approved"
    assert test_db.get_item_by_id("item-2")["approval_status"] == "approved"


def test_unique_hash_constraint(test_db):
    item_data = {
        "id": "hash-dup-1",
        "source_path": "/tmp/a.png",
        "file_hash": "same_hash",
        "original_filename": "a.png",
        "detected_category": "reading",
        "extracted_fields": {}
    }
    test_db.create_item(item_data)

    by_hash = test_db.get_item_by_hash("same_hash")
    assert by_hash is not None
    assert by_hash["id"] == "hash-dup-1"
