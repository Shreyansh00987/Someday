"""
Someday Backend Application - FastAPI Server.

Provides RESTful endpoints for screenshot processing, morning ledger management,
deterministic date editing, multi-format export, and system configuration.
"""

from __future__ import annotations
import io
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from PIL import Image

from database import Database, DEFAULT_DB_PATH
from models import (
    CategoryEnum,
    ValidationStatusEnum,
    ApprovalStatusEnum,
    ItemOut,
    ItemListResponse,
    ItemUpdate,
    SystemConfig,
    QueueStatus,
    RunRecord
)
from watcher import FolderWatcher
from inference import check_ollama_status, DEFAULT_MODEL
from export_engine import (
    export_events_to_ics,
    export_receipts_to_csv,
    export_reading_to_csv,
    export_reading_to_json
)


from contextlib import asynccontextmanager

# Core singletons
db = Database()
watcher = FolderWatcher(db)
THUMBNAIL_DIR = Path(__file__).resolve().parent / "thumbnails"
THUMBNAIL_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start filesystem watcher loop
    watcher.start()
    yield
    # Shutdown: Stop watcher
    watcher.stop()


app = FastAPI(
    title="Someday API",
    description="Local-First Vision AI Ledger for Screenshots",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Next.js frontend (default port 3000 / 3001)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- System & Health Endpoints ---

@app.get("/api/health")
def get_health():
    return {
        "status": "healthy",
        "service": "someday-backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/status", response_model=QueueStatus)
def get_status():
    stat = watcher.get_status()
    cfg = db.get_config()
    active_m = cfg.get("active_model", DEFAULT_MODEL)
    ollama_info = check_ollama_status(active_m)
    return QueueStatus(
        is_watching=stat["is_watching"],
        is_paused=stat["is_paused"],
        queue_length=stat["queue_length"],
        processed_count=stat["processed_count"],
        failed_count=stat["failed_count"],
        last_processed_file=stat["last_processed_file"],
        last_run_timestamp=stat["last_run_timestamp"],
        active_model=active_m,
        model_online=ollama_info.get("online", False)
    )


@app.get("/api/config", response_model=SystemConfig)
def get_config():
    cfg = db.get_config()
    ollama_info = check_ollama_status()
    return SystemConfig(
        watch_folder=cfg.get("watch_folder", str(watcher.get_watch_folder())),
        recursive=cfg.get("recursive", "0") == "1",
        idle_only=cfg.get("idle_only", "0") == "1",
        is_paused=cfg.get("is_paused", "0") == "1",
        active_model=cfg.get("active_model", DEFAULT_MODEL),
        available_models=ollama_info.get("available_models", []),
        polling_interval_sec=float(cfg.get("polling_interval_sec", "3.0")),
        auto_approve_high_confidence=cfg.get("auto_approve_high_confidence", "0") == "1"
    )


@app.post("/api/config")
def update_config(conf: SystemConfig):
    # Validate watch folder path exists or create it
    if conf.watch_folder:
        try:
            p = Path(conf.watch_folder)
            p.mkdir(parents=True, exist_ok=True)
            db.set_config("watch_folder", str(p.resolve()))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid folder path: {str(e)}")

    db.set_config("recursive", "1" if conf.recursive else "0")
    db.set_config("idle_only", "1" if conf.idle_only else "0")
    db.set_config("is_paused", "1" if conf.is_paused else "0")
    db.set_config("active_model", conf.active_model)
    db.set_config("polling_interval_sec", str(conf.polling_interval_sec))
    db.set_config("auto_approve_high_confidence", "1" if conf.auto_approve_high_confidence else "0")

    if conf.is_paused:
        watcher.pause()
    else:
        watcher.resume()

    return {"status": "updated", "config": conf}


# --- Queue Controls ---

@app.post("/api/queue/pause")
def pause_queue():
    watcher.pause()
    return {"status": "paused"}


@app.post("/api/queue/resume")
def resume_queue():
    watcher.resume()
    return {"status": "resumed"}


@app.post("/api/queue/trigger")
def trigger_scan():
    """Forces an immediate pass of the watch folder."""
    folder = watcher.get_watch_folder()
    files = [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}]
    processed = []
    for f in files:
        item_id = watcher.process_single_file(str(f))
        if item_id:
            processed.append(item_id)
    return {"triggered": len(files), "new_items": len(processed)}


@app.post("/api/queue/retry-failed")
def retry_failed_items():
    items = db.list_items(validation_status="failed") + db.list_items(validation_status="needs_attention")
    retried = 0
    for it in items:
        source_p = it.get("source_path")
        if source_p and os.path.exists(source_p):
            # Reprocess
            res = watcher.process_single_file(source_p)
            if res:
                retried += 1
    return {"retried_count": retried}


# --- Item & Ledger Endpoints ---

