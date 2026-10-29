# 05 — Message actions (reply, edit, delete, react)

**Status: Done**

## Goal

Reply, edit, delete, and react — bot and user.

## Implemented

### Bot

| Tool / param | Notes |
| --- | --- |
| `send_message.reply_to_message_id` | Thread reply |
| `edit_message_text` | `editMessageText` |
| `delete_message` | Destructive; skill says confirm |
| `set_message_reaction` | Emoji reaction |

### User

| Tool / param | Notes |
| --- | --- |
| `send_message.reply_to` | teleproto reply |
| `edit_message` | Edit own message |
| `delete_message` | Optional `revoke` |
| `send_reaction` | `messages.SendReaction` |

## Acceptance

- [x] Reply/edit/delete/react available on both servers
- [x] Skills warn on delete
- [x] Smoke tool list includes new names

## Todos

- [x] Bot reply param + edit/delete/react tools
- [x] User reply/edit/delete/react tools
- [x] Skills + README
- [x] Smoke tool list update
