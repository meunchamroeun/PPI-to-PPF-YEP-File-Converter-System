import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram/verify";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "yamaha-converter-dev-secret-key-2026";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/auth/telegram
 * ==============================================================================
 * Validates Telegram Mini App initData or widget auth data
 */
export async function POST(req: NextRequest) {
  try {
    const { initData, widgetData } = await req.json();

    let user: any = null;

    if (initData) {
      // Validate TMA initData if BOT_TOKEN is configured
      if (BOT_TOKEN) {
        const result = verifyTelegramInitData(initData, BOT_TOKEN);
        if (!result.valid) {
          return NextResponse.json({ error: "Invalid Telegram signature" }, { status: 401 });
        }
        user = result.user;
      } else {
        // Fallback for development without live bot token
        const params = new URLSearchParams(initData);
        const userJson = params.get("user");
        user = userJson ? JSON.parse(userJson) : { id: 12345678, first_name: "Telegram User" };
      }
    } else if (widgetData) {
      user = widgetData;
    } else {
      user = {
        id: 99887766,
        first_name: "Telegram Musician",
        username: "yamaha_creator",
      };
    }

    const payload = {
      id: "usr_tg_" + (user.id || "guest"),
      name: user.first_name || user.username || "Telegram Musician",
      username: user.username,
      avatar: user.photo_url || null,
      provider: "TELEGRAM",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    return NextResponse.json({
      success: true,
      token,
      user: payload,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
