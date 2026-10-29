---
name: send-telegram-message
description: Send a Telegram message via Bot API or personal account with explicit identity and recipient confirmation. Use when the user asks to send, post, or reply on Telegram.
---

# Send Telegram message

## Before sending

1. Pick identity using telegram-mode-guide (`telegram-bot` vs `telegram-user`).
2. Resolve the recipient:
   - **Bot**: `list_recent_chats` or `get_updates` → `chat_id` / `@username`
   - **User**: `list_dialogs` or `search_dialogs` → id / `@username` / exact title
3. Confirm with the user: **which identity**, **recipient label**, and **message text**.
4. Only then call the matching server’s `send_message`.

## Bot send

- Server: `telegram-bot`
- Tool: `send_message` with `chat_id` + `text`
- Optional: `parse_mode`, `disable_notification`

## User send

- Server: `telegram-user`
- Tool: `send_message` with `target` + `text`
- Prefer ids from `list_dialogs` over ambiguous titles

## Do not

- Send the same text via both servers
- Guess a private chat id
- Include secrets (tokens, session strings) in the message body
