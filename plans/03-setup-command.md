# 03 — Setup command / checklist

**Status: Done**

## Goal

Cursor command that walks bot and/or user-account setup and smoke tests without sending messages.

## Implemented

| Item | Location |
| --- | --- |
| Setup command | [`commands/telegram-setup.md`](../commands/telegram-setup.md) |
| Linked from README quick start | [`README.md`](../README.md) |
| Uses existing setup skills | `telegram-bot-setup`, `telegram-user-setup` |

No separate setup agent was added (command + skills are enough).

## Acceptance

- [x] Command with `name` + `description` frontmatter
- [x] Instructs no `send_message` during setup
- [x] Validator passes

## Todos

- [x] `commands/telegram-setup.md`
- [x] Skipped optional setup agent (not needed)
- [x] README link
- [x] Validate frontmatter via `scripts/validate-template.mjs`
