"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  Save, 
  Folder, 
  Cpu, 
  Shield, 
  Zap, 
  Clock, 
  Sliders, 
  FolderSearch,
  Sparkles
} from "lucide-react";
import { SystemConfig, fetchConfig, saveConfig } from "@/lib/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export function SettingsModal({ isOpen, onClose, onConfigSaved }: SettingsModalProps) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [folderPath, setFolderPath] = useState("");
  const [activeModel, setActiveModel] = useState("moondream");
  const [pollingSec, setPollingSec] = useState("3.0");
  const [recursive, setRecursive] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [idleOnly, setIdleOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
        .then((cfg) => {
          setConfig(cfg);
          setFolderPath(cfg.watch_folder);
          setActiveModel(cfg.active_model);
          setPollingSec(String(cfg.polling_interval_sec));
          setRecursive(cfg.recursive);
          setAutoApprove(cfg.auto_approve_high_confidence);
          setIdleOnly(cfg.idle_only);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await saveConfig({
        watch_folder: folderPath,
        active_model: activeModel,
        polling_interval_sec: parseFloat(pollingSec) || 3.0,
        recursive,
        auto_approve_high_confidence: autoApprove,
        idle_only: idleOnly,
      });
      setMessage("Configuration saved successfully.");
      onConfigSaved();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-[#E5DFD3] bg-[#FCFBF7] p-6 shadow-modal max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EFECE4] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#E7EFEA] p-2 text-[#1E3F2E]">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-editorial text-xl font-bold text-[#181613]">
                System &amp; Model Configuration
              </h2>
              <p className="text-[11px] text-[#787166]">
                Configure local folders, open-weight models, and lazy ingestion parameters.
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

        <div className="space-y-4 text-xs">
          {/* Watched Directory */}
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4 shadow-xs">
            <label className="block text-xs font-semibold text-[#181613] mb-1.5 flex items-center gap-1.5">
              <Folder className="h-4 w-4 text-[#1E3F2E]" />
              Screenshot Ingestion Directory
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="flex-1 rounded-lg border border-[#E5DFD3] bg-[#FAF8F3] px-3 py-2 font-mono text-xs text-[#181613] focus:border-[#1E3F2E] focus:outline-hidden"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#787166] leading-relaxed">
              Monitors only image files (*.png, *.jpg, *.jpeg, *.webp). Read-only access — original screenshots are never deleted.
            </p>
          </div>

          {/* Model Selection */}
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#181613] flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-[#1E3F2E]" />
                Open-Weight Model Engine (Ollama)
              </label>
              <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                RTX 4050 GPU Acceleration
              </span>
            </div>

            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full rounded-lg border border-[#E5DFD3] bg-[#FAF8F3] px-3 py-2 text-xs font-medium text-[#181613] focus:border-[#1E3F2E] focus:outline-hidden"
            >
              <option value="moondream">moondream (1.4B - Verified Local Vision &amp; OCR)</option>
              <option value="gemma3:1b">gemma3:1b (Google Gemma 3 Open Weights)</option>
              {config?.available_models
                ?.filter((m) => m !== "moondream" && m !== "gemma3:1b")
                .map((m) => (
                  <option key={m} value={m}>
                    {m} (Installed Local Model)
                  </option>
                ))}
            </select>
            <p className="mt-1.5 text-[11px] text-[#787166]">
              All inference executes on your machine. You can swap models anytime without code modifications.
            </p>
          </div>

          {/* Automation & Polling Options */}
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-4 shadow-xs space-y-3">
            <div className="text-xs font-semibold text-[#181613] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#1E3F2E]" />
              Slow &amp; Steady Ingestion Options
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[#575147] mb-1">
                  Folder Polling (Seconds)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1.0"
                  value={pollingSec}
                  onChange={(e) => setPollingSec(e.target.value)}
                  className="w-full rounded-md border border-[#E5DFD3] bg-[#FAF8F3] px-3 py-1.5 font-mono text-xs text-[#181613] focus:border-[#1E3F2E] focus:outline-hidden"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recursive}
                    onChange={(e) => setRecursive(e.target.checked)}
                    className="rounded border-[#D1C9B8] text-[#1E3F2E] focus:ring-[#1E3F2E]"
                  />
                  <span className="text-[11.5px] text-[#181613]">Scan subdirectories</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="rounded border-[#D1C9B8] text-[#1E3F2E] focus:ring-[#1E3F2E]"
                  />
                  <span className="text-[11.5px] text-[#181613]">Auto-approve &gt;90% confidence</span>
                </label>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="rounded-xl border border-[#C8E3D2] bg-[#EAF4EE] p-3.5 text-[11px] text-[#1F4E38]">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <Shield className="h-4 w-4 text-[#1E3F2E]" />
              Zero-Cloud Privacy Guarantee
            </div>
            Someday operates entirely local-first. Screenshots and extracted dates/receipt amounts never cross network boundaries or touch external cloud servers.
          </div>

          {message && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium">
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#EFECE4] pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E5DFD3] bg-white px-4 py-2 text-xs font-medium text-[#787166] hover:bg-[#F7F4EC] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3F2E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#152E21] disabled:opacity-50 transition active:scale-95"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
