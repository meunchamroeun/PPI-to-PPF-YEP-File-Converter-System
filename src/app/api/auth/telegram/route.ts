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
 * Validates Telegram Mini App initData, widget auth, or username
 */
export async function POST(req: NextRequest) {
  try {
    const { initData, widgetData, username } = await req.json();

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
        if (userJson) {
          tgUser = JSON.parse(userJson);
        }
      }
    } else if (widgetData) {
      tgUser = widgetData;
    } else if (username && username.trim()) {
      tgUser = {
        id: Math.floor(10000000 + Math.random() * 90000000),
        first_name: username.trim(),
        username: username.trim().replace(/^@/, ""),
      };
    }

    if (!tgUser) {
      return NextResponse.json({ error: "Telegram account verification data is required." }, { status: 400 });
    }

    const userId = "usr_tg_" + (tgUser.id || Math.random().toString(36).substring(2, 8));
    const cleanUsername = tgUser.username || "tg_user_" + tgUser.id;
    const existing = await getUserByEmailOrUsername(cleanUsername);

    if (existing && existing.status === "SUSPENDED") {
      return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
    }

    const savedUser = await saveUserRecord({
      id: existing ? existing.id : userId,
      name: (tgUser.first_name || "") + (tgUser.last_name ? ` ${tgUser.last_name}` : "") || cleanUsername,
      username: cleanUsername,
      avatar: tgUser.photo_url || existing?.avatar || null,
      provider: "TELEGRAM",
      role: existing ? existing.role : "USER",
      status: "ACTIVE",
      last_login_at: new Date(),
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
    return NextResponse.json({ error: error.message || "Failed to authenticate via Telegram." }, { status: 500 });
  }
}
