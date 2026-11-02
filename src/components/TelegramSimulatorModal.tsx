"use client";

import React, { useState } from "react";
import {
  Send,
  Smartphone,
  CheckCircle2,
  X,
  Zap,
  ShieldCheck,
  ExternalLink,
  Bot,
  Activity,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TelegramSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramSimulatorModal: React.FC<TelegramSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [lastHaptic, setLastHaptic] = useState<string>("None");

  if (!isOpen) return null;

  const triggerSimulatedHaptic = (style: "light" | "medium" | "heavy") => {
    setLastHaptic(style);
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(style === "light" ? 15 : style === "medium" ? 30 : 60);
      } catch (_) {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative max-w-2xl w-full rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-scale-in ring-1 ring-border/50 text-foreground"
        style={{ backgroundColor: "var(--card)" }}
      >
        {/* Modal Top Bar */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-border"
          style={{ backgroundColor: "var(--card)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-sky-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2 truncate">
                <span className="truncate">Telegram Bot &amp; Mini App</span>
                <Badge variant="secondary" className="text-[10px] font-mono text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border border-sky-500/20 shrink-0">
                  ONLINE
                </Badge>
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5">
                Official Telegram Bot connection for Yamaha ExpVoice Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
          style={{ backgroundColor: "var(--card)" }}
        >
          {/* Left Column: Official Bot Profile Card */}
          <div className="space-y-4">
            <div
              className="p-5 rounded-2xl border border-border space-y-4 shadow-xs"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    PPI To PPF Converter
                  </h4>
                  <a
                    href="https://t.me/PPI_PPF_ConvertBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>@PPI_PPF_ConvertBot</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Bot Info List */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/60">
                  <span className="text-muted-foreground">Webhook Status</span>
                  <Badge variant="default" className="text-[9px] bg-emerald-600 text-white">
                    CONNECTED
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/60">
                  <span className="text-muted-foreground">Menu Button</span>
                  <span className="font-semibold text-foreground">Launch Studio</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-muted/60">
                  <span className="text-muted-foreground">Database</span>
                  <span className="font-semibold text-foreground">Neon PostgreSQL</span>
                </div>
              </div>

              {/* Launch in Telegram Button */}
              <a
                href="https://t.me/PPI_PPF_ConvertBot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 rounded-xl bg-[#229ED9] hover:bg-[#1E8BC0] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.97]"
              >
                <Send className="w-4 h-4" />
                <span>Open in Telegram Messenger</span>
              </a>
            </div>

            {/* Bot Commands Quick Reference */}
            <div
              className="p-4 rounded-2xl border border-border space-y-2 shadow-xs"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <Terminal className="w-3.5 h-3.5 text-brand-600" />
                <span>Supported Bot Commands</span>
              </span>
              <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                <p><span className="text-sky-600 dark:text-sky-400 font-semibold">/start</span> - Launch Mini App & Welcome</p>
                <p><span className="text-sky-600 dark:text-sky-400 font-semibold">/app</span> - Open Web Studio inside Telegram</p>
                <p><span className="text-sky-600 dark:text-sky-400 font-semibold">/convert</span> - File conversion instructions</p>
                <p><span className="text-sky-600 dark:text-sky-400 font-semibold">/status</span> - Conversion engine status</p>
              </div>
            </div>
          </div>

          {/* Right Column: WebApp Features & Haptics */}
          <div className="space-y-4 text-xs">
            <div
              className="p-4 rounded-2xl border border-border space-y-2 shadow-xs"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <span>Telegram Mini App Features</span>
              </span>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                When musicians open ExpVoice inside Telegram, the system automatically binds to their Telegram user ID, syncs theme colors with Telegram's palette, and enables native device haptics.
              </p>
            </div>

            {/* Haptic Feedback Tester */}
            <div
              className="p-4 rounded-2xl border border-border space-y-2 shadow-xs"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Telegram Haptic Feedback
                </span>
                <span className="font-mono text-[10px] text-brand-600 font-bold">
                  {lastHaptic}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerSimulatedHaptic("light")}
                  className="h-8 text-[11px]"
                >
                  Light
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerSimulatedHaptic("medium")}
                  className="h-8 text-[11px]"
                >
                  Medium
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerSimulatedHaptic("heavy")}
                  className="h-8 text-[11px]"
                >
                  Heavy
                </Button>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
