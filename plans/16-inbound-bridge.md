# 16 — Inbound bridge (Telegram → agent → reply)

## Goal

Always-on (or scheduled) process: inbound Telegram message triggers a Cursor agent run and optionally replies.

## Why separate

MCP tools are pull-based inside a chat. Inbound automation needs a long-running worker + Cursor SDK (`Agent.prompt` / `Agent.create`) — not just plugin MCP.

## Approach

1. New package or `bridge/` service:
   - Bot long-poll `getUpdates` **or** user `NewMessage` handler (teleproto events)
   - Allowlist of chat ids
   - On message → `Agent.prompt(...)` with cwd/repo config + MCP telegram servers inline for reply
2. Config: `.env` with `CURSOR_API_KEY`, Telegram creds, allowlist, model id.
3. Safety: default dry-run (log only); explicit `BRIDGE_AUTO_REPLY=true`.
4. Document ToS / cost / privacy risks heavily.

## Out of scope for bridge v0

- Multi-tenant SaaS
- Hosting MTProto session in Cursor Cloud VMs

## Acceptance

- Demo: message test bot → agent run logged → optional reply in same chat.
- Allowlist blocks unknown chats.

## Todos

- [ ] Bridge scaffold + allowlist
- [ ] Cursor SDK one-shot integration
- [ ] Dry-run vs auto-reply modes
- [ ] Ops README (run with systemd/launchd)
