import csv
import io
import json
import pytest
from export_engine import (
    export_events_to_ics,
    export_receipts_to_csv,
    export_reading_to_csv,
    export_reading_to_json
)


def test_export_events_to_ics():
    items = [
        {
            "id": "item-123",
            "detected_category": "event",
            "original_filename": "meetup_poster.png",
            "resolved_date": "2026-10-25T18:00:00",
            "extracted_fields": {
                "event_title": "AI Builders Hackathon Showcase",
                "start_time": "2026-10-25T18:00:00",
                "end_time": "2026-10-25T21:00:00",
                "location": "Design Hall B & Online",
                "description": "Annual open-source showcase",
                "source_evidence": "October 25, 6 PM - 9 PM at Design Hall B"
            }
        }
    ]

    ics_result = export_events_to_ics(items)
    assert "BEGIN:VCALENDAR" in ics_result
    assert "END:VCALENDAR" in ics_result
    assert "SUMMARY:AI Builders Hackathon Showcase" in ics_result
    assert "LOCATION:Design Hall B & Online" in ics_result
    assert "UID:someday-item-123@someday.local" in ics_result


def test_export_receipts_to_csv():
    items = [
        {
            "id": "rec-001",
            "detected_category": "receipt",
            "original_filename": "dinner_bill.jpg",
            "resolved_date": "2026-10-20",
            "extracted_fields": {
                "merchant": "Trattoria Romana",
                "total_amount": 48.75,
                "currency": "USD",
                "expense_category": "Dining",
                "items_summary": "Pasta, sparkling water, espresso",
                "source_evidence": "TOTAL $48.75"
            }
        }
    ]

    csv_data = export_receipts_to_csv(items)
    reader = csv.reader(io.StringIO(csv_data))
    rows = list(reader)
    
    assert len(rows) == 2
    headers = rows[0]
    assert "Merchant" in headers
    assert "Amount" in headers
    
    data_row = rows[1]
    assert data_row[2] == "Trattoria Romana"
    assert data_row[3] == "48.75"
    assert data_row[4] == "USD"
    assert data_row[5] == "Dining"


def test_export_reading_to_json():
    items = [
        {
            "id": "read-001",
            "detected_category": "reading",
            "original_filename": "arxiv_paper.png",
            "created_at": "2026-10-21T10:00:00",
            "extracted_fields": {
                "title": "Attention Is All You Need",
                "url": "https://arxiv.org/abs/1706.03762",
                "website_or_source": "arXiv",
                "author": "Vaswani et al.",
                "description": "Seminal transformer architecture paper",
                "source_evidence": "Attention Is All You Need (arXiv:1706.03762)"
            }
        }
    ]

    json_str = export_reading_to_json(items)
    parsed = json.loads(json_str)
    assert len(parsed) == 1
    assert parsed[0]["title"] == "Attention Is All You Need"
    assert parsed[0]["source"] == "arXiv"
