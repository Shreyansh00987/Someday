"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Receipt as ReceiptIcon, 
  BookOpen, 
  HelpCircle, 
  Check, 
  X, 
  ExternalLink,
  Clock, 
  AlertTriangle,
  Quote,
  ShieldCheck,
  Eye
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

  const [imgError, setImgError] = useState(false);

  // Category Configuration
  const getCategoryConfig = () => {
    switch (item.detected_category) {
      case "event":
        return {
          label: "Event",
          icon: Calendar,
          borderClass: "border-l-[4px] border-l-[#1F4E38]",
          badgeClass: "bg-[#EAF4EE] text-[#1F4E38] border border-[#C8E3D2]",
          dotColor: "bg-[#1F4E38]",
        };
      case "receipt":
        return {
          label: "Receipt",
          icon: ReceiptIcon,
          borderClass: "border-l-[4px] border-l-[#A24222]",
          badgeClass: "bg-[#FBEFEA] text-[#A24222] border border-[#F3D2C4]",
          dotColor: "bg-[#A24222]",
        };
      case "reading":
        return {
          label: "Reading",
          icon: BookOpen,
          borderClass: "border-l-[4px] border-l-[#5C3252]",
          badgeClass: "bg-[#F5EDF3] text-[#5C3252] border border-[#E5D0E0]",
          dotColor: "bg-[#5C3252]",
        };
      default:
        return {
          label: "Review",
          icon: HelpCircle,
          borderClass: "border-l-[4px] border-l-[#9B5808]",
          badgeClass: "bg-[#FEF6EB] text-[#9B5808] border border-[#F8DFB7]",
          dotColor: "bg-[#9B5808]",
        };
    }
  };

  const catConfig = getCategoryConfig();
  const Icon = catConfig.icon;

  // Title calculation
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
      if (!dt) return <span className="text-[#9B5808] italic">Date unconfirmed</span>;
      try {
        const formatted = new Date(dt).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        return (
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#181613]">
              <Clock className="h-3.5 w-3.5 text-[#1F4E38]" /> {formatted}
            </span>
            {fields.location && (
              <span className="text-[11px] text-[#6E685E] max-w-[150px] truncate">
                {fields.location}
              </span>
            )}
          </div>
        );
      } catch {
        return <span className="text-xs font-mono">{item.raw_date_expression || dt}</span>;
      }
    }
    if (item.detected_category === "receipt") {
      const amt = fields.total_amount;
      const curr = fields.currency || "USD";
      return (
        <div className="flex flex-col items-end">
          <span className="font-mono text-sm font-bold text-[#181613]">
            {amt !== undefined ? `$${amt.toFixed(2)} ${curr}` : "Pending Amount"}
          </span>
          <span className="text-[11px] text-[#6E685E] capitalize">
            {fields.expense_category || "Expense"}
          </span>
        </div>
      );
    }
    if (item.detected_category === "reading") {
      return (
        <div className="flex flex-col items-end">
          <span className="font-medium text-xs text-[#181613] max-w-[160px] truncate">
            {fields.website_or_source || (fields.url ? new URL(fields.url).hostname : "Reading Resource")}
          </span>
          {fields.author && (
            <span className="text-[11px] text-[#6E685E]">
              by {fields.author}
            </span>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-col items-end">
        <span className="text-xs font-medium text-[#9B5808]">Uncertain Intent</span>
        <span className="text-[10px] text-[#8E877C]">Requires user review</span>
      </div>
    );
  };

  const evidenceText = item.evidence_metadata?.source_evidence || fields.source_evidence;

  return (
    <div
      className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5DFD3] bg-[#FFFFFF] p-4 sm:p-5 transition-all duration-150 hover:bg-[#FDFCF9] ${catConfig.borderClass} ${
        isRejected ? "opacity-35 grayscale" : ""
      } ${isSelected ? "bg-[#F7F4EC]" : ""}`}
    >
      {/* Left Column: Checkbox, Contact Sheet Thumbnail, Content */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="mt-1 sm:mt-0 h-4 w-4 rounded border-[#D1C9B8] text-[#1E3F2E] focus:ring-[#1E3F2E] cursor-pointer"
        />

        {/* Thumbnail with Polaroid Frame styling */}
        <div
          onClick={onInspect}
          className="relative h-16 w-16 sm:h-18 sm:w-18 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-[#E5DFD3] bg-[#F7F5EE] shadow-xs transition duration-200 group-hover:shadow-md group-hover:scale-102"
        >
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getThumbnailUrl(item.id)}
              alt={item.original_filename}
              className="h-full w-full object-cover transition duration-300 group-hover:brightness-95"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-mono text-[#8E877C]">
              IMG
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
            <Eye className="h-4 w-4 text-white drop-shadow-sm" />
          </div>
        </div>

        {/* Main Information */}
        <div className="flex flex-col min-w-0 pr-3 flex-1">
          {/* Metadata badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${catConfig.badgeClass}`}>
              <Icon className="h-3 w-3" />
              {catConfig.label}
            </span>

            {needsAttention && (
              <span className="inline-flex items-center gap-1 rounded bg-[#FEF6EB] px-1.5 py-0.5 text-[11px] font-semibold text-[#9B5808] border border-[#F8DFB7]">
                <AlertTriangle className="h-3 w-3" />
                Attention Needed
              </span>
            )}

            <span className="truncate font-mono text-[11px] text-[#787166]">
              {item.original_filename}
            </span>

            {item.evidence_metadata?.confidence_score !== undefined && (
              <span className="hidden lg:inline-flex items-center gap-0.5 text-[10px] text-[#787166] font-mono">
                <ShieldCheck className="h-2.5 w-2.5 text-[#1E3F2E]" />
                {Math.round(item.evidence_metadata.confidence_score * 100)}% grounded
              </span>
            )}
          </div>

          {/* Action Title (Editorial Serif) */}
          <h3
            onClick={onInspect}
            className="cursor-pointer font-editorial text-lg sm:text-xl font-bold tracking-tight text-[#181613] hover:text-[#1E3F2E] transition-colors truncate"
          >
            {getActionTitle()}
          </h3>

          {/* Grounding Evidence Quote */}
          {evidenceText && (
            <div className="mt-1 flex items-start gap-1.5 text-xs text-[#6E685E]">
              <Quote className="h-3 w-3 text-[#A89F8D] flex-shrink-0 mt-0.5 rotate-180" />
              <p className="italic line-clamp-1 text-[11.5px] text-[#575147]">
                &ldquo;{evidenceText}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Key details & Action Controls */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 border-t border-[#EFECE4] sm:border-t-0 pt-3 sm:pt-0">
        <div className="text-right sm:min-w-[120px]">{getKeyDetail()}</div>

        {/* Action Button Suite */}
        <div className="flex items-center gap-1.5">
          {isApproved ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF4EE] px-3 py-1.5 text-xs font-semibold text-[#1F4E38] border border-[#C8E3D2]">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Approved
            </span>
          ) : isRejected ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#F2EFE7] px-3 py-1.5 text-xs font-medium text-[#787166] border border-[#E5DFD3]">
              <X className="h-3.5 w-3.5" /> Rejected
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onApprove}
                title="Approve this item and save to ledger"
                className="inline-flex items-center gap-1 rounded-lg bg-[#1E3F2E] px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#152E21] transition active:scale-95"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>

              <button
                onClick={onReject}
                title="Reject item"
                className="inline-flex items-center rounded-lg border border-[#E5DFD3] p-1.5 text-xs text-[#6E685E] hover:bg-[#FBEFEA] hover:border-[#F3D2C4] hover:text-[#A24222] transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={onInspect}
            title="Inspect source screenshot & edit fields"
            className="inline-flex items-center rounded-lg border border-[#E5DFD3] bg-[#FCFBF7] p-1.5 text-xs text-[#6E685E] hover:bg-[#F7F4EC] hover:text-[#181613] hover:border-[#D1C9B8] transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
