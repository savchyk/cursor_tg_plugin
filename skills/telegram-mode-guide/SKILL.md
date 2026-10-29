---
name: telegram-mode-guide
description: Choose between Telegram Bot API and personal user-account MCP tools. Use when the user mentions Telegram, sending or reading chats, or both servers are available.
---

# Telegram mode guide

Two MCP servers: `telegram-bot` (`[Bot API]`) and `telegram-user` (`[User account]`).

## Defaults

Honor rule `telegram-default-identity` when present (usually **bot** for pings). Override when the user says “my account” / inbox / dialogs.

Optional env `TELEGRAM_DEFAULT_IDENTITY=bot|user`.

## Bot vs user

| Need | Server |
| --- | --- |
| Alerts, CI, bot chats | `telegram-bot` |
| Personal inbox, dialogs, send as you | `telegram-user` |

## Safety

- `resolve_peer` before send; confirm identity + recipient + text.
- Never dual-send the same text on both servers.
- Do not paste tokens / api_hash / sessions into chat.
