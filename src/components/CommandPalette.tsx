"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  LayoutDashboard,
  Repeat,
  Binary,
  History,
  Brain,
  ShieldCheck,
  Sliders,
  Cpu,
  Sparkles,
  ShieldAlert,
  Moon,
  Sun,
  Download,
  FileSpreadsheet,
  X,
  CornerDownLeft,
  Music,
  Send,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Actions" | "System";
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onLoadSample: (isProtected: boolean) => void;
  onConvertAll: () => void;
  onToggleTheme: () => void;
  onOpenTelegramSimulator: () => void;
  darkMode: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onLoadSample,
  onConvertAll,
  onToggleTheme,
  onOpenTelegramSimulator,
  darkMode,
}) => {
  const [query, setQuery] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Go to Dashboard Overview",
      category: "Navigation",
      icon: <LayoutDashboard className="w-4 h-4 text-brand-500" />,
      action: () => {
        onNavigate("dashboard");
        onClose();
      },
    },
    {
      id: "nav-converter",
      title: "Go to File Converter Queue",
      category: "Navigation",
      icon: <Repeat className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onNavigate("converter");
        onClose();
      },
    },
    {
      id: "nav-inspector",
      title: "Go to File & Hex Inspector",
      category: "Navigation",
      icon: <Binary className="w-4 h-4 text-sky-500" />,
      action: () => {
        onNavigate("inspector");
        onClose();
      },
    },
    {
      id: "nav-history",
      title: "Go to Conversion History Archive",
      category: "Navigation",
      icon: <History className="w-4 h-4 text-amber-500" />,
      action: () => {
        onNavigate("history");
        onClose();
      },
    },
    {
      id: "nav-ai",
      title: "Go to Gemini AI Sound Design Studio",
      category: "Navigation",
      icon: <Brain className="w-4 h-4 text-brand-600" />,
      action: () => {
        onNavigate("ai");
        onClose();
      },
    },
    {
      id: "nav-settings",
      title: "Go to Settings & API Key Manager",
      category: "Navigation",
      icon: <Sliders className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onNavigate("settings");
        onClose();
      },
    },
    {
      id: "nav-admin",
      title: "Go to Admin Management Console",
      category: "Navigation",
      icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
      action: () => {
        onNavigate("admin");
        onClose();
      },
    },
    {
      id: "nav-arch",
      title: "Go to Architecture & Tech Specs",
      category: "Navigation",
      icon: <Cpu className="w-4 h-4 text-slate-500" />,
      action: () => {
        onNavigate("architecture");
        onClose();
      },
    },

    // Quick Actions
    {
      id: "act-load-sample",
      title: "Load Sample PPI Pack (Demo Voice Archive)",
      category: "Quick Actions",
      icon: <Sparkles className="w-4 h-4 text-brand-500" />,
      shortcut: "Alt+S",
      action: () => {
        onLoadSample(false);
        onClose();
      },
    },
    {
      id: "act-load-cpi",
      title: "Test Encrypted CPI Package (DRM Rejection)",
      category: "Quick Actions",
      icon: <ShieldAlert className="w-4 h-4 text-amber-500" />,
      action: () => {
        onLoadSample(true);
        onClose();
      },
    },
    {
      id: "act-convert-all",
      title: "Convert All Pending Queue Files",
      category: "Quick Actions",
      icon: <Repeat className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onConvertAll();
        onClose();
      },
    },
    {
      id: "act-tg-simulator",
      title: "Open Telegram Mini App Simulator",
      category: "Quick Actions",
      icon: <Send className="w-4 h-4 text-sky-500" />,
      action: () => {
        onOpenTelegramSimulator();
        onClose();
      },
    },

    // System
    {
      id: "sys-theme",
      title: darkMode ? "Switch to Light Mode" : "Switch to Night / Dark Mode",
      category: "System",
      icon: darkMode ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      ),
      shortcut: "Alt+T",
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Reset index on search change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="glass-card w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search views (e.g. converter, audio, admin)..."
            className="w-full text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[320px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              No commands found matching "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">{cmd.icon}</div>
                    <span>{cmd.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-brand-500" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-mono">Yamaha ExpVoice v2.4</span>
        </div>
      </div>
    </div>
  );
};
