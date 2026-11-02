import { NextRequest, NextResponse } from "next/server";

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/telegram/send
 * ==============================================================================
 * Sends a converted Yamaha package (.ppf, .yep, .vce) as a document directly
 * to a user's Telegram chat or group via Telegram Bot API (sendDocument).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const chatId = (formData.get("chatId") as string)?.trim();
    const customBotToken = (formData.get("botToken") as string)?.trim();
    const caption = (formData.get("caption") as string) || "Yamaha Converted Package from ExpVoice Studio";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided for Telegram transfer." },
        { status: 400 }
      );
    }

    if (!chatId) {
      return NextResponse.json(
        { error: "Telegram Chat ID or Username is required." },
        { status: 400 }
      );
    }

    // Determine bot token (custom token provided by user or server env token)
    const token = customBotToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error: "NO_BOT_TOKEN",
          message: "No Telegram Bot Token provided. Please enter a Bot Token from @BotFather.",
        },
        { status: 400 }
      );
    }

    // Prepare multipart/form-data for Telegram Bot API
    const tgFormData = new FormData();
    tgFormData.append("chat_id", chatId);
    tgFormData.append("document", file, file.name);
    tgFormData.append("caption", caption);

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: tgFormData,
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      // Handle known Telegram API error cases
      if (tgData.error_code === 401) {
        return NextResponse.json(
          {
            error: "UNAUTHORIZED_TOKEN",
            message: "The Telegram Bot Token is invalid or expired. Please check your token from @BotFather.",
            details: tgData.description,
          },
          { status: 401 }
        );
      }

      if (tgData.error_code === 400 && tgData.description?.includes("chat not found")) {
        return NextResponse.json(
          {
            error: "CHAT_NOT_FOUND",
            message: `Telegram could not find chat '${chatId}'. Ensure you have pressed /start with the bot first!`,
            details: tgData.description,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "TELEGRAM_API_ERROR",
          message: tgData.description || "Failed to send document to Telegram.",
          details: tgData,
        },
        { status: tgData.error_code || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: tgData.result?.message_id,
      chat: tgData.result?.chat,
      filename: file.name,
    });
  } catch (error: any) {
    console.error("Telegram send error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
