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
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
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
      setErrorMessage(
        language === "kh"
          ? "Google OAuth មិនទាន់ត្រូវបានកំណត់ Client ID នៅឡើយទេ។ សូមចូលគណនីតាមរយៈ អ៊ីមែល និង ពាក្យសម្ងាត់។"
          : "Google OAuth Client ID is not configured yet. Please sign in with email and password."
      );
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
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  !isRegisterMode
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {language === "kh" ? "ចូលគណនី" : "Sign In"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  isRegisterMode
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {language === "kh" ? "ចុះឈ្មោះថ្មី" : "Register"}
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* CREDENTIALS FORM */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}

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
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

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
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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

              {/* Genuine Google Alternative */}
              <div className="pt-2">
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {language === "kh" ? "ឬ" : "OR"}
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  className="w-full mt-2 flex items-center justify-center gap-2.5 h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
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
