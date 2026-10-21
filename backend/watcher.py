"""
Folder Watcher and Processing Queue Engine for Someday.

Continuously monitors the configured directory, computes SHA-256 hashes,
validates file stability, avoids duplicates, handles corrupt images safely,
and processes screenshots sequentially with pause/resume support.
"""

from __future__ import annotations
import hashlib
import os
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Set, Any
from PIL import Image, UnidentifiedImageError

from database import Database
from inference import process_screenshot_with_model


SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def compute_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def is_file_stable(filepath: str, check_interval: float = 0.5) -> bool:
    """
    Checks if a file is done being written by comparing size across check_interval.
    """
    try:
        initial_size = os.path.getsize(filepath)
        time.sleep(check_interval)
        final_size = os.path.getsize(filepath)
        return initial_size == final_size and final_size > 0
    except (OSError, FileNotFoundError):
        return False


def verify_image_readable(filepath: str) -> bool:
    """
    Verifies that PIL can open and verify the image header without corruption.
    """
    try:
        with Image.open(filepath) as img:
            img.verify()
        return True
    except Exception:
        return False


class FolderWatcher:
    def __init__(self, db: Database):
        self.db = db
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._is_paused = False
        self._processing_lock = threading.Lock()
        self.current_queue: List[str] = []
        self.processed_count = 0
        self.failed_count = 0
        self.last_processed_file: Optional[str] = None
        self.last_run_timestamp: Optional[str] = None

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._watch_loop, daemon=True, name="SomedayWatcherThread")
        self._thread.start()

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=3.0)

    def pause(self):
        self._is_paused = True
        self.db.set_config("is_paused", "1")

    def resume(self):
        self._is_paused = False
        self.db.set_config("is_paused", "0")

    def is_paused(self) -> bool:
        return self._is_paused

    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def get_watch_folder(self) -> Path:
        cfg = self.db.get_config()
        folder_str = cfg.get("watch_folder", "")
        if not folder_str:
            folder_str = str(Path(__file__).resolve().parent / "sample_screenshots")
        p = Path(folder_str)
        p.mkdir(parents=True, exist_ok=True)
        return p

    def get_status(self) -> Dict[str, Any]:
        cfg = self.db.get_config()
        return {
            "is_watching": self.is_running(),
            "is_paused": self._is_paused,
            "watch_folder": str(self.get_watch_folder()),
            "queue_length": len(self.current_queue),
            "processed_count": self.processed_count,
            "failed_count": self.failed_count,
            "last_processed_file": self.last_processed_file,
            "last_run_timestamp": self.last_run_timestamp,
            "active_model": cfg.get("active_model", "gemma3:1b")
        }

    def process_single_file(self, file_path: str) -> Optional[str]:
        """
        Processes a single screenshot file, saves to DB, returns item_id.
        """
        p = Path(file_path)
        if not p.exists():
            return None

        # Check stability
        if not is_file_stable(file_path, check_interval=0.2):
            return None

        # Compute hash
        try:
            f_hash = compute_sha256(file_path)
        except Exception as e:
            return None

        # Check if already processed
        existing = self.db.get_item_by_hash(f_hash)
        if existing:
            return None  # Duplicate: already processed and persisted

        filename = p.name
        self.last_processed_file = filename
        self.last_run_timestamp = datetime.now(timezone.utc).isoformat()

        # Check image corruption
        if not verify_image_readable(file_path):
            self.failed_count += 1
            item_id = self.db.create_item({
                "source_path": str(p.resolve()),
                "file_hash": f_hash,
                "original_filename": filename,
                "detected_category": "uncertain",
                "extracted_fields": {
                    "summary": "Corrupted or unreadable image file",
                    "reason_for_uncertainty": "Pillow could not decode image headers",
                    "detected_text_snippets": [],
                    "source_evidence": "Unreadable file"
                },
                "validation_status": "failed",
                "processing_status": "failed",
                "approval_status": "rejected",
                "error_message": "Corrupted image file: decode failed"
            })
            return item_id

        # Run model inference
        cfg = self.db.get_config()
        model_name = cfg.get("active_model", "gemma3:1b")
        run_start = datetime.now(timezone.utc).isoformat()

        try:
            result = process_screenshot_with_model(file_path, model_name=model_name)
            
            # Auto-approval check if enabled
            auto_approve = cfg.get("auto_approve_high_confidence", "0") == "1"
            conf = result.get("evidence_metadata", {}).get("confidence_score", 0.0)
            initial_approval = "approved" if (auto_approve and conf >= 0.90 and result["validation_status"] == "valid") else "pending"

            item_id = self.db.create_item({
                "source_path": str(p.resolve()),
                "file_hash": f_hash,
                "original_filename": filename,
                "detected_category": result["category"],
                "extracted_fields": result["extracted_fields"],
                "raw_date_expression": result["raw_date_expression"],
                "resolved_date": result["resolved_date"],
                "evidence_metadata": result["evidence_metadata"],
                "validation_status": result["validation_status"],
                "processing_status": result["processing_status"],
                "approval_status": initial_approval,
                "error_message": result.get("error_message")
            })

            # Record run log
            self.db.log_run({
                "model_name": model_name,
                "model_version": "ollama",
                "start_time": run_start,
                "end_time": datetime.now(timezone.utc).isoformat(),
                "items_processed": 1,
                "items_succeeded": 1 if result["processing_status"] == "completed" else 0,
                "items_failed": 0 if result["processing_status"] == "completed" else 1,
                "measured_latency_ms": result.get("latency_ms", 0.0)
            })

            self.processed_count += 1
            return item_id

        except Exception as e:
            self.failed_count += 1
            item_id = self.db.create_item({
                "source_path": str(p.resolve()),
                "file_hash": f_hash,
                "original_filename": filename,
                "detected_category": "uncertain",
                "extracted_fields": {
                    "summary": f"Inference pipeline exception: {str(e)}",
                    "reason_for_uncertainty": str(e),
                    "source_evidence": "Processing failure"
                },
                "validation_status": "failed",
                "processing_status": "failed",
                "approval_status": "pending",
                "error_message": str(e)
            })
            return item_id

    def _watch_loop(self):
        """
        Background loop polling the watch folder at regular intervals.
        """
        while not self._stop_event.is_set():
            try:
                # Sync pause state from DB
                cfg = self.db.get_config()
                self._is_paused = cfg.get("is_paused", "0") == "1"
                poll_interval = float(cfg.get("polling_interval_sec", "3.0"))

                if not self._is_paused:
                    watch_dir = self.get_watch_folder()
                    recursive = cfg.get("recursive", "0") == "1"

                    # Scan files
                    candidates: List[Path] = []
                    if recursive:
                        candidates = [p for p in watch_dir.rglob("*") if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS]
                    else:
                        candidates = [p for p in watch_dir.iterdir() if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS]

                    # Filter out already hashed items
                    for candidate in candidates:
                        if self._stop_event.is_set() or self._is_paused:
                            break
                        try:
                            # Fast size check
                            if candidate.stat().st_size == 0:
                                continue
                            f_hash = compute_sha256(str(candidate))
                            if not self.db.get_item_by_hash(f_hash):
                                # Enqueue and process
                                with self._processing_lock:
                                    self.process_single_file(str(candidate))
                        except Exception:
                            continue

            except Exception:
                pass

            self._stop_event.wait(poll_interval)
