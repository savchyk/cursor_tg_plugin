---
name: send-telegram-message
description: Send a Telegram message via Bot API or personal account with explicit identity and recipient confirmation. Use when the user asks to send, post, reply, or share media on Telegram.
---

# Send Telegram message

## Required before any send

1. Pick identity (`telegram-mode-guide` / default-identity rule).
2. Call **`resolve_peer`** on that server; if ambiguous, ask the user to pick an id.
3. Confirm in chat: **identity**, **resolved label/id**, **text or media**.
4. Only then call `send_message` / `send_photo` / `send_document`. Prefer passing `confirm_label` matching the resolved title/username/id.
5. For replies: set `reply_to_message_id` (bot) or `reply_to` (user). For forums: `message_thread_id` / `topic_id`.

## Destructive

Confirm before `delete_message`.

## Do not

- Guess private chat ids
- Send via both servers
- Include secrets in the message body
