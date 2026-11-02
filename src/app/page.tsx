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
  Monitor,
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
  Brain,
  Sliders,
  ShieldCheck,
  Crown,
  LogIn,
  LogOut,
  Search,
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
import { AuthGate } from "@/components/AuthGate";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AdminPanel } from "@/components/AdminPanel";
import { Logo } from "@/components/ui/logo";
import { YamahaVoicePlayer } from "@/components/YamahaVoicePlayer";
import { CommandPalette } from "@/components/CommandPalette";
import { TelegramSimulatorModal } from "@/components/TelegramSimulatorModal";
import { SendToTelegramModal } from "@/components/SendToTelegramModal";
import { SoundWaveHero } from "@/components/SoundWaveHero";
import { FloatingAIAssistant } from "@/components/FloatingAIAssistant";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { useTelegramWebApp } from "@/hooks/useTelegramWebApp";
import { YamahaPPIParser, ParsedPPIData } from "@/lib/yamaha/ppi-parser";
import { YamahaPPFGenerator } from "@/lib/yamaha/ppf-generator";
import { YamahaYEPGenerator } from "@/lib/yamaha/yep-generator";
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
  // Internationalization hook (Default: Khmer 'kh')
  const { t, language, setLanguage } = useTranslation();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  type ThemeMode = "system" | "light" | "dark";
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
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
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [telegramSimulatorOpen, setTelegramSimulatorOpen] = useState<boolean>(false);
  const [telegramSendModalOpen, setTelegramSendModalOpen] = useState<boolean>(false);
  const [telegramSendTarget, setTelegramSendTarget] = useState<{
    blob: Blob | null;
    filename: string;
  } | null>(null);

  const handleOpenTelegramSend = (blob: Blob | null, filename: string) => {
    setTelegramSendTarget({ blob, filename });
    setTelegramSendModalOpen(true);
    triggerHaptic("medium");
  };

  // Search & Filter
  const [historySearch, setHistorySearch] = useState<string>("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("ALL");
  const [historyScope, setHistoryScope] = useState<"personal" | "all">("personal");

  // Telegram Mini App Hook
  const { isInTelegram, user: tgUser, triggerHaptic, notifyHaptic } = useTelegramWebApp();

  // Statistics Calculation
  const stats = {
    uploaded: queue.length + history.length,
    converted: history.length,
    success: history.filter((h) => h.status === "SUCCESS").length,
    failed: history.filter((h) => h.status === "FAILED").length,
  };

  // Restore user session from localStorage or Google OAuth redirect callback
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const userParam = urlParams.get("user");
        if (userParam) {
          try {
            const user = JSON.parse(decodeURIComponent(userParam));
            setCurrentUser(user);
            localStorage.setItem("user_session", JSON.stringify(user));
            window.history.replaceState({}, document.title, window.location.pathname);
            setIsSessionLoading(false);
            return;
          } catch (e) {}
        }
      }

      const savedUser = localStorage.getItem("user_session");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
    } finally {
      setIsSessionLoading(false);
    }
  }, []);

  // Fetch persisted history from DB API
  const fetchHistoryFromDb = async () => {
    try {
      const url = currentUser?.id && historyScope === "personal"
        ? `/api/history?userId=${currentUser.id}`
        : "/api/history?all=true";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data.history && Array.isArray(data.history)) {
        const mapped: HistoryEntry[] = data.history.map((h: any) => ({
          id: h.id,
          name: h.original_filename,
          size: h.original_size_bytes,
          type: `${h.original_format || "PPI"} → ${h.target_format || "PPF"}`,
          status: h.status === "COMPLETED" ? "SUCCESS" : h.status,
          date: new Date(h.completed_at || h.created_at),
          notes: h.error_message || "Verified container structure",
          output: h.output_filename ? { filename: h.output_filename, downloadUrl: h.download_url || "" } : null,
        }));
        setHistory(mapped);
      }
    } catch (e) {
      console.warn("Could not load history from API:", e);
    }
  };

  useEffect(() => {
    fetchHistoryFromDb();
  }, [currentUser, historyScope]);

  // Synchronize Light / Night / System Theme directly on <html> root element
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme") as ThemeMode | null;
      const initialMode: ThemeMode =
        saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
      setThemeMode(initialMode);

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const applyResolvedTheme = (mode: ThemeMode) => {
        const isDark = mode === "dark" ? true : mode === "light" ? false : mediaQuery.matches;
        setDarkMode(isDark);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      };

      applyResolvedTheme(initialMode);

      // Listen for system OS theme changes dynamically
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const currentSaved = localStorage.getItem("theme");
        if (!currentSaved || currentSaved === "system") {
          setDarkMode(e.matches);
          if (e.matches) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      };

      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    } catch {
      // safe fallback
    }
  }, []);

  const setThemeExplicitly = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem("theme", mode);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = mode === "dark" ? true : mode === "light" ? false : mediaQuery.matches;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const cycleThemeMode = () => {
    // Cycle: system -> light -> dark -> system
    const nextMode: ThemeMode =
      themeMode === "system"
        ? (darkMode ? "light" : "dark")
        : themeMode === "light"
        ? "dark"
        : "system";
    setThemeExplicitly(nextMode);
  };

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K, Alt+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        cycleThemeMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [themeMode, darkMode]);

  // Sync Telegram User on load
  useEffect(() => {
    if (tgUser && !currentUser) {
      setCurrentUser({
        id: "usr_tg_" + tgUser.id,
        name: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ""),
        username: tgUser.username,
        provider: "TELEGRAM",
        role: "USER",
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

      // Persist to Database API
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser?.id,
            userName: currentUser?.name,
            userEmail: currentUser?.email,
            originalFilename: item.name,
            originalSizeBytes: item.size,
            originalFormat: "PPI",
            targetFormat: item.targetFormat,
            outputFilename,
            downloadUrl,
            status: "COMPLETED",
            progress: 100,
            stage: "Conversion Complete!",
            packName: item.parsedData.packName,
            targetHardware: item.parsedData.targetHardware,
            voicesCount: item.parsedData.voicesCount,
            stylesCount: item.parsedData.stylesCount,
            wavesCount: item.parsedData.waveCount,
          }),
        });
      } catch (e) {}

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

      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser?.id,
            userName: currentUser?.name,
            userEmail: currentUser?.email,
            originalFilename: item.name,
            originalSizeBytes: item.size,
            originalFormat: "PPI",
            targetFormat: item.targetFormat,
            status: "FAILED",
            progress: 100,
            stage: `Error: ${err.message}`,
            errorMessage: err.message,
            packName: item.parsedData.packName,
            targetHardware: item.parsedData.targetHardware,
          }),
        });
      } catch (e) {}

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

  // Session verification loading splash
  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-3">
          <Logo variant="mark" size="lg" className="animate-pulse" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Yamaha ExpVoice Studio...
          </span>
        </div>
      </div>
    );
  }

  // Mandatory Authentication Gate (All users must login to access)
  if (!currentUser) {
    return (
      <AuthGate
        onLogin={(user) => {
          setCurrentUser(user);
          localStorage.setItem("user_session", JSON.stringify(user));
          notifyHaptic("success");
        }}
        darkMode={darkMode}
        themeMode={themeMode}
        onToggleTheme={cycleThemeMode}
      />
    );
  }

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-200 overflow-x-hidden lg:overflow-hidden">
      {/* PWA Install Prompt & Offline Awareness Banner */}
      <PWAInstallBanner />
      {/* ===================================================================== */}
      {/* SIDEBAR NAVIGATION (FIXED & NEVER SCROLLS)                           */}
      {/* ===================================================================== */}
      <aside className="w-full lg:w-64 lg:h-screen lg:sticky lg:top-0 bg-sidebar border-r border-border/80 flex flex-col justify-between shrink-0 z-30 overflow-hidden no-scrollbar select-none">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-border/80 shrink-0">
            <Logo variant="compact" size="sm" />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Items (Perfect fit, zero scrollbar) */}
          <div className={`p-3 space-y-0.5 flex-1 min-h-0 overflow-hidden no-scrollbar ${mobileMenuOpen ? "block" : "hidden lg:block"}`}>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace
            </span>

            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === "dashboard"
                  ? "bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/20 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="truncate min-w-0 flex-1 text-left">{t("nav_dashboard")}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("converter");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === "converter"
                  ? "bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/20 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent"
              }`}
            >
              <Repeat className="w-4 h-4 shrink-0" />
              <span className="truncate min-w-0 flex-1 text-left">{t("nav_converter")}</span>
              {queue.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs px-2 py-0.2 shrink-0">
                  {queue.length}
                </Badge>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("inspector");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === "inspector"
                  ? "bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/20 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent"
              }`}
            >
              <Binary className="w-4 h-4 shrink-0" />
              <span className="truncate min-w-0 flex-1 text-left">{t("nav_inspector")}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("history");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === "history"
                  ? "bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/20 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent"
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span className="truncate min-w-0 flex-1 text-left">{t("nav_history")}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("ai");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === "ai"
                  ? "bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/20 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent"
              }`}
            >
              <Brain className="w-4 h-4 text-brand-500 shrink-0" />
              <span className="truncate min-w-0 flex-1 text-left">{t("nav_ai")}</span>
              <Badge variant="default" className="ml-auto text-[9px] px-1.5 py-0 bg-brand-600 text-white shrink-0">
                Gemini
              </Badge>
            </button>

            <div className="pt-2">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t("nav_system_category")}
              </span>
            </div>

            <button
              onClick={() => {
                setActiveTab("settings");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === "settings"
                  ? "bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/20 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent"
              }`}
            >
              <Sliders className="w-4 h-4 text-brand-500 shrink-0" />
              <span className="truncate min-w-0 flex-1 text-left">{t("nav_settings")}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("admin");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                activeTab === "admin"
                  ? "bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/20 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="truncate min-w-0 flex-1 text-left">{t("nav_admin")}</span>
              <Badge variant="default" className="ml-auto text-[9px] px-1.5 py-0 bg-purple-600 text-white shrink-0">
                {t("nav_admin_badge")}
              </Badge>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Audio Visualizer & User */}
        <div className={`p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0 ${mobileMenuOpen ? "block" : "hidden lg:block"}`}>
          {enableToneVisualizer && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>AWM2 Spectrum</span>
                <span className="font-mono text-emerald-500 tabular-nums">44.1 kHz</span>
              </div>
              <GSAPAudioVisualizer
                isActive={queue.some((q) => q.status === "CONVERTING")}
                barCount={20}
                className="w-full"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 min-w-0"
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600 shrink-0">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="user" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="truncate max-w-[100px] whitespace-nowrap">{currentUser?.name}</span>
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("user_session");
                  setCurrentUser(null);
                  triggerHaptic("light");
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                title={t("auth_sign_out")}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <LanguageSwitcher compact />
              <button
                onClick={cycleThemeMode}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-[0.97]"
                title={
                  themeMode === "system"
                    ? (language === "kh" ? "ទម្រង់តាមប្រព័ន្ធ (ចុចដើម្បីប្តូរ)" : "Following System (Click to toggle)")
                    : themeMode === "light"
                    ? (language === "kh" ? "ទម្រង់ពន្លឺថ្ងៃ (ចុចដើម្បីប្តូរ)" : "Light Mode (Click to toggle)")
                    : (language === "kh" ? "ទម្រង់ពន្លឺយប់ (ចុចដើម្បីប្តូរ)" : "Night Mode (Click to toggle)")
                }
              >
                {themeMode === "system" ? (
                  <Monitor className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                ) : darkMode ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* MAIN CONTENT AREA                                                     */}
      {/* ===================================================================== */}
      <main className="relative flex-1 lg:h-screen overflow-y-auto p-3.5 sm:p-4 md:p-8 space-y-5 sm:space-y-6 pb-28 lg:pb-8">
        <SoundWaveHero />
        {/* Top Studio Command Bar (Somleng Clean Glassmorphism) */}
        <header className="sticky -top-4 md:-top-8 -mx-4 md:-mx-8 px-4 md:px-8 py-3.5 z-20 bg-background/80 backdrop-blur-md border-b border-border/60 flex items-center justify-between gap-3 sm:gap-4 transition-colors duration-200">
          {/* Left: Mobile Toggle & View Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 rounded-xl border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition active:scale-[0.95]"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 truncate">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:inline">
                Studio
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
                {activeTab === "dashboard" && t("nav_dashboard")}
                {activeTab === "converter" && t("nav_converter")}
                {activeTab === "inspector" && t("nav_inspector")}
                {activeTab === "history" && t("nav_history")}
                {activeTab === "ai" && t("nav_ai")}
                {activeTab === "settings" && t("nav_settings")}
                {activeTab === "admin" && t("nav_admin")}
              </h1>

              {/* Engine Status Dot */}
              <div className="hidden xl:flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>AWM2 Engine Online</span>
              </div>
            </div>
          </div>

          {/* Center: Command Palette Search Bar */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center justify-between w-56 lg:w-72 h-9 px-3.5 rounded-full bg-slate-100/70 dark:bg-card/70 hover:bg-slate-100 dark:hover:bg-card/90 border border-slate-200/70 dark:border-white/10 hover:border-brand-500/40 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition duration-150 active:scale-[0.98] shrink-0"
            title="Open Command Palette (Cmd+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs truncate">{t("hdr_commands")}</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-500 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Right: Unified Studio Tools Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="md:hidden h-9 w-9 rounded-full border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-card flex items-center justify-center transition active:scale-[0.97]"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* AI Studio Assistant (Desktop/Tablet) */}
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`hidden sm:flex h-9 px-3 sm:px-3.5 rounded-full text-xs font-medium items-center gap-1.5 transition active:scale-[0.97] ${
                activeTab === "ai"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/70 dark:border-brand-800/80"
              }`}
              title="AI Studio Assistant"
            >
              <Brain className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300" />
              <span className="hidden md:inline">{t("hdr_ai_assistant")}</span>
            </button>

            {/* Telegram Bot Connector / Simulator Pill (Desktop Only, Hide inside Telegram) */}
            {!isInTelegram && (
              <button
                type="button"
                onClick={() => setTelegramSimulatorOpen(true)}
                className="hidden lg:flex h-9 px-3 sm:px-3.5 rounded-full text-xs font-medium border items-center gap-1.5 transition active:scale-[0.97] bg-sky-50/80 hover:bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60"
                title="Telegram Mini App Connection"
              >
                <Send className="w-3 h-3 text-[#229ED9]" />
                <span className="truncate">@PPI_PPF_ConvertBot</span>
              </button>
            )}

            {/* Language Switcher (Compact KH/EN) */}
            <LanguageSwitcher compact />

            {/* Theme Toggle (System / Light / Dark) */}
            <button
              type="button"
              onClick={cycleThemeMode}
              className="h-9 w-9 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-card/50 hover:bg-slate-100 dark:hover:bg-card text-slate-600 dark:text-slate-300 flex items-center justify-center transition active:scale-[0.97]"
              title={
                themeMode === "system"
                  ? (language === "kh" ? "ទម្រង់តាមប្រព័ន្ធ (ចុចដើម្បីប្តូរ)" : "Following System (Click to toggle)")
                  : themeMode === "light"
                  ? (language === "kh" ? "ទម្រង់ពន្លឺថ្ងៃ (ចុចដើម្បីប្តូរ)" : "Light Mode (Click to toggle)")
                  : (language === "kh" ? "ទម្រង់ពន្លឺយប់ (ចុចដើម្បីប្តូរ)" : "Night Mode (Click to toggle)")
              }
            >
              {themeMode === "system" ? (
                <Monitor className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              ) : darkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* User Account Avatar & Discrete Sign Out */}
            {currentUser && (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="h-9 px-2 sm:px-3 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-card/50 hover:bg-slate-100 dark:hover:bg-card flex items-center gap-2 transition active:scale-[0.97]"
                  title={`${currentUser.name} (${currentUser.role})`}
                >
                  <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="user" className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[80px] sm:max-w-[100px] hidden sm:inline">
                    {currentUser.name}
                  </span>
                  {currentUser.role === "ADMIN" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20" title="Admin" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("user_session");
                    setCurrentUser(null);
                    triggerHaptic("light");
                  }}
                  className="h-9 w-9 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 flex items-center justify-center transition active:scale-[0.97]"
                  title={t("auth_sign_out")}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* =================================================================== */}
        {/* TAB 1: DASHBOARD                                                    */}
        {/* =================================================================== */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Hero Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white p-4.5 sm:p-6 md:p-8 shadow-xl border border-indigo-900/40">
              <div className="relative z-10 max-w-5xl space-y-3 sm:space-y-4">
                <Badge className="bg-white/10 text-brand-300 hover:bg-white/15 border-none backdrop-blur text-[10px] sm:text-xs">
                  {t("dash_hero_tag")}
                </Badge>
                <h3 className="text-base sm:text-2xl md:text-3xl font-extrabold tracking-tight truncate leading-tight">
                  {t("dash_hero_title")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-none leading-relaxed">
                  {t("dash_hero_desc")}
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    onClick={() => setActiveTab("converter")}
                    size="sm"
                    className="gap-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-full shadow-lg shadow-brand-600/30 text-xs sm:text-sm"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span className="truncate">{t("dash_btn_upload")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab("converter");
                      document.getElementById("file-upload-input")?.click();
                    }}
                    className="gap-2 bg-white/10 hover:bg-white/15 border-white/20 text-white rounded-full text-xs sm:text-sm"
                  >
                    <FolderSearch className="w-4 h-4" />
                    <span className="truncate">{t("dash_btn_browse")}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* 4 Metric KPI Cards (2x2 on Mobile / 4 on Desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <Card className="p-3 sm:p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {t("stat_total_uploaded")}
                  </span>
                  <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                </div>
                <div className="text-xl sm:text-2xl font-black mt-1">{stats.uploaded}</div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5">{t("stat_uploaded_sub")}</p>
              </Card>

              <Card className="p-3 sm:p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {t("stat_total_converted")}
                  </span>
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-500 shrink-0" />
                </div>
                <div className="text-xl sm:text-2xl font-black mt-1">{stats.converted}</div>
                <p className="text-[10px] sm:text-[11px] text-brand-500 truncate mt-0.5">{t("stat_converted_sub")}</p>
              </Card>

              <Card className="p-3 sm:p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {t("stat_successful")}
                  </span>
                  <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.success}
                </div>
                <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 truncate mt-0.5">{t("stat_successful_sub")}</p>
              </Card>

              <Card className="p-3 sm:p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    {t("stat_failed")}
                  </span>
                  <AlertOctagon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.failed}</div>
                <p className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 truncate mt-0.5">{t("stat_failed_sub")}</p>
              </Card>
            </div>

            {/* Gemini AI Sound Assistant Banner */}
            <Card className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-brand-200/60 dark:border-brand-900/60 bg-gradient-to-r from-brand-900/10 via-purple-900/10 to-indigo-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">AI Sound Architecture</h4>
                    <Badge variant="default" className="text-[9px] sm:text-[10px] bg-brand-600 shrink-0">Gemini 2.5</Badge>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5">
                    Analyze AWM2 voice filters, envelope curves, and legacy down-conversion.
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={() => setActiveTab("ai")} className="gap-2 shrink-0 h-8 sm:h-9 text-xs rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="truncate">Launch AI</span>
              </Button>
            </Card>

            {/* Real-time Web Audio Synthesizer & Voice Player */}
            <YamahaVoicePlayer
              packVoices={queue.length > 0 ? ["Concert Grand", "Warm Strings", "Synth Brass", "Oriental Oud"] : []}
            />

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
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{t("queue_title")}</h3>
                <p className="text-xs text-slate-500">{t("queue_subtitle")}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={handleConvertAll}
                  disabled={!queue.some((q) => q.status === "PENDING")}
                  size="sm"
                  className="gap-2 shadow-md"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{t("queue_btn_convert_all")}</span>
                </Button>
                <Button
                  variant="emerald"
                  size="sm"
                  onClick={handleDownloadAllZip}
                  disabled={!queue.some((q) => q.status === "SUCCESS")}
                  className="gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("queue_btn_download_all")}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQueue([])}
                  disabled={queue.length === 0}
                  className="gap-1.5 text-slate-600 dark:text-slate-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t("queue_btn_clear")}</span>
                </Button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone (Somleng Clean Glassmorphic Style) */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload-input")?.click()}
              className="border-2 border-dashed border-border/80 hover:border-brand-500/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 text-center bg-card/60 hover:bg-card/90 backdrop-blur-md transition-all cursor-pointer group shadow-xs hover:shadow-lg"
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                accept=".ppi,.cpi"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h4 className="font-bold text-sm sm:text-base text-foreground truncate mb-1">
                {t("queue_dropzone_title")}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto truncate mb-3">
                {t("queue_dropzone_desc")}
              </p>
              <Button size="sm" variant="secondary" className="gap-2 pointer-events-none rounded-full h-8 sm:h-9 text-xs">
                <FolderSearch className="w-3.5 h-3.5" />
                <span className="truncate">{t("queue_dropzone_btn")}</span>
              </Button>
            </div>

            {/* Queue Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{language === "kh" ? `ឯកសារក្នុងជួរ (${queue.length})` : `Files in Queue (${queue.length})`}</span>
                <BaseSwitch
                  checked={strictDRMMode}
                  onCheckedChange={setStrictDRMMode}
                  label={t("queue_drm_toggle")}
                  className="text-xs"
                />
              </div>

              {queue.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-border/80 bg-card/40 backdrop-blur-sm space-y-4">
                  <FileMusic className="w-12 h-12 mx-auto text-slate-400" />
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{t("queue_empty_title")}</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {t("queue_empty_desc")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <Button
                      size="sm"
                      onClick={() => document.getElementById("file-upload-input")?.click()}
                      className="gap-2 shadow-sm rounded-full"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{t("queue_dropzone_btn")}</span>
                    </Button>
                  </div>
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
                      <Card className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-border/80 bg-card/80 backdrop-blur-sm shadow-xs hover:shadow-md transition-all space-y-3">
                        {/* Main Item Row (Single-line clean presentation) */}
                        <div className="flex items-center justify-between gap-3">
                          {/* File Icon & 1-Line Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                                item.status === "SUCCESS"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                                  : item.parsedData.isProtected
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20"
                                  : item.status === "CONVERTING"
                                  ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20"
                                  : "bg-muted text-foreground ring-1 ring-border"
                              }`}
                            >
                              {item.status === "SUCCESS" ? (
                                <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              ) : item.status === "CONVERTING" ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                              ) : item.parsedData.isProtected ? (
                                <Lock className="w-5 h-5" />
                              ) : (
                                <FileMusic className="w-5 h-5" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              {/* Line 1: Single-line File Name */}
                              <div className="flex items-center gap-2 min-w-0">
                                <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                                  {item.status === "SUCCESS" && item.output
                                    ? item.output.filename
                                    : item.name}
                                </h4>
                                {item.parsedData.isProtected && (
                                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0 shrink-0">
                                    CPI
                                  </Badge>
                                )}
                              </div>

                              {/* Line 2: Single-line Metadata */}
                              <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                                <span>{formatBytes(item.status === "SUCCESS" && item.output ? item.output.blob.size : item.size)}</span>
                                <span className="mx-1.5 opacity-40">•</span>
                                <span className="truncate">{item.parsedData.packName || "Yamaha Pack"}</span>
                                {item.parsedData.voicesCount > 0 && (
                                  <>
                                    <span className="mx-1.5 opacity-40">•</span>
                                    <span>{item.parsedData.voicesCount} {language === "kh" ? "សំឡេង" : "voices"}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Right Controls & Badges */}
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Pending State: Format Selector & Convert Button */}
                            {item.status === "PENDING" && (
                              <>
                                <div className="flex rounded-full bg-muted p-0.5 text-xs font-semibold ring-1 ring-border/50">
                                  <button
                                    onClick={() =>
                                      setQueue((prev) =>
                                        prev.map((q) =>
                                          q.id === item.id ? { ...q, targetFormat: "PPF" } : q
                                        )
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-full transition text-[11px] font-medium ${
                                      item.targetFormat === "PPF"
                                        ? "bg-background text-brand-600 dark:text-brand-300 shadow-2xs"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    PPF
                                  </button>
                                  <button
                                    onClick={() =>
                                      setQueue((prev) =>
                                        prev.map((q) =>
                                          q.id === item.id ? { ...q, targetFormat: "YEP" } : q
                                        )
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-full transition text-[11px] font-medium ${
                                      item.targetFormat === "YEP"
                                        ? "bg-background text-brand-600 dark:text-brand-300 shadow-2xs"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                  >
                                    YEP
                                  </button>
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => handleConvertItem(item.id)}
                                  className="h-8 px-3 rounded-full text-xs gap-1.5 shadow-xs"
                                >
                                  <Play className="w-3 h-3" />
                                  <span className="hidden sm:inline">{t("btn_convert")}</span>
                                </Button>
                              </>
                            )}

                            {/* Converting State: Cancel */}
                            {item.status === "CONVERTING" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelItem(item.id)}
                                className="h-8 px-2.5 rounded-full text-xs gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{t("btn_cancel")}</span>
                              </Button>
                            )}

                            {/* Success State: Clean Pill Badge + Action Buttons (Exact Image 1 Style) */}
                            {item.status === "SUCCESS" && (
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Badge
                                  variant="outline"
                                  className="px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 font-mono tracking-wide"
                                >
                                  {item.targetFormat}
                                </Badge>

                                {item.output && (
                                  <>
                                    <a href={item.output.downloadUrl} download={item.output.filename}>
                                      <Button
                                        size="sm"
                                        variant="emerald"
                                        className="h-8 px-2.5 sm:px-3 rounded-xl text-xs gap-1 shadow-2xs"
                                        title={t("btn_download")}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span className="hidden md:inline">{t("btn_download")}</span>
                                      </Button>
                                    </a>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleOpenTelegramSend(
                                          item.output?.blob || null,
                                          item.output?.filename || `${item.name}.ppf`
                                        )
                                      }
                                      className="h-8 px-2.5 sm:px-3 rounded-xl text-xs gap-1 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/10"
                                      title={language === "kh" ? "ផ្ញើទៅ Telegram" : "Send to Telegram"}
                                    >
                                      <Send className="w-3.5 h-3.5 text-sky-500" />
                                      <span className="hidden md:inline">Telegram</span>
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Failed State: Retry */}
                            {item.status === "FAILED" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleConvertItem(item.id)}
                                className="h-8 px-2.5 rounded-full text-xs gap-1"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{t("btn_retry")}</span>
                              </Button>
                            )}

                            {/* Cancelled State: Restart */}
                            {item.status === "CANCELLED" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleConvertItem(item.id)}
                                className="h-8 px-2.5 rounded-full text-xs gap-1"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{t("btn_convert")}</span>
                              </Button>
                            )}

                            {/* Inspect Icon Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setInspectorFileId(item.id);
                                setActiveTab("inspector");
                              }}
                              title={t("nav_inspector")}
                            >
                              <Binary className="w-3.5 h-3.5" />
                            </Button>

                            {/* Remove Icon Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-rose-500"
                              onClick={() => setQueue((prev) => prev.filter((q) => q.id !== item.id))}
                              title={t("queue_btn_clear")}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Progress Bar & Stage Indicator (when converting) */}
                        {item.status === "CONVERTING" && (
                          <div className="space-y-1.5 pt-1 border-t border-border/50">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5 truncate">
                                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping shrink-0" />
                                <span className="truncate">{item.stage}</span>
                              </span>
                              <span className="font-mono font-semibold tabular-nums ml-2 shrink-0">{item.progress}%</span>
                            </div>
                            <Progress
                              value={item.progress}
                              indicatorColor="bg-brand-600"
                              className="h-1.5 rounded-full"
                            />
                          </div>
                        )}
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
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{t("insp_title")}</h3>
                <p className="text-xs text-slate-500">{t("insp_subtitle")}</p>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t("insp_inspecting")}</span>
                <select
                  value={activeInspectorItem?.id || ""}
                  onChange={(e) => setInspectorFileId(e.target.value)}
                  className="text-xs px-4 py-1.5 rounded-full bg-card/60 border border-border/80 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
                >
                  {queue.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.name} ({formatBytes(q.size)})
                    </option>
                  ))}
                  {queue.length === 0 && <option value="">{t("insp_no_file")}</option>}
                </select>
              </div>
            </div>

            {activeInspectorItem ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Metadata Specs */}
                <div className="space-y-4">
                  <Card className="p-4 space-y-3">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      {t("insp_header_card")}
                    </CardTitle>
                    <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{t("insp_signature")}</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.signature}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{t("insp_version")}</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.formatVersion}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{t("insp_pack_name")}</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {activeInspectorItem.parsedData.packName}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{t("insp_target_model")}</span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          {activeInspectorItem.parsedData.targetHardware}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{t("insp_drm_status")}</span>
                        {activeInspectorItem.parsedData.isProtected ? (
                          <Badge variant="destructive" className="text-[10px]">
                            CPI Protected
                          </Badge>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Open / Unencrypted
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{t("insp_voices_count")}</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.voicesCount}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{t("insp_styles_count")}</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.stylesCount}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{t("insp_waves_count")}</span>
                        <span className="font-mono font-semibold">{activeInspectorItem.parsedData.waveCount}</span>
                      </div>
                    </div>
                  </Card>

                  {/* Chunks List */}
                  <Card className="p-4 space-y-2">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                      {t("insp_chunks_card")}
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
                      <span className="font-bold text-slate-700 dark:text-slate-300">{t("insp_hex_card")}</span>
                      <span className="font-mono text-slate-500">512 Bytes</span>
                    </div>
                    <div className="p-3">
                      <HexViewer buffer={activeInspectorItem.buffer} maxBytes={512} />
                    </div>
                  </Card>

                  <Card className="overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{t("insp_xml_card")}</span>
                      <Badge variant="outline" className="text-[10px]">
                        PPF ZIP Schema
                      </Badge>
                    </div>
                    <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs max-h-56 overflow-y-auto">
                      <pre>
                        {activeInspectorItem.output?.xml ||
                          YamahaPPFGenerator.generatePackXml(activeInspectorItem.parsedData, activeInspectorItem.parsedData.voiceNames ?? Array.from({ length: activeInspectorItem.parsedData.voicesCount }, (_, i) => `Voice ${i + 1}`), activeInspectorItem.parsedData.signature === "XPIH")}
                      </pre>
                    </div>
                  </Card>
                </div>

                {/* Embedded Web Audio Voice Player with Detected Pack Voices */}
                <div className="lg:col-span-3 pt-2">
                  <YamahaVoicePlayer
                    packVoices={
                      activeInspectorItem.parsedData.voicesCount > 0
                        ? ["Concert Grand (AWM2)", "Warm Symphonic Strings", "DX7 FM Lead", "Oriental Solo Oud"]
                        : []
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="p-16 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 space-y-4">
                <Binary className="w-12 h-12 mx-auto text-slate-400" />
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{t("insp_no_file")}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    {t("insp_subtitle")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setActiveTab("converter");
                      document.getElementById("file-upload-input")?.click();
                    }}
                    className="gap-2 shadow-md"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{t("queue_dropzone_btn")}</span>
                  </Button>
                </div>
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
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{t("hist_title")}</h3>
                <p className="text-xs text-slate-500">{t("hist_subtitle")}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{t("hist_export_csv")}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistory([])}
                  disabled={history.length === 0}
                  className="gap-2 text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t("hist_clear_all")}</span>
                </Button>
              </div>
            </div>

            {/* User Session Scope Selector */}
            {currentUser && (
              <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {currentUser.role}
                  </Badge>
                  <span className="text-slate-600 dark:text-slate-400">
                    {language === "kh" ? "បង្ហាញការបំលែងសម្រាប់ " : "Showing conversions for "}
                    <strong className="text-slate-900 dark:text-white">{currentUser.name}</strong>
                  </span>
                </div>

                {currentUser.role === "ADMIN" && (
                  <div className="flex rounded-full bg-slate-100 dark:bg-white/10 p-1 text-xs font-medium ring-1 ring-border/50">
                    <button
                      onClick={() => setHistoryScope("personal")}
                      className={`px-3 py-1 rounded-full transition text-xs font-medium ${
                        historyScope === "personal"
                          ? "bg-white dark:bg-[#1c1c1f] text-brand-600 dark:text-brand-300 shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-foreground"
                      }`}
                    >
                      {t("hist_scope_my")}
                    </button>
                    <button
                      onClick={() => setHistoryScope("all")}
                      className={`px-3 py-1 rounded-full transition text-xs font-medium ${
                        historyScope === "all"
                          ? "bg-white dark:bg-[#1c1c1f] text-purple-600 dark:text-purple-300 shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-foreground"
                      }`}
                    >
                      {t("hist_scope_all")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Filter Controls (Somleng Pill Design) */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder={t("hist_search_placeholder")}
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="flex-1 px-4 py-2 rounded-full bg-card/60 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-full bg-card/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
              >
                <option value="ALL">{t("hist_filter_all")}</option>
                <option value="SUCCESS">{t("hist_filter_success")}</option>
                <option value="FAILED">{t("hist_filter_failed")}</option>
                <option value="CANCELLED">{t("btn_cancel")}</option>
              </select>
            </div>

            {/* History Table & Mobile Cards */}
            <div className="space-y-3">
              {/* Desktop Table View */}
              <Card className="hidden md:block overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/60 font-semibold text-muted-foreground uppercase text-[10px]">
                        <th className="py-3 px-4">{t("hist_col_name")}</th>
                        <th className="py-3 px-4">{t("hist_col_size")}</th>
                        <th className="py-3 px-4">{t("hist_col_type")}</th>
                        <th className="py-3 px-4">{t("hist_col_status")}</th>
                        <th className="py-3 px-4">{t("hist_col_date")}</th>
                        <th className="py-3 px-4 text-right">{t("hist_col_action")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {history
                        .filter((h) => {
                          const matchesSearch = h.name.toLowerCase().includes(historySearch.toLowerCase());
                          const matchesFilter = historyStatusFilter === "ALL" || h.status === historyStatusFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map((h) => (
                          <tr key={h.id} className="hover:bg-muted/40 transition">
                            <td className="py-3 px-4 font-medium flex items-center gap-2 max-w-xs truncate">
                              <FileMusic className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="truncate">{h.name}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">{formatBytes(h.size)}</td>
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
                                className="text-[10px] rounded-full"
                              >
                                {h.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-[11px]">
                              {h.date.toLocaleDateString()} {h.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {h.output ? (
                                <div className="flex items-center justify-end gap-1">
                                  <a href={h.output.downloadUrl} download={h.output.filename}>
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-brand-600 hover:text-brand-500">
                                      <Download className="w-3.5 h-3.5 mr-1" />
                                      <span>{t("btn_download")}</span>
                                    </Button>
                                  </a>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenTelegramSend(null, h.output?.filename || h.name)}
                                    className="h-7 px-2 text-sky-600 hover:text-sky-500 hover:bg-sky-500/10"
                                    title={language === "kh" ? "ផ្ញើទៅ Telegram" : "Send to Telegram"}
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}

                      {history.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-muted-foreground">
                            <p className="text-sm font-medium">
                              {language === "kh" ? "មិនទាន់មានកំណត់ត្រាប្រវត្តិការបំលែងនៅឡើយទេ។" : "No conversion history records found."}
                            </p>
                            <div className="pt-3">
                              <Button size="sm" onClick={() => setActiveTab("converter")} className="gap-2 shadow-sm rounded-full">
                                <Play className="w-3.5 h-3.5" />
                                <span>{t("queue_title")}</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Mobile Card List View (Clean Single-Line Presentation for Telegram Mini App) */}
              <div className="block md:hidden space-y-2.5">
                {history
                  .filter((h) => {
                    const matchesSearch = h.name.toLowerCase().includes(historySearch.toLowerCase());
                    const matchesFilter = historyStatusFilter === "ALL" || h.status === historyStatusFilter;
                    return matchesSearch && matchesFilter;
                  })
                  .map((h) => (
                    <Card
                      key={h.id}
                      className="p-3.5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              h.status === "SUCCESS"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20"
                            }`}
                          >
                            {h.status === "SUCCESS" ? (
                              <FileCheck className="w-5 h-5" />
                            ) : (
                              <AlertOctagon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {/* Line 1: Filename */}
                            <h4 className="font-bold text-xs text-foreground truncate">{h.name}</h4>
                            {/* Line 2: Size • Type • Date */}
                            <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                              <span>{formatBytes(h.size)}</span>
                              <span className="mx-1 opacity-40">•</span>
                              <span className="text-brand-600 dark:text-brand-400 font-semibold">{h.type}</span>
                              <span className="mx-1 opacity-40">•</span>
                              <span>{h.date.toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Badge
                            variant={h.status === "SUCCESS" ? "outline" : "destructive"}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                              h.status === "SUCCESS"
                                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                : ""
                            }`}
                          >
                            {h.status}
                          </Badge>
                          {h.output && (
                            <>
                              <a href={h.output.downloadUrl} download={h.output.filename}>
                                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-brand-600">
                                  <Download className="w-3.5 h-3.5" />
                                </Button>
                              </a>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenTelegramSend(null, h.output?.filename || h.name)}
                                className="h-7 w-7 rounded-lg text-sky-600 hover:text-sky-500"
                                title="Send to Telegram"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                {history.length === 0 && (
                  <div className="p-8 text-center rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-2">
                    <History className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground">
                      {language === "kh" ? "មិនទាន់មានកំណត់ត្រាប្រវត្តិនៅឡើយទេ។" : "No conversion history records found."}
                    </p>
                    <div className="pt-1">
                      <Button size="sm" onClick={() => setActiveTab("converter")} className="gap-2 rounded-full text-xs">
                        <Play className="w-3.5 h-3.5" />
                        <span>{t("queue_title")}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: AI STUDIO ASSISTANT (GEMINI)                                 */}
        {/* =================================================================== */}
        {activeTab === "ai" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <AIAssistantPanel activePack={activeInspectorItem} />
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* TAB 6: USER SETTINGS & GEMINI API KEY                               */}
        {/* =================================================================== */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <SettingsPanel
              currentUser={currentUser}
              onOpenAuth={() => setAuthModalOpen(true)}
              onUpdateUserRole={(newRole) => {
                if (currentUser) {
                  const updated: UserSession = { ...currentUser, role: newRole };
                  setCurrentUser(updated);
                  localStorage.setItem("user_session", JSON.stringify(updated));
                }
              }}
              darkMode={darkMode}
              themeMode={themeMode}
              onToggleDarkMode={cycleThemeMode}
              onSelectThemeMode={setThemeExplicitly}
              enableToneVisualizer={enableToneVisualizer}
              onToggleToneVisualizer={setEnableToneVisualizer}
              strictDRMMode={strictDRMMode}
              onToggleStrictDRM={setStrictDRMMode}
            />
          </motion.div>
        )}

        {/* =================================================================== */}
        {/* TAB 8: ADMIN MANAGEMENT CONSOLE                                     */}
        {/* =================================================================== */}
        {activeTab === "admin" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <AdminPanel currentUser={currentUser} onNavigateTab={setActiveTab} />
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
            <DialogTitle className="text-base font-bold">{t("drm_modal_title")}</DialogTitle>
            <DialogDescription className="text-xs">
              {t("drm_modal_desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">Copyright Rule Enforced:</p>
            <p>{t("drm_modal_rule")}</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setDrmModalOpen(false)}>
              {t("drm_modal_btn")}
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

      {/* ===================================================================== */}
      {/* MODAL: PRO COMMAND PALETTE (CMD+K / CTRL+K)                           */}
      {/* ===================================================================== */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          triggerHaptic("light");
        }}
        onConvertAll={handleConvertAll}
        onToggleTheme={cycleThemeMode}
        onSelectThemeMode={setThemeExplicitly}
        onOpenTelegramSimulator={() => setTelegramSimulatorOpen(true)}
        darkMode={darkMode}
        themeMode={themeMode}
      />

      {/* ===================================================================== */}
      {/* MODAL: TELEGRAM MINI APP SIMULATOR                                    */}
      {/* ===================================================================== */}
      <TelegramSimulatorModal
        isOpen={telegramSimulatorOpen}
        onClose={() => setTelegramSimulatorOpen(false)}
      />

      {/* ===================================================================== */}
      {/* MODAL: SEND CONVERTED FILE TO TELEGRAM                                */}
      {/* ===================================================================== */}
      <SendToTelegramModal
        isOpen={telegramSendModalOpen}
        onClose={() => setTelegramSendModalOpen(false)}
        fileBlob={telegramSendTarget?.blob}
        filename={telegramSendTarget?.filename}
        defaultChatId={tgUser?.id || (currentUser?.provider === "TELEGRAM" ? currentUser.username || currentUser.id : undefined)}
      />

      {/* ===================================================================== */}
      {/* FLOATING DRAGGABLE AI ASSISTANT WIDGET (BOTTOM RIGHT)                 */}
      {/* ===================================================================== */}
      <FloatingAIAssistant
        activePack={activeInspectorItem}
        onNavigateFullTab={() => {
          setActiveTab("ai");
          triggerHaptic("light");
        }}
        currentTab={activeTab}
      />

      {/* ===================================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (FIXED FOR PWA & MOBILE RESPONSIVENESS) */}
      {/* ===================================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-md border-t border-border shadow-lg pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] pt-1 px-1 text-foreground"
      >
        <div className="grid grid-cols-5 items-center">
          <button
            type="button"
            onClick={() => {
              setActiveTab("dashboard");
              triggerHaptic("light");
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
              activeTab === "dashboard"
                ? "text-brand-600 dark:text-brand-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === "dashboard" ? "bg-brand-500/10" : ""}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight truncate whitespace-nowrap max-w-full mt-0.5">
              {t("nav_dashboard")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("converter");
              triggerHaptic("light");
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors relative ${
              activeTab === "converter"
                ? "text-brand-600 dark:text-brand-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-lg relative ${activeTab === "converter" ? "bg-brand-500/10" : ""}`}>
              <Repeat className="w-5 h-5" />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight truncate whitespace-nowrap max-w-full mt-0.5">
              {t("nav_converter")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("inspector");
              triggerHaptic("light");
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
              activeTab === "inspector"
                ? "text-brand-600 dark:text-brand-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === "inspector" ? "bg-brand-500/10" : ""}`}>
              <Binary className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight truncate whitespace-nowrap max-w-full mt-0.5">
              {t("nav_inspector")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              triggerHaptic("light");
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
              activeTab === "history"
                ? "text-brand-600 dark:text-brand-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === "history" ? "bg-brand-500/10" : ""}`}>
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight truncate whitespace-nowrap max-w-full mt-0.5">
              {t("nav_history")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("ai");
              triggerHaptic("light");
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors ${
              activeTab === "ai"
                ? "text-brand-600 dark:text-brand-400 font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === "ai" ? "bg-brand-500/10" : ""}`}>
              <Brain className="w-5 h-5 text-brand-500" />
            </div>
            <span className="text-[10px] leading-tight truncate whitespace-nowrap max-w-full mt-0.5">
              {t("nav_ai")}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
