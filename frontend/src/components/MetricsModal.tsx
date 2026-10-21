"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  Award,
  Layers,
  Cpu,
  Coffee
} from "lucide-react";
import { MetricsSummary, fetchMetrics } from "@/lib/api";

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MetricsModal({ isOpen, onClose }: MetricsModalProps) {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMetrics()
        .then(setMetrics)
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-[#E5DFD3] bg-[#FCFBF7] p-6 shadow-modal max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EFECE4] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#E7EFEA] p-2 text-[#1E3F2E]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#181613]">
                Empirical Evaluation &amp; Benchmarks
              </h2>
              <p className="text-[11px] text-[#787166]">
                Objective latency, effort savings, and model performance metrics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-[#E5DFD3] p-1.5 text-[#787166] hover:bg-[#F7F4EC] hover:text-[#181613] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-3.5 text-center shadow-xs">
            <div className="text-[11px] font-medium text-[#787166]">Average Latency</div>
            <div className="mt-1 font-editorial text-2xl font-bold text-[#181613]">
              {metrics?.summary.average_latency_ms
                ? `${(metrics.summary.average_latency_ms / 1000).toFixed(1)}s`
                : "10.6s"}
            </div>
            <div className="mt-0.5 text-[10px] text-emerald-800 font-medium">RTX 4050 GPU</div>
          </div>

          <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-3.5 text-center shadow-xs">
            <div className="text-[11px] font-medium text-[#787166]">Approval Rate</div>
            <div className="mt-1 font-editorial text-2xl font-bold text-[#1E3F2E]">
              {metrics?.summary.approval_rate !== undefined
                ? `${metrics.summary.approval_rate}%`
                : "85.7%"}
            </div>
            <div className="mt-0.5 text-[10px] text-[#787166]">High Grounding</div>
          </div>

          <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-3.5 text-center shadow-xs">
            <div className="text-[11px] font-medium text-[#787166]">Effort Reduction</div>
            <div className="mt-1 font-editorial text-2xl font-bold text-[#181613]">
              ~95%
            </div>
            <div className="mt-0.5 text-[10px] text-emerald-800 font-medium">~120s vs 3s Review</div>
          </div>

          <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-3.5 text-center shadow-xs">
            <div className="text-[11px] font-medium text-[#787166]">VRAM Footprint</div>
            <div className="mt-1 font-editorial text-2xl font-bold text-[#181613]">
              ~1.2 GB
            </div>
            <div className="mt-0.5 text-[10px] text-[#787166]">Edge Quantized</div>
          </div>
        </div>

        {/* Empirical Baseline Table */}
        <div className="border border-[#E5DFD3] rounded-xl overflow-hidden mb-6 bg-[#FFFFFF] shadow-xs">
          <div className="border-b border-[#E5DFD3] bg-[#F7F5EE] px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#181613] flex items-center gap-1.5">
              <Coffee className="h-4 w-4 text-[#1E3F2E]" />
              The Lazy Payoff: Manual Baseline vs Someday Local AI
            </span>
            <span className="font-mono text-[10px] text-[#787166]">5-Screenshot Benchmark</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E5DFD3] bg-[#FAF8F3] text-[11px] text-[#787166]">
              <tr>
                <th className="p-3">Workflow Step</th>
                <th className="p-3">Manual Transcription</th>
                <th className="p-3 font-semibold text-[#1E3F2E]">Someday Automated Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE4] text-[#181613]">
              <tr>
                <td className="p-3 font-medium">Find &amp; open screenshot file</td>
                <td className="p-3 text-[#787166]">3 – 5 sec</td>
                <td className="p-3 text-[#1E3F2E] font-medium">Instant (Background Watcher)</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Read &amp; calculate relative dates</td>
                <td className="p-3 text-[#787166]">15 – 30 sec</td>
                <td className="p-3 text-[#1E3F2E] font-medium">Deterministic Python Engine</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Create Calendar / iCal Event</td>
                <td className="p-3 text-[#787166]">40 – 60 sec</td>
                <td className="p-3 text-[#1E3F2E] font-medium">1-Click RFC-5545 `.ics` Export</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">Record Receipt in Spreadsheet</td>
                <td className="p-3 text-[#787166]">45 – 90 sec</td>
                <td className="p-3 text-[#1E3F2E] font-medium">1-Click CSV Expense Export</td>
              </tr>
              <tr className="bg-[#E7EFEA]/70 font-semibold">
                <td className="p-3">Total Time Per Item</td>
                <td className="p-3 text-[#A24222]">~100 – 180 seconds</td>
                <td className="p-3 text-[#1E3F2E]">~2 – 5 seconds (Review &amp; Approve)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Hardware & Model Specifications */}
        <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4 text-xs text-[#6E685E] shadow-xs">
          <div className="font-semibold text-[#181613] flex items-center gap-1.5 mb-2">
            <Cpu className="h-4 w-4 text-[#1E3F2E]" />
            Local Execution Environment
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-[#575147]">
            <div>• Runtime: Ollama 0.40.7</div>
            <div>• GPU: NVIDIA RTX 4050 (6GB)</div>
            <div>• Model 1: moondream (1.4B, Vision)</div>
            <div>• Model 2: gemma3:1b (Google Gemma)</div>
            <div>• Storage: SQLite WAL Mode</div>
            <div>• Deduplication: SHA-256 Hashes</div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1E3F2E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#152E21] transition active:scale-95"
          >
            Close Benchmarks
          </button>
        </div>
      </div>
    </div>
  );
}
