"""
Database Management Layer for Someday using SQLite.
Includes parameterized queries, schema initialization, and transactional safety.
"""

from __future__ import annotations
import sqlite3
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pathlib import Path


DEFAULT_DB_PATH = Path(__file__).resolve().parent / "someday.db"


class Database:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = str(db_path or DEFAULT_DB_PATH)
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            # 1. items table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    id TEXT PRIMARY KEY,
                    source_path TEXT NOT NULL,
                    file_hash TEXT NOT NULL UNIQUE,
                    original_filename TEXT NOT NULL,
                    detected_category TEXT NOT NULL,
                    extracted_fields TEXT NOT NULL,
                    raw_date_expression TEXT,
                    resolved_date TEXT,
                    evidence_metadata TEXT,
                    validation_status TEXT NOT NULL,
                    processing_status TEXT NOT NULL,
                    approval_status TEXT NOT NULL DEFAULT 'pending',
                    error_message TEXT,
                    created_at TEXT NOT NULL,
                    processed_at TEXT,
                    approved_at TEXT
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_items_hash ON items(file_hash);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_items_category ON items(detected_category);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_items_approval ON items(approval_status);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);")

            # 2. runs table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY,
                    model_name TEXT NOT NULL,
                    model_version TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT,
                    items_processed INTEGER DEFAULT 0,
                    items_succeeded INTEGER DEFAULT 0,
                    items_failed INTEGER DEFAULT 0,
                    measured_latency_ms REAL DEFAULT 0.0,
                    peak_memory_mb REAL
                );
            """)

            # 3. config table
            conn.execute("""
                CREATE TABLE IF NOT EXISTS config (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
            """)

            # Seed default config if empty
            defaults = {
                "watch_folder": str(Path(__file__).resolve().parent / "sample_screenshots"),
                "recursive": "0",
                "idle_only": "0",
                "is_paused": "0",
                "active_model": "moondream",
                "polling_interval_sec": "3.0",
                "auto_approve_high_confidence": "0"
            }
            for k, v in defaults.items():
                conn.execute(
                    "INSERT OR IGNORE INTO config (key, value) VALUES (?, ?);",
                    (k, v)
                )

    # --- Item CRUD Operations ---

    def create_item(self, item_data: Dict[str, Any]) -> str:
        item_id = item_data.get("id") or str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO items (
                    id, source_path, file_hash, original_filename,
                    detected_category, extracted_fields, raw_date_expression,
                    resolved_date, evidence_metadata, validation_status,
                    processing_status, approval_status, error_message,
                    created_at, processed_at, approved_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item_id,
                    item_data["source_path"],
                    item_data["file_hash"],
                    item_data["original_filename"],
                    item_data.get("detected_category", "uncertain"),
                    json.dumps(item_data.get("extracted_fields", {})),
                    item_data.get("raw_date_expression"),
                    item_data.get("resolved_date"),
                    json.dumps(item_data.get("evidence_metadata", {})),
                    item_data.get("validation_status", "valid"),
                    item_data.get("processing_status", "completed"),
                    item_data.get("approval_status", "pending"),
                    item_data.get("error_message"),
                    item_data.get("created_at") or now_iso,
                    item_data.get("processed_at") or now_iso,
                    item_data.get("approved_at")
                )
            )
        return item_id

    def get_item_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM items WHERE id = ?", (item_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_item_dict(row)

    def get_item_by_hash(self, file_hash: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.execute("SELECT * FROM items WHERE file_hash = ?", (file_hash,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_item_dict(row)

    def list_items(
        self,
        category: Optional[str] = None,
        approval_status: Optional[str] = None,
        validation_status: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        query = "SELECT * FROM items WHERE 1=1"
        params: List[Any] = []

        if category and category != "all":
            query += " AND detected_category = ?"
            params.append(category)

        if approval_status and approval_status != "all":
            query += " AND approval_status = ?"
            params.append(approval_status)

        if validation_status:
            query += " AND validation_status = ?"
            params.append(validation_status)

        if search_query and search_query.strip():
            query += " AND (original_filename LIKE ? OR extracted_fields LIKE ? OR raw_date_expression LIKE ?)"
            term = f"%{search_query.strip()}%"
            params.extend([term, term, term])

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            return [self._row_to_item_dict(row) for row in cursor.fetchall()]

    def update_item(self, item_id: str, updates: Dict[str, Any]) -> bool:
        allowed_keys = {
            "detected_category", "extracted_fields", "raw_date_expression",
            "resolved_date", "evidence_metadata", "validation_status",
            "processing_status", "approval_status", "error_message",
            "approved_at", "processed_at"
        }
        filtered = {k: v for k, v in updates.items() if k in allowed_keys}
        if not filtered:
            return False

        set_clauses = []
        params = []
        for k, v in filtered.items():
            set_clauses.append(f"{k} = ?")
            if isinstance(v, (dict, list)):
                params.append(json.dumps(v))
            else:
                params.append(v)

        params.append(item_id)
        sql = f"UPDATE items SET {', '.join(set_clauses)} WHERE id = ?"
        with self.get_connection() as conn:
            cur = conn.execute(sql, params)
            return cur.rowcount > 0

    def approve_item(self, item_id: str) -> bool:
        now_iso = datetime.now(timezone.utc).isoformat()
        return self.update_item(item_id, {
            "approval_status": "approved",
            "approved_at": now_iso
        })

    def reject_item(self, item_id: str) -> bool:
        return self.update_item(item_id, {
            "approval_status": "rejected"
        })

    def bulk_approve(self, item_ids: List[str]) -> int:
        now_iso = datetime.now(timezone.utc).isoformat()
        count = 0
        with self.get_connection() as conn:
            for i_id in item_ids:
                # Do not approve items with validation failed
                cur = conn.execute(
                    "UPDATE items SET approval_status = 'approved', approved_at = ? WHERE id = ? AND validation_status != 'failed'",
                    (now_iso, i_id)
                )
                count += cur.rowcount
        return count

    def get_summary_stats(self) -> Dict[str, int]:
        with self.get_connection() as conn:
            total = conn.execute("SELECT COUNT(*) FROM items").fetchone()[0]
            pending = conn.execute("SELECT COUNT(*) FROM items WHERE approval_status = 'pending'").fetchone()[0]
            approved = conn.execute("SELECT COUNT(*) FROM items WHERE approval_status = 'approved'").fetchone()[0]
            rejected = conn.execute("SELECT COUNT(*) FROM items WHERE approval_status = 'rejected'").fetchone()[0]
            attention = conn.execute("SELECT COUNT(*) FROM items WHERE validation_status IN ('needs_attention', 'failed') OR detected_category = 'uncertain'").fetchone()[0]
            events = conn.execute("SELECT COUNT(*) FROM items WHERE detected_category = 'event'").fetchone()[0]
            receipts = conn.execute("SELECT COUNT(*) FROM items WHERE detected_category = 'receipt'").fetchone()[0]
            reading = conn.execute("SELECT COUNT(*) FROM items WHERE detected_category = 'reading'").fetchone()[0]
            
            return {
                "total": total,
                "pending": pending,
                "approved": approved,
                "rejected": rejected,
                "needs_attention": attention,
                "events": events,
                "receipts": receipts,
                "reading": reading
            }

    # --- Run Logging Operations ---

    def log_run(self, run_data: Dict[str, Any]) -> str:
        run_id = run_data.get("id") or str(uuid.uuid4())
        with self.get_connection() as conn:
            conn.execute(
                """
                INSERT INTO runs (
                    id, model_name, model_version, start_time, end_time,
                    items_processed, items_succeeded, items_failed,
                    measured_latency_ms, peak_memory_mb
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    run_id,
                    run_data.get("model_name", "unknown"),
                    run_data.get("model_version", "unknown"),
                    run_data["start_time"],
                    run_data.get("end_time"),
                    run_data.get("items_processed", 0),
                    run_data.get("items_succeeded", 0),
                    run_data.get("items_failed", 0),
                    run_data.get("measured_latency_ms", 0.0),
                    run_data.get("peak_memory_mb")
                )
            )
        return run_id

    def list_runs(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.execute("SELECT * FROM runs ORDER BY start_time DESC LIMIT ?", (limit,))
            return [dict(row) for row in cur.fetchall()]

    # --- Config Management ---

    def get_config(self) -> Dict[str, str]:
        with self.get_connection() as conn:
            cur = conn.execute("SELECT key, value FROM config")
            return {row["key"]: row["value"] for row in cur.fetchall()}

    def set_config(self, key: str, value: str):
        with self.get_connection() as conn:
            conn.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", (key, str(value)))

    # --- Internal Helpers ---

    def _row_to_item_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        d = dict(row)
        try:
            d["extracted_fields"] = json.loads(d["extracted_fields"])
        except Exception:
            d["extracted_fields"] = {}

        try:
            d["evidence_metadata"] = json.loads(d["evidence_metadata"]) if d.get("evidence_metadata") else {}
        except Exception:
            d["evidence_metadata"] = {}

        return d
