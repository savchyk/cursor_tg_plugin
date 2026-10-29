# 18 — Grok Bot HTTP / self-host

**Status: Done** (Cursor stdio preserved)

## Goal

Let people use this MCP from the **Grok Bot app** via a public HTTPS endpoint, without breaking Cursor stdio.

## Implemented

| Item | Location |
| --- | --- |
| `createBotMcpServer` / `createUserMcpServer` | shared factories; stdio still default |
| `runHttpServer` Streamable HTTP | [`mcp/src/http.ts`](../mcp/src/http.ts) |
| CLI `http` mode | [`mcp/src/cli.ts`](../mcp/src/cli.ts) — `bot`/`user` unchanged |
| Bearer / `x-api-key` auth | `MCP_AUTH_TOKEN` |
| Endpoints | `/health`, `/mcp`, `/mcp/bot`, `/mcp/user` |
| Docker | [`Dockerfile`](../Dockerfile), [`docker-compose.yml`](../docker-compose.yml) |
| Docs | [`docs/grok-bot.md`](../docs/grok-bot.md) |
| Smoke | [`mcp/scripts/smoke-http.mjs`](../mcp/scripts/smoke-http.mjs) |

## Non-goals / preserved

- [`mcp.json`](../mcp.json) stdio for Cursor — **unchanged**
- No requirement to host anything for Cursor-only users

## Todos

- [x] HTTP transport alongside stdio
- [x] Auth token for public host
- [x] Docker + compose
- [x] Grok Bot docs
- [x] Smoke test HTTP health/auth
