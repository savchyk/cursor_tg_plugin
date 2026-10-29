# 06 — Forum topics

## Goal

Support Telegram forum groups: list topics and send into a specific topic.

## User account (primary)

- `list_forum_topics` — input: forum group id/title; output: topic ids + titles
- Extend `send_message` (and media later) with optional `topic_id` / `reply_to_msg_id` for topic root
- Mark forums in `list_dialogs` (`isForum` if available from teleproto dialog flags)

## Bot API (secondary)

- If the bot is in a forum: support `message_thread_id` on `send_message`
- Document that topic discovery still needs updates or admin APIs

## Acceptance

- From a known forum dialog, agent can list topics and send to one topic as the user.
- Skill note in mode-guide / send skill.

## Todos

- [ ] Detect forum dialogs in `list_dialogs`
- [ ] `list_forum_topics` (user)
- [ ] `message_thread_id` / topic send params (user + bot)
- [ ] Docs/skills
