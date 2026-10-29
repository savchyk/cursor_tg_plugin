# 19 — Grok Bot vault credentials (open hosted)

**Status: Done** (stateless — host stores nothing)

## Goal

Grok Bot users provide Telegram credentials via **Vault** headers. Open hosted MCP is **stateless**: process request → call Telegram → return result; **do not persist** tokens/sessions on the host. Cursor stdio/env unchanged.

## Implemented

| Item | Detail |
| --- | --- |
| Request-scoped creds | ALS for the duration of one HTTP request only |
| Header parsing | `x-telegram-bot-token` etc. — no disk write |
| No tenant store | Removed; nothing under `tenants/` |
| Tools | `setup_guide`, `credentials_status` |
| Skill / docs | vault every request; host stores nothing |

## Vault headers (every request)

- `x-telegram-bot-token`
- `x-telegram-api-id` / `x-telegram-api-hash` / `x-telegram-session`

## Todos

- [x] Per-request credentials from headers only
- [x] No server-side token/session persistence in open/header mode
- [x] setup_guide + credentials_status + skill/docs
