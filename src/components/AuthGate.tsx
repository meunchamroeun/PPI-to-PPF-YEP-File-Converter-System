"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Logo } from "@/components/ui/logo";
import { UserSession } from "@/components/AuthModal";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
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
  Monitor,
  AlertCircle,
  Database,
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

  // Google Identity Services (GIS) One-Tap / Button render if Client ID is configured
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || typeof window === "undefined") return;

    const initGIS = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      try {
        google.accounts.id.initialize({
          client_id: clientId.trim(),
          callback: async (response: any) => {
            if (response?.credential) {
              setLoading(true);
              try {
                const res = await fetch("/api/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ credential: response.credential }),
                });
                const data = await res.json();
                if (res.ok && data.user) {
                  onLogin(data.user);
                } else {
                  setError(data.error || (language === "kh" ? "ការផ្ទៀងផ្ទាត់ Google បរាជ័យ" : "Google verification failed"));
                }
              } catch (e: any) {
                setError(e.message || (language === "kh" ? "មានបញ្ហាក្នុងការផ្ទៀងផ្ទាត់ Google" : "Google authentication error"));
              } finally {
                setLoading(false);
              }
            }
          },
        });

        const btnContainer = document.getElementById("google_gis_btn_container");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          google.accounts.id.renderButton(btnContainer, {
            theme: darkMode ? "filled_black" : "outline",
            size: "large",
            shape: "rectangular",
            text: "continue_with",
            width: btnContainer.offsetWidth || 340,
          });
        }
      } catch (e) {
        console.warn("Google Identity Services initialization:", e);
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGIS();
    } else {
      const timer = setTimeout(initGIS, 1000);
      return () => clearTimeout(timer);
    }
  }, [darkMode, authMode, language]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <Logo variant="full" size="sm" />

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-[0.97]"
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
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* EMAIL / PASSWORD FORM */}
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
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
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
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
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
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

                {/* Direct Google Alternative Button */}
                <div className="pt-2">
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {language === "kh" ? "ឬ" : "OR"}
                    </span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  </div>

                  {/* Google Identity Services Container */}
                  <div id="google_gis_btn_container" className="w-full flex justify-center empty:hidden mt-2"></div>

                  <button
                    type="button"
                    onClick={handleGoogleSignInClick}
                    className="w-full mt-2 flex items-center justify-center gap-2.5 h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
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
                    <span>{language === "kh" ? "ចូលតាមគណនី Google" : "Continue with Google"}</span>
                  </button>
                </div>
              </form>

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
