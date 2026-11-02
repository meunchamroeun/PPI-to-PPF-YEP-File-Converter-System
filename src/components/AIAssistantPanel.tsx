"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import {
  Sparkles,
  Brain,
  Sliders,
  Layers,
  FileText,
  Key,
  Copy,
  Check,
  Download,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Send,
  Cpu,
  Activity,
  Square,
  Trash2,
  Wrench,
  CheckCircle2,
  HelpCircle,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedPPIData } from "@/lib/yamaha/ppi-parser";
import { useTranslation } from "@/lib/i18n/LanguageContext";

interface AIAssistantPanelProps {
  activePack: {
    name: string;
    parsedData: ParsedPPIData;
  } | null;
  onSelectAction?: (promptText: string) => void;
}

// Helper to format bold **text** and inline `code`
function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-slate-200/70 dark:bg-slate-700/70 text-brand-700 dark:text-brand-300 font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// Markdown-aware text formatter without awkward line breaking
function FormattedText({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(
          <pre
            key={`code-${i}`}
            className="my-2 p-3 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-950 font-mono text-[11px] overflow-x-auto border border-slate-800"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={`h3-${i}`} className="font-bold text-sm mt-3 mb-1 text-slate-900 dark:text-white break-words">
          {formatInline(line.replace("### ", ""))}
        </h4>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={`h2-${i}`} className="font-bold text-base mt-4 mb-1.5 text-slate-900 dark:text-white break-words">
          {formatInline(line.replace("## ", ""))}
        </h3>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={`h1-${i}`} className="font-bold text-lg mt-4 mb-2 text-slate-900 dark:text-white break-words">
          {formatInline(line.replace("# ", ""))}
        </h2>
      );
      continue;
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const text = line.trim().replace(/^[-*]\s+/, "");
      blocks.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-1 pl-1 break-words leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
          <span className="flex-1">{formatInline(text)}</span>
        </div>
      );
      continue;
    }

    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      blocks.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 pl-1 break-words leading-relaxed">
          <span className="font-bold font-mono text-[10px] text-brand-600 dark:text-brand-400 mt-0.5 shrink-0">
            {numMatch[1]}.
          </span>
          <span className="flex-1">{formatInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    if (!line.trim()) {
      blocks.push(<div key={`sp-${i}`} className="h-1.5" />);
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} className="my-1 break-words leading-relaxed">
        {formatInline(line)}
      </p>
    );
  }

  return <div className="space-y-0.5">{blocks}</div>;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ activePack }) => {
  const { t, language } = useTranslation();
  const [apiKey, setApiKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [inputPrompt, setInputPrompt] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API key from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gemini_api_key");
      if (saved) {
        setApiKey(saved);
      }
    } catch (_) {}
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      if (newKey.trim()) {
        localStorage.setItem("gemini_api_key", newKey.trim());
      } else {
        localStorage.removeItem("gemini_api_key");
      }
    } catch (_) {}
  };

  // Configure Vercel AI SDK transport to communicate with /api/agent
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

  // Initialize Vercel AI SDK useChat hook
  const { messages, sendMessage, status, stop, setMessages, error, clearError } = useChat({
    transport,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom of messages container
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status]);

  const toggleToolExpanded = (callId: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [callId]: !prev[callId],
    }));
  };

  const handleSendPrompt = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isStreaming) return;

    if (error) clearError();
    setInputPrompt("");

    try {
      await sendMessage({ text });
    } catch (err) {
      console.error("Failed to send message to AI agent:", err);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportFullChat = () => {
    if (!messages || messages.length === 0) return;

    let markdown = `# Yamaha Expansion Sound Studio - AI Agent Report\n`;
    markdown += `Generated on: ${new Date().toISOString()}\n`;
    markdown += `Target Hardware: ${activePack?.parsedData.targetHardware || "Yamaha Genos / PSR-SX900"}\n`;
    markdown += `Active Pack: ${activePack?.name || "None (General Advice)"}\n\n`;
    markdown += `---\n\n`;

    messages.forEach((msg) => {
      markdown += `### ${msg.role === "user" ? "User Query" : "Yamaha AI Agent"}\n\n`;
      msg.parts.forEach((part) => {
        if (part.type === "text") {
          markdown += `${part.text}\n\n`;
        } else if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
          const toolPart = part as any;
          markdown += `> Tool Execution: \`${toolPart.type.replace(/^tool-/, "")}\`\n`;
          if (toolPart.output) {
            markdown += `\`\`\`json\n${JSON.stringify(toolPart.output, null, 2)}\n\`\`\`\n\n`;
          }
        }
      });
    });

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const title = activePack ? activePack.name.replace(/\.[^/.]+$/, "") : "Yamaha_AI_Agent_Report";
    link.download = `${title}_Agent_Session.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to get matching icon for tool
  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "inspectPpiStructure":
        return <Layers className="w-4 h-4 text-brand-600" />;
      case "calculateAwm2Filter":
        return <Sliders className="w-4 h-4 text-indigo-600" />;
      case "checkLegacyYepCompatibility":
        return <Cpu className="w-4 h-4 text-amber-600" />;
      case "generateMidiMapping":
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case "diagnoseConversionIssue":
        return <Activity className="w-4 h-4 text-rose-600" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="border-brand-200/50 dark:border-brand-900/50 bg-gradient-to-br from-white via-brand-50/20 to-white dark:from-slate-900 dark:via-brand-950/20 dark:to-slate-900 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    {t("ai_agent_title")}
                  </CardTitle>
                  <Badge variant="default" className="text-[10px] gap-1 py-0.5">
                    <Sparkles className="w-3 h-3" />
                    <span>{t("ai_agent_model_badge")}</span>
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1 py-0.5 border-brand-300 dark:border-brand-800">
                    <Cpu className="w-3 h-3 text-brand-600" />
                    <span>{t("ai_agent_sdk_badge")}</span>
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1 py-0.5 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{t("ai_agent_tools_badge")}</span>
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  {t("ai_agent_subtitle")}
                </CardDescription>
              </div>
            </div>

            {/* Top Toolbar Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="gap-2 text-xs border-slate-300 dark:border-slate-700 h-8"
              >
                <Key className="w-3.5 h-3.5 text-brand-500" />
                <span>
                  {apiKey
                    ? (language === "kh" ? "សោរផ្ទាល់ខ្លួន" : "Custom Key")
                    : (language === "kh" ? "AI លំនាំដើម (សកម្ម)" : "Default AI (Active)")}
                </span>
              </Button>

              {messages.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportFullChat}
                    className="gap-1.5 text-xs h-8"
                    title={t("ai_btn_export")}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t("ai_btn_export")}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessages([])}
                    className="gap-1.5 text-xs h-8 text-slate-500 hover:text-rose-600"
                    title={t("ai_btn_clear")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t("ai_btn_clear")}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Collapsible API Key Drawer */}
        {showKeyInput && (
          <CardContent className="pt-0 pb-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-brand-600" />
                  <span>
                    {language === "kh" ? "កំណត់សោរ Google Gemini API (ស្រេចចិត្ត)" : "Custom Google Gemini API Key (Optional)"}
                  </span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>{t("ai_key_hint")}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={
                    language === "kh"
                      ? "ទុកទទេដើម្បីប្រើសោរលំនាំដើម (AQ.Ab8R...)"
                      : "Leave blank to use System Default AI Key (AQ.Ab8R...)"
                  }
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-base sm:text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button size="sm" onClick={() => setShowKeyInput(false)}>
                  Done
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">
                {language === "kh"
                  ? "ប្រព័ន្ធដំណើរការជាមួយសោរលំនាំដើមដោយស្វ័យប្រវត្តិ។ លោកអ្នកអាចបញ្ចូលសោរផ្ទាល់ខ្លួនប្រសិនបើចង់ប្រើ Quota ផ្ទាល់ខ្លួន។"
                  : "System operates automatically with the Default AI Key. You may provide a personal Gemini API key to use your own quota."}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Target File Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-[10px]">
            Target Context
          </Badge>
          {activePack ? (
            <span className="font-semibold text-slate-900 dark:text-white">
              {activePack.name} ({activePack.parsedData.voicesCount} voices, {activePack.parsedData.stylesCount} styles,{" "}
              {activePack.parsedData.waveCount} samples)
            </span>
          ) : (
            <span className="text-slate-500">No pack loaded in memory. Ready for general Yamaha sound advice.</span>
          )}
        </div>

        {activePack && (
          <span className="text-brand-600 dark:text-brand-400 font-medium">
            Model: {activePack.parsedData.targetHardware}
          </span>
        )}
      </div>

      {/* Preset Action Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <button
          onClick={() =>
            handleSendPrompt(
              "Perform a comprehensive full-stack technical review of this Yamaha pack. Inspect chunk proportions, memory footprint, and tone generator layout."
            )
          }
          disabled={isStreaming}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-400 hover:shadow-md text-left transition group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Brain className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 break-words leading-snug">{t("ai_quick_audit")}</h4>
          <p className="text-[10px] text-slate-500 break-words leading-tight">Inspect chunks, voices &amp; wave tables.</p>
        </button>

        <button
          onClick={() =>
            handleSendPrompt(
              "Calculate optimal Yamaha AWM2 voice parameters for standard acoustic and lead voices: calculate resonant filter cutoff frequency in Hz, Q factor, and AEG envelope curves (Attack, Decay, Sustain, Release)."
            )
          }
          disabled={isStreaming}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md text-left transition group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 break-words leading-snug">{t("ai_quick_filter")}</h4>
          <p className="text-[10px] text-slate-500 break-words leading-tight">Calculate Cutoff (Hz), Q factor &amp; AEG.</p>
        </button>

        <button
          onClick={() =>
            handleSendPrompt(
              "Evaluate compatibility risks when down-converting this pack from Genos/SX900 to legacy PSR-S950 / PSR-S750 YEP format. Check the 64MB flash memory limit and polyphony constraints."
            )
          }
          disabled={isStreaming}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md text-left transition group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 break-words leading-snug">{t("ai_quick_yep")}</h4>
          <p className="text-[10px] text-slate-500 break-words leading-tight">Assess 64MB memory limit &amp; voice slots.</p>
        </button>

        <button
          onClick={() =>
            handleSendPrompt(
              "Generate a professional Yamaha Expansion MIDI Bank mapping table using MSB 063/062 and Program Change assignments conforming to Yamaha XG / GM2 standards."
            )
          }
          disabled={isStreaming}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md text-left transition group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 break-words leading-snug">{t("ai_quick_midi")}</h4>
          <p className="text-[10px] text-slate-500 break-words leading-tight">Allocate CC#0, CC#32 and PC slots.</p>
        </button>

        <button
          onClick={() =>
            handleSendPrompt(
              "Diagnose common Yamaha expansion container issues: check DRM encryption locks, CRC32 header corruption, and 16-bit PCM Big-Endian vs Little-Endian byte-swapping rules."
            )
          }
          disabled={isStreaming}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-400 hover:shadow-md text-left transition group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5 break-words leading-snug">{t("ai_quick_diagnose")}</h4>
          <p className="text-[10px] text-slate-500 break-words leading-tight">Identify DRM locks &amp; endian faults.</p>
        </button>
      </div>

      {/* Main Conversation Stream Viewport */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col min-h-[460px]">
        {/* Stream Header */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-600" />
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              Vercel AI SDK Agent Conversation Stream
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming && (
              <Badge variant="outline" className="text-[10px] gap-1 text-brand-600 animate-pulse border-brand-300">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Agent Active</span>
              </Badge>
            )}
            <Badge variant="secondary" className="font-mono text-[10px]">
              {messages.length} {messages.length === 1 ? "Message" : "Messages"}
            </Badge>
          </div>
        </div>

        {/* Message Bubble List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 max-h-[560px]">
          {messages.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">
                {t("ai_no_messages")}
              </h5>
              <p className="text-xs max-w-md">
                Click any quick preset action above or ask a question regarding Yamaha AWM2 elements, voice editing, or file format conversion.
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
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-2`}
                >
                  {/* Sender Badge */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isUser ? "User" : "Yamaha AI Agent"}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{message.id.slice(0, 8)}</span>
                    {!isUser && rawText && (
                      <button
                        onClick={() => handleCopyMessage(message.id, rawText)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Message Bubble Box */}
                  <div
                    className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      isUser
                        ? "bg-brand-600 text-white rounded-tr-none shadow-md"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm"
                    }`}
                  >
                    {/* Render Message Parts */}
                    <div className="space-y-3">
                      {message.parts.map((part, pIdx) => {
                        // Render standard text parts with clean markdown-aware formatting (no awkward breaks)
                        if (part.type === "text") {
                          return (
                            <div
                              key={pIdx}
                              className="font-sans selection:bg-brand-500 selection:text-white"
                            >
                              <FormattedText content={part.text} />
                            </div>
                          );
                        }

                        // Render tool execution parts
                        if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                          const toolPart = part as any;
                          const toolName = toolPart.type.startsWith("tool-")
                            ? toolPart.type.replace(/^tool-/, "")
                            : toolPart.toolName || "tool";
                          const callId = toolPart.toolCallId || `tool-${pIdx}`;
                          const isExpanded = expandedTools[callId] ?? false;
                          const isFinished = toolPart.state === "output-available";
                          const isRunning =
                            toolPart.state === "input-streaming" || toolPart.state === "input-available";

                          return (
                            <div
                              key={callId}
                              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-3 my-2 shadow-sm text-slate-800 dark:text-slate-200"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {getToolIcon(toolName)}
                                  <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                                    {toolName}
                                  </span>
                                  {isRunning && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] gap-1 text-brand-600 dark:text-brand-400 border-brand-300 animate-pulse"
                                    >
                                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                      <span>{t("ai_tool_running")}</span>
                                    </Badge>
                                  )}
                                  {isFinished && (
                                    <Badge
                                      variant="outline"
                                      className="text-[9px] gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-300"
                                    >
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                      <span>{t("ai_tool_finished")}</span>
                                    </Badge>
                                  )}
                                </div>

                                <button
                                  onClick={() => toggleToolExpanded(callId)}
                                  className="text-[10px] text-slate-500 hover:text-brand-600 flex items-center gap-1 font-mono"
                                >
                                  <span>{isExpanded ? "Collapse" : "Inspect Data"}</span>
                                  {isExpanded ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </button>
                              </div>

                              {/* Tool Call & Output Details */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-[10px] font-mono">
                                  {toolPart.input && (
                                    <div>
                                      <span className="text-slate-500 font-semibold block mb-1">
                                        Input Parameters:
                                      </span>
                                      <pre className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 overflow-x-auto text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                                        {JSON.stringify(toolPart.input, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {toolPart.output && (
                                    <div>
                                      <span className="text-slate-500 font-semibold block mb-1">
                                        Tool Output Result:
                                      </span>
                                      <pre className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 overflow-x-auto text-emerald-700 dark:text-emerald-400 border border-slate-200 dark:border-slate-800">
                                        {JSON.stringify(toolPart.output, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Streaming Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error.message || "An error occurred during agent communication."}</span>
            </div>
            <div className="flex items-center gap-2">
              {!apiKey && (
                <Button size="sm" variant="outline" onClick={() => setShowKeyInput(true)} className="h-7 text-[11px]">
                  Set Key
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={clearError} className="h-7 text-[11px]">
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Input Bar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
          <input
            type="text"
            placeholder={t("ai_input_placeholder")}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          />

          {isStreaming ? (
            <Button
              onClick={() => stop()}
              variant="destructive"
              className="gap-1.5 px-4 rounded-2xl text-xs font-semibold h-10 shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>{t("ai_btn_stop")}</span>
            </Button>
          ) : (
            <Button
              onClick={() => handleSendPrompt()}
              disabled={!inputPrompt.trim()}
              className="gap-1.5 px-5 rounded-2xl text-xs font-semibold h-10 shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t("ai_btn_send")}</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
