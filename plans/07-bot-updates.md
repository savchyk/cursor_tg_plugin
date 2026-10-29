# 07 — Bot updates clarity (ack + webhook notes)

**Status: Done**

## Goal

Safer bot inbound reading: acknowledge updates, recover when a webhook blocks `getUpdates`.

## Implemented

| Tool | Purpose |
| --- | --- |
| `get_updates` | Returns `next_offset` |
| `list_recent_chats` | Returns `next_offset` |
| `acknowledge_updates` | `offset` confirm or `drop_pending` |
| `get_webhook_info` | Debug webhook |
| `delete_webhook` | Restore polling |

Docs: README + bot setup skill (polling vs webhook).

## Out of scope (unchanged)

- Public webhook HTTP server inside MCP → see [16-inbound-bridge](16-inbound-bridge.md)

## Acceptance

- [x] Ack / drop pending + webhook recovery tools
- [x] Docs explain webhook vs getUpdates

## Todos

- [x] `delete_webhook` / `get_webhook_info`
- [x] Ack / `next_offset` UX
- [x] README / skill polling vs webhook
