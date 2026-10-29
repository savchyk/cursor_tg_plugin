---
name: telegram-mode-guide
description: Choose between Telegram Bot API and personal user-account MCP tools. Use when the user mentions Telegram, sending or reading chats, or both telegram-bot and telegram-user servers are available.
---

# Telegram mode guide

This plugin exposes **two** MCP servers. Prefer tools by server name and the `[Bot API]` / `[User account]` prefixes on tool descriptions.

## When to use `telegram-bot`

- Alerts, CI notifications, status pings from automation
- Messaging chats where a **bot** is an intended participant
- You only have a BotFather token (`TELEGRAM_BOT_TOKEN`)
- Reading inbound traffic the bot has received (`get_updates` / `list_recent_chats`)

Limits: a bot cannot see your personal inbox. `list_recent_chats` is best-effort from recent updates only.

## When to use `telegram-user`

- Read or search your real dialogs / message history
- Send as **you** (personal account), not as a bot
- Resolve people/groups by dialog title via `list_dialogs` / `search_dialogs`

Requires `TELEGRAM_API_ID` + `TELEGRAM_API_HASH` (my.telegram.org) and a completed login/session.

## How to decide

1. If the user says “as the bot” / “BotFather” → `telegram-bot`.
2. If the user says “from my account” / “my chats” / “inbox” → `telegram-user`.
3. If unclear, ask once: bot identity or personal account?
4. Never call both `send_message` tools for the same request.

## Safety

- Confirm recipient and which identity before any `send_message`.
- Do not paste bot tokens, api_hash, session strings, or 2FA passwords into chat unless the user explicitly provides them for a setup step.
