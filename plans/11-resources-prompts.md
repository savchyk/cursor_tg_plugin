# 11 — MCP resources & prompts

**Status: Done**

## Goal

Higher-level entry points: unread summary and draft-reply (no auto-send).

## Implemented

| Kind | Name | Server |
| --- | --- | --- |
| Prompt | `unread-summary` | bot + user |
| Prompt | `draft-reply` | user (`target` arg) |
| Resource | `telegram://bot/me` | bot |
| Resource | `telegram://user/me` | user |

Draft-reply prompt text forbids calling `send_message` until the user confirms.

## Acceptance

- [x] Prompts registered
- [x] Draft path does not send by itself
- [x] README mentions prompts/resources

## Todos

- [x] Implement prompts on user (and bot where useful)
- [x] Optional me resources
- [x] README
