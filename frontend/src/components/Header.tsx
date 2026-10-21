"use client";

import React, { useMemo } from "react";
import { 
  Folder, 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  BarChart3, 
  Cpu, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Coffee
} from "lucide-react";
import { QueueStatus, ItemListResponse } from "@/lib/api";

interface HeaderProps {
  status: QueueStatus | null;
  itemsData: ItemListResponse | null;
  onRefresh: () => void;
  onTogglePause: () => void;
  onOpenSettings: () => void;
  onOpenMetrics: () => void;
  isScanning: boolean;
}

export function Header({
  status,
  itemsData,
  onRefresh,
  onTogglePause,
  onOpenSettings,
  onOpenMetrics,
  isScanning,
}: HeaderProps) {
  const isWatching = status?.is_watching && !status?.is_paused;
  const isPaused = status?.is_paused;
  const isOnline = status?.model_online;

  // Calculate the "Lazy Payoff" - estimated time saved
  const lazyMinutesSaved = useMemo(() => {
    const total = itemsData?.total_count || 0;
    // Average manual transcription is ~2.5 minutes per screenshot (calendar, spreadsheet, read-later)
    return Math.max(1, Math.round(total * 2.5));
  }, [itemsData]);

  // Format today's date for editorial masthead
  const [todayFormatted, setTodayFormatted] = React.useState("Wednesday, October 21, 2026");

  React.useEffect(() => {
    try {
      setTodayFormatted(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    } catch {
      // Keep default on SSR
    }
  }, []);

  return (
    <header className="border-b border-[#E5DFD3] bg-[#FCFBF7] shadow-paper">
      {/* Top Editorial Masthead Ribbon */}
      <div className="border-b border-[#EFECE4] bg-[#F7F4EC] px-6 py-1.5 text-[11px] text-[#787166]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono tracking-wider uppercase font-semibold text-[#575147]">
              Vol. I · No. 24
            </span>
            <span className="hidden sm:inline text-[#BDB5A6]">|</span>
            <span className="hidden sm:inline font-serif italic text-[#635D52]">
              {todayFormatted}
            </span>
            <span className="hidden md:inline text-[#BDB5A6]">|</span>
            <span className="hidden md:inline text-[#635D52]">
              The Slow &amp; Steady Open AI Edition
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7EFEA] px-2.5 py-0.5 text-[10px] font-semibold text-[#1E3F2E]">
              <Coffee className="h-3 w-3 text-[#1E3F2E]" />
              Lazy Payoff: ~{lazyMinutesSaved} min saved
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFFFF] px-2 py-0.5 text-[10px] border border-[#E5DFD3] text-[#575147]">
              <Cpu className="h-2.5 w-2.5 text-[#1E3F2E]" />
              100% Local Inference
            </span>
          </div>
        </div>
      </div>

      {/* Main Masthead Banner */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          {/* Logo & Headline */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-editorial text-3xl md:text-4xl font-bold tracking-tight text-[#181613]">
                Someday
              </h1>
              <div className="h-5 w-px bg-[#E5DFD3]" />
              <span className="font-serif italic text-sm text-[#575147]">
                The Morning Ledger
              </span>

              {/* Status Pill */}
              {isOnline ? (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C8E3D2] bg-[#EAF4EE] px-2.5 py-0.5 text-xs font-medium text-[#1E3F2E]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span>{status?.active_model || "moondream"} (Active)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-[#FEF6EB] px-2.5 py-0.5 text-xs font-medium text-[#9B5808]">
                  <AlertCircle className="h-3 w-3" />
                  <span>Ollama Offline</span>
                </div>
              )}
            </div>

            <p className="mt-1.5 text-sm text-[#6E685E] max-w-xl leading-relaxed">
              Screenshots are the fastest way to save things for later. Someday extracts events, receipts, and reading lists in the background so you can stay lazy.
            </p>
          </div>

          {/* Action Button Suite */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onTogglePause}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition shadow-xs ${
                isPaused
                  ? "border-[#F8DFB7] bg-[#FEF6EB] text-[#9B5808] hover:bg-[#FDF0DC]"
                  : "border-[#E5DFD3] bg-[#FFFFFF] text-[#181613] hover:bg-[#F7F4EC]"
              }`}
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {isPaused ? "Resume Watcher" : "Pause Watcher"}
            </button>

            <button
              onClick={onRefresh}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3F2E] px-4 py-2 text-xs font-medium text-[#FFFFFF] shadow-sm hover:bg-[#152E21] disabled:opacity-60 transition active:scale-[0.98]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Scanning Folder..." : "Scan Watched Folder"}</span>
            </button>

            <button
              onClick={onOpenMetrics}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] px-3.5 py-2 text-xs font-medium text-[#181613] shadow-xs hover:bg-[#F7F4EC] transition"
              title="View benchmark report & accuracy metrics"
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#6E685E]" />
              <span>Metrics</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] px-3.5 py-2 text-xs font-medium text-[#181613] shadow-xs hover:bg-[#F7F4EC] transition"
              title="Configure watched folder & AI models"
            >
              <Settings className="h-3.5 w-3.5 text-[#6E685E]" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Ledger Statistics Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-[#EFECE4] pt-4">
          <div className="rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] p-3 shadow-xs">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#787166]">
              Total Ingested
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-editorial text-2xl font-bold text-[#181613]">
                {itemsData?.total_count ?? 0}
              </span>
              <span className="font-mono text-[10px] text-[#787166]">SHA-256 Hashed</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] p-3 shadow-xs">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#787166]">
              Pending Approval
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-editorial text-2xl font-bold text-[#9B5808]">
                {itemsData?.pending_approval_count ?? 0}
              </span>
              <span className="text-[10px] text-[#9B5808] font-medium">Awaiting Review</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] p-3 shadow-xs">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#787166]">
              Needs Review
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-editorial text-2xl font-bold text-[#A24222]">
                {itemsData?.needs_attention_count ?? 0}
              </span>
              <span className="text-[10px] text-[#A24222] font-medium">Human Check</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] p-3 shadow-xs">
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#787166]">
              Approved &amp; Ready
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="font-editorial text-2xl font-bold text-[#1E3F2E]">
                {itemsData?.approved_count ?? 0}
              </span>
              <span className="text-[10px] text-[#1E3F2E] font-medium">Ready for Export</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
