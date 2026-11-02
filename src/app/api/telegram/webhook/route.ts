import { NextRequest, NextResponse } from "next/server";
import { createTelegramBot } from "@/lib/telegram/bot";

const bot = createTelegramBot();

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/telegram/webhook
 * ==============================================================================
 * Webhook handler for Telegram Bot updates
 */
export async function POST(req: NextRequest) {
  if (!bot) {
    return NextResponse.json({ status: "Telegram Bot not configured" });
  }

  try {
    const update = await req.json();
    await bot.handleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
