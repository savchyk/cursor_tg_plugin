# 17 — Multi-bot Bot API support

**Status: Done**

## Goal

Multiple BotFather bots from one `telegram-bot` MCP server.

## Implemented

| Item | Detail |
| --- | --- |
| Env | `TELEGRAM_BOT_TOKEN` → name `default`; `TELEGRAM_BOT_<NAME>=token` |
| Home fallback | `~/.cursor-telegram/bot-token` as `default` |
| Registry | [`mcp/src/bot/tokens.ts`](../mcp/src/bot/tokens.ts) |
| `list_bots` | Masked tokens + optional `getMe` probe |
| `bot` arg | On bot tools (`get_me`, send*, updates, etc.) |
| Docs | `.env.example`, bot setup skill, README |

Single-token setups unchanged (`default`).

## Acceptance

- [x] Named bots via env
- [x] `list_bots` + `bot` routing
- [x] Skills/README
- [x] Covered indirectly via bot-api unit tests + smoke `list_bots`

## Todos

- [x] Token registry from env
- [x] `bot` param on bot tools + `list_bots`
- [x] Skills/README
- [x] Tests with mocked fetch (default bot path)
