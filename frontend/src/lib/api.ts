export interface ExtractedFields {
  category?: string;
  event_title?: string;
  raw_date_expression?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  description?: string;
  merchant?: string;
  total_amount?: number;
  currency?: string;
  transaction_date?: string;
  expense_category?: string;
  items_summary?: string;
  title?: string;
  url?: string;
  website_or_source?: string;
  author?: string;
  summary?: string;
  reason_for_uncertainty?: string;
  source_evidence?: string;
  confidence_score?: number;
  [key: string]: any;
}

export interface Item {
  id: string;
  source_path: string;
  file_hash: string;
  original_filename: string;
  detected_category: "event" | "receipt" | "reading" | "uncertain";
  extracted_fields: ExtractedFields;
  raw_date_expression?: string;
  resolved_date?: string;
  evidence_metadata: {
    source_evidence?: string;
    confidence_score?: number;
    file_timestamp?: string;
    [key: string]: any;
  };
  validation_status: "valid" | "repaired" | "needs_attention" | "failed";
  processing_status: "pending" | "processing" | "completed" | "failed" | "duplicate";
  approval_status: "pending" | "approved" | "rejected";
  error_message?: string;
  created_at: string;
  processed_at?: string;
  approved_at?: string;
  thumbnail_url?: string;
}

export interface ItemListResponse {
  items: Item[];
  total_count: number;
  pending_approval_count: number;
  needs_attention_count: number;
  approved_count: number;
  rejected_count: number;
}

export interface QueueStatus {
  is_watching: boolean;
  is_paused: boolean;
  queue_length: number;
  processed_count: number;
  failed_count: number;
  last_processed_file?: string;
  last_run_timestamp?: string;
  active_model: string;
  model_online: boolean;
}

export interface SystemConfig {
  watch_folder: string;
  recursive: boolean;
  idle_only: boolean;
  is_paused: boolean;
  active_model: string;
  available_models: string[];
  polling_interval_sec: number;
  auto_approve_high_confidence: boolean;
}

export interface MetricsSummary {
  stats: Record<string, number>;
  runs: any[];
  summary: {
    total_runs: number;
    average_latency_ms: number;
    approval_rate: number;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function fetchQueueStatus(): Promise<QueueStatus> {
  const res = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function fetchItems(params?: {
  category?: string;
  approval_status?: string;
  validation_status?: string;
  search?: string;
}): Promise<ItemListResponse> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "all") query.set("category", params.category);
  if (params?.approval_status && params.approval_status !== "all") query.set("approval_status", params.approval_status);
  if (params?.validation_status) query.set("validation_status", params.validation_status);
  if (params?.search) query.set("search", params.search);

  const res = await fetch(`${API_BASE}/api/items?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function approveItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/items/${id}/approve`, { method: "POST" });
  if (!res.ok) throw new Error("Approval failed");
}

export async function rejectItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/items/${id}/reject`, { method: "POST" });
  if (!res.ok) throw new Error("Rejection failed");
}

export async function bulkApproveItems(ids: string[]): Promise<number> {
  const res = await fetch(`${API_BASE}/api/items/bulk-approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_ids: ids }),
  });
  if (!res.ok) throw new Error("Bulk approval failed");
  const data = await res.json();
  return data.approved_count;
}

export async function updateItem(id: string, updates: any): Promise<Item> {
  const res = await fetch(`${API_BASE}/api/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function fetchConfig(): Promise<SystemConfig> {
  const res = await fetch(`${API_BASE}/api/config`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch config");
  return res.json();
}

export async function saveConfig(cfg: Partial<SystemConfig>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error("Failed to save config");
}

export async function pauseWatcher(): Promise<void> {
  await fetch(`${API_BASE}/api/queue/pause`, { method: "POST" });
}

export async function resumeWatcher(): Promise<void> {
  await fetch(`${API_BASE}/api/queue/resume`, { method: "POST" });
}

export async function triggerImmediateScan(): Promise<{ triggered: number; new_items: number }> {
  const res = await fetch(`${API_BASE}/api/queue/trigger`, { method: "POST" });
  return res.json();
}

export async function retryFailedItems(): Promise<{ retried_count: number }> {
  const res = await fetch(`${API_BASE}/api/queue/retry-failed`, { method: "POST" });
  return res.json();
}

export async function fetchMetrics(): Promise<MetricsSummary> {
  const res = await fetch(`${API_BASE}/api/metrics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export function getExportUrl(type: "calendar" | "expenses" | "reading", format?: string): string {
  if (type === "calendar") return `${API_BASE}/api/export/calendar?only_approved=true`;
  if (type === "expenses") return `${API_BASE}/api/export/expenses?only_approved=true`;
  return `${API_BASE}/api/export/reading?format=${format || "csv"}&only_approved=true`;
}

export function getOriginalImageUrl(itemId: string): string {
  return `${API_BASE}/api/items/${itemId}/image`;
}

export function getThumbnailUrl(itemId: string): string {
  return `${API_BASE}/api/items/${itemId}/thumbnail`;
}
