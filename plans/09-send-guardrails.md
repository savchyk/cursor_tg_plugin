# 09 — Send guardrails

## Goal

Reduce accidental wrong-chat sends: always resolve and surface peer identity before sending.

## Approach

1. Add `resolve_peer` tool on both servers (bot: validate chat via getChat if possible; user: reuse `resolvePeer`).
2. Change send tools to accept optional `confirm_label` — if provided, server checks it matches resolved title/username or returns an error asking to confirm.
3. Or: add `preview_send` tool that returns `{ peer, preview_text }` without sending; skill mandates preview → user OK → send.
4. Update `send-telegram-message` skill to **require** resolve/preview step and explicit user confirmation in chat.
5. Prefer ids over fuzzy title match for user `send_message` when multiple dialogs match (error listing candidates).

## Acceptance

- Ambiguous title match does not silently send.
- Skill text requires confirmation of identity + recipient + body.

## Todos

- [ ] `resolve_peer` (bot + user)
- [ ] Disambiguation errors on title match
- [ ] Skill enforcement of preview/confirm
- [ ] README safety section refresh
