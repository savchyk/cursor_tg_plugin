# 05 — Message actions (reply, edit, delete, react)

## Goal

Beyond plain send: reply to a message, edit, delete, and react — bot and user where the API allows.

## Bot API

| Tool | Telegram method |
| --- | --- |
| `send_message` enhancement | `reply_to_message_id` |
| `edit_message_text` | `editMessageText` |
| `delete_message` | `deleteMessage` |
| `set_message_reaction` | `setMessageReaction` (API support permitting) |

## User account

| Tool | Notes |
| --- | --- |
| `send_message` + `reply_to` | teleproto reply-to message id |
| `edit_message` | edit own messages |
| `delete_message` | delete for self / revoke when allowed |
| `send_reaction` | emoji reaction on a message |

## Design notes

- Require `chat_id`/`target` + `message_id` for edit/delete/react.
- Skill update: confirm destructive deletes.
- Keep tool descriptions prefixed.

## Acceptance

- Agent can reply in-thread and edit/delete with explicit ids from `get_messages` / `get_updates`.
- README updated.

## Todos

- [ ] Bot reply param + edit/delete/react tools
- [ ] User reply/edit/delete/react tools
- [ ] Skills + README
- [ ] Smoke tool list update
