# 06 — Forum topics

**Status: Done**

## Goal

Support Telegram forum groups: list topics and send into a specific topic.

## Implemented

| Item | Location |
| --- | --- |
| `is_forum` on dialogs/search | [`mcp/src/user/server.ts`](../mcp/src/user/server.ts) |
| `list_forum_topics` | uses teleproto `client.getForumTopics` ([`mcp/src/user/client.ts`](../mcp/src/user/client.ts)) |
| User send `topic_id` | maps to replyTo when no explicit reply |
| Bot `message_thread_id` | on `send_message` / photo / document |

## Acceptance

- [x] List topics for a forum peer
- [x] Send into topic / thread id
- [x] Skills mention forums in send skill

## Todos

- [x] Detect forum dialogs in `list_dialogs`
- [x] `list_forum_topics` (user)
- [x] `message_thread_id` / topic send params (user + bot)
- [x] Docs/skills
