# 08 — QR login (user account)

**Status: Done**

## Goal

QR / “Link Desktop Device” login as an alternative to phone+code.

## Implemented

| Tool | Behavior |
| --- | --- |
| `start_qr_login` | teleproto `signInUserWithQrCode`; stores rotating `tg://login?token=…` on login state |
| `complete_qr_login` | Poll status; optional 2FA `password` |
| `cancel_login` | AbortController cancel |
| `auth_status` | Exposes `qr_url` + `login_status` |

Phone flow unchanged. Session still under `~/.cursor-telegram/`. Skills updated (`telegram-user-setup`).

## Note

MCP hosts may not render QR images — tool returns scannable URL string (as planned).

## Acceptance

- [x] QR tools listed in smoke
- [x] Skill documents QR path
- [ ] Live scan verified on a real account (user machine)

## Todos

- [x] Implement QR start/complete against teleproto
- [x] Skill + README
- [x] Smoke: tools listed
