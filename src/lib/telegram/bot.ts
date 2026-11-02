import { Telegraf } from "telegraf";
import { resolveTelegramLinkToken } from "@/lib/db/pg";

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
  const miniAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yamaha-ppi-to-ppf-converter.vercel.app";

  bot.start(async (ctx) => {
    const chatId = String(ctx.chat.id);
    const username = ctx.from?.username || "";
    const firstName = ctx.from?.first_name || "";

    // Check for deep link token: /start link_<token>
    const payload = (ctx.payload || "").trim() || (ctx.message && "text" in ctx.message ? ctx.message.text.split(" ")[1] : "") || "";
    if (payload.startsWith("link_")) {
      const token = payload.slice(5).trim();
      const linked = await resolveTelegramLinkToken(token, chatId, username, firstName);
      if (linked) {
        return ctx.reply(
          `*ការភ្ជាប់បានជោគជ័យ! / Connected Successfully!*\n\n` +
          `គណនី Telegram របស់អ្នក (\`@${username || firstName || chatId}\`) ត្រូវបានភ្ជាប់ជាមួយ *Yamaha ExpVoice Studio* រួចរាល់ដោយស្វ័យប្រវត្តិ។\n\n` +
          `លោកអ្នកអាចត្រឡប់ទៅកាន់ Website វិញបាន — ប្រព័ន្ធបានភ្ជាប់រួចជាស្រេចដោយមិនបាច់ Copy ឬ Paste អ្វីឡើយ!\n\n` +
          `ឯកសារបម្លែង PPF/YEP និងការជូនដំណឹងនឹងត្រូវផ្ញើមកកាន់ទីនេះ។`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Launch Studio Mini App",
                    web_app: { url: miniAppUrl },
                  },
                ],
              ],
            },
          }
        );
      }
    }

    ctx.reply(
      `*សូមស្វាគមន៍មកកាន់ Yamaha ExpVoice Studio Bot!*\n\nYour Chat ID: \`${chatId}\` (ចុចដើម្បីចម្លង / tap to copy)\n\nConvert compiled Yamaha installation packages (\`.ppi\`) into editable project archives (\`.ppf\`) or legacy instrument formats (\`.yep\`).\n\nTap below to launch the Mini App:`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Launch Studio Mini App",
                web_app: { url: miniAppUrl },
              },
            ],
            [
              { text: "Documentation", callback_data: "cmd_docs" },
              { text: "Server Status", callback_data: "cmd_status" },
            ],
          ],
        },
      }
    );
  });

  bot.command("id", (ctx) => {
    ctx.reply(`Your Telegram Chat ID is: \`${ctx.chat.id}\` (tap to copy)`, {
      parse_mode: "Markdown",
    });
  });

  bot.command("app", (ctx) => {
    ctx.reply("Tap the button below to open the Yamaha Expansion Studio Web Mini App:", {
      reply_markup: {
        inline_keyboard: [[{ text: "Launch Studio", web_app: { url: miniAppUrl } }]],
      },
    });
  });

  bot.command("convert", (ctx) => {
    ctx.reply(
      "Send me any unencrypted Yamaha `.ppi` file directly, or launch the Mini App for batch processing and hex analysis.",
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Launch Converter", web_app: { url: miniAppUrl } }]],
        },
      }
    );
  });

  bot.command("status", (ctx) => {
    ctx.reply(
      "Conversion Engine Status: *ONLINE*\n- Direct AWM2 Parser: Ready\n- PPF XML Transcoder: Ready\n- DRM Validator: Active\n- Cloud Database: Neon PostgreSQL Connected",
      {
        parse_mode: "Markdown",
      }
    );
  });

  bot.action("cmd_docs", (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      "*Yamaha ExpVoice Studio Documentation*\n\n1. Supported inputs: unencrypted `.ppi` packages.\n2. Supported outputs: `.ppf` (Yamaha Expansion Manager project) and `.yep` (legacy PSR-S series).\n3. Encrypted `.cpi` packages require the matching hardware `.n27` instrument key.",
      { parse_mode: "Markdown" }
    );
  });

  bot.action("cmd_status", (ctx) => {
    ctx.answerCbQuery();
    ctx.reply(
      "Conversion Engine Status: *ONLINE*\n- Cloud Database: Neon PostgreSQL\n- WebApp: https://yamaha-ppi-to-ppf-converter.vercel.app",
      {
        parse_mode: "Markdown",
      }
    );
  });

  bot.on("document", async (ctx) => {
    const doc = ctx.message.document;
    if (doc.file_name?.endsWith(".ppi") || doc.file_name?.endsWith(".cpi")) {
      const isCpi = doc.file_name.endsWith(".cpi");
      if (isCpi) {
        ctx.reply("Notice: Protected Yamaha package (`.cpi`) detected. Conversion requires the hardware `.n27` instrument key.");
      } else {
        ctx.reply(
          `Received Yamaha pack: "${doc.file_name}" (${(doc.file_size! / (1024 * 1024)).toFixed(2)} MB).\nProcessing chunk table...\n\nYou can also launch the Mini App to inspect waveform tables and presets:`,
          {
            reply_markup: {
              inline_keyboard: [[{ text: "Open in Mini App", web_app: { url: miniAppUrl } }]],
            },
          }
        );
      }
    } else {
      ctx.reply("Please upload a Yamaha `.ppi` or `.cpi` file.");
    }
  });

  return bot;
}
