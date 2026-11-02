"use client";

import React, { useState } from "react";
import {
  Send,
  Smartphone,
  CheckCircle2,
  MessageSquare,
  Share2,
  X,
  Zap,
  Music,
  ArrowRight,
  ShieldCheck,
  Download,
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
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "Welcome to Yamaha Expansion Voice Bot! Send any .ppi pack or tap 'Launch Mini App' to convert to PPF / YEP.",
      time: "11:20 AM",
    },
  ]);
  const [simulatedFileConverted, setSimulatedFileConverted] = useState<boolean>(false);

  if (!isOpen) return null;

  const triggerSimulatedHaptic = (style: "light" | "medium" | "heavy") => {
    setLastHaptic(style);
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(style === "light" ? 15 : style === "medium" ? 30 : 60);
      } catch (_) {}
    }
  };

  const simulateSendFileToChat = () => {
    triggerSimulatedHaptic("heavy");
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setChatMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: "Sent: Traditional_Arabic_Strings.ppi (4.8 MB)",
        time: now,
      },
      {
        sender: "bot",
        text: "Conversion complete! Generated Traditional_Arabic_Strings.ppf (4.2 MB) containing 6 AWM2 Voices & 2 Styles. Download link valid for 24h.",
        time: now,
      },
    ]);
    setSimulatedFileConverted(true);
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
                <span>Telegram Mini App & Bot Simulator</span>
                <Badge variant="secondary" className="text-[10px] font-mono text-sky-600 bg-sky-50">
                  TMA READY
                </Badge>
              </h3>
              <p className="text-xs text-slate-500">
                Experience the mobile keyboardist workflow inside Telegram Messenger.
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

        {/* Simulator Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-900/30">
          {/* Left Column: Simulated Phone Frame */}
          <div className="flex justify-center">
            <div className="w-[280px] h-[460px] bg-slate-900 rounded-[36px] border-4 border-slate-700 shadow-2xl p-2.5 flex flex-col relative overflow-hidden">
              {/* Phone Speaker Notch */}
              <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-2 shrink-0"></div>

              {/* Telegram App Header Bar */}
              <div className="bg-[#17212b] text-white px-3 py-2 rounded-t-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center font-bold text-[10px]">
                    <Send className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-[11px] leading-tight">PPI_PPF_ConvertBot</p>
                    <p className="text-[9px] text-sky-300">@PPI_PPF_ConvertBot</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Close</span>
              </div>

              {/* Chat Viewport */}
              <div className="flex-1 bg-[#0e1621] p-2.5 overflow-y-auto space-y-2 text-[11px] font-sans">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-2 rounded-xl ${
                        msg.sender === "user"
                          ? "bg-sky-600 text-white rounded-br-none"
                          : "bg-[#182533] text-slate-200 rounded-bl-none border border-slate-700/50"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className="text-[8px] text-slate-400 block text-right mt-1">
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Simulated Telegram MainButton */}
              <div className="pt-2 bg-[#17212b] -mx-2.5 -mb-2.5 p-2 rounded-b-[28px]">
                <button
                  onClick={simulateSendFileToChat}
                  className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Convert & Send to Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Mini App Tech Controls & Telemetry */}
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-brand-600" />
                <span>Telegram WebApp Integration</span>
              </span>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                When musicians launch ExpVoice inside Telegram, the system automatically binds to their Telegram user ID, syncs theme colors with Telegram's palette, and uses native device haptics.
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

            {/* Quick Actions */}
            <div className="space-y-2">
              <a
                href="https://t.me/PPI_PPF_ConvertBot"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 rounded-xl bg-[#229ED9] hover:bg-[#1E8BC0] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open @PPI_PPF_ConvertBot in Telegram</span>
              </a>
              <Button
                onClick={() => {
                  simulateSendFileToChat();
                }}
                variant="outline"
                className="w-full text-xs font-semibold gap-2 border-slate-300 dark:border-slate-700"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Simulate Telegram Upload & Conversion</span>
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
