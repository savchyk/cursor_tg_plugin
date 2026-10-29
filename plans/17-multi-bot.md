# 17 — Multi-bot Bot API support

## Goal

Manage multiple BotFather bots from one `telegram-bot` MCP server (e.g. `alerts`, `sales`).

## Approach

1. Env convention: `TELEGRAM_BOT_<NAME>=token` (plus optional legacy `TELEGRAM_BOT_TOKEN` as `default`).
2. Every bot tool gains optional `bot` string arg (default `default`).
3. Add `list_bots` — calls `getMe` per configured token (mask tokens in output).
4. Update skills/README for multi-bot routing.
5. Keep single-token setup working unchanged.

## Acceptance

- Two tokens in env → `list_bots` shows two usernames; `send_message` with `bot: "alerts"` uses the right token.

## Todos

- [ ] Token registry from env
- [ ] `bot` param on all bot tools + `list_bots`
- [ ] Skills/README
- [ ] Tests with mocked fetch per bot
