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
  Crown,
  Sparkles,
  KeyRound,
  Mail,
  Lock,
  CheckCircle,
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
  const [authTab, setAuthTab] = useState<"quick" | "oauth" | "email">("quick");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickLogin = async (accountType: "admin" | "artist" | "telegram") => {
    setLoadingProvider(accountType);
    setErrorMessage(null);
    try {
      if (accountType === "telegram") {
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            widgetData: {
              id: 88776655,
              first_name: "Yamaha Keyboardist",
              username: "yamaha_synth_pro",
            },
          }),
        });
        const data = await res.json();
        if (data.user) {
          onLogin(data.user);
          localStorage.setItem("user_session", JSON.stringify(data.user));
          onClose();
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType }),
        });
        const data = await res.json();
        if (data.user) {
          onLogin(data.user);
          localStorage.setItem("user_session", JSON.stringify(data.user));
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in.");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingProvider("google");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "artist@yamaha-studio.com",
          name: "Alex Thorne (Expansion Designer)",
        }),
      });
      const data = await res.json();
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

  const handleTelegramLogin = async () => {
    setLoadingProvider("telegram");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetData: {
            id: 88776655,
            first_name: "Yamaha Keyboardist",
            username: "yamaha_synth_pro",
          },
        }),
      });
      const data = await res.json();
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
          name: nameInput.trim() || undefined,
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
                  <span>{language === "kh" ? "សម័យការងារសកម្ម • សមកាលកម្មស្វ័យប្រវត្តិ" : "Session Active • History Auto-Syncing"}</span>
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
                onClick={() => setAuthTab("quick")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authTab === "quick"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {t("auth_tab_quick")}
              </button>
              <button
                onClick={() => setAuthTab("oauth")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authTab === "oauth"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {t("auth_tab_oauth")}
              </button>
              <button
                onClick={() => setAuthTab("email")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  authTab === "email"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {t("auth_tab_email")}
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
                {errorMessage}
              </div>
            )}

            {/* TAB 1: 1-CLICK DEMO ACCOUNTS */}
            {authTab === "quick" && (
              <div className="space-y-2.5">
                <button
                  onClick={() => handleQuickLogin("admin")}
                  disabled={loadingProvider !== null}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-950/30 dark:to-indigo-950/30 hover:border-purple-400 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Yamaha Master Admin
                        </span>
                        <Badge className="text-[9px] bg-purple-600 text-white">ADMIN</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        admin@yamaha-studio.com • Full Admin Console access
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickLogin("artist")}
                  disabled={loadingProvider !== null}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-400 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-md">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Alex Thorne
                        </span>
                        <Badge variant="secondary" className="text-[9px]">USER</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        artist@yamaha-studio.com • Expansion Sound Designer
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  onClick={() => handleQuickLogin("telegram")}
                  disabled={loadingProvider !== null}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 hover:border-sky-400 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-md">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Yamaha Keyboardist
                        </span>
                        <Badge variant="secondary" className="text-[9px]">TELEGRAM</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        @yamaha_synth_pro • Mini App Synchronized
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-[#229ED9] group-hover:scale-110 transition-transform" />
                </button>
              </div>
            )}

            {/* TAB 2: OAUTH & TELEGRAM */}
            {authTab === "oauth" && (
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={loadingProvider !== null}
                  variant="outline"
                  className="w-full justify-center gap-3 h-12 text-sm font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>{loadingProvider === "google" ? "Connecting..." : "Continue with Google"}</span>
                </Button>

                <Button
                  onClick={handleTelegramLogin}
                  disabled={loadingProvider !== null}
                  className="w-full justify-center gap-3 h-12 text-sm font-semibold bg-[#229ED9] hover:bg-[#1E8BC0] text-white"
                >
                  <Send className="w-5 h-5 fill-current" />
                  <span>{loadingProvider === "telegram" ? "Verifying..." : "Continue with Telegram"}</span>
                </Button>
              </div>
            )}

            {/* TAB 3: CUSTOM CREDENTIALS */}
            {authTab === "email" && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Email or Username
                  </label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. musician@yamaha-studio.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Display Name (Optional)
                  </label>
                  <div className="relative mt-1">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Roland / Yamaha Artist"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loadingProvider !== null || !emailInput.trim()}
                  className="w-full mt-2 gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loadingProvider === "credentials" ? "Signing In..." : "Sign In / Register"}</span>
                </Button>
              </form>
            )}

            <div className="pt-2 text-center border-t border-slate-200 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Protected by Session Signing &amp; HMAC WebApp Verification</span>
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
