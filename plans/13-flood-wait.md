# 13 — FloodWait / rate-limit handling

## Goal

Survive Telegram `FloodWait` and similar RPC errors on the user (and bot HTTP 429) paths without crashing the MCP server.

## Approach

1. Catch teleproto `FloodWaitError` (or equivalent); sleep `seconds` (capped, e.g. max 60s unless tool arg `wait_for_flood=true`) and retry once.
2. Return a clear tool error: `Flood wait N seconds; retry after …` if not auto-waiting.
3. Bot API: detect 429 / `retry_after` in description; same policy.
4. Log waits to stderr (MCP-safe) not stdout.
5. Short note in README under reliability.

## Acceptance

- Simulated FloodWait in a unit test triggers retry or structured error (no unhandled rejection).
- MCP server stays up after the error.

## Todos

- [ ] Shared retry helper
- [ ] Wire into user invoke paths + bot `botApi`
- [ ] Unit test with fake error
- [ ] README note
