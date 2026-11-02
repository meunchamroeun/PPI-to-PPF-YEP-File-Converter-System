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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-in">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Telegram Bot & Mini App</span>
                <Badge variant="secondary" className="text-[10px] font-mono text-sky-600 bg-sky-50">
                  ONLINE
                </Badge>
              </h3>
              <p className="text-xs text-slate-500">
                Official Telegram Bot connection for Yamaha ExpVoice Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-900/30">
          {/* Left Column: Official Bot Profile Card */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    PPI To PPF Converter
                  </h4>
                  <a
                    href="https://t.me/PPI_PPF_ConvertBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-sky-600 hover:text-sky-500 flex items-center gap-1"
                  >
                    <span>@PPI_PPF_ConvertBot</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Bot Info List */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Webhook Status</span>
                  <Badge variant="default" className="text-[9px] bg-emerald-600 text-white">
                    CONNECTED
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Menu Button</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Launch Studio</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Database</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Neon PostgreSQL</span>
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
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                <Terminal className="w-3.5 h-3.5 text-brand-600" />
                <span>Supported Bot Commands</span>
              </span>
              <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                <p><span className="text-sky-600 font-semibold">/start</span> - Launch Mini App & Welcome</p>
                <p><span className="text-sky-600 font-semibold">/app</span> - Open Web Studio inside Telegram</p>
                <p><span className="text-sky-600 font-semibold">/convert</span> - File conversion instructions</p>
                <p><span className="text-sky-600 font-semibold">/status</span> - Conversion engine status</p>
              </div>
            </div>
          </div>

          {/* Right Column: WebApp Features & Haptics */}
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <span>Telegram Mini App Features</span>
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                When musicians open ExpVoice inside Telegram, the system automatically binds to their Telegram user ID, syncs theme colors with Telegram's palette, and enables native device haptics.
              </p>
            </div>

            {/* Haptic Feedback Tester */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
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
