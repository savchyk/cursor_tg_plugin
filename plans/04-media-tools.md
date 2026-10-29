# 04 — Media send tools

## Goal

Send photos and documents via both MCP servers.

## Bot API (`telegram-bot`)

- `send_photo` — `chat_id`, `photo` (URL or `file_id`), optional `caption`, `parse_mode`
- `send_document` — same shape with `document`
- v0: URL / `file_id` only (no multipart local upload unless easy with fetch + FormData)

## User account (`telegram-user`)

- `send_photo` / `send_document` via teleproto (`sendFile` / upload helpers)
- Accept local path **or** URL; resolve peer like `send_message`
- Prefix descriptions with `[User account]`

## Also

- Extend `send-telegram-message` skill: confirm media source + caption
- Smoke: listTools includes new names; optional mocked bot HTTP test later ([12](12-integration-tests.md))

## Acceptance

- Both servers expose photo + document tools with `[Bot API]` / `[User account]` prefixes.
- README tools tables updated.

## Todos

- [ ] Bot `send_photo` / `send_document`
- [ ] User `send_photo` / `send_document`
- [ ] Skill + README updates
- [ ] Extend smoke-list-tools expectations
