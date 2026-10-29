---
name: telegram-user-setup
description: Set up personal Telegram (MTProto) access for telegram-user MCP. Use for api_id/api_hash, phone login, QR login, or auth_status issues.
---

# Telegram user-account setup

## Credentials

1. [my.telegram.org](https://my.telegram.org) → API development tools → `api_id` / `api_hash`.
2. Put them in project `.env` (`TELEGRAM_API_ID`, `TELEGRAM_API_HASH`) **or** call `save_api_credentials`.
3. Reload MCP so `telegram-user` starts with envFile.

## Login options

**Phone:** `start_login` → code from Telegram → `complete_login` (+ `password` if 2FA).

**QR:** `start_qr_login` → scan `qr_url` (Devices → Link Desktop Device) → `complete_qr_login` (password if 2FA). URL rotates ~30s; re-check `auth_status`.

Optional: `TELEGRAM_SESSION` to skip login.

## Verify

`auth_status` → `get_me` → `list_dialogs`.

## Troubleshooting

Same as bot: prefer `.env` + `envFile`; GUI Cursor often lacks shell exports. Session lives under `~/.cursor-telegram/` (secrets — do not commit).
