"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Download, 
  CheckCheck, 
  Search, 
  Filter, 
  FolderPlus, 
  Sparkles, 
  Inbox, 
  Calendar, 
  Receipt, 
  BookOpen, 
  AlertCircle,
  Coffee,
  Check,
  FileSpreadsheet,
  FileText,
  X
} from "lucide-react";
import { 
  Item, 
  ItemListResponse, 
  QueueStatus, 
  fetchItems, 
  fetchQueueStatus, 
  approveItem, 
  rejectItem, 
  bulkApproveItems, 
  updateItem, 
  pauseWatcher, 
  resumeWatcher, 
  triggerImmediateScan,
  getExportUrl
} from "@/lib/api";
import { Header } from "@/components/Header";
import { LedgerRow } from "@/components/LedgerRow";
import { InspectorModal } from "@/components/InspectorModal";
import { SettingsModal } from "@/components/SettingsModal";
import { MetricsModal } from "@/components/MetricsModal";

export default function MorningLedgerPage() {
  const [itemsData, setItemsData] = useState<ItemListResponse | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectedItem, setInspectedItem] = useState<Item | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);

  // Load items and queue status
  const loadData = useCallback(async () => {
    try {
      const [items, status] = await Promise.all([
        fetchItems({
          category: ["event", "receipt", "reading"].includes(activeTab) ? activeTab : undefined,
          approval_status: ["approved", "rejected", "pending"].includes(activeTab) ? activeTab : undefined,
          validation_status: activeTab === "attention" ? "needs_attention" : undefined,
          search: searchQuery || undefined,
        }),
        fetchQueueStatus(),
      ]);
      setItemsData(items);
      setQueueStatus(status);
    } catch (e) {
      console.error("Error loading data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3500);
    return () => clearInterval(interval);
  }, [loadData]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked && itemsData) {
      setSelectedIds(new Set(itemsData.items.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  // Actions
  const handleApprove = async (id: string) => {
    await approveItem(id);
    loadData();
  };

  const handleReject = async (id: string) => {
    await rejectItem(id);
    loadData();
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await bulkApproveItems(ids);
    setSelectedIds(new Set());
    loadData();
  };

  const handleSaveAndApprove = async (id: string, updates: any) => {
    await updateItem(id, updates);
    await approveItem(id);
    setInspectedItem(null);
    loadData();
  };

  const handleTogglePause = async () => {
    if (queueStatus?.is_paused) {
      await resumeWatcher();
    } else {
      await pauseWatcher();
    }
    loadData();
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await triggerImmediateScan();
      await loadData();
    } finally {
      setIsScanning(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!itemsData) return [];
    let list = itemsData.items;

    if (activeTab === "attention") {
      list = list.filter(
        (i) =>
          i.validation_status === "needs_attention" ||
          i.validation_status === "failed" ||
          i.detected_category === "uncertain"
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => {
        const title = (
          i.extracted_fields?.event_title ||
          i.extracted_fields?.merchant ||
          i.extracted_fields?.title ||
          i.extracted_fields?.summary ||
          i.original_filename
        ).toLowerCase();
        const evidence = (i.evidence_metadata?.source_evidence || "").toLowerCase();
        return title.includes(q) || evidence.includes(q);
      });
    }

    return list;
  }, [itemsData, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#181613]">
      {/* Header */}
      <Header
        status={queueStatus}
        itemsData={itemsData}
        onRefresh={handleScan}
        onTogglePause={handleTogglePause}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMetrics={() => setIsMetricsOpen(true)}
        isScanning={isScanning}
      />

      {/* Main Ledger Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Navigation Tabs & Search Toolbar */}
        <div className="flex flex-col gap-4 border-b border-[#E5DFD3] pb-4 md:flex-row md:items-center md:justify-between">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Items" },
              { id: "event", label: "Events", icon: Calendar },
              { id: "receipt", label: "Receipts", icon: Receipt },
              { id: "reading", label: "Reading", icon: BookOpen },
              { id: "attention", label: "Needs Review", icon: AlertCircle, badge: itemsData?.needs_attention_count },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#1E3F2E] text-white shadow-xs font-semibold"
                      : "text-[#6E685E] bg-[#FFFFFF] border border-[#E5DFD3] hover:bg-[#F2EFE7] hover:text-[#181613]"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive ? "bg-white text-[#1E3F2E]" : "bg-amber-100 text-[#9B5808]"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input & Action Controls */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#787166]" />
              <input
                type="text"
                placeholder="Search ledger entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] py-1.5 pl-8.5 pr-3 text-xs text-[#181613] placeholder-[#787166] shadow-xs focus:border-[#1E3F2E] focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-[#787166] hover:text-[#181613]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-semibold text-[#181613] shadow-xs hover:bg-[#F7F4EC] transition"
              >
                <Download className="h-3.5 w-3.5 text-[#1E3F2E]" />
                Export
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E5DFD3] bg-[#FFFFFF] p-1.5 shadow-modal z-30 text-xs animate-in fade-in duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#787166] border-b border-[#EFECE4]">
                    Export Approved Items
                  </div>
                  <a
                    href={getExportUrl("calendar")}
                    download
                    onClick={() => setExportMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#181613] hover:bg-[#EAF4EE] hover:text-[#1F4E38] transition"
                  >
                    <Calendar className="h-4 w-4 text-[#1F4E38]" />
                    <div>
                      <div className="font-medium">Calendar (.ics)</div>
                      <div className="text-[10px] text-[#787166]">For Apple &amp; Google Calendar</div>
                    </div>
                  </a>
                  <a
                    href={getExportUrl("expenses")}
                    download
                    onClick={() => setExportMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#181613] hover:bg-[#FBEFEA] hover:text-[#A24222] transition"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-[#A24222]" />
                    <div>
                      <div className="font-medium">Expenses (.csv)</div>
                      <div className="text-[10px] text-[#787166]">For Excel &amp; QuickBooks</div>
                    </div>
                  </a>
                  <a
                    href={getExportUrl("reading", "csv")}
                    download
                    onClick={() => setExportMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#181613] hover:bg-[#F5EDF3] hover:text-[#5C3252] transition"
                  >
                    <BookOpen className="h-4 w-4 text-[#5C3252]" />
                    <div>
                      <div className="font-medium">Reading List (.csv)</div>
                      <div className="text-[10px] text-[#787166]">Spreadsheet format</div>
                    </div>
                  </a>
                  <a
                    href={getExportUrl("reading", "json")}
                    download
                    onClick={() => setExportMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#181613] hover:bg-[#F5EDF3] hover:text-[#5C3252] transition"
                  >
                    <FileText className="h-4 w-4 text-[#5C3252]" />
                    <div>
                      <div className="font-medium">Reading List (.json)</div>
                      <div className="text-[10px] text-[#787166]">Structured developer format</div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Bulk Approve */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkApprove}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3F2E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#152E21] transition active:scale-95"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Approve ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Ledger Activity List */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E5DFD3] bg-[#FFFFFF] shadow-paper">
          {/* Ledger Table Header */}
          <div className="flex items-center justify-between border-b border-[#E5DFD3] bg-[#F7F5EE] px-5 py-3 text-xs font-semibold text-[#6E685E]">
            <div className="flex items-center gap-3.5">
              <input
                type="checkbox"
                checked={
                  filteredItems.length > 0 &&
                  filteredItems.every((i) => selectedIds.has(i.id))
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-[#D1C9B8] text-[#1E3F2E] focus:ring-[#1E3F2E] cursor-pointer"
              />
              <span className="font-medium tracking-wide uppercase text-[11px] text-[#575147]">
                Extracted Screenshots &amp; Intent
              </span>
            </div>
            <div className="flex items-center gap-10 pr-2">
              <span className="hidden sm:inline font-medium tracking-wide uppercase text-[11px] text-[#575147]">
                Key Detail
              </span>
              <span className="font-medium tracking-wide uppercase text-[11px] text-[#575147]">
                Human Review
              </span>
            </div>
          </div>

          {/* Ledger Rows */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#6E685E]">
              <Sparkles className="h-8 w-8 animate-pulse text-[#1E3F2E] mb-3" />
              <p className="font-editorial text-lg text-[#181613]">Opening Morning Ledger...</p>
              <p className="text-xs text-[#787166] mt-1">Reading local SQLite database</p>
            </div>
          ) : filteredItems.length === 0 ? (
            /* Slow & Steady Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-[#E7EFEA] flex items-center justify-center text-[#1E3F2E] mb-4 shadow-xs">
                <Coffee className="h-8 w-8" />
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[#181613]">
                Your Morning Ledger is Clear
              </h3>
              <p className="mt-2 max-w-md text-xs text-[#6E685E] leading-relaxed">
                Take screenshots of events, receipts, or articles whenever you browse.
                Someday processes them quietly in the background so you never have to type them out by hand.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleScan}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3F2E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#152E21] transition active:scale-95"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Scan Watched Folder
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5DFD3] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#181613] hover:bg-[#F7F4EC] transition"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-[#6E685E]" />
                  Configure Folder
                </button>
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <LedgerRow
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onSelect={(sel) => handleSelectOne(item.id, sel)}
                onApprove={() => handleApprove(item.id)}
                onReject={() => handleReject(item.id)}
                onInspect={() => setInspectedItem(item)}
              />
            ))
          )}
        </div>
      </main>

      {/* Inspector Modal */}
      <InspectorModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        onSaveAndApprove={handleSaveAndApprove}
        onReject={(id) => {
          handleReject(id);
          setInspectedItem(null);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={loadData}
      />

      {/* Metrics Modal */}
      <MetricsModal
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
      />
    </div>
  );
}
