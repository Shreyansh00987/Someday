from __future__ import annotations
from enum import Enum
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field


class CategoryEnum(str, Enum):
    EVENT = "event"
    RECEIPT = "receipt"
    READING = "reading"
    UNCERTAIN = "uncertain"


class ValidationStatusEnum(str, Enum):
    VALID = "valid"
    REPAIRED = "repaired"
    NEEDS_ATTENTION = "needs_attention"
    FAILED = "failed"


class ProcessingStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DUPLICATE = "duplicate"


class ApprovalStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# --- Structured extraction models validated against model output ---

class EventExtracted(BaseModel):
    category: str = "event"
    event_title: str = Field(..., description="Title or headline of the event")
    raw_date_expression: str = Field(..., description="Verbatim date/time expression from the image, e.g. 'Tomorrow at 7 PM' or 'Oct 25, 2026 19:00'")
    start_time: Optional[str] = Field(None, description="Resolved ISO-8601 datetime if deterministically resolvable")
    end_time: Optional[str] = Field(None, description="Resolved ISO-8601 end datetime if given")
    location: Optional[str] = Field(None, description="Venue, address, or virtual platform")
    description: Optional[str] = Field(None, description="Summary or details about the event")
    source_evidence: str = Field(..., description="Exact textual quote or visual anchor seen in the screenshot that grounds this extraction")
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0, description="Calibrated confidence based on text clarity and completeness")


class ReceiptExtracted(BaseModel):
    category: str = "receipt"
    merchant: str = Field(..., description="Store, restaurant, vendor, or billing entity")
    total_amount: float = Field(..., description="Total numerical amount paid or due")
    currency: str = Field(default="USD", description="Currency symbol or code (USD, EUR, GBP, INR, etc.)")
    raw_date_expression: Optional[str] = Field(None, description="Verbatim date expression on receipt")
    transaction_date: Optional[str] = Field(None, description="Resolved ISO-8601 transaction date")
    expense_category: Optional[str] = Field("General", description="Expense classification (Meals, Travel, Supplies, Software, Groceries, Utilities, etc.)")
    items_summary: Optional[str] = Field(None, description="Brief summary of purchased line items")
    source_evidence: str = Field(..., description="Exact textual quote or visual anchor seen in the receipt")
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)


class ReadingExtracted(BaseModel):
    category: str = "reading"
    title: str = Field(..., description="Article title, book title, repo name, or headline")
    url: Optional[str] = Field(None, description="Exact or visible web URL if present in screenshot")
    website_or_source: Optional[str] = Field(None, description="Domain, publication, or app name (e.g. Substack, Twitter/X, Medium, GitHub)")
    author: Optional[str] = Field(None, description="Author or account handle if visible")
    description: Optional[str] = Field(None, description="Key takeaway or abstract")
    source_evidence: str = Field(..., description="Exact textual quote or headline from the image")
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)


class UncertainExtracted(BaseModel):
    category: str = "uncertain"
    summary: str = Field(..., description="Brief description of what is visible in the image")
    reason_for_uncertainty: str = Field(..., description="Why clear event/receipt/reading extraction was not possible")
    detected_text_snippets: List[str] = Field(default_factory=list, description="Fragments of legible text found")
    suggested_action: Optional[str] = Field(None, description="Recommendation for manual user handling")
    source_evidence: str = Field(..., description="Visual description or legible snippet")
    confidence_score: float = Field(default=0.3, ge=0.0, le=1.0)


# Union type for dynamic parsing
ExtractedContent = Union[EventExtracted, ReceiptExtracted, ReadingExtracted, UncertainExtracted]


# --- Database & API response models ---

class ItemBase(BaseModel):
    source_path: str
    file_hash: str
    original_filename: str
    detected_category: CategoryEnum
    extracted_fields: Dict[str, Any]
    raw_date_expression: Optional[str] = None
    resolved_date: Optional[str] = None
    evidence_metadata: Dict[str, Any] = Field(default_factory=dict)
    validation_status: ValidationStatusEnum = ValidationStatusEnum.VALID
    processing_status: ProcessingStatusEnum = ProcessingStatusEnum.COMPLETED
    approval_status: ApprovalStatusEnum = ApprovalStatusEnum.PENDING
    error_message: Optional[str] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    detected_category: Optional[CategoryEnum] = None
    extracted_fields: Optional[Dict[str, Any]] = None
    raw_date_expression: Optional[str] = None
    resolved_date: Optional[str] = None
    approval_status: Optional[ApprovalStatusEnum] = None
    validation_status: Optional[ValidationStatusEnum] = None


class ItemOut(ItemBase):
    id: str
    created_at: str
    processed_at: Optional[str] = None
    approved_at: Optional[str] = None
    thumbnail_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ItemListResponse(BaseModel):
    items: List[ItemOut]
    total_count: int
    pending_approval_count: int
    needs_attention_count: int
    approved_count: int
    rejected_count: int


class RunRecord(BaseModel):
    id: str
    model_name: str
    model_version: str
    start_time: str
    end_time: Optional[str] = None
    items_processed: int = 0
    items_succeeded: int = 0
    items_failed: int = 0
    measured_latency_ms: float = 0.0
    peak_memory_mb: Optional[float] = None


class SystemConfig(BaseModel):
    watch_folder: str = ""
    recursive: bool = False
    idle_only: bool = False
    is_paused: bool = False
    active_model: str = "gemma2"
    available_models: List[str] = Field(default_factory=list)
    polling_interval_sec: float = 3.0
    auto_approve_high_confidence: bool = False


class QueueStatus(BaseModel):
    is_watching: bool
    is_paused: bool
    queue_length: int
    processed_count: int
    failed_count: int
    last_processed_file: Optional[str] = None
    last_run_timestamp: Optional[str] = None
    active_model: str
    model_online: bool
