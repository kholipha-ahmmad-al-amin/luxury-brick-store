# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅ active  |
| < 2.0   | ❌ end-of-life |

## Reporting a vulnerability

Please report security issues privately to **kholipha@example.com**
(replace with the project's actual security contact before going public).

We will:

1. Acknowledge the report within 72 hours.
2. Triage and reproduce within 7 days.
3. Patch critical issues within 30 days, lower-severity within 90 days.
4. Credit the reporter (with permission) in release notes.

## Scope

The site is a **static single-page application**. The relevant security
boundaries are:

- **Firestore Security Rules** (see `SDD.md` §3.3) — the actual security
  boundary for any data path.
- **Content Security Policy** — designed to be added under
  `script-src 'self'` (no inline event handlers).
- **Firebase API keys** — *not secrets*. They identify the project; they
  do not authorize writes. Real authorization lives in Security Rules.

## Privacy commitments

- No third-party tracking cookies.
- No PII collected. Anonymous session ids only.
- Analytics is **consent-gated**. `Bhitti.track` is a no-op until the user
  grants consent (see `script.js` → `Bhitti.consent`).
- localStorage keys are namespaced under `bhitti.*` and never contain PII.