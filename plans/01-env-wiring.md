# 01 — Env / secrets wiring

## Goal

Ensure `telegram-bot` and `telegram-user` reliably receive credentials when Cursor starts MCP (not only when the terminal has exports).

## Why

`${env:TELEGRAM_*}` in [`mcp.json`](../mcp.json) only works if those variables exist in Cursor’s process environment. GUI-launched Cursor often does not inherit shell profile exports.

## Approach

1. Document three supported credential sources (priority order):
   - Cursor MCP env / plugin variables UI
   - `envFile` pointing at a gitignored `.env` (stdio MCP supports `envFile`)
   - Shell exports for CLI debugging
2. Update [`mcp.json`](../mcp.json) to add `envFile` (e.g. `${workspaceFolder}/.env`) alongside `${env:…}` interpolation.
3. Expand [`.env.example`](../.env.example) and [README](../README.md) with a “Cursor can’t see my token” troubleshooting section.
4. Optionally support reading bot token from `~/.cursor-telegram/bot-token` (0600) via a small loader in bot mode — mirror user store pattern — so secrets need not live in project `.env`.
5. Update skills `telegram-bot-setup` / `telegram-user-setup` to match the new flow.

## Out of scope

- Cloud Agent secret sync
- OS keychain integration

## Acceptance

- Fresh Cursor window with only `.env` (or home store) can start both MCP servers without shell exports.
- README documents the failure mode and fix in ≤5 steps.
- No secrets committed; `.gitignore` already covers `.env`.

## Todos

- [ ] Add `envFile` to both servers in `mcp.json`
- [ ] Optional home-dir bot token file loader
- [ ] README + skills troubleshooting
- [ ] Manual verify: reload MCP, call `get_me` on bot
