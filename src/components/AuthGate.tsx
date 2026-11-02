"use client";

import React, { useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { UserSession } from "@/components/AuthModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Mail,
  KeyRound,
  User,
  ShieldCheck,
  Repeat,
  Binary,
  Brain,
  Moon,
  Sun,
  AlertCircle,
  Send,
  Database,
  CheckCircle2,
} from "lucide-react";

interface AuthGateProps {
  onLogin: (user: UserSession) => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onLogin,
  darkMode,
  onToggleTheme,
}) => {
  const { t, language } = useTranslation();
  const [authMode, setAuthMode] = useState<"signin" | "register" | "social">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
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

  // Google Authentication
  const handleGoogleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setError(language === "kh" ? "សូមបញ្ចូលអ៊ីមែល Google" : "Google email is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail.trim(),
          name: googleName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === "kh" ? "ការផ្ទៀងផ្ទាត់ Google បរាជ័យ" : "Google verification failed"));
      }

      if (data.user) {
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message || (language === "kh" ? "មានបញ្ហាក្នុងការផ្ទៀងផ្ទាត់ Google" : "Google authentication error"));
    } finally {
      setLoading(false);
    }
  };

  // Telegram Authentication
  const handleTelegramAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramUsername.trim()) {
      setError(language === "kh" ? "សូមបញ្ចូលឈ្មោះគណនី Telegram" : "Telegram username is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: telegramUsername.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === "kh" ? "ការតភ្ជាប់ Telegram បរាជ័យ" : "Telegram connection failed"));
      }

      if (data.user) {
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message || (language === "kh" ? "មានបញ្ហាក្នុងការតភ្ជាប់ Telegram" : "Telegram connection error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/20">
            Y
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                YAMAHA
              </span>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                Expansion Studio
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              PPI to PPF / YEP Converter &bull; AWM2 Inspector &bull; Sound AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header Card */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 shadow-sm mb-1">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {language === "kh" ? "ចូលគណនីដើម្បីប្រើប្រាស់ប្រព័ន្ធ" : "Sign In Required to Access System"}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {language === "kh"
                ? "សូមចូលគណនីរបស់អ្នកដើម្បីដំណើរការប្រព័ន្ធបំប្លែងឯកសារ Yamaha PPI/PPF, AWM2 Inspector និង Sound AI Agent។"
                : "Please sign in to access the Yamaha PPI/PPF Converter, AWM2 Inspector, and Sound AI Agent."}
            </p>
          </div>

          {/* Authentication Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-5">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
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
              <button
                type="button"
                onClick={() => {
                  setAuthMode("social");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authMode === "social"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {language === "kh" ? "Google / TG" : "Google / TG"}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* EMAIL / PASSWORD FORM */}
            {(authMode === "signin" || authMode === "register") && (
              <form onSubmit={handleCredentialsAuth} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {language === "kh" ? "អ៊ីមែល ឬ ឈ្មោះគណនី" : "Email or Username"}
                  </label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder={language === "kh" ? "ឧទាហរណ៍៖ musician@yamaha-studio.com" : "e.g. musician@yamaha-studio.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    />
                  </div>
                </div>

                {authMode === "register" && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {language === "kh" ? "ឈ្មោះពេញរបស់អ្នក" : "Full Display Name"}
                    </label>
                    <div className="relative mt-1">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        placeholder={language === "kh" ? "ឈ្មោះរបស់អ្នក" : "e.g. Alex Thorne"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {language === "kh" ? "ពាក្យសម្ងាត់" : "Password"}
                  </label>
                  <div className="relative mt-1">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-xs font-semibold gap-2 shadow-md shadow-brand-500/20 mt-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {loading
                      ? (language === "kh" ? "កំពុងផ្ទៀងផ្ទាត់..." : "Verifying Session...")
                      : authMode === "register"
                      ? (language === "kh" ? "ចុះឈ្មោះ និងចូលប្រព័ន្ធ" : "Register & Enter Studio")
                      : (language === "kh" ? "ចូលគណនីប្រព័ន្ធ" : "Sign In to Studio")}
                  </span>
                </Button>
              </form>
            )}

            {/* SOCIAL / OAUTH FORM */}
            {authMode === "social" && (
              <div className="space-y-4">
                {/* Google Sign In */}
                <form onSubmit={handleGoogleAuth} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
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
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "kh" ? "ចូលតាមគណនី Google" : "Continue with Google"}
                    </span>
                  </div>

                  <input
                    type="email"
                    required
                    placeholder="musician@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !googleEmail.trim()}
                    className="w-full text-xs font-semibold"
                  >
                    {loading
                      ? (language === "kh" ? "កំពុងផ្ទៀងផ្ទាត់..." : "Verifying...")
                      : (language === "kh" ? "ផ្ទៀងផ្ទាត់គណនី Google" : "Sign In with Google")}
                  </Button>
                </form>

                {/* Telegram Sign In */}
                <form onSubmit={handleTelegramAuth} className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/20 dark:bg-sky-950/20 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#229ED9] shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "kh" ? "ចូលតាម Telegram Username" : "Continue with Telegram"}
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="@telegram_username"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !telegramUsername.trim()}
                    className="w-full text-xs font-semibold bg-[#229ED9] hover:bg-[#1E8BC0] text-white"
                  >
                    {loading
                      ? (language === "kh" ? "កំពុងតភ្ជាប់..." : "Connecting...")
                      : (language === "kh" ? "ភ្ជាប់គណនី Telegram" : "Connect Telegram")}
                  </Button>
                </form>
              </div>
            )}

            {/* Cloud Persistence Notice */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
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

          {/* System Capabilities Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mb-1">
                <Repeat className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {language === "kh" ? "បំប្លែង PPI ទៅ PPF/YEP" : "Genuine Conversion"}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                {language === "kh"
                  ? "វិភាគ binary blocks និង wave samples 100% មិនបាត់បង់គុណភាពសំឡេង"
                  : "100% loss-free binary container parsing for SX900/SX700 & Genos"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1">
                <Binary className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {language === "kh" ? "AWM2 Hex Inspector" : "AWM2 Deep Inspector"}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                {language === "kh"
                  ? "ពិនិត្យមើល Header, Keymaps, PCM Wave Tables និង Voice Presets"
                  : "Inspect raw PCM wave headers, sample maps, and voice presets"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-1">
                <Brain className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {language === "kh" ? "Sound AI Assistant" : "Sound AI Assistant"}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                {language === "kh"
                  ? "ផ្តល់ដំបូន្មានតន្ត្រី ពិនិត្យភាពត្រូវគ្នា និងណែនាំការបង្កើតសំឡេង"
                  : "AI-assisted expansion voice curation & hardware compatibility"}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
