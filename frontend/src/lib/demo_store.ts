import demoDataRaw from "./demo_data.json";

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
  evidence_metadata: Record<string, any>;
  validation_status: "valid" | "repaired" | "needs_attention" | "failed";
  processing_status: "pending" | "processing" | "completed" | "failed" | "duplicate";
  approval_status: "pending" | "approved" | "rejected";
  error_message?: string;
  created_at: string;
  processed_at?: string;
  approved_at?: string;
}

// In-memory items list for serverless execution
let memoryItems: Item[] = (demoDataRaw.items as any[]).map((it) => ({
  ...it,
  extracted_fields: it.extracted_fields || {},
  evidence_metadata: it.evidence_metadata || {},
}));

export function getDemoItems(params: {
  category?: string;
  approval_status?: string;
  validation_status?: string;
  search?: string;
}): {
  items: Item[];
  total_count: number;
  pending_approval_count: number;
  needs_attention_count: number;
  approved_count: number;
  rejected_count: number;
} {
  let filtered = [...memoryItems];

  if (params.category) {
    filtered = filtered.filter((i) => i.detected_category === params.category);
  }
  if (params.approval_status) {
    filtered = filtered.filter((i) => i.approval_status === params.approval_status);
  }
  if (params.validation_status) {
    filtered = filtered.filter((i) => i.validation_status === params.validation_status);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.original_filename.toLowerCase().includes(q) ||
        JSON.stringify(i.extracted_fields).toLowerCase().includes(q)
    );
  }

  const pending_approval_count = memoryItems.filter(
    (i) => i.approval_status === "pending" && i.validation_status === "valid"
  ).length;
  const needs_attention_count = memoryItems.filter(
    (i) =>
      i.validation_status === "needs_attention" ||
      i.validation_status === "failed" ||
      i.detected_category === "uncertain"
  ).length;
  const approved_count = memoryItems.filter((i) => i.approval_status === "approved").length;
  const rejected_count = memoryItems.filter((i) => i.approval_status === "rejected").length;

  return {
    items: filtered,
    total_count: filtered.length,
    pending_approval_count,
    needs_attention_count,
    approved_count,
    rejected_count,
  };
}

export function getItemById(id: string): Item | undefined {
  return memoryItems.find((i) => i.id === id);
}

export function approveDemoItem(id: string): boolean {
  const item = memoryItems.find((i) => i.id === id);
  if (!item) return false;
  item.approval_status = "approved";
  item.approved_at = new Date().toISOString();
  return true;
}

export function rejectDemoItem(id: string): boolean {
  const item = memoryItems.find((i) => i.id === id);
  if (!item) return false;
  item.approval_status = "rejected";
  return true;
}

export function bulkApproveDemoItems(ids: string[]): number {
  let count = 0;
  for (const id of ids) {
    if (approveDemoItem(id)) count++;
  }
  return count;
}

export function updateDemoItem(id: string, updates: Partial<ExtractedFields>): boolean {
  const item = memoryItems.find((i) => i.id === id);
  if (!item) return false;
  item.extracted_fields = { ...item.extracted_fields, ...updates };
  return true;
}

export function getDemoStatus() {
  return {
    is_watching: true,
    is_paused: false,
    queue_length: 0,
    processed_count: memoryItems.length,
    failed_count: 0,
    last_processed_file: memoryItems[0]?.original_filename || "event_summit_poster.png",
    last_run_timestamp: new Date().toISOString(),
    active_model: "moondream (Open-Weight Vision 1.4B)",
    model_online: true,
  };
}

export function getDemoMetrics() {
  const summary = {
    total_runs: demoDataRaw.runs.length || 12,
    average_latency_ms: 7890.5,
    approval_rate: 0.9,
  };
  return {
    stats: {
      total: memoryItems.length,
      approved: memoryItems.filter((i) => i.approval_status === "approved").length,
      rejected: memoryItems.filter((i) => i.approval_status === "rejected").length,
      events: memoryItems.filter((i) => i.detected_category === "event").length,
      receipts: memoryItems.filter((i) => i.detected_category === "receipt").length,
      reading: memoryItems.filter((i) => i.detected_category === "reading").length,
      uncertain: memoryItems.filter((i) => i.detected_category === "uncertain").length,
    },
    runs: demoDataRaw.runs,
    summary,
  };
}

export function generateCalendarIcs(onlyApproved = true): string {
  const events = memoryItems.filter((i) => {
    if (i.detected_category !== "event") return false;
    if (onlyApproved && i.approval_status !== "approved") return false;
    return true;
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Someday//Morning Ledger//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const item of events) {
    const f = item.extracted_fields || {};
    const title = f.event_title || item.original_filename || "Someday Event";
    const loc = f.location || "";
    const desc = f.description || f.source_evidence || "Extracted by Someday";
    const startTimeStr = f.start_time || item.resolved_date || new Date().toISOString();
    const dt = new Date(startTimeStr);
    const dtFormatted = dt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    
    // 1 hour later
    const endDt = new Date(dt.getTime() + 60 * 60 * 1000);
    const endFormatted = endDt.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@someday.local`,
      `DTSTAMP:${dtFormatted}`,
      `DTSTART:${dtFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      loc ? `LOCATION:${loc}` : "",
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export function generateExpenseCsv(onlyApproved = true): string {
  const receipts = memoryItems.filter((i) => {
    if (i.detected_category !== "receipt") return false;
    if (onlyApproved && i.approval_status !== "approved") return false;
    return true;
  });

  const rows = [
    ["id", "merchant", "total_amount", "currency", "transaction_date", "expense_category", "filename"].join(","),
  ];

  for (const item of receipts) {
    const f = item.extracted_fields || {};
    rows.push(
      [
        `"${item.id}"`,
        `"${(f.merchant || "").replace(/"/g, '""')}"`,
        f.total_amount ?? "",
        `"${f.currency || "USD"}"`,
        `"${f.transaction_date || item.resolved_date || ""}"`,
        `"${(f.expense_category || "General").replace(/"/g, '""')}"`,
        `"${item.original_filename}"`,
      ].join(",")
    );
  }

  return rows.join("\r\n");
}

export function generateReadingExport(format = "csv", onlyApproved = true): string | object[] {
  const reading = memoryItems.filter((i) => {
    if (i.detected_category !== "reading") return false;
    if (onlyApproved && i.approval_status !== "approved") return false;
    return true;
  });

  if (format === "json") {
    return reading.map((i) => ({
      id: i.id,
      title: i.extracted_fields?.title || i.original_filename,
      url: i.extracted_fields?.url || "",
      author: i.extracted_fields?.author || "",
      summary: i.extracted_fields?.summary || "",
      filename: i.original_filename,
      created_at: i.created_at,
    }));
  }

  const rows = [["id", "title", "url", "author", "summary", "filename"].join(",")];
  for (const item of reading) {
    const f = item.extracted_fields || {};
    rows.push(
      [
        `"${item.id}"`,
        `"${(f.title || item.original_filename).replace(/"/g, '""')}"`,
        `"${f.url || ""}"`,
        `"${(f.author || "").replace(/"/g, '""')}"`,
        `"${(f.summary || "").replace(/"/g, '""')}"`,
        `"${item.original_filename}"`,
      ].join(",")
    );
  }

  return rows.join("\r\n");
}
