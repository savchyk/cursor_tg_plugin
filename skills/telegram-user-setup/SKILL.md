---
name: telegram-user-setup
description: Set up personal Telegram (MTProto) access for the telegram-user MCP server. Use when configuring api_id/api_hash, logging in, or fixing auth_status.
---

# Telegram user-account setup

## Credentials

1. Visit [https://my.telegram.org](https://my.telegram.org) → API development tools.
2. Create an application and note `api_id` and `api_hash`.
3. Provide them either via env:

```bash
export TELEGRAM_API_ID="1234567"
export TELEGRAM_API_HASH="your_api_hash"
```

or by calling MCP tool `save_api_credentials` on `telegram-user` (stored under `~/.cursor-telegram/` with restrictive permissions).

4. Reload MCP so `telegram-user` starts with the env vars.

## Login

1. Call `auth_status` — expect `credentials_present: true`.
2. Call `start_login` with phone in international format (e.g. `+15551234567`).
3. Read the code from Telegram (other devices / SMS).
4. Call `complete_login` with `{ code }`. If 2FA is on, also pass `{ password }` (or call again when status is `awaiting_password`).
5. Call `get_me` and `list_dialogs` to confirm.

Optional: set `TELEGRAM_SESSION` to a saved session string to skip interactive login.

## Notes

- Session files under `~/.cursor-telegram/` are secrets — do not commit or share them.
- User-account automation can violate Telegram ToS if abused; keep use personal and low-volume.
- Cloud Agents do not share your local MTProto session; this path is for local Cursor.
