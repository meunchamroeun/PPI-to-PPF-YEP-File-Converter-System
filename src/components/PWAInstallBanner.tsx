"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, WifiOff, Wifi, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export const PWAInstallBanner: React.FC = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showOnlineToast, setShowOnlineToast] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    if (typeof window !== "undefined") {
      const isApp =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isApp);

      // Online / Offline Listeners
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        setShowOnlineToast(true);
        setTimeout(() => setShowOnlineToast(false), 3000);
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Listen for PWA BeforeInstallPromptEvent
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        // Only show if user hasn't dismissed it in this session
        const dismissed = sessionStorage.getItem("pwa_install_dismissed");
        if (!dismissed) {
          setShowInstallBanner(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  return (
    <>
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="bg-amber-500/90 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 shadow-md z-50 sticky top-0 backdrop-blur">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              <strong>{t("pwa_offline_title")}:</strong> {t("pwa_offline_desc")}
            </span>
          </div>
          <span className="font-mono text-[10px] bg-amber-600/30 px-2 py-0.5 rounded uppercase">
            Offline Mode
          </span>
        </div>
      )}

      {/* Online Restored Toast */}
      {showOnlineToast && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-md z-50 sticky top-0 transition-opacity">
          <Wifi className="w-4 h-4" />
          <span>{t("pwa_online_title")}</span>
        </div>
      )}

      {/* PWA Install Banner (When installable and not running as standalone app) */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-16 lg:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 p-4 rounded-2xl bg-card text-card-foreground border border-border shadow-2xl shadow-brand-500/10 ring-1 ring-border/50 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs text-foreground leading-tight">
                {t("pwa_install_title")}
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t("pwa_install_desc")}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="gap-1.5 text-xs h-7 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("pwa_btn_install")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs h-7 px-2.5 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <span>{t("pwa_btn_dismiss")}</span>
                </Button>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
