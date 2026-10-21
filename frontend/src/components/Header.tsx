"use client";

import React from "react";
import { Folder, Play, Pause, RefreshCw, Settings, BarChart3, AlertCircle } from "lucide-react";
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

  return (
    <header className="border-b border-[#E8E4DC] bg-[#FFFFFF] px-6 py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Brand and Tagline */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A1917]">
              Someday
            </h1>
            <span className="inline-flex items-center rounded-full bg-[#EBF3EE] px-2.5 py-0.5 text-xs font-medium text-[#2B593F]">
              Local-First AI
            </span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {status?.active_model}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                <AlertCircle className="h-3 w-3" />
                Ollama Offline
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[#736E66]">
            Your screenshots are a to-do list. Someday finishes them.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onTogglePause}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              isPaused
                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                : "border-[#E8E4DC] bg-[#FBF9F5] text-[#1A1917] hover:bg-[#F4F1EA]"
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? "Resume Watcher" : "Pause"}
          </button>

          <button
            onClick={onRefresh}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-[#1A1917] hover:bg-[#F4F1EA] disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? "animate-spin text-[#2B593F]" : ""}`} />
            {isScanning ? "Scanning..." : "Scan Folder"}
          </button>

          <button
            onClick={onOpenMetrics}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-[#1A1917] hover:bg-[#F4F1EA] transition"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#736E66]" />
            Metrics
          </button>

          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-[#1A1917] hover:bg-[#F4F1EA] transition"
          >
            <Settings className="h-3.5 w-3.5 text-[#736E66]" />
            Settings
          </button>
        </div>
      </div>

      {/* Ledger Stats Ribbon */}
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between border-t border-[#F4F1EA] pt-3 text-xs text-[#736E66]">
        <div className="flex items-center gap-6">
          <div>
            Total Captured:{" "}
            <span className="font-semibold text-[#1A1917]">{itemsData?.total_count ?? 0}</span>
          </div>
          <div>
            Pending Review:{" "}
            <span className="font-semibold text-amber-700">{itemsData?.pending_approval_count ?? 0}</span>
          </div>
          <div>
            Needs Attention:{" "}
            <span className="font-semibold text-red-600">{itemsData?.needs_attention_count ?? 0}</span>
          </div>
          <div>
            Approved:{" "}
            <span className="font-semibold text-[#2B593F]">{itemsData?.approved_count ?? 0}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Folder className="h-3.5 w-3.5 text-[#736E66]" />
          <span className="truncate max-w-xs font-mono text-[11px] text-[#736E66]">
            {status?.last_processed_file ? `Last: ${status.last_processed_file}` : "Folder Active"}
          </span>
        </div>
      </div>
    </header>
  );
}
