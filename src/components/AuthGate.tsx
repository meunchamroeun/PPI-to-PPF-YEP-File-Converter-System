"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Logo } from "@/components/ui/logo";
import { UserSession } from "@/components/AuthModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  Moon,
  Sun,
  Monitor,
  AlertCircle,
  Database,
  Send,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

interface AuthGateProps {
  onLogin: (user: UserSession) => void;
  darkMode: boolean;
  themeMode?: "system" | "light" | "dark";
  onToggleTheme: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onLogin,
  darkMode,
  themeMode = "system",
  onToggleTheme,
}) => {
  const { t, language } = useTranslation();
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email / Password Authentication
  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === "kh" ? "សូមបញ្ចូលអ៊ីមែល ឬ ឈ្មោះគណនី" : "Email or username is required.");
      return;
    }
    if (!password || password.length < 4) {
      setError(language === "kh" ? "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ" : "Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: authMode === "register" ? name.trim() : undefined,
          isRegister: authMode === "register",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === "kh" ? "ការចូលគណនីបានបរាជ័យ" : "Sign in failed"));
      }

      if (data.user) {
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message || (language === "kh" ? "មានបញ្ហាក្នុងការផ្ទៀងផ្ទាត់" : "Authentication error"));
    } finally {
      setLoading(false);
    }
  };

  // Genuine Google OAuth 2.0 Web Flow
  const handleGoogleSignInClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && clientId.trim()) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectUri = `${origin}/api/auth/google/callback`;
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        clientId.trim()
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`;
      window.location.href = googleAuthUrl;
    } else {
      setError(
        language === "kh"
          ? "Google OAuth មិនទាន់ត្រូវបានកំណត់ Client ID នៅឡើយទេ។ សូមចូលគណនីតាមរយៈ អ៊ីមែល និង ពាក្យសម្ងាត់។"
          : "Google OAuth Client ID is not configured yet. Please sign in with email and password."
      );
    }
  };

  // Telegram Authentication Handler
  const handleTelegramSignInClick = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. If running inside Telegram Mini App, use initData
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.initData) {
        const initData = (window as any).Telegram.WebApp.initData;
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          onLogin(data.user);
          return;
        }
      }

      // 2. Check if window.Telegram?.WebApp?.initDataUnsafe?.user is present
      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser) {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widgetData: {
              id: tgUser.id,
              first_name: tgUser.first_name,
              last_name: tgUser.last_name,
              username: tgUser.username,
              photo_url: tgUser.photo_url,
            },
          }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          onLogin(data.user);
          return;
        }
      }

      // 3. Fallback for external web browser: Open Telegram Bot to link/auth
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YamahaConverterBot";
      window.open(`https://t.me/${botUsername}`, "_blank");
    } catch (err: any) {
      setError(err.message || (language === "kh" ? "ការតភ្ជាប់ Telegram បរាជ័យ" : "Telegram connection failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#070b14] p-0 sm:p-6 transition-colors duration-200">
      {/* Clean Ambient Studio Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-b from-slate-100/80 via-slate-50 to-slate-100/80 dark:from-[#0a0f1d] dark:via-[#070b14] dark:to-[#05070d]" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-brand-500/10 dark:bg-brand-500/10 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-purple-500/10 dark:bg-purple-500/10 blur-[100px] pointer-events-none -z-10" />

      {/* Top-Right Floating Controls (Language & Theme) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-xl border border-slate-300/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-1 backdrop-blur-md shadow-sm">
        <LanguageSwitcher />
        <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-[0.97]"
          aria-label="Toggle Theme"
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
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Split-Screen Login Card */}
      <div className="login-card grid w-full max-w-[760px] overflow-hidden bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 sm:rounded-2xl lg:min-h-[580px] lg:grid-cols-[330px_1fr] dark:bg-[#020817] dark:shadow-black/70 dark:ring-white/10">
        {/* Left Hero Sidebar (Desktop - Clean Studio Aesthetics) */}
        <aside className="relative hidden shrink-0 flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0b1020] via-[#080d1a] to-[#04060d] text-white lg:flex border-r border-white/5">
          {/* Subtle Studio Glow Highlights */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-16 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -ml-20" />

          {/* Top Branding Section */}
          <div className="relative px-7 pt-[34px] z-10">
            <div className="size-[52px] overflow-hidden rounded-[14px] bg-white/95 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_10px_28px_-12px_rgba(0,0,0,0.5)] flex items-center justify-center">
              <Image
                src="/logomark.svg"
                alt="Yamaha ExpVoice Studio Logomark"
                width={36}
                height={36}
                className="rounded-lg"
              />
            </div>
            <h2 className="mt-4 font-heading text-[22px] leading-tight font-bold tracking-[-0.77px] text-white">
              ExpVoice Studio
            </h2>
            <p className="mt-1 text-[11px] font-medium text-slate-400 tracking-wide">
              Yamaha PPI / PPF / YEP Suite
            </p>
          </div>

          {/* Middle Sound Wave / Synthesizer Graphic */}
          <div className="relative px-7 py-6 z-10 space-y-4">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-medium">
                <span>AWM2 Synthesis Engine</span>
                <span className="text-emerald-400 font-mono text-[10px]">44.1kHz • 16-Bit</span>
              </div>
              {/* Animated / Soundwave Frequency Bars */}
              <div className="flex items-end gap-1 h-10 pt-2">
                {[40, 65, 85, 45, 95, 70, 50, 80, 100, 60, 75, 90, 55, 85, 65, 40, 70, 95, 50, 35].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-full bg-gradient-to-t from-brand-500/60 to-cyan-400/80 transition-all duration-300"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-brand-400" />
                <span>Lossless Voice & Wave Transcoder</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-brand-400" />
                <span>PSR-SX / Genos / S-Series Compatibility</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-brand-400" />
                <span>Khmer & World Acoustic Presets</span>
              </div>
            </div>
          </div>

          {/* Bottom Information Section */}
          <div className="relative px-7 pb-6 z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Neon Cloud DB &bull; AWM2 v2.5</span>
            </div>
            <div className="my-3 h-px w-10 bg-white/20" />
            <p className="text-[10px] tracking-[1.4px] text-slate-400 uppercase leading-relaxed">
              Professional Yamaha Expansion Voice File Converter System
            </p>
          </div>
        </aside>

        {/* Right Form Main Section */}
        <main className="flex flex-col justify-center px-5 py-8 sm:px-8 lg:justify-start lg:pt-[28px] lg:pb-6">
          <div className="mx-auto w-full max-w-[350px]">
            {/* Mobile Brand (lg:hidden) */}
            <div className="mb-4 flex items-center justify-center gap-2.5 lg:hidden">
              <Logo variant="compact" size="sm" />
            </div>

            {/* Header Title & Subtitle */}
            <div className="text-center">
              <h1 className="mb-1 font-heading text-[24px] sm:text-[26px] font-bold tracking-[-0.65px] text-slate-900 dark:text-white">
                {authMode === "register"
                  ? (language === "kh" ? "ចុះឈ្មោះគណនីថ្មី" : "Create Account")
                  : (language === "kh" ? "ចូលគណនីប្រព័ន្ធ" : "Sign In to Studio")}
              </h1>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">
                {authMode === "register"
                  ? (language === "kh" ? "បង្កើតគណនីដើម្បីបំប្លែងឯកសារ និងគ្រប់គ្រង Voices" : "Register to convert files and manage expansion voices")
                  : (language === "kh" ? "សូមបញ្ចូលគណនីរបស់អ្នកដើម្បីដំណើរការប្រព័ន្ធ" : "Enter your credentials to access ExpVoice Studio")}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-4 flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signin");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authMode === "signin"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {language === "kh" ? "ចូលគណនី" : "Sign In"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authMode === "register"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {language === "kh" ? "ចុះឈ្មោះថ្មី" : "Register"}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-[10px] border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12.5px] text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleCredentialsAuth} className="mt-4 space-y-3.5">
              {/* Full Display Name (Only when Registering) */}
              {authMode === "register" && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
                    <User className="size-3.5" />
                    <span>{language === "kh" ? "ឈ្មោះពេញរបស់អ្នក" : "Full Display Name"}</span>
                    <span className="text-brand-600 dark:text-brand-400">*</span>
                  </label>
                  <div className="flex h-11 items-center gap-2.5 rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020817] px-3.5 transition-[border-color,box-shadow] focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-500/20">
                    <User className="size-4 shrink-0 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder={language === "kh" ? "ឧ. សុខ ពិសិដ្ឋ" : "e.g. Alex Thorne"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Identifier / Email */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
                  <Mail className="size-3.5" />
                  <span>{language === "kh" ? "អ៊ីមែល ឬ ឈ្មោះគណនី" : "Email or Username"}</span>
                  <span className="text-brand-600 dark:text-brand-400">*</span>
                </label>
                <div className="flex h-11 items-center gap-2.5 rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020817] px-3.5 transition-[border-color,box-shadow] focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-500/20">
                  <Mail className="size-4 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder={language === "kh" ? "musician@yamaha-studio.com" : "musician@yamaha-studio.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
                    <Lock className="size-3.5" />
                    <span>{language === "kh" ? "ពាក្យសម្ងាត់" : "Password"}</span>
                    <span className="text-brand-600 dark:text-brand-400">*</span>
                  </label>
                </div>
                <div className="flex h-11 items-center gap-2.5 rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#020817] px-3.5 transition-[border-color,box-shadow] focus-within:border-brand-500 focus-within:ring-[3px] focus-within:ring-brand-500/20">
                  <Lock className="size-4 shrink-0 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={authMode === "register" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group/btn relative flex h-11 w-full items-center justify-center overflow-hidden rounded-[10px] text-[15px] font-semibold transition-[background-color,box-shadow,color] duration-300 shadow-sm bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#f2f2f2] dark:text-black dark:hover:bg-white active:scale-[0.98] disabled:opacity-70 mt-1 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin dark:border-black/30 dark:border-t-black" />
                    <span>{language === "kh" ? "កំពុងផ្ទៀងផ្ទាត់..." : "Verifying..."}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>
                      {authMode === "register"
                        ? (language === "kh" ? "ចុះឈ្មោះ និងចូលប្រព័ន្ធ" : "Register & Sign In")
                        : (language === "kh" ? "ចូលគណនី" : "Sign In")}
                    </span>
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="pt-2">
                <div className="relative flex py-1.5 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {language === "kh" ? "ឬចូលតាម" : "OR CONTINUE WITH"}
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                </div>

                {/* Google & Telegram Social Login Buttons */}
                <div className="grid grid-cols-2 gap-2.5 mt-2">
                  {/* Google Login Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignInClick}
                    disabled={loading}
                    className="flex h-10.5 items-center justify-center gap-2 rounded-[10px] border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition active:scale-[0.98] cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  {/* Telegram Login Button */}
                  <button
                    type="button"
                    onClick={handleTelegramSignInClick}
                    disabled={loading}
                    className="flex h-10.5 items-center justify-center gap-2 rounded-[10px] border border-sky-300 dark:border-sky-800/80 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-100/60 dark:hover:bg-sky-900/40 text-xs font-semibold text-sky-700 dark:text-sky-300 shadow-sm transition active:scale-[0.98] cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-[#229ED9] shrink-0" />
                    <span>Telegram</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Footer Notice */}
            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-brand-500" />
                <span>Neon PostgreSQL Cloud</span>
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HMAC Secure</span>
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
