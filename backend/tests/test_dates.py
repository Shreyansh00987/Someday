import pytest
from datetime import datetime, timezone, timedelta
from date_engine import resolve_date_expression


def test_resolve_tomorrow():
    ref = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)
    res = resolve_date_expression("Tomorrow at 7 PM", reference_time=ref)
    assert res["success"] is True
    assert "2026-10-22T19:00:00" in res["resolved_start_iso"]
    assert res["resolved_end_iso"] is not None
    assert "2026-10-22T20:00:00" in res["resolved_end_iso"]


def test_resolve_today_tonight():
    ref = datetime(2026, 10, 21, 10, 0, 0, tzinfo=timezone.utc)
    res = resolve_date_expression("Tonight at 8:30 PM", reference_time=ref)
    assert res["success"] is True
    assert "2026-10-21T20:30:00" in res["resolved_start_iso"]


def test_resolve_weekday():
    # 2026-10-21 is a Wednesday
    ref = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)
    res = resolve_date_expression("This Friday at 6 PM", reference_time=ref)
    assert res["success"] is True
    # Friday should be 2026-10-23
    assert "2026-10-23T18:00:00" in res["resolved_start_iso"]


def test_resolve_time_range():
    ref = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)
    res = resolve_date_expression("Tomorrow 2:00 PM - 5:00 PM", reference_time=ref)
    assert res["success"] is True
    assert "2026-10-22T14:00:00" in res["resolved_start_iso"]
    assert "2026-10-22T17:00:00" in res["resolved_end_iso"]


def test_resolve_fuzzy_date_with_year():
    ref = datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc)
    res = resolve_date_expression("Nov 15, 2026 at 10:00 AM", reference_time=ref)
    assert res["success"] is True
    assert "2026-11-15T10:00:00" in res["resolved_start_iso"]


def test_empty_expression():
    res = resolve_date_expression("")
    assert res["success"] is False
    assert res["is_ambiguous"] is True
