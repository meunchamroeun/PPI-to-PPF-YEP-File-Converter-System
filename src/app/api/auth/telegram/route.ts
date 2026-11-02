import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram/verify";
import { saveUserRecord, getUserByEmailOrUsername } from "@/lib/db/pg";
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
    const { initData, widgetData, role } = await req.json();

    let tgUser: any = null;

    if (initData) {
      if (BOT_TOKEN) {
        const result = verifyTelegramInitData(initData, BOT_TOKEN);
        if (!result.valid) {
          return NextResponse.json({ error: "Invalid Telegram signature" }, { status: 401 });
        }
        tgUser = result.user;
      } else {
        const params = new URLSearchParams(initData);
        const userJson = params.get("user");
        tgUser = userJson ? JSON.parse(userJson) : { id: 88776655, first_name: "Yamaha Keyboardist", username: "yamaha_synth_pro" };
      }
    } else if (widgetData) {
      tgUser = widgetData;
    } else {
      tgUser = {
        id: 88776655,
        first_name: "Yamaha Keyboardist",
        username: "yamaha_synth_pro",
      };
    }

    const userId = "usr_tg_" + (tgUser.id || "guest");
    const existing = await getUserByEmailOrUsername(tgUser.username || userId);

    const savedUser = await saveUserRecord({
      id: existing ? existing.id : userId,
      name: (tgUser.first_name || "") + (tgUser.last_name ? ` ${tgUser.last_name}` : "") || "Yamaha Keyboardist",
      username: tgUser.username || "yamaha_synth_pro",
      avatar: tgUser.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      provider: "TELEGRAM",
      role: existing ? existing.role : role === "ADMIN" ? "ADMIN" : "USER",
      status: "ACTIVE",
    });

    const token = jwt.sign(
      {
        id: savedUser.id,
        username: savedUser.username,
        name: savedUser.name,
        role: savedUser.role,
        provider: savedUser.provider,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      user: savedUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
