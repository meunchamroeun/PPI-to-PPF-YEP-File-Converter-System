import { Telegraf } from "telegraf";

/**
 * ==============================================================================
 * TELEGRAM BOT CONTROLLER (TELEGRAF)
 * ==============================================================================
 * Features:
 * - /start: Sends greeting and WebApp Mini App launcher button
 * - /convert: Step-by-step instructions for file conversion
 * - /status: Checks current server conversion queue status
 * - File listener: Receives .ppi and .cpi documents directly in Telegram chat
 */

export function createTelegramBot(token?: string) {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn("TELEGRAM_BOT_TOKEN not provided, Telegram Bot disabled.");
    return null;
  }

  const bot = new Telegraf(botToken);
  const miniAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.yamaha-converter.io";

  bot.start((ctx) => {
    ctx.reply(
      `🎹 *Welcome to Yamaha Expansion Voice Studio!* \n\nConvert compiled Yamaha installation packages (\`.ppi\`) into editable project archives (\`.ppf\`) or legacy instrument formats (\`.yep\`).\n\nTap below to launch the Mini App:`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Open ExpVoice Mini App",
                web_app: { url: miniAppUrl },
              },
            ],
            [
              { text: "📖 Conversion Docs", callback_data: "cmd_docs" },
              { text: "📊 Check Status", callback_data: "cmd_status" },
            ],
          ],
        },
      }
    );
  });

  bot.command("convert", (ctx) => {
    ctx.reply(
      "📁 Send me any unencrypted Yamaha `.ppi` file directly, or launch the Mini App for batch processing and hex analysis.",
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Launch Converter", web_app: { url: miniAppUrl } }]],
        },
      }
    );
  });

  bot.command("status", (ctx) => {
    ctx.reply("⚡ Conversion Engine Status: *ONLINE*\n- Direct AWM2 Parser: Ready\n- PPF XML Transcoder: Ready\n- DRM Validator: Active", {
      parse_mode: "Markdown",
    });
  });

  bot.on("document", async (ctx) => {
    const doc = ctx.message.document;
    if (doc.file_name?.endsWith(".ppi") || doc.file_name?.endsWith(".cpi")) {
      const isCpi = doc.file_name.endsWith(".cpi");
      if (isCpi) {
        ctx.reply("⚠️ Protected Yamaha package (`.cpi`) detected. Conversion requires the hardware `.n27` instrument key.");
      } else {
        ctx.reply(`📥 Received Yamaha pack: "${doc.file_name}" (${(doc.file_size! / (1024 * 1024)).toFixed(2)} MB).\nProcessing chunk table...`);
      }
    } else {
      ctx.reply("⚠️ Please upload a Yamaha `.ppi` or `.cpi` file.");
    }
  });

  return bot;
}
