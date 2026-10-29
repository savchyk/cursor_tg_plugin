# 04 — Media send tools

**Status: Done**

## Goal

Send photos and documents via both MCP servers.

## Implemented

### Bot (`telegram-bot`) — [`mcp/src/bot/server.ts`](../mcp/src/bot/server.ts)

- `send_photo` — `chat_id`, `photo` (URL / `file_id`), caption, reply/thread, `bot`
- `send_document` — same with `document`
- v0: URL / `file_id` only (no multipart local upload)

### User (`telegram-user`) — [`mcp/src/user/server.ts`](../mcp/src/user/server.ts)

- `send_photo` / `send_document` via teleproto `sendFile`
- Local path or URL; `forceDocument` on document tool

### Docs / smoke

- Skill `send-telegram-message` covers media confirmation
- README tools summary
- Smoke expects photo/document tool names

## Acceptance

- [x] Both servers expose photo + document tools with prefixes
- [x] README + smoke updated

## Todos

- [x] Bot `send_photo` / `send_document`
- [x] User `send_photo` / `send_document`
- [x] Skill + README updates
- [x] Extend smoke-list-tools expectations
