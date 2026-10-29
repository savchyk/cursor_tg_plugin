# Execution status

Last updated: 2026-10-29

| # | Plan | Status | Notes |
| --- | --- | --- | --- |
| 01 | env-wiring | **Done** | `envFile` in [`mcp.json`](../mcp.json); `save_bot_token` / `~/.cursor-telegram/bot-token`; README + skills troubleshooting |
| 02 | npm-publish | **Prep only** | [`mcp/package.json`](../mcp/package.json) publish-ready; [`mcp.json.npx.example`](../mcp.json.npx.example). Needs `npm login` + `npm publish`; then switch live `mcp.json` to npx |
| 03 | setup-command | **Done** | [`commands/telegram-setup.md`](../commands/telegram-setup.md) |
| 04 | media-tools | **Done** | Bot + user `send_photo` / `send_document` in MCP servers |
| 05 | message-actions | **Done** | Reply params; bot edit/delete/react; user edit/delete/react |
| 06 | forum-topics | **Done** | `list_forum_topics`; `message_thread_id` / `topic_id`; `is_forum` on dialogs |
| 07 | bot-updates | **Done** | `acknowledge_updates`, `get_webhook_info`, `delete_webhook`, `next_offset` |
| 08 | qr-login | **Done** | `start_qr_login`, `complete_qr_login`, `cancel_login` (teleproto QR) |
| 09 | send-guardrails | **Done** | `resolve_peer`, `confirm_label`, ambiguous title errors; send skill updated |
| 10 | default-identity | **Done** | [`rules/telegram-default-identity.mdc`](../rules/telegram-default-identity.mdc) |
| 11 | resources-prompts | **Done** | Prompts `unread-summary` / `draft-reply`; resources `telegram://bot/me`, `telegram://user/me` |
| 12 | integration-tests | **Done** | [`mcp/test/`](../mcp/test/) + smoke; `cd mcp && npm test` (10 passing) |
| 13 | flood-wait | **Done** | [`mcp/src/shared/retry.ts`](../mcp/src/shared/retry.ts); bot + user `wait_for_flood` |
| 14 | ci | **Done** | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| 15 | marketplace | **Polish** | Manifest/README ready; submission is a human step |
| 16 | inbound-bridge | **Scaffold** | [`bridge/`](../bridge/) dry-run `getUpdates` + allowlist; `@cursor/sdk` reply not wired |
| 17 | multi-bot | **Done** | `TELEGRAM_BOT_<NAME>`, `list_bots`, optional `bot` arg on bot tools |

## Verify locally

```bash
cd mcp && npm test
node scripts/validate-template.mjs
```