@app.get("/api/items", response_model=ItemListResponse)
def get_items(
    category: Optional[str] = Query(None),
    approval_status: Optional[str] = Query(None),
    validation_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    raw_items = db.list_items(
        category=category,
        approval_status=approval_status,
        validation_status=validation_status,
        search_query=search,
        limit=limit,
        offset=offset
    )
    stats = db.get_summary_stats()

    items_out = []
    for it in raw_items:
        it_out = dict(it)
        it_out["thumbnail_url"] = f"/api/items/{it['id']}/thumbnail"
        items_out.append(ItemOut(**it_out))

    return ItemListResponse(
        items=items_out,
        total_count=stats["total"],
        pending_approval_count=stats["pending"],
        needs_attention_count=stats["needs_attention"],
        approved_count=stats["approved"],
        rejected_count=stats["rejected"]
    )


@app.get("/api/items/{item_id}", response_model=ItemOut)
def get_item(item_id: str):
    it = db.get_item_by_id(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")
    it_out = dict(it)
    it_out["thumbnail_url"] = f"/api/items/{it['id']}/thumbnail"
    return ItemOut(**it_out)


@app.patch("/api/items/{item_id}", response_model=ItemOut)
def update_item_endpoint(item_id: str, updates: ItemUpdate):
    it = db.get_item_by_id(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")

    update_dict = updates.model_dump(exclude_unset=True)
    success = db.update_item(item_id, update_dict)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update item")

    updated = db.get_item_by_id(item_id)
    return ItemOut(**updated)


@app.post("/api/items/{item_id}/approve")
def approve_item_endpoint(item_id: str):
    it = db.get_item_by_id(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")
    db.approve_item(item_id)
    return {"status": "approved", "id": item_id}


@app.post("/api/items/{item_id}/reject")
def reject_item_endpoint(item_id: str):
    it = db.get_item_by_id(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")
    db.reject_item(item_id)
    return {"status": "rejected", "id": item_id}


@app.post("/api/items/bulk-approve")
def bulk_approve_endpoint(payload: Dict[str, List[str]]):
    item_ids = payload.get("item_ids", [])
    count = db.bulk_approve(item_ids)
    return {"approved_count": count}


# --- Image and Thumbnail Serving ---

@app.get("/api/items/{item_id}/image")
def get_item_image(item_id: str):
    it = db.get_item_by_id(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")
    
    file_path = it.get("source_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image file missing on disk")

    return FileResponse(file_path)


@app.get("/api/items/{item_id}/thumbnail")
def get_item_thumbnail(item_id: str):
    thumb_path = THUMBNAIL_DIR / f"{item_id}.webp"
    if thumb_path.exists():
        return FileResponse(str(thumb_path), media_type="image/webp")

    it = db.get_item_by_id(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Item not found")
    
    source_p = it.get("source_path")
    if not source_p or not os.path.exists(source_p):
        raise HTTPException(status_code=404, detail="Source image missing")

    try:
        with Image.open(source_p) as img:
            img.thumbnail((320, 320))
            img.save(str(thumb_path), "WEBP", quality=85)
        return FileResponse(str(thumb_path), media_type="image/webp")
    except Exception as e:
        # Fall back to original file if thumbnail creation fails
        return FileResponse(source_p)


# --- File Upload Support (for testing or drag-and-drop into ledger) ---

@app.post("/api/upload")
async def upload_screenshot(file: UploadFile = File(...)):
    watch_dir = watcher.get_watch_folder()
    target_path = watch_dir / file.filename
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process file immediately
    item_id = watcher.process_single_file(str(target_path))
    if not item_id:
        raise HTTPException(status_code=400, detail="Processing failed or duplicate file")

    item = db.get_item_by_id(item_id)
    return item


# --- Export Endpoints ---

@app.get("/api/export/calendar")
def export_calendar(only_approved: bool = True):
    status_filter = "approved" if only_approved else None
    items = db.list_items(category="event", approval_status=status_filter, limit=1000)
    ics_content = export_events_to_ics(items)
    
    filename = f"someday-events-{datetime.now().strftime('%Y%m%d')}.ics"
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.get("/api/export/expenses")
def export_expenses(only_approved: bool = True):
    status_filter = "approved" if only_approved else None
    items = db.list_items(category="receipt", approval_status=status_filter, limit=1000)
    csv_content = export_receipts_to_csv(items)

    filename = f"someday-expenses-{datetime.now().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.get("/api/export/reading")
def export_reading(format: str = Query("csv", pattern="^(csv|json)$"), only_approved: bool = True):
    status_filter = "approved" if only_approved else None
    items = db.list_items(category="reading", approval_status=status_filter, limit=1000)

    if format == "json":
        json_content = export_reading_to_json(items)
        filename = f"someday-reading-{datetime.now().strftime('%Y%m%d')}.json"
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        csv_content = export_reading_to_csv(items)
        filename = f"someday-reading-{datetime.now().strftime('%Y%m%d')}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )


# --- Metrics & Evaluation Endpoints ---

@app.get("/api/metrics")
def get_metrics():
    stats = db.get_summary_stats()
    runs = db.list_runs(limit=50)

    total_runs = len(runs)
    avg_latency = sum(r.get("measured_latency_ms", 0.0) for r in runs) / max(total_runs, 1)

    return {
        "stats": stats,
        "runs": runs,
        "summary": {
            "total_runs": total_runs,
            "average_latency_ms": round(avg_latency, 2),
            "approval_rate": round((stats["approved"] / max(stats["total"], 1)) * 100, 1)
        }
    }


@app.get("/api/models")
def get_models_endpoint():
    cfg = db.get_config()
    active_m = cfg.get("active_model", DEFAULT_MODEL)
    status = check_ollama_status(active_m)
    return status
