# 07 — Bot updates clarity (ack + webhook notes)

## Goal

Make bot inbound reading safer and clearer: acknowledge updates, avoid re-reading the same backlog, document webhook vs getUpdates tradeoff.

## Approach

1. Add `acknowledge_updates` tool (or `get_updates` flag `drop_pending`) that calls `getUpdates` with `offset = last_update_id + 1` and optionally confirms cleared queue.
2. Have `list_recent_chats` return `next_offset` hint.
3. README section: **polling vs webhook** — this MCP uses getUpdates; if a webhook is set, getUpdates fails — add `delete_webhook` tool (`deleteWebhook`) for recovery.
4. Optional `get_webhook_info` tool for debugging.

## Out of scope

- Running a public webhook HTTP server inside the MCP process (see [16-inbound-bridge](16-inbound-bridge.md) for always-on inbound).

## Acceptance

- Agent can clear a stuck update queue and recover from “webhook already set” errors.
- Docs explain the failure mode.

## Todos

- [ ] `delete_webhook` / `get_webhook_info`
- [ ] Ack / `next_offset` UX on get_updates / list_recent_chats
- [ ] README polling vs webhook
