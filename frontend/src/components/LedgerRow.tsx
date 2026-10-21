"use client";

import React from "react";
import { 
  Calendar, 
  Receipt as ReceiptIcon, 
  BookOpen, 
  HelpCircle, 
  Check, 
  X, 
  ExternalLink,
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { Item, getThumbnailUrl } from "@/lib/api";

interface LedgerRowProps {
  item: Item;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onInspect: () => void;
}

export function LedgerRow({
  item,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  onInspect,
}: LedgerRowProps) {
  const fields = item.extracted_fields || {};
  const isApproved = item.approval_status === "approved";
  const isRejected = item.approval_status === "rejected";
  const needsAttention =
    item.validation_status === "needs_attention" ||
    item.validation_status === "failed" ||
    item.detected_category === "uncertain";

  // Category Icon & Label
  const getCategoryBadge = () => {
    switch (item.detected_category) {
      case "event":
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-800">
            <Calendar className="h-3 w-3" /> Event
          </span>
        );
      case "receipt":
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800">
            <ReceiptIcon className="h-3 w-3" /> Receipt
          </span>
        );
      case "reading":
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-800">
            <BookOpen className="h-3 w-3" /> Reading
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800">
            <HelpCircle className="h-3 w-3" /> Review
          </span>
        );
    }
  };

  // Primary action title
  const getActionTitle = () => {
    if (item.detected_category === "event") {
      return fields.event_title || item.original_filename;
    }
    if (item.detected_category === "receipt") {
      return fields.merchant || "Receipt Record";
    }
    if (item.detected_category === "reading") {
      return fields.title || "Reading Item";
    }
    return fields.summary || item.original_filename;
  };

  // Structured key detail
  const getKeyDetail = () => {
    if (item.detected_category === "event") {
      const dt = item.resolved_date || fields.start_time;
      if (!dt) return <span className="text-amber-700 italic">Date unconfirmed</span>;
      try {
        const formatted = new Date(dt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        return (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-[#1A1917]">
            <Clock className="h-3 w-3 text-[#736E66]" /> {formatted}
          </span>
        );
      } catch {
        return <span className="text-xs">{item.raw_date_expression || dt}</span>;
      }
    }
    if (item.detected_category === "receipt") {
      const amt = fields.total_amount;
      const curr = fields.currency || "USD";
      return (
        <span className="font-mono text-xs font-semibold text-[#1A1917]">
          {amt !== undefined ? `$${amt.toFixed(2)} ${curr}` : "Amount Pending"}
        </span>
      );
    }
    if (item.detected_category === "reading") {
      return (
        <span className="truncate text-xs text-[#736E66]">
          {fields.website_or_source || (fields.url ? new URL(fields.url).hostname : "Web Article")}
        </span>
      );
    }
    return <span className="text-xs text-amber-700 italic">Needs manual classification</span>;
  };

  return (
    <div
      className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E4DC] bg-[#FFFFFF] p-4 transition hover:bg-[#FDFCFB] ${
        isRejected ? "opacity-40" : ""
      } ${isSelected ? "bg-[#F7F5F0]" : ""}`}
    >
      {/* Left selection + Thumbnail */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="h-4 w-4 rounded border-[#D5CFC3] text-[#2B593F] focus:ring-[#2B593F]"
        />

        <div
          onClick={onInspect}
          className="relative h-14 w-14 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-[#E8E4DC] bg-[#F4F1EA] transition hover:opacity-80 shadow-xs"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getThumbnailUrl(item.id)}
            alt={item.original_filename}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Content details */}
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            {getCategoryBadge()}
            {needsAttention && (
              <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800">
                <AlertTriangle className="h-3 w-3" /> Review
              </span>
            )}
            <span className="truncate text-[11px] font-mono text-[#736E66]">
              {item.original_filename}
            </span>
          </div>

          <h3
            onClick={onInspect}
            className="mt-1 cursor-pointer font-serif text-base font-semibold text-[#1A1917] hover:underline truncate"
          >
            {getActionTitle()}
          </h3>

          {/* Evidence snippet */}
          {(item.evidence_metadata?.source_evidence || fields.source_evidence) && (
            <p className="mt-0.5 text-xs text-[#736E66] line-clamp-1 italic">
              &ldquo;{item.evidence_metadata?.source_evidence || fields.source_evidence}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Right details & actions */}
      <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pl-8 md:pl-0">
        <div className="text-right">{getKeyDetail()}</div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          {isApproved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF3EE] px-2.5 py-1 text-xs font-semibold text-[#2B593F]">
              <Check className="h-3.5 w-3.5" /> Approved
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
              <X className="h-3.5 w-3.5" /> Rejected
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onApprove}
                title="Approve extracted action"
                className="inline-flex items-center gap-1 rounded-lg bg-[#2B593F] px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#234732] transition"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>

              <button
                onClick={onReject}
                title="Reject item"
                className="inline-flex items-center rounded-lg border border-[#E8E4DC] p-1.5 text-xs text-[#736E66] hover:bg-[#F4F1EA] hover:text-red-700 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={onInspect}
            title="Inspect source screenshot & edit fields"
            className="inline-flex items-center rounded-lg border border-[#E8E4DC] p-1.5 text-xs text-[#736E66] hover:bg-[#F4F1EA] hover:text-[#1A1917] transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
