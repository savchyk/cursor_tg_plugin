# 12 — Integration / unit tests

## Goal

Automated tests so tool wiring and Bot API client behavior do not regress.

## Approach

1. **Bot API unit tests** with mocked `fetch`:
   - `getMe` success / error JSON
   - `sendMessage` body shape
2. **MCP listTools smoke** — keep/extend [`mcp/scripts/smoke-list-tools.mjs`](../mcp/scripts/smoke-list-tools.mjs); add to `npm test`.
3. **User store tests** — temp dir via `TELEGRAM_USER_DATA_DIR`; save/load credentials + session perms.
4. **User client** — mock TelegramClient where practical; skip live network in CI.
5. Test runner: Node built-in `node:test` or vitest (prefer `node:test` to avoid extra weight).

## Acceptance

- `cd mcp && npm test` passes offline.
- CI plan ([14](14-ci.md)) can call the same script.

## Todos

- [ ] Mock fetch tests for `bot/api.ts`
- [ ] Store tests
- [ ] `npm test` script aggregating smoke + unit
- [ ] No real Telegram calls in default test suite
