"""
Export Engine for Someday.

Generates:
1. Valid RFC-5545 iCalendar (.ics) files for approved events.
2. Valid CSV files for approved expense receipts.
3. Valid CSV and JSON files for approved reading items.
"""

from __future__ import annotations
import csv
import io
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from icalendar import Calendar, Event as ICalEvent, vText
from dateutil import parser as dateutil_parser


def export_events_to_ics(items: List[Dict[str, Any]], calendar_name: str = "Someday Events") -> str:
    """
    Exports approved event items to a valid iCalendar (.ics) string.
    Only includes events with valid date information.
    """
    cal = Calendar()
    cal.add("prodid", "-//Someday AI//someday.local//EN")
    cal.add("version", "2.0")
    cal.add("x-wr-calname", calendar_name)

    exported_count = 0
    for item in items:
        category = item.get("detected_category")
        if category != "event":
            continue

        fields = item.get("extracted_fields", {})
        title = fields.get("event_title") or item.get("original_filename") or "Untitled Event"
        
        # Determine start datetime
        start_str = item.get("resolved_date") or fields.get("start_time")
        if not start_str:
            continue

        try:
            start_dt = dateutil_parser.isoparse(start_str)
        except Exception:
            try:
                start_dt = dateutil_parser.parse(start_str)
            except Exception:
                continue

        end_str = fields.get("end_time")
        end_dt = None
        if end_str:
            try:
                end_dt = dateutil_parser.isoparse(end_str)
            except Exception:
                try:
                    end_dt = dateutil_parser.parse(end_str)
                except Exception:
                    pass

        event = ICalEvent()
        event.add("summary", title)
        event.add("dtstart", start_dt)
        if end_dt:
            event.add("dtend", end_dt)
        
        # Stable unique identifier
        event_uid = f"someday-{item.get('id', uuid.uuid4())}@someday.local"
        event.add("uid", event_uid)
        event.add("dtstamp", datetime.now(timezone.utc))

        if fields.get("location"):
            event.add("location", vText(fields["location"]))

        description_parts = []
        if fields.get("description"):
            description_parts.append(fields["description"])
        if fields.get("source_evidence"):
            description_parts.append(f"Source Evidence: {fields['source_evidence']}")
        description_parts.append(f"Original Screenshot: {item.get('original_filename', 'N/A')}")
        
        event.add("description", "\n\n".join(description_parts))
        cal.add_component(event)
        exported_count += 1

    return cal.to_ical().decode("utf-8")


def export_receipts_to_csv(items: List[Dict[str, Any]]) -> str:
    """
    Exports approved receipt items to a valid CSV formatted string.
    Includes columns: Merchant, Amount, Currency, Date, Category, Summary, Source File, Item ID.
    """
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    
    headers = [
        "Item ID",
        "Transaction Date",
        "Merchant",
        "Amount",
        "Currency",
        "Expense Category",
        "Purchased Items Summary",
        "Source Evidence",
        "Original Screenshot"
    ]
    writer.writerow(headers)

    for item in items:
        if item.get("detected_category") != "receipt":
            continue

        fields = item.get("extracted_fields", {})
        writer.writerow([
            item.get("id", ""),
            item.get("resolved_date") or fields.get("transaction_date") or fields.get("raw_date_expression") or "",
            fields.get("merchant", "Unknown Merchant"),
            fields.get("total_amount", ""),
            fields.get("currency", "USD"),
            fields.get("expense_category", "General"),
            fields.get("items_summary", ""),
            fields.get("source_evidence", ""),
            item.get("original_filename", "")
        ])

    return output.getvalue()


def export_reading_to_csv(items: List[Dict[str, Any]]) -> str:
    """
    Exports approved reading items to CSV.
    """
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    
    headers = [
        "Item ID",
        "Title",
        "URL",
        "Publication / Source",
        "Author",
        "Summary / Description",
        "Source Evidence",
        "Original Screenshot",
        "Saved At"
    ]
    writer.writerow(headers)

    for item in items:
        if item.get("detected_category") != "reading":
            continue

        fields = item.get("extracted_fields", {})
        writer.writerow([
            item.get("id", ""),
            fields.get("title", "Untitled"),
            fields.get("url", ""),
            fields.get("website_or_source", ""),
            fields.get("author", ""),
            fields.get("description", ""),
            fields.get("source_evidence", ""),
            item.get("original_filename", ""),
            item.get("created_at", "")
        ])

    return output.getvalue()


def export_reading_to_json(items: List[Dict[str, Any]]) -> str:
    """
    Exports approved reading items to formatted JSON.
    """
    reading_items = []
    for item in items:
        if item.get("detected_category") != "reading":
            continue
        fields = item.get("extracted_fields", {})
        reading_items.append({
            "id": item.get("id"),
            "title": fields.get("title"),
            "url": fields.get("url"),
            "source": fields.get("website_or_source"),
            "author": fields.get("author"),
            "description": fields.get("description"),
            "source_evidence": fields.get("source_evidence"),
            "screenshot": item.get("original_filename"),
            "created_at": item.get("created_at")
        })
    return json.dumps(reading_items, indent=2)
