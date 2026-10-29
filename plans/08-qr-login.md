# 08 — QR login (user account)

## Goal

Offer QR / “link desktop device” login as an alternative to phone+code for `telegram-user`.

## Approach

1. Research teleproto QR export login APIs (LoginToken / QR helpers — match current teleproto version).
2. Tools:
   - `start_qr_login` — returns QR payload or `tg://` URL / base64 PNG if feasible
   - `complete_qr_login` — poll/finish; accept optional 2FA `password`
3. Keep phone flow (`start_login` / `complete_login`) intact.
4. Update `telegram-user-setup` skill with QR path.
5. Session persistence unchanged (`~/.cursor-telegram/`).

## Risks

- MCP hosts may not render QR images well — always return a scannable URL/string fallback.
- Telegram may still demand 2FA password after QR accept.

## Acceptance

- User can authorize without typing a phone code when QR succeeds.
- `auth_status` shows authorized after completion.

## Todos

- [ ] Implement QR start/complete against teleproto
- [ ] Skill + README
- [ ] Smoke: tools listed (no live Telegram required)
