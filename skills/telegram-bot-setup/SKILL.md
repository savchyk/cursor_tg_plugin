---
name: telegram-bot-setup
description: Set up Telegram Bot API access for the telegram-bot MCP server. Use when configuring TELEGRAM_BOT_TOKEN, BotFather, webhooks, or smoke-testing the bot.
---

# Telegram bot setup

## Credential sources (priority)

1. Project `.env` with `TELEGRAM_BOT_TOKEN=…` (loaded via `mcp.json` `envFile`)
2. Cursor MCP / plugin env UI
3. Shell export (GUI Cursor often **misses** this)
4. Home file via tool `save_bot_token` → `~/.cursor-telegram/bot-token`
5. Named bots: `TELEGRAM_BOT_<NAME>=token` (use tool arg `bot`)

## Steps

1. Chat with [@BotFather](https://t.me/BotFather) → `/newbot` or `/token`.
2. Put the token in `.env` (copy from `.env.example`) **or** call `save_bot_token`.
3. Reload MCP in Cursor.
4. Call `list_bots` then `get_me`.
5. If updates fail: `get_webhook_info` → `delete_webhook` if a webhook is set.
6. Message the bot, then `list_recent_chats` / `get_updates` for `chat_id`.

## Troubleshooting: Cursor can’t see my token

1. Create `.env` in the workspace from `.env.example`.
2. Confirm `mcp.json` has `"envFile": "${workspaceFolder}/.env"`.
3. Fully quit and reopen Cursor (not only reload window).
4. Call `list_bots` — if empty, the server still has no token.
5. As a fallback, use `save_bot_token` (home store) and reload MCP.
