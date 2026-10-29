# 01 — Env / secrets wiring

**Status: Done** (2026-10-29)

## Goal

Ensure `telegram-bot` and `telegram-user` reliably receive credentials when Cursor starts MCP (not only when the terminal has exports).

## Implemented

| Item | Location |
| --- | --- |
| `envFile` on both servers | [`mcp.json`](../mcp.json) → `${workspaceFolder}/.env` |
| Example env | [`.env.example`](../.env.example) |
| Home bot token file | `~/.cursor-telegram/bot-token` via `save_bot_token` ([`mcp/src/bot/tokens.ts`](../mcp/src/bot/tokens.ts)) |
| Troubleshooting docs | [README](../README.md), skills `telegram-bot-setup` / `telegram-user-setup` |
| Credential priority documented | `.env` / MCP UI / shell / home store |

## Acceptance

- [x] `mcp.json` loads `.env` via `envFile`
- [x] Optional home-dir bot token loader
- [x] README + skills troubleshooting (≤5 steps)
- [ ] Manual: reload MCP in Cursor and call `get_me` with only `.env` (user machine)

## Todos

- [x] Add `envFile` to both servers in `mcp.json`
- [x] Optional home-dir bot token file loader
- [x] README + skills troubleshooting
- [ ] Manual verify on user machine: reload MCP, call `get_me` on bot
