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
  AlertCircle 
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
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1917]">
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
        <div className="flex flex-col gap-4 border-b border-[#E8E4DC] pb-4 md:flex-row md:items-center md:justify-between">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1">
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
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-[#2B593F] text-white shadow-xs"
                      : "text-[#736E66] hover:bg-[#F4F1EA] hover:text-[#1A1917]"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive ? "bg-white text-[#2B593F]" : "bg-amber-100 text-amber-800"
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
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#736E66]" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 rounded-lg border border-[#E8E4DC] bg-[#FFFFFF] py-1.5 pl-8 pr-3 text-xs text-[#1A1917] placeholder-[#736E66] focus:border-[#2B593F] focus:outline-hidden"
              />
            </div>

            {/* Export Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DC] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#1A1917] shadow-xs hover:bg-[#F4F1EA] transition"
              >
                <Download className="h-3.5 w-3.5 text-[#2B593F]" />
                Export
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-lg border border-[#E8E4DC] bg-[#FFFFFF] p-1 shadow-lg z-20 text-xs">
                  <a
                    href={getExportUrl("calendar")}
                    download
                    onClick={() => setExportMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-[#1A1917] hover:bg-[#F4F1EA]"
                  >
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    Export Calendar (.ics)
                  </a>
                  <a
                    href={getExportUrl("expenses")}
                    download
                    onClick={() => setExportMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-[#1A1917] hover:bg-[#F4F1EA]"
                  >
                    <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                    Export Expenses (CSV)
                  </a>
                  <a
                    href={getExportUrl("reading", "csv")}
                    download
                    onClick={() => setExportMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-[#1A1917] hover:bg-[#F4F1EA]"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                    Export Reading (CSV)
                  </a>
                  <a
                    href={getExportUrl("reading", "json")}
                    download
                    onClick={() => setExportMenuOpen(false)}
                    className="flex items-center gap-2 rounded px-3 py-2 text-[#1A1917] hover:bg-[#F4F1EA]"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                    Export Reading (JSON)
                  </a>
                </div>
              )}
            </div>

            {/* Bulk Approve */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkApprove}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2B593F] px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#234732] transition"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Approve ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Ledger Activity List */}
        <div className="mt-6 overflow-hidden rounded-xl border border-[#E8E4DC] bg-[#FFFFFF] shadow-xs">
          {/* Ledger Table Header */}
          <div className="flex items-center justify-between border-b border-[#E8E4DC] bg-[#F4F1EA] px-4 py-3 text-xs font-semibold text-[#736E66]">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={
                  filteredItems.length > 0 &&
                  filteredItems.every((i) => selectedIds.has(i.id))
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-[#D5CFC3] text-[#2B593F] focus:ring-[#2B593F]"
              />
              <span>Screenshots & Extracted Intent</span>
            </div>
            <div className="flex items-center gap-8 pr-2">
              <span className="hidden sm:inline">Key Details</span>
              <span>Review Action</span>
            </div>
          </div>

          {/* Ledger Rows */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#736E66]">
              <Sparkles className="h-8 w-8 animate-pulse text-[#2B593F] mb-3" />
              <p className="font-serif text-sm">Opening Morning Ledger...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-[#EBF3EE] flex items-center justify-center text-[#2B593F] mb-4">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A1917]">
                Your Morning Ledger is Clear
              </h3>
              <p className="mt-1.5 max-w-md text-xs text-[#736E66] leading-relaxed">
                Add screenshot images to your watched folder, or trigger a scan.
                Someday will classify the intent, extract dates and totals, and list them here for your review.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={handleScan}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2B593F] px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#234732] transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Scan Watched Folder
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E4DC] bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#1A1917] hover:bg-[#F4F1EA] transition"
                >
                  <FolderPlus className="h-3.5 w-3.5 text-[#736E66]" />
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

      {/* Inspector Modal (Evidence Grounding & Field Editor) */}
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
