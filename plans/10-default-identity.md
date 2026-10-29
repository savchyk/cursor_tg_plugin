# 10 — Default identity rule

**Status: Done**

## Goal

Project default so the agent does not ask “bot or user?” every time.

## Implemented

| Item | Location |
| --- | --- |
| Rule | [`rules/telegram-default-identity.mdc`](../rules/telegram-default-identity.mdc) — prefer **bot** |
| Mode guide honors rule + env | [`skills/telegram-mode-guide/SKILL.md`](../skills/telegram-mode-guide/SKILL.md) |
| Optional env | `TELEGRAM_DEFAULT_IDENTITY=bot\|user` in [`.env.example`](../.env.example) |

Explicit user phrasing still overrides.

## Acceptance

- [x] Rule present with frontmatter
- [x] Mode-guide documents override
- [x] Validator passes

## Todos

- [x] Add rule file
- [x] Document override in mode-guide + README
- [x] Validate frontmatter
