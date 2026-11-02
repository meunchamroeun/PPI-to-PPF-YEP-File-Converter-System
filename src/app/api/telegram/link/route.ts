import { NextRequest, NextResponse } from "next/server";
import { createTelegramLinkToken, getTelegramLinkStatus } from "@/lib/db/pg";

/**
 * ==============================================================================
 * API ENDPOINT: /api/telegram/link
 * ==============================================================================
 * Generates and polls one-time Telegram deep links for 100% automatic connection.
 * When the user clicks "Start" in Telegram, the bot resolves this token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId as string | undefined;

    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "PPI_PPF_ConvertBot";
    const linkRecord = await createTelegramLinkToken(userId);

    const deepLinkUrl = `https://t.me/${botUsername}?start=link_${linkRecord.token}`;

    return NextResponse.json({
      token: linkRecord.token,
      url: deepLinkUrl,
      botUsername,
      expiresAt: linkRecord.expiresAt,
    });
  } catch (error: any) {
    console.error("Create telegram link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const status = await getTelegramLinkStatus(token);
    if (!status) {
      return NextResponse.json({ linked: false, expired: true });
    }

    return NextResponse.json({
      linked: !!status.linked,
      chatId: status.chatId || null,
      username: status.username || null,
      firstName: status.firstName || null,
    });
  } catch (error: any) {
    console.error("Check telegram link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
