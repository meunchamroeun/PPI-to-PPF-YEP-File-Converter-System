"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  LogIn,
  Send,
  LogOut,
  User,
  ShieldCheck,
  KeyRound,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export interface UserSession {
  id: string;
  name: string;
  email?: string;
  username?: string;
  avatar?: string | null;
  provider: "GOOGLE" | "TELEGRAM" | "CREDENTIALS" | "GUEST";
  role: "ADMIN" | "USER";
  status?: "ACTIVE" | "SUSPENDED";
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onLogin: (user: UserSession) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const { t, language } = useTranslation();
  const [authTab, setAuthTab] = useState<"credentials" | "oauth">("credentials");
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [googleEmailInput, setGoogleEmailInput] = useState<string>("");
  const [googleNameInput, setGoogleNameInput] = useState<string>("");
  const [telegramUsernameInput, setTelegramUsernameInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setLoadingProvider("credentials");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          password: passwordInput,
          name: isRegisterMode ? nameInput.trim() : undefined,
          isRegister: isRegisterMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (data.user) {
        onLogin(data.user);
        localStorage.setItem("user_session", JSON.stringify(data.user));
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) return;

    setLoadingProvider("google");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmailInput.trim(),
          name: googleNameInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google authentication failed");
      if (data.user) {
        onLogin(data.user);
        localStorage.setItem("user_session", JSON.stringify(data.user));
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate with Google.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleTelegramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramUsernameInput.trim()) return;

    setLoadingProvider("telegram");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: telegramUsernameInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Telegram authentication failed");
      if (data.user) {
        onLogin(data.user);
        localStorage.setItem("user_session", JSON.stringify(data.user));
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate with Telegram.");
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-brand-600" />
            <span>{t("auth_modal_title")}</span>
          </DialogTitle>
          <DialogDescription>
            {t("auth_modal_desc")}
          </DialogDescription>
        </DialogHeader>

        {currentUser ? (
          <div className="space-y-4 py-3">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{currentUser.name}</h4>
                  <Badge
                    variant={currentUser.role === "ADMIN" ? "default" : "secondary"}
                    className={`text-[10px] ${
                      currentUser.role === "ADMIN" ? "bg-purple-600 text-white" : ""
                    }`}
                  >
                    {currentUser.role === "ADMIN" ? "ADMIN" : "USER"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser.email || (currentUser.username ? `@${currentUser.username}` : "Verified Account")}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>{language === "kh" ? "សម័យការងារសកម្ម • សមកាលកម្មស្វ័យប្រវត្តិ" : "Session Active • Database Synchronized"}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                {language === "kh" ? "បិទ" : "Close"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  localStorage.removeItem("user_session");
                  onLogout();
                  onClose();
                }}
                className="gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("auth_sign_out")}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("credentials");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authTab === "credentials"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {t("auth_tab_email")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("oauth");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authTab === "oauth"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {t("auth_tab_oauth")}
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: CREDENTIALS (SIGN IN & REGISTER) */}
            {authTab === "credentials" && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isRegisterMode
                      ? (language === "kh" ? "បង្កើតគណនីថ្មី" : "Create New Account")
                      : (language === "kh" ? "ចូលគណនីរបស់អ្នក" : "Sign In with Credentials")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode((prev) => !prev);
                      setErrorMessage(null);
                    }}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {isRegisterMode
                      ? (language === "kh" ? "មានគណនីរួចហើយ? ចូល" : "Already have account? Sign in")
                      : (language === "kh" ? "មិនទាន់មានគណនី? ចុះឈ្មោះ" : "Need account? Register")}
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {language === "kh" ? "អ៊ីមែល ឬ ឈ្មោះគណនី" : "Email or Username"}
                  </label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. musician@yamaha-studio.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {isRegisterMode && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {language === "kh" ? "ឈ្មោះពេញបង្ហាញ" : "Full Display Name"}
                    </label>
                    <div className="relative mt-1">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sok Piseth"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {language === "kh" ? "ពាក្យសម្ងាត់" : "Password"}
                  </label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loadingProvider !== null || !emailInput.trim() || !passwordInput.trim()}
                  className="w-full mt-2 gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {loadingProvider === "credentials"
                      ? (language === "kh" ? "កំពុងដំណើរការ..." : "Processing...")
                      : isRegisterMode
                      ? (language === "kh" ? "ចុះឈ្មោះ និងចូលប្រើ" : "Register & Sign In")
                      : (language === "kh" ? "ចូលគណនី" : "Sign In to Account")}
                  </span>
                </Button>
              </form>
            )}

            {/* TAB 2: GOOGLE & TELEGRAM VERIFICATION */}
            {authTab === "oauth" && (
              <div className="space-y-4">
                {/* Google Sign In Form */}
                <form onSubmit={handleGoogleSubmit} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
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
                      {language === "kh" ? "ចូលតាមគណនី Google" : "Continue with Google Account"}
                    </span>
                  </div>

                  <input
                    type="email"
                    required
                    placeholder="your-google-email@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={loadingProvider !== null || !googleEmailInput.trim()}
                    className="w-full h-8 text-xs font-semibold"
                  >
                    {loadingProvider === "google"
                      ? (language === "kh" ? "កំពុងផ្ទៀងផ្ទាត់..." : "Verifying Google...")
                      : (language === "kh" ? "ផ្ទៀងផ្ទាត់គណនី Google" : "Verify Google Account")}
                  </Button>
                </form>

                {/* Telegram Sign In Form */}
                <form onSubmit={handleTelegramSubmit} className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/20 dark:bg-sky-950/10 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#229ED9] shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {language === "kh" ? "ចូលតាមគណនី Telegram" : "Continue with Telegram Account"}
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="@telegram_username"
                    value={telegramUsernameInput}
                    onChange={(e) => setTelegramUsernameInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={loadingProvider !== null || !telegramUsernameInput.trim()}
                    className="w-full h-8 text-xs font-semibold bg-[#229ED9] hover:bg-[#1E8BC0] text-white"
                  >
                    {loadingProvider === "telegram"
                      ? (language === "kh" ? "កំពុងភ្ជាប់ Telegram..." : "Connecting Telegram...")
                      : (language === "kh" ? "ភ្ជាប់គណនី Telegram" : "Connect Telegram Account")}
                  </Button>
                </form>
              </div>
            )}

            <div className="pt-2 text-center border-t border-slate-200 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>{language === "kh" ? "ការពារដោយ Neon PostgreSQL Cloud & HMAC Verification" : "Protected by Neon PostgreSQL Cloud & HMAC Verification"}</span>
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
