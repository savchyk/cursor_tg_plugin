---
name: telegram-setup
description: Walk through Telegram bot and/or user-account MCP setup and smoke-test get_me / auth_status without sending messages.
---

# Telegram setup

Ask which mode(s) to configure: **bot**, **user**, or **both**.

## Bot path

1. Follow skill `telegram-bot-setup` (BotFather token).
2. Prefer project `.env` (`TELEGRAM_BOT_TOKEN=…`) or `save_bot_token`, then reload MCP.
3. Call `list_bots` then `get_me` on `telegram-bot`.
4. If `getUpdates` fails mentioning webhook, call `get_webhook_info` / `delete_webhook`.

## User path

1. Follow skill `telegram-user-setup` (my.telegram.org api_id / api_hash).
2. Prefer `.env` or `save_api_credentials`.
3. Call `auth_status`. Login with `start_login` + `complete_login`, or `start_qr_login` + `complete_qr_login`.
4. Call `get_me` and optionally `list_dialogs`.

## Rules

- Stop before any `send_message` / media send unless the user explicitly asks.
- Never echo full tokens, api_hash, or session strings back in chat.
- Report a short pass/fail checklist at the end.
