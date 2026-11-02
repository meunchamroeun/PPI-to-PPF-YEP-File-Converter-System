import { createTelegramBot } from "../lib/telegram/bot";

const bot = createTelegramBot();

if (bot) {
  bot.launch()
    .then(() => {
      console.log("🎹 [Telegram Bot] ExpVoice Studio Bot is now active and polling for updates!");
    })
    .catch((err) => {
      console.error("[Telegram Bot] Launch failed:", err);
    });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
} else {
  console.log("⚠️ Set TELEGRAM_BOT_TOKEN environment variable to start the bot daemon.");
}
