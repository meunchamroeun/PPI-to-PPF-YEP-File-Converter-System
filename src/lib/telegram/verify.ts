import crypto from "crypto";

/**
 * ==============================================================================
 * TELEGRAM MINI APP (TMA) INITDATA HMAC VALIDATION
 * ==============================================================================
 * Official Telegram WebApp security verification:
 * 1. Parse raw initData query string
 * 2. Sort keys alphabetically (excluding 'hash')
 * 3. HMAC-SHA256 data_check_string using secret key generated from "WebAppData" + BOT_TOKEN
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export function verifyTelegramInitData(initDataString: string, botToken: string): { valid: boolean; user?: TelegramUser } {
  if (!initDataString || !botToken) {
    return { valid: false };
  }

  try {
    const urlParams = new URLSearchParams(initDataString);
    const hash = urlParams.get("hash");
    if (!hash) return { valid: false };

    urlParams.delete("hash");

    // Sort parameters alphabetically
    const paramsList: string[] = [];
    urlParams.forEach((val, key) => {
      paramsList.push(`${key}=${val}`);
    });
    paramsList.sort();
    const dataCheckString = paramsList.join("\n");

    // Generate secret key: HMAC_SHA256("WebAppData", botToken)
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();

    // Calculate verification hash
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (calculatedHash !== hash) {
      return { valid: false };
    }

    const userJson = urlParams.get("user");
    const user: TelegramUser | undefined = userJson ? JSON.parse(userJson) : undefined;

    return { valid: true, user };
  } catch (err) {
    console.error("Telegram initData verification failed:", err);
    return { valid: false };
  }
}
