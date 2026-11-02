import { NextRequest, NextResponse } from "next/server";
import { getUserByEmailOrUsername } from "@/lib/db/pg";

const TELEGRAM_MAX_DOCUMENT_BYTES = 50 * 1024 * 1024; // 50 MB limit for Telegram Bot API sendDocument

/**
 * ==============================================================================
 * API ENDPOINT: POST /api/telegram/send
 * ==============================================================================
 * Sends a converted Yamaha package (.ppf, .yep, .vce) as a document directly
 * to a user's Telegram chat or group via Telegram Bot API (sendDocument).
 *
 * For files exceeding Telegram's 50 MB document limit, sends an informative
 * conversion notification message with details and web download instructions.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const isNotificationOnly = formData.get("isNotificationOnly") === "true";
    const file = formData.get("file") as File | null;
    const rawChatId = (formData.get("chatId") as string)?.trim();
    const customBotToken = (formData.get("botToken") as string)?.trim();
    const filename = (formData.get("filename") as string) || file?.name || "Yamaha_Package.ppf";
    const fileSizeBytes = Number(formData.get("fileSizeBytes")) || file?.size || 0;
    const caption = (formData.get("caption") as string) || "Yamaha Converted Package from ExpVoice Studio";

    if (!file && !isNotificationOnly) {
      return NextResponse.json(
        { error: "No file provided for Telegram transfer." },
        { status: 400 }
      );
    }

    if (!rawChatId) {
      return NextResponse.json(
        { error: "Telegram Chat ID or Username is required." },
        { status: 400 }
      );
    }

    // Determine target chat ID (resolve username to numeric ID if possible)
    let chatId = rawChatId;
    if (!/^-?\d+$/.test(chatId)) {
      const cleanUsername = chatId.replace(/^@/, "");
      try {
        const found = await getUserByEmailOrUsername(cleanUsername);
        if (found) {
          if (found.id.startsWith("usr_tg_")) {
            chatId = found.id.replace("usr_tg_", "");
          }
        }
      } catch (err) {
        console.warn("Could not resolve username to chat ID:", err);
      }
    }

    // Determine bot token (custom token provided by user or server env token)
    const token = customBotToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error: "NO_BOT_TOKEN",
          message: "No Telegram Bot Token configured. Please set TELEGRAM_BOT_TOKEN in .env.local or enter a custom token.",
        },
        { status: 400 }
      );
    }

    // If notification-only requested OR file exceeds Telegram's 50 MB document limit
    if (isNotificationOnly || (file && file.size > TELEGRAM_MAX_DOCUMENT_BYTES)) {
      const sizeMB = (fileSizeBytes / 1024 / 1024).toFixed(1);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yamaha-ppi-to-ppf-converter.vercel.app";

      const notifyText =
        `*Yamaha Pack Converted Successfully!*\n\n` +
        `• File: \`${filename}\`\n` +
        `• Size: \`${sizeMB} MB\` (exceeds Telegram Bot API 50 MB upload limit)\n` +
        `• Status: Converted and ready on your device\n\n` +
        `Notice: Telegram Bot API restricts direct document delivery to files under 50 MB.\n` +
        `Your converted package is available directly on your device and via the ExpVoice Studio WebApp:\n${appUrl}`;

      const notifyRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: notifyText,
          parse_mode: "Markdown",
        }),
      });

      const notifyData = await notifyRes.json();

      if (!notifyData.ok) {
        if (notifyData.error_code === 400 && notifyData.description?.includes("chat not found")) {
          return NextResponse.json(
            {
              error: "CHAT_NOT_FOUND",
              message: `Telegram could not find chat '${rawChatId}'. Please start a conversation with the bot first by clicking /start, or verify your numeric Chat ID.`,
              details: notifyData.description,
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            error: "TELEGRAM_API_ERROR",
            message: notifyData.description || "Failed to deliver Telegram notification.",
            details: notifyData,
          },
          { status: notifyData.error_code || 500 }
        );
      }

      return NextResponse.json({
        success: true,
        notice: "LARGE_FILE_NOTIFICATION",
        message: `File is ${sizeMB} MB (over 50 MB limit). A conversion receipt and details have been sent to your Telegram chat. Please download the file directly from the studio dashboard.`,
        chat: notifyData.result?.chat,
        filename,
      });
    }

    // File is <= 50 MB: Send as document attachment
    const tgFormData = new FormData();
    tgFormData.append("chat_id", chatId);
    tgFormData.append("document", file!, file!.name);
    tgFormData.append("caption", caption);

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: tgFormData,
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
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
            message: `Telegram could not find chat '${rawChatId}'. If using a personal username (@username), note that Telegram requires a numeric Chat ID or a prior /start message to the bot.`,
            details: tgData.description,
          },
          { status: 400 }
        );
      }

      if (tgData.error_code === 403) {
        return NextResponse.json(
          {
            error: "BOT_BLOCKED",
            message: "The bot was blocked by this user or lacks permission to message this chat. Please unblock the bot and press /start.",
            details: tgData.description,
          },
          { status: 403 }
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
      filename: filename,
    });
  } catch (error: any) {
    console.error("Telegram send error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
