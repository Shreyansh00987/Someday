"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  Eye, 
  Calendar, 
  Receipt, 
  BookOpen, 
  HelpCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Quote, 
  MapPin, 
  DollarSign, 
  Globe, 
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { Item, getOriginalImageUrl } from "@/lib/api";

interface InspectorModalProps {
  item: Item | null;
  onClose: () => void;
  onSaveAndApprove: (id: string, updates: any) => void;
  onReject: (id: string) => void;
}

export function InspectorModal({
  item,
  onClose,
  onSaveAndApprove,
  onReject,
}: InspectorModalProps) {
  const [editedCategory, setEditedCategory] = useState<string>("event");
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [editedDate, setEditedDate] = useState<string>("");
  const [editedAmount, setEditedAmount] = useState<string>("");
  const [editedLocation, setEditedLocation] = useState<string>("");
  const [editedSource, setEditedSource] = useState<string>("");
  const [editedEvidence, setEditedEvidence] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    if (item) {
      const f = item.extracted_fields || {};
      setEditedCategory(item.detected_category);
      setEditedTitle(f.event_title || f.merchant || f.title || f.summary || "");
      setEditedDate(item.resolved_date || f.start_time || f.transaction_date || item.raw_date_expression || "");
      setEditedAmount(f.total_amount !== undefined ? String(f.total_amount) : "");
      setEditedLocation(f.location || "");
      setEditedSource(f.website_or_source || f.url || "");
      setEditedEvidence(f.source_evidence || item.evidence_metadata?.source_evidence || "");
      setZoomLevel(1);
    }
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    const updates: any = {
      detected_category: editedCategory,
      resolved_date: editedDate || null,
      extracted_fields: {
        ...item.extracted_fields,
        category: editedCategory,
        event_title: editedCategory === "event" ? editedTitle : undefined,
        merchant: editedCategory === "receipt" ? editedTitle : undefined,
        title: editedCategory === "reading" ? editedTitle : undefined,
        summary: editedCategory === "uncertain" ? editedTitle : undefined,
        total_amount: editedAmount ? parseFloat(editedAmount) : undefined,
        location: editedLocation || undefined,
        website_or_source: editedSource || undefined,
        source_evidence: editedEvidence,
      },
      validation_status: "valid",
    };
    onSaveAndApprove(item.id, updates);
  };

  const confidencePct = Math.round((item.evidence_metadata?.confidence_score || 0.8) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#E5DFD3] bg-[#FFFFFF] shadow-2xl md:flex-row">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border border-[#E5DFD3] bg-white/95 p-2 text-[#6E685E] shadow-sm hover:bg-[#F7F4EC] hover:text-[#181613] transition active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left Column: Lightbox Studio Screenshot Viewer */}
        <div className="flex flex-1 flex-col border-b border-[#E5DFD3] md:border-b-0 md:border-r border-[#E5DFD3] bg-[#161513] p-4 sm:p-5 overflow-hidden">
          {/* Studio Top bar */}
          <div className="mb-3 flex items-center justify-between text-xs text-[#A89F8D]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded text-white">
                {item.original_filename}
              </span>
              <span className="text-[11px] text-[#A89F8D]">
                Captured {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.2))}
                className="p-1 text-white hover:bg-white/20 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 font-mono text-[10px] text-white">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="p-1 text-white hover:bg-white/20 rounded"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 text-white hover:bg-white/20 rounded ml-1"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Lightbox canvas */}
          <div className="relative flex flex-1 items-center justify-center overflow-auto rounded-xl border border-white/10 bg-[#1F1E1B] p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getOriginalImageUrl(item.id)}
              alt="Source screenshot"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
              className="max-h-full max-w-full object-contain rounded transition-transform duration-150"
            />
          </div>

          {/* Model Grounding Callout */}
          <div className="mt-3 rounded-xl border border-white/15 bg-white/5 p-3.5 text-xs text-white backdrop-blur-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400 text-xs">
                <ShieldCheck className="h-4 w-4" />
                Evidence Grounding
              </span>
              <span className="font-mono text-[11px] text-[#A89F8D]">
                Confidence: {confidencePct}%
              </span>
            </div>
            <div className="flex items-start gap-2 bg-black/40 p-2.5 rounded-lg border border-white/10">
              <Quote className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5 rotate-180" />
              <p className="font-mono text-[11px] text-[#EFECE4] italic leading-relaxed">
                {editedEvidence || "Verbatim text parsed directly from the visual bounds."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Verification & Field Editor */}
        <div className="flex w-full md:w-[460px] flex-col justify-between bg-[#FAF8F3] p-6 overflow-y-auto">
          <div>
            {/* Header */}
            <div className="border-b border-[#E5DFD3] pb-3 mb-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#787166]">
                  Morning Ledger Inspector
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E3F2E]">
                  <Check className="h-3 w-3" /> Ready for Approval
                </span>
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#181613] mt-1">
                Verify Extracted Action
              </h2>
            </div>

            {/* Category Selector Tabs */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#575147] mb-1.5">
                Target Category
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "event", label: "Event", icon: Calendar },
                  { id: "receipt", label: "Receipt", icon: Receipt },
                  { id: "reading", label: "Reading", icon: BookOpen },
                  { id: "uncertain", label: "Review", icon: HelpCircle },
                ].map((t) => {
                  const CatIcon = t.icon;
                  const isCur = editedCategory === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditedCategory(t.id)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-medium transition ${
                        isCur
                          ? "border-[#1E3F2E] bg-[#E7EFEA] text-[#1E3F2E] shadow-xs"
                          : "border-[#E5DFD3] bg-[#FFFFFF] text-[#6E685E] hover:bg-[#F4F1EA]"
                      }`}
                    >
                      <CatIcon className="h-3.5 w-3.5 mb-1" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#575147] mb-1">
                  {editedCategory === "event"
                    ? "Event Title"
                    : editedCategory === "receipt"
                    ? "Merchant / Store Name"
                    : editedCategory === "reading"
                    ? "Article or Resource Headline"
                    : "Item Summary"}
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] px-3 py-2 text-xs font-editorial text-base text-[#181613] shadow-xs focus:border-[#1E3F2E] focus:outline-hidden"
                />
              </div>

              {/* Date & Deterministic Resolution Timeline */}
              <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-3.5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#575147] flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#1F4E38]" />
                    Deterministic Date Resolution
                  </label>
                  <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Deterministic Math
                  </span>
                </div>

                {item.raw_date_expression && (
                  <div className="mb-2.5 text-[11px] text-[#6E685E] bg-[#F7F5EE] p-2 rounded border border-[#EFECE4]">
                    <span className="font-medium text-[#181613]">Model Raw Quote:</span> &ldquo;{item.raw_date_expression}&rdquo;
                  </div>
                )}

                <input
                  type="text"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  placeholder="2026-10-25T19:00:00"
                  className="w-full rounded-md border border-[#E5DFD3] bg-[#FAF8F3] px-3 py-1.5 font-mono text-xs text-[#181613] focus:border-[#1E3F2E] focus:outline-hidden"
                />
              </div>

              {/* Amount (Receipt) */}
              {editedCategory === "receipt" && (
                <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-3.5 shadow-xs">
                  <label className="block text-xs font-semibold text-[#575147] mb-1 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-[#A24222]" />
                    Total Amount (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                    className="w-full rounded-md border border-[#E5DFD3] bg-[#FAF8F3] px-3 py-1.5 font-mono text-sm font-bold text-[#181613] focus:border-[#1E3F2E] focus:outline-hidden"
                  />
                </div>
              )}

              {/* Location (Event) */}
              {editedCategory === "event" && (
                <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-3.5 shadow-xs">
                  <label className="block text-xs font-semibold text-[#575147] mb-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#1F4E38]" />
                    Location or Venue
                  </label>
                  <input
                    type="text"
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    placeholder="e.g. Design Hall B or Online Zoom"
                    className="w-full rounded-md border border-[#E5DFD3] bg-[#FAF8F3] px-3 py-1.5 text-xs text-[#181613] focus:border-[#1E3F2E] focus:outline-hidden"
                  />
                </div>
              )}

              {/* Source URL (Reading) */}
              {editedCategory === "reading" && (
                <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-3.5 shadow-xs">
                  <label className="block text-xs font-semibold text-[#575147] mb-1 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-[#5C3252]" />
                    URL / Publication Domain
                  </label>
                  <input
                    type="text"
                    value={editedSource}
                    onChange={(e) => setEditedSource(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-md border border-[#E5DFD3] bg-[#FAF8F3] px-3 py-1.5 text-xs text-[#181613] focus:border-[#1E3F2E] focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 border-t border-[#E5DFD3] pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onReject(item.id)}
              className="rounded-lg border border-[#E5DFD3] bg-white px-4 py-2.5 text-xs font-medium text-[#787166] hover:bg-[#FBEFEA] hover:border-[#F3D2C4] hover:text-[#A24222] transition"
            >
              Reject Item
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1E3F2E] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#152E21] transition active:scale-95"
            >
              <Check className="h-4 w-4" /> Save &amp; Approve to Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
