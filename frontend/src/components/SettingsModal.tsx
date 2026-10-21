"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Save, Folder, Cpu, Shield, RefreshCw } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-[#E8E4DC] bg-[#FFFFFF] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F1EA] pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[#2B593F]" />
            <h2 className="font-serif text-lg font-bold text-[#1A1917]">System & Model Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#736E66] hover:bg-[#F4F1EA] hover:text-[#1A1917]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Watched Directory */}
          <div>
            <label className="block font-medium text-[#1A1917] mb-1">Screenshots Watched Directory</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                className="flex-1 rounded-md border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-2 font-mono text-xs text-[#1A1917] focus:border-[#2B593F] focus:outline-hidden"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#736E66]">
              Someday only monitors image files (*.png, *.jpg, *.webp) in this folder.
            </p>
          </div>

          {/* Vision Model Selection */}
          <div>
            <label className="block font-medium text-[#1A1917] mb-1">Active Vision-Language Model</label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full rounded-md border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-2 text-xs text-[#1A1917] focus:border-[#2B593F] focus:outline-hidden"
            >
              <option value="moondream">moondream (1.4B - Verified Local Vision)</option>
              <option value="gemma3:1b">gemma3:1b (Google Gemma 3 Open Weights)</option>
              {config?.available_models
                ?.filter((m) => m !== "moondream" && m !== "gemma3:1b")
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-[11px] text-[#736E66]">
              All inference runs locally on your machine via Ollama. No images leave your device.
            </p>
          </div>

          {/* Polling Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#1A1917] mb-1">Polling Interval (Seconds)</label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                value={pollingSec}
                onChange={(e) => setPollingSec(e.target.value)}
                className="w-full rounded-md border border-[#E8E4DC] bg-[#FBF9F5] px-3 py-2 text-xs font-mono text-[#1A1917] focus:border-[#2B593F] focus:outline-hidden"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={recursive}
                  onChange={(e) => setRecursive(e.target.checked)}
                  className="rounded border-[#D5CFC3] text-[#2B593F] focus:ring-[#2B593F]"
                />
                <span className="text-xs text-[#1A1917]">Recursive subdirectories</span>
              </label>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="rounded-lg border border-[#E8E4DC] bg-[#FBF9F5] p-3 text-[11px] text-[#736E66]">
            <div className="font-semibold text-[#1A1917] flex items-center gap-1.5 mb-0.5">
              <Shield className="h-3.5 w-3.5 text-[#2B593F]" />
              Local Privacy Guarantee
            </div>
            Original screenshot files are never modified, deleted, or uploaded to any third-party cloud.
          </div>

          {message && (
            <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-800">
              {message}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F4F1EA] pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E8E4DC] px-4 py-2 text-xs font-medium text-[#736E66] hover:bg-[#F4F1EA]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2B593F] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#234732] disabled:opacity-50 transition"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
