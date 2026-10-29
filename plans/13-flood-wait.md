# 13 — FloodWait / rate-limit handling

**Status: Done**

## Goal

Survive Telegram FloodWait / HTTP 429 without crashing the MCP server.

## Implemented

| Item | Location |
| --- | --- |
| Shared helper | [`mcp/src/shared/retry.ts`](../mcp/src/shared/retry.ts) — detect seconds, optional auto-wait (cap 60s), one retry |
| Bot wiring | [`mcp/src/bot/api.ts`](../mcp/src/bot/api.ts) via `parameters.retry_after` + `wait_for_flood` tool arg |
| User wiring | `withUserFlood` / `wait_for_flood` on send paths |
| Unit tests | [`mcp/test/retry.test.mjs`](../mcp/test/retry.test.mjs), bot-api 429 case |
| Docs | README reliability note |

Logs waits to **stderr** only.

## Acceptance

- [x] Simulated FloodWait → structured error or retry
- [x] MCP stays up (errors returned as tool results)

## Todos

- [x] Shared retry helper
- [x] Wire into user invoke paths + bot `botApi`
- [x] Unit test with fake error
- [x] README note
