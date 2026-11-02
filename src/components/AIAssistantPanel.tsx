"use client";

import React, { useState, useEffect } from "react";
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
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedPPIData } from "@/lib/yamaha/ppi-parser";

interface AIAssistantPanelProps {
  activePack: {
    name: string;
    parsedData: ParsedPPIData;
  } | null;
  onSelectAction?: (promptText: string) => void;
  onLoadSample?: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ activePack, onLoadSample }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load API key from localStorage if saved
  useEffect(() => {
    const saved = localStorage.getItem("gemini_api_key");
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    if (newKey.trim()) {
      localStorage.setItem("gemini_api_key", newKey.trim());
    } else {
      localStorage.removeItem("gemini_api_key");
    }
  };

  const runAnalysis = async (promptQuery?: string) => {
    const promptToSend = promptQuery || customPrompt;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packMetadata: activePack ? activePack.parsedData : null,
          userPrompt: promptToSend,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to generate AI insights.");
      }

      setAnalysisResult(data.analysis);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during AI analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportText = () => {
    if (!analysisResult) return;
    const blob = new Blob([analysisResult], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const title = activePack ? activePack.name.replace(/\.[^/.]+$/, "") : "Yamaha_Pack";
    link.download = `${title}_AI_Sound_Design_Analysis.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Gemini AI Sound Design &amp; Architecture Assistant
                  </CardTitle>
                  <Badge variant="default" className="text-[10px] gap-1 py-0.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Gemini 2.5 Flash</span>
                  </Badge>
                </div>
                <CardDescription>
                  Deep technical analysis of Yamaha AWM2 voice parameters, wave samples, and legacy instrument compatibility.
                </CardDescription>
              </div>
            </div>

            {/* API Key Configure Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="gap-2 text-xs border-slate-300 dark:border-slate-700"
            >
              <Key className="w-3.5 h-3.5 text-brand-500" />
              <span>{apiKey ? "API Key Configured" : "Set Gemini API Key"}</span>
            </Button>
          </div>
        </CardHeader>

        {/* API Key Drawer Input */}
        {showKeyInput && (
          <CardContent className="pt-0 pb-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-brand-600" />
                  <span>Google Gemini API Key</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Get free Gemini API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your AI Studio Gemini API key (AIzaSy...)"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button size="sm" onClick={() => setShowKeyInput(false)}>
                  Done
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">
                Your key is stored securely in your browser's local storage and used directly for requests.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Target File Context Card */}
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
            <span className="text-slate-500">No pack currently selected. Load or upload a PPI to provide context.</span>
          )}
        </div>

        {activePack ? (
          <span className="text-brand-600 dark:text-brand-400 font-medium">
            Model: {activePack.parsedData.targetHardware}
          </span>
        ) : onLoadSample ? (
          <Button size="sm" variant="outline" onClick={onLoadSample} className="gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Load Demo Pack Context</span>
          </Button>
        ) : null}
      </div>

      {/* Preset Action Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() =>
            runAnalysis(
              "Perform a comprehensive full-stack technical review of this Yamaha pack. Inspect chunk proportions, memory footprint, and tone generator layout."
            )
          }
          disabled={isAnalyzing}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-400 hover:shadow-md text-left transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Brain className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5">Comprehensive Pack Audit</h4>
          <p className="text-[11px] text-slate-500">Full technical assessment of voices, samples &amp; chunks.</p>
        </button>

        <button
          onClick={() =>
            runAnalysis(
              "Suggest optimal Yamaha AWM2 voice parameters for this pack: AEG envelopes (Attack, Decay, Sustain, Release), filter cutoff frequency, resonance, and velocity curve sensitivity."
            )
          }
          disabled={isAnalyzing}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-400 hover:shadow-md text-left transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Sliders className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5">AWM2 Filter &amp; Envelope Tuning</h4>
          <p className="text-[11px] text-slate-500">Recommend Cutoff, Resonance, and AEG envelope curves.</p>
        </button>

        <button
          onClick={() =>
            runAnalysis(
              "Evaluate compatibility risks when down-converting this pack from modern Genos/SX900 to older PSR-S950 / PSR-S750 YEP format. Highlight polyphony constraints, Super Articulation mapping, and sample rate downsampling."
            )
          }
          disabled={isAnalyzing}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-400 hover:shadow-md text-left transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5">Legacy YEP Compatibility</h4>
          <p className="text-[11px] text-slate-500">Analyze PSR-S950/S750 hardware conversion limits.</p>
        </button>

        <button
          onClick={() =>
            runAnalysis(
              "Draft professional musician-oriented release notes, catalog sound descriptions, and recommended MIDI Bank MSB/LSB allocations for this expansion pack."
            )
          }
          disabled={isAnalyzing}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-400 hover:shadow-md text-left transition group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-0.5">Release Notes &amp; MIDI Bank</h4>
          <p className="text-[11px] text-slate-500">Generate sound catalog descriptions &amp; LSB assignments.</p>
        </button>
      </div>

      {/* Custom Prompt Query Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ask Gemini AI anything about this Yamaha expansion pack, sound design, or conversion rules..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isAnalyzing) {
              runAnalysis();
            }
          }}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button
          onClick={() => runAnalysis()}
          disabled={isAnalyzing}
          className="gap-2 px-5 rounded-2xl shadow-md font-semibold"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Generate AI Analysis</span>
            </>
          )}
        </Button>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold">AI Analysis Request Failed</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          {!apiKey && (
            <Button size="sm" variant="outline" onClick={() => setShowKeyInput(true)}>
              Configure API Key
            </Button>
          )}
        </div>
      )}

      {/* Analysis Result Card */}
      {analysisResult && (
        <Card className="overflow-hidden border-brand-200/60 dark:border-brand-900/60 shadow-lg">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Gemini AI Technical Report</h4>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 h-8 text-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportText} className="gap-1.5 h-8 text-xs">
                <Download className="w-3.5 h-3.5" />
                <span>Export Markdown</span>
              </Button>
            </div>
          </div>

          <div className="p-6 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans max-h-[500px] overflow-y-auto whitespace-pre-wrap selection:bg-brand-500 selection:text-white">
            {analysisResult}
          </div>
        </Card>
      )}
    </div>
  );
};
