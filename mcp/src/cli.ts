#!/usr/bin/env node

/**
 * Transports:
 * - bot | user  → stdio MCP (Cursor / local agents) — unchanged default path
 * - http        → Streamable HTTP for Grok Bot / self-host (public HTTPS)
 */

const mode = (process.argv[2] ?? "").toLowerCase();

function usage(): never {
  console.error(`Usage: cursor-telegram-mcp <bot|user|http>

  bot   — stdio MCP, Telegram Bot API (TELEGRAM_BOT_TOKEN)  [Cursor]
  user  — stdio MCP, personal MTProto account               [Cursor]
  http  — Streamable HTTP server for Grok Bot / remote hosts

HTTP env:
  PORT              listen port (default 8787)
  HOST              bind address (default 0.0.0.0)
  MCP_MODE          bot | user | both (default: infer from Telegram env)
  MCP_AUTH_TOKEN    require Bearer / x-api-key (strongly recommended)
  MCP_STATEFUL      true to enable session ids (default false / stateless)

If no mode is given, picks from env (stdio only):
  TELEGRAM_BOT_TOKEN alone → bot
  TELEGRAM_API_ID + HASH alone → user
  both set → refuse (pass bot, user, or http)`);
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
        "Both TELEGRAM_BOT_TOKEN and TELEGRAM_API_ID/HASH are set. Pass an explicit mode: bot, user, or http."
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
  if (resolved === "http") {
    const { runHttpServer } = await import("./http.js");
    await runHttpServer();
    return;
  }
  usage();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
