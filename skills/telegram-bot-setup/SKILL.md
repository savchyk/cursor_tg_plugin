---
name: telegram-bot-setup
description: Set up Telegram Bot API access for the telegram-bot MCP server. Use when configuring TELEGRAM_BOT_TOKEN, BotFather, or smoke-testing the bot.
---

# Telegram bot setup

## Steps

1. Open Telegram and chat with [@BotFather](https://t.me/BotFather).
2. Run `/newbot` (or `/token` for an existing bot) and copy the token.
3. Export it in the environment Cursor uses:

```bash
export TELEGRAM_BOT_TOKEN="123456:ABC..."
```

4. Restart MCP / reload the window so `telegram-bot` picks up the env.
5. Smoke-test with the MCP tool `get_me` on server `telegram-bot`. You should see `is_bot: true` and a username.
6. Message the bot from Telegram, then call `get_updates` or `list_recent_chats` to discover `chat_id`.

## Notes

- Do not commit the token. Prefer shell env or a local secret store.
- The bot can only see chats it participates in and updates it receives.
- For personal inbox access, use `telegram-user` instead (see telegram-user-setup).
