# 09 — Send guardrails

**Status: Done**

## Goal

Reduce accidental wrong-chat sends.

## Implemented

| Mechanism | Detail |
| --- | --- |
| `resolve_peer` (bot) | `getChat` → id/label/username |
| `resolve_peer` (user) | Candidates; `ambiguous: true` if multiple title matches |
| `confirm_label` on send | Bot + user `send_message` refuses on mismatch |
| Ambiguous titles | User resolve/send errors with candidate list (no silent pick) |
| Skill | `send-telegram-message` requires resolve → confirm → send |

No separate `preview_send` tool — resolve + confirm_label covers the intent.

## Acceptance

- [x] Ambiguous title does not silently send
- [x] Skill requires confirmation

## Todos

- [x] `resolve_peer` (bot + user)
- [x] Disambiguation errors on title match
- [x] Skill enforcement of preview/confirm
- [x] README safety section refresh
