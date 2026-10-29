# 12 — Integration / unit tests

**Status: Done**

## Goal

Offline automated tests so tool wiring and Bot API client behavior do not regress.

## Implemented

| Test | File |
| --- | --- |
| Mocked `botApi` fetch | [`mcp/test/bot-api.test.mjs`](../mcp/test/bot-api.test.mjs) |
| Flood retry helper | [`mcp/test/retry.test.mjs`](../mcp/test/retry.test.mjs) |
| User store temp dir | [`mcp/test/store.test.mjs`](../mcp/test/store.test.mjs) |
| MCP listTools smoke | [`mcp/scripts/smoke-list-tools.mjs`](../mcp/scripts/smoke-list-tools.mjs) |
| Aggregator | `cd mcp && npm test` → 10 passing |

Runner: Node built-in `node:test` (no vitest).

## Acceptance

- [x] `npm test` passes offline
- [x] No live Telegram in default suite
- [x] CI calls same script ([14](14-ci.md))

## Todos

- [x] Mock fetch tests for bot API
- [x] Store tests
- [x] `npm test` script aggregating smoke + unit
- [x] No real Telegram calls in default test suite
