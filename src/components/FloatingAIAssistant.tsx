"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Brain,
  Sparkles,
  Bot,
  RotateCcw,
  X,
  Maximize2,
  Send,
  Square,
  Copy,
  Check,
  Layers,
  Cpu,
  Lock,
  FileMusic,
  Sliders,
} from "lucide-react";
import { ParsedPPIData } from "@/lib/yamaha/ppi-parser";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface FloatingAIAssistantProps {
  activePack: {
    name: string;
    parsedData: ParsedPPIData;
  } | null;
  onNavigateFullTab?: () => void;
  currentTab?: string;
}

// Inline Markdown-like formatter (bold, code)
function formatInlineText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-muted text-brand-600 dark:text-brand-300 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MiniFormattedContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const text = line.trim().replace(/^[-*]\s+/, "");
      blocks.push(
        <div key={`li-${i}`} className="flex items-start gap-1.5 my-0.5 pl-1 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
          <span className="flex-1 text-xs">{formatInlineText(text)}</span>
        </div>
      );
      continue;
    }

    if (!line.trim()) {
      blocks.push(<div key={`sp-${i}`} className="h-1" />);
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} className="my-0.5 text-xs leading-relaxed">
        {formatInlineText(line)}
      </p>
    );
  }

  return <div className="space-y-1">{blocks}</div>;
}

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  activePack,
  onNavigateFullTab,
  currentTab,
}) => {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drag tracking
  const dragDistanceRef = useRef<number>(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load custom API key from local storage
  useEffect(() => {
    const saved = localStorage.getItem("gemini_api_key");
    if (saved) setApiKey(saved);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close when clicking outside of the popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Vercel AI SDK Transport
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/agent",
        headers: () => ({
          "x-gemini-key": apiKey.trim(),
        }),
        body: () => ({
          apiKey: apiKey.trim() || undefined,
          packMetadata: activePack ? activePack.parsedData : null,
        }),
      }),
    [apiKey, activePack]
  );

  const { messages, sendMessage, status, stop, setMessages, error, clearError } = useChat({
    transport,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status, isOpen]);

  const handleSend = async (customText?: string) => {
    const text = (customText || inputPrompt).trim();
    if (!text || isStreaming) return;
    if (error) clearError();
    setInputPrompt("");
    try {
      await sendMessage({ text });
    } catch (err) {
      console.error("AI send error:", err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([]);
    if (error) clearError();
  };

  // If user is already on the dedicated full AI tab, hide the floating widget
  if (currentTab === "ai") {
    return null;
  }

  return (
    <>
      {/* =================================================================== */}
      {/* FLOATING DRAGGABLE CHATBOT LAUNCHER (BOTTOM RIGHT)                  */}
      {/* =================================================================== */}
      <motion.div
        ref={buttonRef}
        drag
        dragMomentum={false}
        dragElastic={0.08}
        onDragStart={() => {
          dragDistanceRef.current = 0;
        }}
        onDrag={(_, info) => {
          dragDistanceRef.current += Math.abs(info.delta.x) + Math.abs(info.delta.y);
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        whileDrag={{ scale: 1.12, cursor: "grabbing" }}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 select-none cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={() => {
            if (dragDistanceRef.current < 6) {
              setIsOpen((prev) => !prev);
            }
          }}
          className="relative group flex items-center justify-center size-13 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-brand-600/35 ring-2 ring-white/20 dark:ring-white/10 transition-shadow hover:shadow-2xl hover:shadow-brand-500/40 cursor-pointer"
          aria-label="Toggle AI Chatbot"
        >
          {/* Subtle Ambient Pulse Halo */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 opacity-60 blur-xs animate-pulse pointer-events-none" />

          {/* Online status indicator */}
          <span className="absolute top-0.5 right-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />

          {/* Center Bot / Close Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {isOpen ? <X className="size-6 transition-transform" /> : <Bot className="size-6 transition-transform" />}
          </div>

          {/* Single Floating Pill Label on Hover (Only when closed, to avoid visual clutter) */}
          {!isOpen && (
            <span className="absolute right-full mr-3 px-3 py-1.5 rounded-full bg-slate-900/95 dark:bg-card/95 backdrop-blur-md text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-white/10 hidden sm:inline-flex items-center gap-1.5">
              <Sparkles className="size-3 text-brand-400" />
              {language === "kh" ? "ជំនួយការ AI Chatbot" : "Yamaha AI Assistant"}
            </span>
          )}
        </button>
      </motion.div>

      {/* =================================================================== */}
      {/* FLOATING AI CHATBOT WINDOW                                          */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-[5.25rem] right-4 sm:right-6 inset-x-3 sm:inset-x-auto sm:w-[400px] md:w-[420px] z-50 flex flex-col rounded-3xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl overflow-hidden ring-1 ring-border/50 specular-card"
            style={{
              height: "min(520px, calc(100dvh - 6.5rem))",
              maxHeight: "calc(100dvh - 6.5rem)",
            }}
          >
            {/* Chatbot Header */}
            <div className="px-4 py-3 border-b border-border/80 bg-background/90 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 select-none">
              {/* Bot Persona Avatar & Status */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative size-8 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white/20">
                  <Bot className="size-4.5" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-foreground truncate">
                      {language === "kh" ? "ជំនួយការ Yamaha AI" : "Yamaha AI Assistant"}
                    </h4>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 shrink-0">
                      Gemini 2.5
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                    <span className="size-1 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">
                      {activePack
                        ? (language === "kh" ? `កញ្ចប់៖ ${activePack.name}` : `Active: ${activePack.name}`)
                        : (language === "kh" ? "ត្រៀមជួយបំប្លែងសំឡេង" : "Sound Engineering Ready")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Reset / New Chat */}
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    title={language === "kh" ? "ចាប់ផ្តើមការសន្ទនាថ្មី" : "Start New Chat"}
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                )}

                {/* Maximize to full tab */}
                {onNavigateFullTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateFullTab();
                    }}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                    title={language === "kh" ? "ពង្រីកពេញផ្ទាំង" : "Maximize to Full Tab"}
                  >
                    <Maximize2 className="size-3.5" />
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  title={language === "kh" ? "បិទ" : "Close"}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Viewport */}
            <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3.5 text-xs">
              {messages.length === 0 ? (
                /* Welcome Screen with Structured Prompt Starter Cards */
                <div className="flex flex-col gap-3 py-1">
                  {/* Bot Greeting Bubble */}
                  <div className="flex items-start gap-2.5">
                    <div className="size-7 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Sparkles className="size-3.5" />
                    </div>
                    <div className="bg-muted/70 text-foreground border border-border/70 rounded-2xl rounded-tl-xs p-3 text-xs shadow-2xs space-y-1 max-w-[90%]">
                      <p className="font-semibold text-foreground text-[12.5px]">
                        {language === "kh"
                          ? "សួស្តី! ខ្ញុំជាជំនួយការ AI សំឡេង Yamaha"
                          : "Hello! I am your Yamaha Sound Assistant"}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {language === "kh"
                          ? "ខ្ញុំអាចជួយអ្នកវិភាគកញ្ចប់ PPI, ស្រង់រលកសំឡេង WAV, គណនា AWM2 Filters ឬពិនិត្យដែនកំណត់ YEP 64MB។"
                          : "Ask me anything about .PPI de-encapsulation, AWM2 voice filters, PCM waveform extraction, or YEP memory limits."}
                      </p>
                    </div>
                  </div>

                  {/* Suggestion Starter Cards Title */}
                  <div className="px-1 pt-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {language === "kh" ? "សំនួរណែនាំរហ័ស" : "Suggested Starters"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      AWM2 Studio
                    </span>
                  </div>

                  {/* 4 Interactive Chat Starter Cards */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleSend(
                          "Analyze Yamaha AWM2 voice elements, oscillator layers, and sample PCM waveform properties in this expansion pack."
                        )
                      }
                      className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border/60 hover:border-brand-500/40 text-left transition group active:scale-[0.99]"
                    >
                      <div className="size-6 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Layers className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground leading-snug">
                          {language === "kh" ? "វិភាគស្រទាប់ AWM2 & Waveforms" : "Analyze AWM2 Elements & Waves"}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground truncate">
                          {language === "kh" ? "ពិនិត្យគំរូ PCM និងរចនាសម្ព័ន្ធសំឡេង" : "Inspect PCM samples and voice structures"}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSend(
                          "Check down-conversion compatibility from Genos / PSR-SX to legacy PSR-S950 YEP format (64MB memory limit)."
                        )
                      }
                      className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border/60 hover:border-brand-500/40 text-left transition group active:scale-[0.99]"
                    >
                      <div className="size-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Cpu className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground leading-snug">
                          {language === "kh" ? "ភាពត្រូវគ្នានឹង YEP (ដែនកំណត់ 64MB)" : "Check YEP 64MB Compatibility"}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground truncate">
                          {language === "kh" ? "វាយតម្លៃទំហំអង្គចងចាំ និងសំឡេងសម្រាប់ PSR-S950" : "Assess memory limits for legacy instruments"}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSend(
                          "Check DRM encryption locks, CPI security header status, and endian byte order."
                        )
                      }
                      className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border/60 hover:border-brand-500/40 text-left transition group active:scale-[0.99]"
                    >
                      <div className="size-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Lock className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground leading-snug">
                          {language === "kh" ? "ពិនិត្យសោរ DRM & ក្បាល CPI" : "Diagnose DRM & CPI Encryption"}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground truncate">
                          {language === "kh" ? "ផ្ទៀងផ្ទាត់សោការពារកម្មសិទ្ធិបញ្ញា" : "Verify encryption headers and locks"}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSend(
                          "Calculate optimal AWM2 Filter Cutoff (Hz), Q Factor resonance, and AEG attack/decay envelopes."
                        )
                      }
                      className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border/60 hover:border-brand-500/40 text-left transition group active:scale-[0.99]"
                    >
                      <div className="size-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Sliders className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground leading-snug">
                          {language === "kh" ? "គណនា AWM2 Filter & AEG" : "Calculate Filter & AEG Envelopes"}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground truncate">
                          {language === "kh" ? "លៃតម្រូវ Cutoff (Hz) និង Resonance" : "Fine-tune Cutoff frequency & Q factor"}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* Chat Messages Thread */
                messages.map((message) => {
                  const isUser = message.role === "user";
                  const rawText = message.parts
                    .filter((p) => p.type === "text")
                    .map((p) => (p as any).text)
                    .join("\n");

                  return (
                    <div
                      key={message.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                    >
                      {/* Sender Label */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                        {!isUser && (
                          <div className="size-4 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center text-[8px] font-bold">
                            AI
                          </div>
                        )}
                        <span>{isUser ? "You" : "Yamaha AI"}</span>
                        {!isUser && rawText && (
                          <button
                            type="button"
                            onClick={() => handleCopy(message.id, rawText)}
                            className="hover:text-foreground transition p-0.5 ml-1"
                            title="Copy message"
                          >
                            {copiedId === message.id ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Chat Speech Bubble */}
                      <div
                        className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser
                            ? "bg-brand-600 text-white rounded-tr-xs shadow-xs"
                            : "bg-muted/70 text-foreground rounded-tl-xs border border-border/70 shadow-2xs"
                        }`}
                      >
                        {message.parts.map((part, idx) => {
                          if (part.type === "text") {
                            return <MiniFormattedContent key={idx} content={part.text} />;
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Bot Thinking / Streaming State */}
              {isStreaming && (
                <div className="flex items-start gap-2.5 pt-1">
                  <div className="size-7 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="size-3.5" />
                  </div>
                  <div className="bg-muted/70 text-foreground border border-border/70 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-xs shadow-2xs flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-brand-500 animate-bounce" />
                    <span className="text-[11px] text-muted-foreground ml-1.5 font-medium">
                      {language === "kh" ? "AI កំពុងគិត..." : "Thinking..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-2.5 bg-rose-500/10 border-t border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] flex items-center justify-between gap-2 shrink-0">
                <span className="truncate">{error.message || "Error generating response"}</span>
                <button
                  type="button"
                  onClick={clearError}
                  className="underline shrink-0 text-[10px]"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Chatbot Input Footer */}
            <div className="p-2.5 border-t border-border/80 bg-background/90 backdrop-blur-md shrink-0 space-y-1.5">
              {/* Active Pack Status Tag */}
              {activePack && (
                <div className="flex items-center justify-between px-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1 truncate">
                    <FileMusic className="size-3 text-brand-500 shrink-0" />
                    <span className="truncate">Context: {activePack.name}</span>
                  </span>
                  <span className="text-emerald-500 font-mono text-[9px] shrink-0">Synced</span>
                </div>
              )}

              {/* Input & Action Buttons */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    language === "kh"
                      ? "សួរសំនួរទៅកាន់ AI Chatbot..."
                      : "Ask Yamaha AI chatbot anything..."
                  }
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isStreaming}
                  className="flex-1 px-4 py-2.5 rounded-full bg-muted/60 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition disabled:opacity-50"
                />

                {isStreaming ? (
                  <button
                    type="button"
                    onClick={() => stop()}
                    className="size-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer"
                    title="Stop generating"
                  >
                    <Square className="size-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!inputPrompt.trim()}
                    className="size-9 rounded-full bg-brand-600 hover:bg-brand-500 disabled:opacity-30 text-white flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer"
                    title="Send message"
                  >
                    <Send className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
