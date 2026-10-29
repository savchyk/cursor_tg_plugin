#!/usr/bin/env node

const mode = (process.argv[2] ?? "").toLowerCase();

function usage(): never {
  console.error(`Usage: cursor-telegram-mcp <bot|user>

  bot   — Telegram Bot API MCP (TELEGRAM_BOT_TOKEN)
  user  — personal account MTProto MCP (TELEGRAM_API_ID / TELEGRAM_API_HASH)

If no mode is given, picks from env:
  TELEGRAM_BOT_TOKEN alone → bot
  TELEGRAM_API_ID + TELEGRAM_API_HASH alone → user
  both set → refuse (pass an explicit mode)`);
  process.exit(1);
}

async function main() {
  let resolved = mode;

  if (!resolved) {
    const hasBot = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
    const hasUser =
      Boolean(process.env.TELEGRAM_API_ID?.trim()) &&
      Boolean(process.env.TELEGRAM_API_HASH?.trim());
    if (hasBot && hasUser) {
      console.error(
        "Both TELEGRAM_BOT_TOKEN and TELEGRAM_API_ID/HASH are set. Pass an explicit mode: bot or user."
      );
      process.exit(1);
    }
    if (hasBot) resolved = "bot";
    else if (hasUser) resolved = "user";
    else usage();
  }

  if (resolved === "bot") {
    const { runBotServer } = await import("./bot/server.js");
    await runBotServer();
    return;
  }
  if (resolved === "user") {
    const { runUserServer } = await import("./user/server.js");
    await runUserServer();
    return;
  }
  usage();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
