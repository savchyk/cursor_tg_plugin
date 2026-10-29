# 16 — Inbound bridge (Telegram → agent → reply)

**Status: Scaffold** — dry-run poller only; SDK auto-reply not wired

## Goal

Always-on process: inbound Telegram → Cursor agent run → optional reply.

## Implemented (scaffold)

| Item | Location |
| --- | --- |
| Package | [`bridge/`](../bridge/) |
| Dry-run long-poll | [`bridge/src/index.ts`](../bridge/src/index.ts) — bot `getUpdates` |
| Allowlist | `BRIDGE_CHAT_ALLOWLIST` (comma chat ids); empty = allow none |
| Auto-reply flag | `BRIDGE_AUTO_REPLY=true` logs stub only (needs `@cursor/sdk`) |
| Docs | [`bridge/README.md`](../bridge/README.md) |

## Remaining

1. Add `@cursor/sdk` dependency
2. On allowlisted message: `Agent.prompt(...)` (or create/send) with repo cwd + telegram MCP for reply
3. `sendMessage` reply when `BRIDGE_AUTO_REPLY=true`
4. Ops: systemd/launchd example
5. Optional: user-account `NewMessage` path (MTProto) — still out of scope until bot path works

## Acceptance

- [x] Dry-run logs inbound allowlisted messages
- [ ] Live agent reply demo
- [x] Empty allowlist blocks all chats

## Todos

- [x] Bridge scaffold + allowlist
- [ ] Cursor SDK one-shot integration
- [x] Dry-run vs auto-reply modes (stub)
- [ ] Ops README (systemd/launchd)
