"""
Deterministic Date Resolution Engine for Someday.

Resolves natural language, relative, and incomplete date expressions extracted
by the vision model into authoritative ISO-8601 timestamps using an explicit
file/system reference timestamp.
"""

from __future__ import annotations
import re
from datetime import datetime, date, time, timedelta, timezone
from typing import Optional, Tuple, Dict, Any
from dateutil import parser as dateutil_parser
from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU


WEEKDAY_MAP = {
    "monday": 0, "mon": 0,
    "tuesday": 1, "tue": 1, "tues": 1,
    "wednesday": 2, "wed": 2,
    "thursday": 3, "thu": 3, "thur": 3, "thurs": 3,
    "friday": 4, "fri": 4,
    "saturday": 5, "sat": 5,
    "sunday": 6, "sun": 6,
}


def _clean_text(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"[\n\r\t]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def _extract_times(text: str) -> Tuple[Optional[time], Optional[time]]:
    """
    Extracts start and optional end time from text like:
    '7 PM', '7:30 PM - 9:00 PM', '14:00 to 16:30', 'at 6pm'
    """
    time_pattern = r"(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)(?:\s*(?:-|–|—|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?))?"
    matches = re.finditer(time_pattern, text)
    
    start_t: Optional[time] = None
    end_t: Optional[time] = None
    
    for m in matches:
        raw_start = m.group(1).strip()
        raw_end = m.group(2).strip() if m.group(2) else None
        
        # Parse start
        try:
            # Check if it has am/pm or hour:minute
            if "am" in raw_start.lower() or "pm" in raw_start.lower() or ":" in raw_start:
                dt_temp = dateutil_parser.parse(raw_start)
                start_t = dt_temp.time()
        except Exception:
            pass

        if raw_end:
            try:
                # If end time lacks am/pm but start had pm, inherit
                if not any(x in raw_end.lower() for x in ["am", "pm"]) and start_t and start_t.hour >= 12:
                    raw_end += " PM"
                dt_temp_end = dateutil_parser.parse(raw_end)
                end_t = dt_temp_end.time()
            except Exception:
                pass

        if start_t:
            break
            
    return start_t, end_t


def resolve_date_expression(
    raw_expression: str,
    reference_time: Optional[datetime] = None,
    default_tz: Optional[timezone] = None
) -> Dict[str, Any]:
    """
    Deterministically parses a date string relative to reference_time.
    Returns:
    {
        "resolved_start_iso": Optional[str],
        "resolved_end_iso": Optional[str],
        "is_ambiguous": bool,
        "notes": str,
        "success": bool
    }
    """
    if not raw_expression or not raw_expression.strip():
        return {
            "resolved_start_iso": None,
            "resolved_end_iso": None,
            "is_ambiguous": True,
            "notes": "Empty date expression",
            "success": False
        }

    ref = reference_time or datetime.now(timezone.utc)
    expr = _clean_text(raw_expression).lower()
    
    start_time_val, end_time_val = _extract_times(expr)
    target_date: Optional[date] = None
    is_ambiguous = False
    notes: List[str] = []

    # 1. Relative keyword matching
    if "today" in expr or "tonight" in expr:
        target_date = ref.date()
        notes.append("Resolved 'today/tonight'")
        if "tonight" in expr and not start_time_val:
            start_time_val = time(20, 0)
    elif "tomorrow" in expr:
        target_date = ref.date() + timedelta(days=1)
        notes.append("Resolved 'tomorrow'")
    elif "yesterday" in expr:
        target_date = ref.date() - timedelta(days=1)
        notes.append("Resolved 'yesterday' (past date)")
    elif "day after tomorrow" in expr:
        target_date = ref.date() + timedelta(days=2)
        notes.append("Resolved 'day after tomorrow'")
    else:
        # Check weekday matching: 'this friday', 'next saturday', etc.
        weekday_match = re.search(r"\b(this|next|coming)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b", expr)
        if weekday_match:
            modifier = weekday_match.group(1) or "this"
            day_name = weekday_match.group(2)
            target_weekday = WEEKDAY_MAP.get(day_name, 0)
            current_weekday = ref.weekday()
            
            days_ahead = (target_weekday - current_weekday) % 7
            if modifier == "next":
                days_ahead = days_ahead + 7 if days_ahead <= 7 else days_ahead
            elif days_ahead == 0 and "this" not in expr:
                days_ahead = 7  # Assume next occurrence if today is that day
                
            target_date = ref.date() + timedelta(days=days_ahead)
            notes.append(f"Resolved weekday '{day_name}' with modifier '{modifier}' to +{days_ahead} days")

    # 2. If relative failed, attempt dateutil parser with fuzzy matching
    if not target_date:
        try:
            # Provide default using reference date so missing year/month picks up reference
            parsed_dt = dateutil_parser.parse(
                raw_expression,
                fuzzy=True,
                default=ref
            )
            target_date = parsed_dt.date()
            if not start_time_val:
                # If parsed_dt has time component that isn't midnight unless explicitly stated
                if parsed_dt.time() != time(0, 0) or "12:00 am" in expr or "midnight" in expr:
                    start_time_val = parsed_dt.time()

            # Smart year correction: if target date is in the past by > 60 days and year was unspecified
            year_specified = re.search(r"\b(20\d\d)\b", raw_expression) is not None
            if not year_specified and target_date < (ref.date() - timedelta(days=60)):
                target_date = target_date.replace(year=ref.year + 1)
                notes.append("Inferred next calendar year because specified month already passed")
            notes.append("Parsed via fuzzy date parser")
        except Exception as e:
            is_ambiguous = True
            notes.append(f"Fuzzy parse failed: {str(e)}")

    if not target_date:
        return {
            "resolved_start_iso": None,
            "resolved_end_iso": None,
            "is_ambiguous": True,
            "notes": "; ".join(notes),
            "success": False
        }

    # Default time to 09:00 if not specified for events, or leave at 00:00:00
    final_start_time = start_time_val or time(9, 0)
    start_dt = datetime.combine(target_date, final_start_time)

    end_dt: Optional[datetime] = None
    if end_time_val:
        end_dt = datetime.combine(target_date, end_time_val)
        if end_dt <= start_dt:
            # End time might cross midnight
            end_dt += timedelta(days=1)
    else:
        # Default 1 hour duration if start was specified
        if start_time_val:
            end_dt = start_dt + timedelta(hours=1)

    return {
        "resolved_start_iso": start_dt.isoformat(),
        "resolved_end_iso": end_dt.isoformat() if end_dt else None,
        "is_ambiguous": is_ambiguous,
        "notes": "; ".join(notes),
        "success": True
    }
