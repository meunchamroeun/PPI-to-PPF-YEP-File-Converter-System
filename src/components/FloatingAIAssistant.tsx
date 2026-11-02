"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Brain,
  Sparkles,
  X,
  Maximize2,
  Send,
  Square,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Cpu,
  Sliders,
  FileText,
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

  // Drag tracking to prevent click trigger when dragging
  const dragDistanceRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load custom API key from local storage
  useEffect(() => {
    const saved = localStorage.getItem("gemini_api_key");
    if (saved) setApiKey(saved);
  }, []);

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

  const { messages, sendMessage, status, stop, error, clearError } = useChat({
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

  // If user is already on the dedicated full AI tab, hide the floating widget
  if (currentTab === "ai") {
    return null;
  }

  return (
    <>
      {/* =================================================================== */}
      {/* FLOATING DRAGGABLE ACTION BUTTON (BOTTOM RIGHT)                     */}
      {/* =================================================================== */}
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={() => {
          dragDistanceRef.current = 0;
        }}
        onDrag={(_, info) => {
          dragDistanceRef.current += Math.abs(info.delta.x) + Math.abs(info.delta.y);
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        whileDrag={{ scale: 1.12, cursor: "grabbing" }}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 select-none cursor-grab"
      >
        <button
          type="button"
          onClick={() => {
            // Only trigger click if user wasn't dragging
            if (dragDistanceRef.current < 6) {
              setIsOpen((prev) => !prev);
            }
          }}
          className="relative group flex items-center justify-center size-13 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-brand-600/30 ring-2 ring-white/20 dark:ring-white/10 transition-shadow hover:shadow-2xl hover:shadow-brand-500/40"
          title={language === "kh" ? "ជំនួយការ AI សំឡេង (ចុចដើម្បីបើក ឬទាញផ្លាស់ទី)" : "Yamaha AI Assistant (Click to open, drag to move)"}
          aria-label="Toggle AI Assistant"
        >
          {/* Subtle Ambient Pulse Halo */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 opacity-60 blur-xs animate-pulse pointer-events-none" />

          {/* Online status indicator */}
          <span className="absolute top-0.5 right-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />

          {/* Center Icon */}
          <div className="relative z-10 flex items-center justify-center">
            {isOpen ? <X className="size-6" /> : <Brain className="size-6" />}
          </div>

          {/* Floating Pill Label on Hover */}
          <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-full bg-slate-900/90 dark:bg-card/90 backdrop-blur-md text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md border border-white/10 hidden sm:inline-block">
            {language === "kh" ? "ជំនួយការ AI (ទាញផ្លាស់ទីបាន)" : "AI Studio (Drag to move)"}
          </span>
        </button>
      </motion.div>

      {/* =================================================================== */}
      {/* FLOATING CONVERSATION WINDOW                                        */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-36 right-4 sm:bottom-22 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[520px] max-h-[75vh] flex flex-col rounded-3xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl overflow-hidden ring-1 ring-border/50 specular-card"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/80 bg-background/80 backdrop-blur-md flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-full bg-gradient-to-tr from-brand-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Brain className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-foreground truncate">
                      {language === "kh" ? "ជំនួយការ AI សំឡេង" : "AI Sound Assistant"}
                    </h4>
                    <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 shrink-0">
                      Gemini
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {activePack ? (
                      <span>{language === "kh" ? `កញ្ចប់៖ ${activePack.name}` : `Pack: ${activePack.name}`}</span>
                    ) : (
                      <span>{language === "kh" ? "AWM2 Voice & Pack Engine" : "AWM2 Synthesis Assistant"}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1 shrink-0">
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
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  title="Close"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="px-3.5 py-2 border-b border-border/60 bg-muted/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "Analyze Yamaha AWM2 voice elements, oscillator layers, and sample PCM waveform properties in this expansion pack."
                  )
                }
                disabled={isStreaming}
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium bg-background border border-border/80 hover:border-brand-500/40 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              >
                {language === "kh" ? "វិភាគ AWM2" : "Analyze AWM2"}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "Check down-conversion compatibility from Genos / PSR-SX to legacy PSR-S950 YEP format (64MB memory limit)."
                  )
                }
                disabled={isStreaming}
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium bg-background border border-border/80 hover:border-brand-500/40 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              >
                {language === "kh" ? "ភាពត្រូវគ្នានឹង YEP" : "YEP Compatibility"}
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    "Check DRM encryption locks, CPI security header status, and endian byte order."
                  )
                }
                disabled={isStreaming}
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium bg-background border border-border/80 hover:border-brand-500/40 text-muted-foreground hover:text-foreground transition disabled:opacity-50"
              >
                {language === "kh" ? "ពិនិត្យ DRM" : "Check DRM"}
              </button>
            </div>

            {/* Conversation Messages Viewport */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <div className="size-10 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-2">
                    <Sparkles className="size-5" />
                  </div>
                  <h5 className="font-bold text-xs text-foreground mb-1">
                    {language === "kh" ? "តើខ្ញុំអាចជួយអ្វីបានខ្លះ?" : "How can I help with your Yamaha sounds?"}
                  </h5>
                  <p className="text-[11px] max-w-xs text-muted-foreground">
                    {language === "kh"
                      ? "សួរអំពីក្បួនបំប្លែងឯកសារ PPI, ទាញស្រង់រលកសំឡេង ឬកែសម្រួល Voice Filters។"
                      : "Ask questions about pack structures, UVF voice scripts, PCM waveforms, or MIDI mapping."}
                  </p>
                </div>
              ) : (
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
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                        <span>{isUser ? "You" : "Yamaha AI"}</span>
                        {!isUser && rawText && (
                          <button
                            type="button"
                            onClick={() => handleCopy(message.id, rawText)}
                            className="hover:text-foreground transition p-0.5"
                            title="Copy"
                          >
                            {copiedId === message.id ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        )}
                      </div>

                      <div
                        className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isUser
                            ? "bg-brand-600 text-white rounded-tr-none shadow-xs"
                            : "bg-muted/70 text-foreground rounded-tl-none border border-border/70 shadow-2xs"
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
              <div ref={messagesEndRef} />
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-2.5 bg-rose-500/10 border-t border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] flex items-center justify-between gap-2">
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

            {/* Input Bar */}
            <div className="p-2.5 border-t border-border/80 bg-background/80 backdrop-blur-md flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  language === "kh"
                    ? "សួរសំនួរទៅកាន់ AI..."
                    : "Ask about voices, waves, filters..."
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
                className="flex-1 px-3.5 py-2 rounded-full bg-muted/60 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition disabled:opacity-50"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="size-9 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer"
                  title="Stop"
                >
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputPrompt.trim()}
                  className="size-9 rounded-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs shrink-0 cursor-pointer"
                  title="Send"
                >
                  <Send className="size-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
