"use client";

import { useEffect, useState } from "react";

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function useTelegramWebApp() {
  const [isReady, setIsReady] = useState(false);
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [user, setUser] = useState<TelegramWebAppUser | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      setIsInTelegram(true);
      setIsReady(true);

      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }

      // Sync Telegram window header & background color
      try {
        const isLight = tg.colorScheme === "light";
        if (typeof tg.setHeaderColor === "function") {
          tg.setHeaderColor(isLight ? "#ffffff" : "#0b0f19");
        }
        if (typeof tg.setBackgroundColor === "function") {
          tg.setBackgroundColor(isLight ? "#f8fafc" : "#0b0f19");
        }
      } catch (_) {
        // Fallback for older Telegram clients
      }
    }
  }, []);

  const triggerHaptic = (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium") => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  };

  const notifyHaptic = (type: "error" | "success" | "warning") => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred(type);
    }
  };

  return {
    isReady,
    isInTelegram,
    user,
    triggerHaptic,
    notifyHaptic,
  };
}
