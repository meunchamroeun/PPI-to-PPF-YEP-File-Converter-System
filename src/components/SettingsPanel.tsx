"use client";

import React, { useState, useEffect } from "react";
import {
  Sliders,
  Key,
  Shield,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Save,
  Volume2,
  FileCheck,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Lock,
  User,
  Crown,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BaseSwitch } from "@/components/ui/base-switch";
import { UserSession } from "@/components/AuthModal";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Logo } from "@/components/ui/logo";

interface SettingsPanelProps {
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onUpdateUserRole: (newRole: "ADMIN" | "USER") => void;
  darkMode: boolean;
  themeMode?: "system" | "light" | "dark";
  onToggleDarkMode: () => void;
  onSelectThemeMode?: (mode: "system" | "light" | "dark") => void;
  enableToneVisualizer: boolean;
  onToggleToneVisualizer: (val: boolean) => void;
  strictDRMMode: boolean;
  onToggleStrictDRM: (val: boolean) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  currentUser,
  onOpenAuth,
  onUpdateUserRole,
  darkMode,
  themeMode = "system",
  onToggleDarkMode,
  onSelectThemeMode,
  enableToneVisualizer,
  onToggleToneVisualizer,
  strictDRMMode,
  onToggleStrictDRM,
}) => {
  const { t, language } = useTranslation();

  // API Key State
  const [apiKey, setApiKey] = useState<string>("");
  const [showKey, setShowKey] = useState<boolean>(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "testing" | "valid" | "invalid">("idle");
  const [keyMessage, setKeyMessage] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Conversion Preferences State
  const [defaultFormat, setDefaultFormat] = useState<"PPF" | "YEP">("PPF");
  const [autoDownload, setAutoDownload] = useState<boolean>(false);
  const [soundFeedback, setSoundFeedback] = useState<boolean>(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key") || "";
    setApiKey(savedKey);
    if (savedKey.trim()) {
      setKeyStatus("idle");
    }

    const savedFormat = localStorage.getItem("pref_default_format") as "PPF" | "YEP";
    if (savedFormat) setDefaultFormat(savedFormat);

    const savedAutoDl = localStorage.getItem("pref_auto_download");
    if (savedAutoDl !== null) setAutoDownload(savedAutoDl === "true");

    const savedSound = localStorage.getItem("pref_sound_feedback");
    if (savedSound !== null) setSoundFeedback(savedSound === "true");
  }, []);

  const handleSaveApiKey = () => {
    const cleanKey = apiKey.trim();
    if (cleanKey) {
      localStorage.setItem("gemini_api_key", cleanKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } else {
      localStorage.removeItem("gemini_api_key");
      setKeyStatus("idle");
      setKeyMessage("API Key removed.");
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setKeyStatus("idle");
    setKeyMessage("API Key cleared.");
  };

  const handleTestApiKey = async () => {
    setKeyStatus("testing");
    setKeyMessage(apiKey.trim() ? "Pinging Google AI Studio with custom key..." : "Testing System Default Gemini AI key...");

    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() || undefined }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setKeyStatus("valid");
        setKeyMessage(data.message || "Connection verified! Model gemini-3.5-flash responded successfully.");
      } else {
        setKeyStatus("invalid");
        setKeyMessage(data.error || "Failed to authenticate with Google Gemini API.");
      }
    } catch (err: any) {
      setKeyStatus("invalid");
      setKeyMessage(err.message || "Network error while connecting to Gemini API.");
    }
  };

  const handleFormatChange = (fmt: "PPF" | "YEP") => {
    setDefaultFormat(fmt);
    localStorage.setItem("pref_default_format", fmt);
  };

  const handleAutoDownloadChange = (val: boolean) => {
    setAutoDownload(val);
    localStorage.setItem("pref_auto_download", String(val));
  };

  const handleSoundFeedbackChange = (val: boolean) => {
    setSoundFeedback(val);
    localStorage.setItem("pref_sound_feedback", String(val));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-brand-600" />
            <span>{t("set_title")}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("set_subtitle")}
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2">
            <Badge
              variant={currentUser.role === "ADMIN" ? "default" : "secondary"}
              className={currentUser.role === "ADMIN" ? "bg-purple-600 text-white font-bold" : ""}
            >
              {currentUser.role === "ADMIN" ? "ADMINISTRATOR" : "STANDARD USER"}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT COLUMN: User Account & Role Switcher */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t("set_profile_title")}
            </CardTitle>

            {currentUser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {currentUser.email || (currentUser.username ? `@${currentUser.username}` : "Verified Account")}
                    </p>
                    <span className="text-[10px] font-mono font-medium text-brand-600 dark:text-brand-400">
                      Via {currentUser.provider}
                    </span>
                  </div>
                </div>

                {/* Verified Account Status */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {language === "kh" ? "សិទ្ធិតួនាទីប្រព័ន្ធ" : "System Privilege Level"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        currentUser.role === "ADMIN" ? "bg-purple-600 text-white border-transparent" : ""
                      }`}
                    >
                      {currentUser.role}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {currentUser.role === "ADMIN"
                      ? (language === "kh"
                          ? "គណនី Master Admin (Meun Chamroeun) មានសិទ្ធិពេញលេញលើ Admin Console និងការគ្រប់គ្រងប្រព័ន្ធ។"
                          : "Master Admin account (Meun Chamroeun) with full governance and console access.")
                      : (language === "kh"
                          ? "គណនីអ្នកប្រើប្រាស់ពិតប្រាកដសម្រាប់បំប្លែងឯកសារ PPI/PPF និងដំណើរការ Sound AI Studio។"
                          : "Verified active user account for PPI/PPF conversions and Sound AI Studio.")}
                  </p>
                </div>

                <Button variant="outline" size="sm" onClick={onOpenAuth} className="w-full text-xs gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>{t("set_btn_switch_account")}</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 text-center py-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t("hist_guest_banner_title")}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t("hist_guest_banner_desc")}
                  </p>
                </div>
                <Button onClick={onOpenAuth} className="w-full gap-2">
                  <Key className="w-3.5 h-3.5" />
                  <span>{t("hdr_sign_in")}</span>
                </Button>
              </div>
            )}
          </Card>

          {/* Theme & Display Quick Settings */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t("cmd_group_theme")}
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {themeMode === "system"
                    ? (language === "kh" 
                        ? `កំពុងតាមប្រព័ន្ធ (${darkMode ? "ពន្លឺយប់" : "ពន្លឺថ្ងៃ"})`
                        : `Following system (${darkMode ? "Dark" : "Light"})`)
                    : themeMode === "light"
                    ? (language === "kh" ? "ពន្លឺថ្ងៃពេញលេញ" : "Light mode active")
                    : (language === "kh" ? "ពន្លឺយប់ស្ទូឌីយោ" : "Dark mode active")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onSelectThemeMode ? onSelectThemeMode("system") : onToggleDarkMode()}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
                  themeMode === "system"
                    ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/60 dark:border-slate-700 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title={t("theme_system_desc")}
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span>{t("theme_system")}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectThemeMode ? onSelectThemeMode("light") : onToggleDarkMode()}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
                  themeMode === "light"
                    ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200/60 dark:border-slate-700 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title={t("theme_light_desc")}
              >
                <Sun className="w-3.5 h-3.5 shrink-0" />
                <span>{t("theme_light")}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectThemeMode ? onSelectThemeMode("dark") : onToggleDarkMode()}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
                  themeMode === "dark"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title={t("theme_dark_desc")}
              >
                <Moon className="w-3.5 h-3.5 shrink-0" />
                <span>{t("theme_dark")}</span>
              </button>
            </div>
          </Card>

          {/* Logo & Brand Identity Kit */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {language === "kh" ? "ឡូហ្គោប្រព័ន្ធ & Brand Kit" : "System Logo & Brand Kit"}
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === "kh" ? "ទាញយកឡូហ្គោច្បាស់កម្រិតខ្ពស់ (Vector SVG & HD PNG)" : "Download high-resolution vector and PNG brand logos"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
              <Logo variant="full" size="sm" showBadge={false} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href="/logo.svg"
                download="yamaha-expvoice-logo.svg"
                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300 transition active:scale-[0.97]"
              >
                <span>Vector SVG</span>
                <Download className="w-3.5 h-3.5 text-brand-500" />
              </a>

              <a
                href="/logomark.png"
                download="yamaha-expvoice-mark-1024.png"
                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300 transition active:scale-[0.97]"
              >
                <span>Mark (1024px)</span>
                <Download className="w-3.5 h-3.5 text-indigo-500" />
              </a>

              <a
                href="/logo-dark.png"
                download="yamaha-expvoice-dark.png"
                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300 transition active:scale-[0.97]"
              >
                <span>Dark Logo (HD)</span>
                <Download className="w-3.5 h-3.5 text-cyan-500" />
              </a>

              <a
                href="/logo-light.png"
                download="yamaha-expvoice-light.png"
                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-medium text-slate-700 dark:text-slate-300 transition active:scale-[0.97]"
              >
                <span>Light Logo (HD)</span>
                <Download className="w-3.5 h-3.5 text-amber-500" />
              </a>
            </div>
          </Card>
        </div>

        {/* RIGHT TWO COLUMNS: API Key Management & Engine Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* SECTION 1: GEMINI AI API KEY MANAGER */}
          <Card className="p-6 space-y-4 border-brand-200/60 dark:border-brand-900/60">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-sm">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {t("set_gemini_title")}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {t("set_gemini_desc")}
                  </p>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <span>{t("set_gemini_get_free")}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("set_gemini_input_label")}
                  </label>
                  {!apiKey.trim() ? (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {language === "kh" ? "សោរលំនាំដើមប្រព័ន្ធសកម្ម" : "System Default AI Key Active"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                      {language === "kh" ? "សោរប្ដូរតាមបំណងផ្ទាល់ខ្លួន" : "Custom Key Active"}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? "text" : "password"}
                      placeholder={language === "kh" ? "ទុកទទេដើម្បីប្រើសោរលំនាំដើមរបស់ប្រព័ន្ធ (AQ.Ab8R...)" : "Leave empty to use System Default AI Key (AQ.Ab8R...)"}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setKeyStatus("idle");
                        setKeyMessage("");
                      }}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title={showKey ? "Hide API key" : "Show API key"}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <Button
                    onClick={handleTestApiKey}
                    disabled={keyStatus === "testing"}
                    variant="outline"
                    className="gap-1.5 shrink-0"
                    title={apiKey.trim() ? "Test Custom Key" : "Test System Default Key"}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${keyStatus === "testing" ? "animate-spin" : ""}`} />
                    <span>{t("set_btn_test_conn")}</span>
                  </Button>

                  <Button onClick={handleSaveApiKey} className="gap-1.5 shrink-0 shadow-sm">
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSaved ? "Saved!" : t("set_btn_save_key")}</span>
                  </Button>
                </div>
              </div>

              {/* Status / Feedback Alert */}
              {keyMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    keyStatus === "valid"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                      : keyStatus === "invalid"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {keyStatus === "valid" ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : keyStatus === "invalid" ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  ) : (
                    <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-brand-600" />
                  )}
                  <span>{keyMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {language === "kh" ? "សោរត្រូវបានរក្សាទុកក្នុងទូសម្ងាត់មូលដ្ឋាននៃកម្មវិធីរុករករបស់អ្នក។" : "Key is saved in your browser's private local vault and passed via encrypted headers."}
                </span>
                {apiKey && (
                  <button
                    onClick={handleClearApiKey}
                    className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{t("set_btn_clear_key")}</span>
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* SECTION 2: CONVERSION ENGINE PREFERENCES */}
          <Card className="p-6 space-y-4">
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>{t("set_pref_title")}</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                {language === "kh" ? "កំណត់ទម្រង់ឯកសារលំនាំដើម ច្បាប់ DRM និងសកម្មភាពស្វ័យប្រវត្តិ។" : "Configure container format defaults, DRM rules, and automated workflow triggers."}
              </p>
            </div>

            <div className="space-y-4">
              {/* Default Format Selection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    {t("set_pref_default_container")}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === "kh" ? "ទម្រង់ដែលត្រូវជ្រើសរើសដោយស្វ័យប្រវត្តិកាលណាមានឯកសារ .PPI ថ្មី" : "Format automatically selected when new .PPI packages are queued"}
                  </span>
                </div>
                <div className="flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5 text-xs font-semibold shrink-0">
                  <button
                    onClick={() => handleFormatChange("PPF")}
                    className={`px-3 py-1.5 rounded-md transition ${
                      defaultFormat === "PPF"
                        ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    PPF (Yamaha YEM)
                  </button>
                  <button
                    onClick={() => handleFormatChange("YEP")}
                    className={`px-3 py-1.5 rounded-md transition ${
                      defaultFormat === "YEP"
                        ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    YEP (Legacy)
                  </button>
                </div>
              </div>

              {/* Strict DRM Check */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="pr-4">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("set_pref_strict_drm")}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {language === "kh" ? "បដិសេធដោយសុវត្ថិភាពនូវឯកសារ CPI ដែលគ្មានសោរម៉ាស៊ីន (.n27)" : "Safely rejects encrypted CPI files that lack hardware instrument encryption keys (.n27)"}
                  </span>
                </div>
                <BaseSwitch
                  checked={strictDRMMode}
                  onCheckedChange={onToggleStrictDRM}
                />
              </div>

              {/* Realtime Audio Spectrum */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="pr-4">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-brand-500" />
                    <span>{t("set_pref_visualizer")}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {language === "kh" ? "បង្ហាញបន្ទះរលកសំឡេងប្រេកង់ 44.1 kHz លើ Sidebar ពេលកំពុងបំលែង" : "Displays live 44.1 kHz animated frequency bars in the sidebar during conversions"}
                  </span>
                </div>
                <BaseSwitch
                  checked={enableToneVisualizer}
                  onCheckedChange={onToggleToneVisualizer}
                />
              </div>

              {/* Auto Download Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="pr-4">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {t("set_pref_auto_download")}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {language === "kh" ? "ទាញយកឯកសារ PPF ឬ YEP ទៅក្នុងកុំព្យូទ័រភ្លាមៗពេលដែលការបំលែងជោគជ័យ" : "Triggers browser download automatically as soon as PPF Zip or YEP container finishes"}
                  </span>
                </div>
                <BaseSwitch
                  checked={autoDownload}
                  onCheckedChange={handleAutoDownloadChange}
                />
              </div>

              {/* Sound / Haptic Feedback */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="pr-4">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {language === "kh" ? "រំញ័រ tactile / Haptic Feedback" : "Haptic & Tactile Feedback"}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {language === "kh" ? "ផ្តល់នូវសញ្ញារំញ័រនៅលើទូរស័ព្ទ ឬ Telegram Mini App ពេលដំណើរការចប់" : "Provides vibration triggers on mobile / Telegram Mini App when actions complete"}
                  </span>
                </div>
                <BaseSwitch
                  checked={soundFeedback}
                  onCheckedChange={handleSoundFeedbackChange}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
