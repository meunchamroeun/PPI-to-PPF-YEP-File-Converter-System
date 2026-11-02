"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import JSZip from "jszip";
import {
  LayoutDashboard,
  Repeat,
  Binary,
  History,
  Cpu,
  UploadCloud,
  FileCheck,
  AlertOctagon,
  RefreshCw,
  Play,
  Download,
  Trash2,
  Sparkles,
  ShieldAlert,
  Moon,
  Sun,
  Menu,
  X,
  FileSpreadsheet,
  Lock,
  Unlock,
  FolderSearch,
  Music2,
  FileMusic,
  Send,
  User as UserIcon,
  ShieldX,
  PlayCircle,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BaseSwitch } from "@/components/ui/base-switch";
import { GSAPAudioVisualizer } from "@/components/GSAPAudioVisualizer";
import { HexViewer } from "@/components/HexViewer";
import { AuthModal, UserSession } from "@/components/AuthModal";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { YamahaPPIParser, ParsedPPIData } from "@/lib/yamaha/ppi-parser";
import { YamahaPPFGenerator } from "@/lib/yamaha/ppf-generator";
import { YamahaYEPGenerator } from "@/lib/yamaha/yep-generator";
import { createDemoPPIBuffer } from "@/lib/yamaha/sample-generator";
import { formatBytes, generateUUID } from "@/lib/utils";

// Queue Item Interface
interface QueueItem {
  id: string;
  name: string;
  size: number;
  buffer: ArrayBuffer;
  parsedData: ParsedPPIData;
  targetFormat: "PPF" | "YEP";
  status: "PENDING" | "CONVERTING" | "SUCCESS" | "FAILED" | "CANCELLED";
  progress: number;
  stage: string;
  output: {
    blob: Blob;
    filename: string;
    xml: string;
    downloadUrl: string;
  } | null;
  uploadedAt: Date;
  cancelToken: boolean;
}

// History Entry Interface
interface HistoryEntry {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
  date: Date;
  notes?: string;
  output?: {
    filename: string;
    downloadUrl: string;
  } | null;
}

