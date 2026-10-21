"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Eye, Calendar, DollarSign, BookOpen, AlertTriangle, ShieldCheck, ArrowLeft, ArrowRight, Save } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#E8E4DC] bg-[#FFFFFF] shadow-2xl md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full border border-[#E8E4DC] bg-white/90 p-1.5 text-[#736E66] hover:bg-[#F4F1EA] hover:text-[#1A1917] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Left Side: Screenshot Evidence Viewer */}
        <div className="flex flex-1 flex-col border-b border-[#E8E4DC] md:border-b-0 md:border-r bg-[#1A1917]/5 p-4 overflow-hidden">
          <div className="mb-2 flex items-center justify-between text-xs text-[#736E66]">
            <span className="font-mono">{item.original_filename}</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Eye className="h-3 w-3" /> Original Capture
            </span>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-auto rounded-lg border border-[#E8E4DC] bg-[#1E1E1E]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getOriginalImageUrl(item.id)}
              alt="Source screenshot"
              className="max-h-full max-w-full object-contain p-2"
            />
          </div>

          {/* Evidence Callout */}
          <div className="mt-3 rounded-lg border border-[#E8E4DC] bg-[#FFFFFF] p-3 text-xs">
            <div className="font-semibold text-[#1A1917] flex items-center gap-1.5 mb-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2B593F]" />
              Model Grounding Evidence
            </div>
            <p className="text-[#736E66] italic font-mono text-[11px] bg-[#FBF9F5] p-2 rounded border border-[#E8E4DC]">
              &ldquo;{editedEvidence || "No direct text quote extracted."}&rdquo;
            </p>
          </div>
        </div>

        {/* Right Side: Structured Ledger Inspector & Editor */}
        <div className="flex w-full md:w-[420px] flex-col justify-between bg-[#FFFFFF] p-6 overflow-y-auto">
          <div>
            <div className="border-b border-[#F4F1EA] pb-3 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#736E66]">
                Morning Ledger Detail
              </span>
              <h2 className="font-serif text-xl font-bold text-[#1A1917] mt-1">
                Edit & Verify Extraction
              </h2>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              {/* Category Selector */}
              <div>
                <label className="block font-medium text-[#1A1917] mb-1">Detected Category</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["event", "receipt", "reading", "uncertain"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditedCategory(cat)}
                      className={`capitalize py-1.5 rounded border text-xs font-medium transition ${
                        editedCategory === cat
                          ? "border-[#2B593F] bg-[#EBF3EE] text-[#2B593F]"
                          : "border-[#E8E4DC] bg-[#FBF9F5] text-[#736E66] hover:bg-[#F4F1EA]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Merchant */}
              <div>
                <label className="block font-medium text-[#1A1917] mb-1">
                  {editedCategory === "event"
                    ? "Event Title"
                    : editedCategory === "receipt"
                    ? "Merchant"
                    : editedCategory === "reading"
                    ? "Article Title"
                    : "Summary"}
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full rounded-md border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-2 text-xs font-serif text-[#1A1917] focus:border-[#2B593F] focus:outline-hidden"
                />
              </div>

              {/* Date & Deterministic Resolution */}
              <div>
                <label className="block font-medium text-[#1A1917] mb-1">
                  Resolved Date & Time
                </label>
                <input
                  type="text"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  className="w-full rounded-md border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-2 text-xs font-mono text-[#1A1917] focus:border-[#2B593F] focus:outline-hidden"
                  placeholder="YYYY-MM-DDTHH:MM:SS"
                />
                {item.raw_date_expression && (
                  <p className="mt-1 text-[11px] text-[#736E66]">
                    Verbatim model expression: <span className="font-mono text-[#1A1917]">&ldquo;{item.raw_date_expression}&rdquo;</span>
                  </p>
                )}
              </div>

              {/* Amount (for receipt) */}
              {editedCategory === "receipt" && (
                <div>
                  <label className="block font-medium text-[#1A1917] mb-1">Total Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                    className="w-full rounded-md border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-2 text-xs font-mono text-[#1A1917] focus:border-[#2B593F] focus:outline-hidden"
                  />
                </div>
              )}

              {/* Location (for event) */}
              {editedCategory === "event" && (
                <div>
                  <label className="block font-medium text-[#1A1917] mb-1">Venue / Location</label>
                  <input
                    type="text"
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    className="w-full rounded-md border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-2 text-xs text-[#1A1917] focus:border-[#2B593F] focus:outline-hidden"
                  />
                </div>
              )}

              {/* Source / URL (for reading) */}
              {editedCategory === "reading" && (
                <div>
                  <label className="block font-medium text-[#1A1917] mb-1">URL or Publication</label>
                  <input
                    type="text"
                    value={editedSource}
                    onChange={(e) => setEditedSource(e.target.value)}
                    className="w-full rounded-md border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-2 text-xs text-[#1A1917] focus:border-[#2B593F] focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 border-t border-[#F4F1EA] pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onReject(item.id)}
              className="rounded-lg border border-[#E8E4DC] px-4 py-2 text-xs font-medium text-stone-600 hover:bg-[#F4F1EA] transition"
            >
              Reject Item
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2B593F] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#234732] transition"
            >
              <Check className="h-4 w-4" /> Save & Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