export default function YamahaConverterApp() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Conversion Queue & History
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [inspectorFileId, setInspectorFileId] = useState<string | null>(null);

  // Settings & Toggles (Base UI Switch)
  const [enableToneVisualizer, setEnableToneVisualizer] = useState<boolean>(true);
  const [strictDRMMode, setStrictDRMMode] = useState<boolean>(true);

  // Modals
  const [drmModalOpen, setDrmModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Search & Filter
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("ALL");

  // Telegram Mini App Hook
  const { isInTelegram, user: tgUser, triggerHaptic, notifyHaptic } = useTelegramWebApp();

  // Statistics Calculation
  const stats = {
    uploaded: queue.length + history.length,
    converted: history.length,
    success: history.filter((h) => h.status === "SUCCESS").length,
    failed: history.filter((h) => h.status === "FAILED").length,
  };

  // Sync Telegram User on load
  useEffect(() => {
    if (tgUser && !currentUser) {
      setCurrentUser({
        id: "usr_tg_" + tgUser.id,
        name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ""),
        username: tgUser.username,
        provider: "TELEGRAM",
      });
    }
  }, [tgUser, currentUser]);

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    triggerHaptic("medium");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  // Ingest files into queue
  const processFiles = async (files: (File | { name: string; size: number; arrayBuffer: () => Promise<ArrayBuffer> })[]) => {
    const newItems: QueueItem[] = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const parsedData = YamahaPPIParser.parse(buffer, file.name);

      const item: QueueItem = {
        id: "file_" + generateUUID().slice(0, 8),
        name: file.name,
        size: file.size,
        buffer,
        parsedData,
        targetFormat: "PPF",
        status: "PENDING",
        progress: 0,
        stage: "Ready for conversion",
        output: null,
        uploadedAt: new Date(),
        cancelToken: false,
      };

      newItems.push(item);
    }

    setQueue((prev) => [...prev, ...newItems]);
    if (newItems.length > 0) {
      setInspectorFileId(newItems[0].id);
      setActiveTab("converter");
    }
  };

  // Instant Sample Generator (Zero Setup Demo)
  const handleLoadSample = (isEncrypted = false) => {
    triggerHaptic("medium");
    const demoBuffer = createDemoPPIBuffer(isEncrypted);
    const fileName = isEncrypted ? "Yamaha_Premium_Ballad.cpi" : "Yamaha_Celtic_Expansion.ppi";

    const mockFile = {
      name: fileName,
      size: demoBuffer.byteLength,
      arrayBuffer: async () => demoBuffer,
    };

    processFiles([mockFile]);
  };

  // Conversion Execution Logic
  const handleConvertItem = async (itemId: string) => {
    const item = queue.find((q) => q.id === itemId);
    if (!item || item.status === "CONVERTING") return;

    triggerHaptic("heavy");

    // Enforce DRM Security Check
    if (item.parsedData.isProtected) {
      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? { ...q, status: "FAILED", stage: "Rejected: Encrypted CPI requires .n27 key", progress: 100 }
            : q
        )
      );

      const histEntry: HistoryEntry = {
        id: "hist_" + generateUUID().slice(0, 8),
        name: item.name,
        size: item.size,
        type: `PPI → ${item.targetFormat}`,
        status: "FAILED",
        date: new Date(),
        notes: "DRM Protected CPI - Missing instrument key",
      };

      setHistory((prev) => [histEntry, ...prev]);
      notifyHaptic("error");
      setDrmModalOpen(true);
      return;
    }

    // Update status to CONVERTING
    setQueue((prev) =>
      prev.map((q) =>
        q.id === itemId
          ? { ...q, status: "CONVERTING", progress: 10, stage: "Reading binary PAC chunks...", cancelToken: false }
          : q
      )
    );

    try {
      let outputBlob: Blob;
      let outputXml = "";
      let outputExtension: string;
      const baseName = item.name.replace(/\.[^/.]+$/, "");

      const onProgress = (percent: number, stage: string) => {
        setQueue((prev) =>
          prev.map((q) => (q.id === itemId && !q.cancelToken ? { ...q, progress: percent, stage } : q))
        );
      };

      if (item.targetFormat === "PPF") {
        const result = await YamahaPPFGenerator.generate(item.parsedData, onProgress);
        outputBlob = result.blob;
        outputXml = result.xml;
        outputExtension = "ppf";
      } else {
        const result = await YamahaYEPGenerator.generate(item.parsedData, onProgress);
        outputBlob = result.blob;
        outputXml = result.xml;
        outputExtension = "yep";
      }

      // Check if cancelled mid-flight
      const current = queue.find((q) => q.id === itemId);
      if (current?.cancelToken) return;

      const outputFilename = `${baseName}.${outputExtension}`;
      const downloadUrl = URL.createObjectURL(outputBlob);

      const outputData = {
        blob: outputBlob,
        filename: outputFilename,
        xml: outputXml,
        downloadUrl,
      };

      setQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? { ...q, status: "SUCCESS", progress: 100, stage: "Conversion Complete!", output: outputData }
            : q
        )
      );

      // Add to History
      const histEntry: HistoryEntry = {
        id: "hist_" + generateUUID().slice(0, 8),
        name: item.name,
        size: item.size,
        type: `PPI → ${item.targetFormat}`,
        status: "SUCCESS",
        date: new Date(),
        notes: "Genuine container structure verified",
        output: { filename: outputFilename, downloadUrl },
      };

      setHistory((prev) => [histEntry, ...prev]);
      notifyHaptic("success");

      // Confetti celebration
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
      });
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, status: "FAILED", stage: `Error: ${err.message}` } : q))
      );

      setHistory((prev) => [
        {
          id: "hist_" + generateUUID().slice(0, 8),
          name: item.name,
          size: item.size,
          type: `PPI → ${item.targetFormat}`,
          status: "FAILED",
          date: new Date(),
          notes: err.message,
        },
        ...prev,
      ]);

      notifyHaptic("error");
    }
  };

  // Convert All Pending
  const handleConvertAll = async () => {
    const pending = queue.filter((q) => q.status === "PENDING");
    for (const item of pending) {
      await handleConvertItem(item.id);
    }
  };

  // Cancel conversion
  const handleCancelItem = (itemId: string) => {
    triggerHaptic("light");
    setQueue((prev) =>
      prev.map((q) =>
        q.id === itemId
          ? { ...q, cancelToken: true, status: "CANCELLED", stage: "Cancelled by user", progress: 0 }
          : q
      )
    );

    const item = queue.find((q) => q.id === itemId);
    if (item) {
      setHistory((prev) => [
        {
          id: "hist_" + generateUUID().slice(0, 8),
          name: item.name,
          size: item.size,
          type: `PPI → ${item.targetFormat}`,
          status: "CANCELLED",
          date: new Date(),
          notes: "Cancelled by user",
        },
        ...prev,
      ]);
    }
  };

  // Download All as Master Zip
  const handleDownloadAllZip = async () => {
    const completed = queue.filter((q) => q.status === "SUCCESS" && q.output);
    if (completed.length === 0) return;

    triggerHaptic("medium");
    const masterZip = new JSZip();
    for (const item of completed) {
      if (item.output) {
        masterZip.file(item.output.filename, item.output.blob);
      }
    }

    const zipBlob = await masterZip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(zipBlob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Yamaha_Converted_Expansions_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export History to CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;
    let csv = "Original File Name,File Size Bytes,Conversion Type,Status,Date\n";
    history.forEach((h) => {
      csv += `"${h.name}",${h.size},"${h.type}","${h.status}","${h.date.toISOString()}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Yamaha_Conversion_History_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Active Inspector Item
  const activeInspectorItem = queue.find((q) => q.id === inspectorFileId) || queue[0] || null;

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${darkMode ? "dark" : ""}`}>
      {/* ===================================================================== */}
      {/* SIDEBAR NAVIGATION                                                    */}
      {/* ===================================================================== */}
      <aside className="w-full lg:w-64 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 z-30">
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-800 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Music2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-none text-slate-900 dark:text-white">ExpVoice Studio</h1>
                <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">PPI Converter v2.5</span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Items */}
          <div className={`p-4 space-y-1 ${mobileMenuOpen ? "block" : "hidden lg:block"}`}>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace
            </span>

            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("converter");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "converter"
                  ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Repeat className="w-4 h-4" />
              <span>File Converter</span>
              {queue.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.2">
                  {queue.length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("inspector");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "inspector"
                  ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Binary className="w-4 h-4" />
              <span>File &amp; Hex Inspector</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("history");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Conversion History</span>
            </button>

            <div className="pt-4">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Specifications
              </span>
            </div>

            <button
              onClick={() => {
                setActiveTab("architecture");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "architecture"
                  ? "bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Tech Stack &amp; Specs</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Audio Visualizer & User */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {enableToneVisualizer && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>AWM2 Spectrum</span>
                <span className="font-mono text-emerald-500">44.1 kHz</span>
              </div>
              <GSAPAudioVisualizer
                isActive={queue.some((q) => q.status === "CONVERTING")}
                barCount={20}
                className="w-full"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400"
            >
              <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="user" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="truncate max-w-[100px]">{currentUser ? currentUser.name : "Sign In"}</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* MAIN CONTENT AREA                                                     */}
      {/* ===================================================================== */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* Top Header Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {activeTab === "dashboard" && "Expansion Voice Dashboard"}
              {activeTab === "converter" && "Yamaha File Conversion Queue"}
              {activeTab === "inspector" && "File & Hex Binary Inspector"}
              {activeTab === "history" && "Conversion History Archive"}
              {activeTab === "architecture" && "Production System Blueprint"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Professional converter for Yamaha Expansion Voice Manager (.PPI → .PPF / .YEP)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Demo Sample Generator */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoadSample(false)}
              className="gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border-brand-200 dark:border-brand-800"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Load Sample PPI</span>
            </Button>

            {/* Test Encrypted CPI Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleLoadSample(true)}
              className="gap-1.5 text-slate-700 dark:text-slate-300"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Test Protected CPI</span>
            </Button>

            {/* Telegram Mini App indicator */}
            <Badge
              variant="secondary"
              className={`gap-1.5 px-3 py-1 text-[11px] ${
                isInTelegram
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <Send className="w-3 h-3 text-[#229ED9]" />
              <span>{isInTelegram ? "Mini App Live" : "Telegram Ready"}</span>
            </Badge>
          </div>
        </header>

        {/* =================================================================== */}
        {/* TAB 1: DASHBOARD                                                    */}
        {/* =================================================================== */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white p-8 shadow-xl border border-indigo-900/40">
              <div className="relative z-10 max-w-2xl space-y-4">
                <Badge className="bg-white/10 text-brand-300 hover:bg-white/15 border-none backdrop-blur">
                  Yamaha Voice Expansion Manager Compatible
                </Badge>
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  High-Fidelity PPI to PPF &amp; YEP File Conversion
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  De-encapsulate compiled installation packs into editable Yamaha Expansion Manager project archives
                  with genuine XML manifests, User Voice scripts (<span className="font-mono text-brand-300">.uvf</span>),
                  and PCM waveforms.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    onClick={() => setActiveTab("converter")}
                    className="gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload &amp; Convert Files</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleLoadSample(false)}
                    className="gap-2 bg-white/10 hover:bg-white/15 border-white/20 text-white"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Try In-Memory Demo</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* 4 Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Files Uploaded
                  </CardTitle>
                  <UploadCloud className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold">{stats.uploaded}</div>
                  <p className="text-[11px] text-slate-500 mt-1">Supported: .ppi, .cpi</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total Converted
                  </CardTitle>
                  <RefreshCw className="w-4 h-4 text-brand-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold">{stats.converted}</div>
                  <p className="text-[11px] text-brand-500 mt-1">Processed packages</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Successful Outputs
                  </CardTitle>
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {stats.success}
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">100% verified structures</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Failed / DRM Blocked
                  </CardTitle>
                  <AlertOctagon className="w-4 h-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.failed}</div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Protected .CPI packs</p>
                </CardContent>
              </Card>
            </div>

            {/* Base UI Settings Toggle & Format Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 font-mono">
                    .PPI Container
                  </Badge>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pack Project Installer</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Compiled binary for instrument flash ROM. Holds flattened PAC chunk streams.
                  </p>
                </div>
                <div className="mt-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  Magic: 0x50 41 43 20 (PAC )
                </div>
              </Card>

              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <Badge variant="default" className="mb-2 font-mono">
                    .PPF Target
                  </Badge>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pack Project File</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Editable ZIP project archive containing Pack.xml, UVF scripts, and PCM WAV samples.
                  </p>
                </div>
                <div className="mt-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  Schema: Valid YEM XML Manifest
                </div>
              </Card>

              <Card className="p-4 flex flex-col justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2 font-mono">
                    .YEP Legacy
                  </Badge>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Yamaha Expansion Pack</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Legacy binary format for older instruments (PSR-S950, PSR-S750, PSR-S650).
                  </p>
                </div>
                <div className="mt-4 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  Signature: YEP0 (0x59 45 50 30)
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: FILE CONVERTER                                               */}
        {/* =================================================================== */}
        {activeTab === "converter" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Conversion Processing Queue</h3>
                <p className="text-xs text-slate-500">Configure target formats and convert individually or in batch.</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={handleConvertAll}
                  disabled={!queue.some((q) => q.status === "PENDING")}
                  size="sm"
                  className="gap-2 shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Convert All</span>
                </Button>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={handleDownloadAllZip}
                  disabled={!queue.some((q) => q.status === "SUCCESS")}
                  className="gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All (.zip)</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueue([])}
                  disabled={queue.length === 0}
                  className="gap-1.5 text-slate-600 dark:text-slate-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </Button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload-input")?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-3xl p-8 md:p-12 text-center bg-white/50 dark:bg-slate-900/40 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 transition-all cursor-pointer group"
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept=".ppi,.cpi"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                Drag &amp; drop your Yamaha .PPI expansion files here
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Accepts Yamaha Pack Project Installation files (.ppi) and Protected Packs (.cpi). Multiple file upload
                enabled.
              </p>
              <Button size="sm" variant="secondary" className="gap-2 pointer-events-none">
                <FolderSearch className="w-4 h-4" />
                <span>Select Files from Computer</span>
              </Button>
            </div>

            {/* Queue Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Files in Queue ({queue.length})</span>
                <BaseSwitch
                  checked={strictDRMMode}
                  onCheckedChange={setStrictDRMMode}
                  label="Strict DRM Safeguard"
                  className="text-xs"
                />
              </div>

              {queue.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20">
                  <FileMusic className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Queue is empty</p>
                  <p className="text-xs text-slate-500 mt-1">Upload a PPI file or click "Load Sample PPI" to test.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {queue.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                item.parsedData.isProtected
                                  ? "bg-rose-100 text-rose-600 dark:bg-rose-950"
                                  : "bg-brand-50 text-brand-600 dark:bg-brand-950"
                              }`}
                            >
                              {item.parsedData.isProtected ? (
                                <Lock className="w-5 h-5" />
                              ) : (
                                <FileMusic className="w-5 h-5" />
                              )}
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs">
                                  {item.name}
                                </h4>
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {formatBytes(item.size)}
                                </Badge>
                                {item.parsedData.isProtected && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    CPI Protected
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Pack: <span className="font-medium text-slate-700 dark:text-slate-300">{item.parsedData.packName}</span> • Target:{" "}
                                <span className="font-medium text-brand-600 dark:text-brand-400">{item.parsedData.targetHardware}</span>
                              </p>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Format selector */}
                            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
                              <button
                                onClick={() =>
                                  setQueue((prev) =>
                                    prev.map((q) => (q.id === item.id ? { ...q, targetFormat: "PPF" } : q))
                                  )
                                }
                                disabled={item.status !== "PENDING"}
                                className={`px-2.5 py-1 rounded-md transition ${
                                  item.targetFormat === "PPF"
                                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                                    : "text-slate-500"
                                }`}
                              >
                                PPF (Zip)
                              </button>
                              <button
                                onClick={() =>
                                  setQueue((prev) =>
                                    prev.map((q) => (q.id === item.id ? { ...q, targetFormat: "YEP" } : q))
                                  )
                                }
                                disabled={item.status !== "PENDING"}
                                className={`px-2.5 py-1 rounded-md transition ${
                                  item.targetFormat === "YEP"
                                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                                    : "text-slate-500"
                                }`}
                              >
                                YEP (Binary)
                              </button>
                            </div>

                            {item.status === "PENDING" && (
                              <Button size="sm" onClick={() => handleConvertItem(item.id)}>
                                Convert
                              </Button>
                            )}

                            {item.status === "CONVERTING" && (
                              <Button size="sm" variant="destructive" onClick={() => handleCancelItem(item.id)}>
                                Cancel
                              </Button>
                            )}

                            {item.status === "SUCCESS" && item.output && (
                              <a href={item.output.downloadUrl} download={item.output.filename}>
                                <Button size="sm" variant="emerald" className="gap-1.5">
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </Button>
                              </a>
                            )}

                            {/* Inspect */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setInspectorFileId(item.id);
                                setActiveTab("inspector");
                              }}
                            >
                              <Binary className="w-4 h-4" />
                            </Button>

                            {/* Remove */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setQueue((prev) => prev.filter((q) => q.id !== item.id))}
                            >
                              <X className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar & Stage Indicator */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              {item.status === "CONVERTING" && (
                                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                              )}
                              {item.stage}
                            </span>
                            <span className="font-mono font-semibold">{item.progress}%</span>
                          </div>
                          <Progress
                            value={item.progress}
                            indicatorColor={
                              item.status === "SUCCESS"
                                ? "bg-emerald-500"
                                : item.status === "FAILED"
                                ? "bg-rose-500"
                                : "bg-brand-600"
                            }
                          />
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: FILE & HEX INSPECTOR                                         */}
        {/* =================================================================== */}
        {activeTab === "inspector" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Binary &amp; Chunk Inspector</h3>
                <p className="text-xs text-slate-500">Examine raw PAC byte stream, chunk index, and generated PPF XML.</p>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Inspecting:</span>
                <select
                  value={activeInspectorItem?.id || ""}
                  onChange={(e) => setInspectorFileId(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-medium"
                >
                  {queue.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name} ({formatBytes(q.size)})
                    </option>
                  ))}
                  {queue.length === 0 && <option value="">No files uploaded</option>}
                </select>
              </div>
            </div>

            {activeInspectorItem ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Metadata Specs */}
                <div className="space-y-4">
                  <Card className="p-4 space-y-3">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      Header Descriptor
                    </CardTitle>
                    <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Signature</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.signature}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Version</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.formatVersion}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Pack Name</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {activeInspectorItem.parsedData.packName}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Target Model</span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          {activeInspectorItem.parsedData.targetHardware}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">DRM Status</span>
                        {activeInspectorItem.parsedData.isProtected ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Protected CPI
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Open / Unencrypted
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Voices Count</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.voicesCount}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Styles Count</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.stylesCount}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Wave Samples</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.waveCount}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Chunks List */}
                  <Card className="p-4 space-y-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      Parsed Chunks
                    </CardTitle>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {activeInspectorItem.parsedData.chunks.map((ch, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px]"
                        >
                          <span className="font-bold text-brand-500">{ch.type}</span>
                          <span className="text-slate-500">0x{ch.offset.toString(16).padStart(4, "0")}</span>
                          <span className="text-slate-700 dark:text-slate-300">{ch.size} B</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Right: Live Hex Viewer & Generated XML Manifest */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Raw Byte Hex Dump</span>
                      <span className="font-mono text-slate-500">First 512 Bytes</span>
                    </div>
                    <div className="p-3">
                      <HexViewer buffer={activeInspectorItem.buffer} maxBytes={512} />
                    </div>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Generated Pack.xml Manifest</span>
                      <Badge variant="outline" className="text-[10px]">
                        PPF ZIP Schema
                      </Badge>
                    </div>
                    <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs max-h-56 overflow-y-auto">
                      <pre>
                        {activeInspectorItem.output?.xml ||
                          YamahaPPFGenerator.generatePackXml(activeInspectorItem.parsedData)}
                      </pre>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/20">
                <Binary className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No file selected for inspection</p>
                <p className="text-xs text-slate-500 mt-1">Upload a PPI file to view raw binary and chunk tables.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: CONVERSION HISTORY                                           */}
        {/* =================================================================== */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Conversion Audit History</h3>
                <p className="text-xs text-slate-500">Track and download previously converted expansion packages.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistory([])}
                  disabled={history.length === 0}
                  className="gap-2 text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </Button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by file name..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Successful</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* History Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500 uppercase text-[10px]">
                      <th className="py-3 px-4">Original File</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Conversion Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {history
                      .filter((h) => {
                        const matchesSearch = h.name.toLowerCase().includes(historySearch.toLowerCase());
                        const matchesFilter = historyStatusFilter === "ALL" || h.status === historyStatusFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-medium flex items-center gap-2">
                            <FileMusic className="w-4 h-4 text-slate-400" />
                            <span>{h.name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{formatBytes(h.size)}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400">
                            {h.type}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                h.status === "SUCCESS"
                                  ? "success"
                                  : h.status === "FAILED"
                                  ? "destructive"
                                  : "warning"
                              }
                              className="text-[10px]"
                            >
                              {h.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {h.date.toLocaleDateString()} {h.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {h.output ? (
                              <a href={h.output.downloadUrl} download={h.output.filename}>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-brand-600">
                                  <Download className="w-3.5 h-3.5 mr-1" />
                                  <span>Download</span>
                                </Button>
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}

                    {history.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No conversion history records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: BACKEND & TECH SPECS                                         */}
        {/* =================================================================== */}
        {activeTab === "architecture" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="p-6 space-y-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-600" />
                <span>Production Technology Stack Integration</span>
              </CardTitle>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-brand-600 font-bold uppercase text-[10px]">Frontend UI</span>
                  <h5 className="font-bold mt-1 text-slate-900 dark:text-white">Next.js 16 + React 19</h5>
                  <p className="text-slate-500 mt-1">Radix UI, shadcn/ui, Base UI, Tailwind CSS, Motion, GSAP.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-brand-600 font-bold uppercase text-[10px]">Queue &amp; Cache</span>
                  <h5 className="font-bold mt-1 text-slate-900 dark:text-white">BullMQ + Redis</h5>
                  <p className="text-slate-500 mt-1">Asynchronous chunk de-encapsulation worker pool.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-brand-600 font-bold uppercase text-[10px]">Database</span>
                  <h5 className="font-bold mt-1 text-slate-900 dark:text-white">PostgreSQL</h5>
                  <p className="text-slate-500 mt-1">Audit logs, user profiles, daily KPI tracking.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-brand-600 font-bold uppercase text-[10px]">Mini App &amp; Bot</span>
                  <h5 className="font-bold mt-1 text-slate-900 dark:text-white">Telegram + PWA</h5>
                  <p className="text-slate-500 mt-1">Telegraf bot daemon, TMA WebApp SDK, installable PWA.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">
                PostgreSQL Schema Reference (schema.sql)
              </CardTitle>
              <div className="p-4 bg-slate-950 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto max-h-56">
                <pre>{`CREATE TABLE conversion_jobs (
    id UUID PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    original_size_bytes BIGINT NOT NULL,
    target_format VARCHAR(20) NOT NULL, -- 'PPF' or 'YEP'
    status VARCHAR(50) NOT NULL,
    progress_percent INT DEFAULT 0,
    pack_name VARCHAR(255),
    voices_count INT DEFAULT 0,
    styles_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`}</pre>
              </div>
            </Card>
          </motion.div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* MODAL: DRM REJECTION WARNING                                          */}
      {/* ===================================================================== */}
      <Dialog open={drmModalOpen} onOpenChange={setDrmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mb-2">
              <ShieldX className="w-6 h-6" />
            </div>
            <DialogTitle className="text-base font-bold">Protected Yamaha Content Detected</DialogTitle>
            <DialogDescription className="text-xs">
              This package is an encrypted commercial expansion (<span className="font-mono text-rose-500">.cpi</span>)
              tied to an Instrument Info (<span className="font-mono">.n27</span>) hardware signature.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">Copyright Rule Enforced:</p>
            <p>
              In accordance with conversion rules, ExpVoice Studio will not generate corrupted or dummy output when valid
              private decryption keys are absent.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setDrmModalOpen(false)}>
              Understood
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL: AUTHENTICATION (GOOGLE & TELEGRAM)                             */}
      {/* ===================================================================== */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          notifyHaptic("success");
        }}
        onLogout={() => {
          setCurrentUser(null);
          triggerHaptic("light");
        }}
      />
    </div>
  );
}
