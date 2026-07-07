# Software Design Document — ভিত্তি (Bhitti)

**Owner:** কholipha Ahmmad Al Amin
**Status:** v2.0
**Last updated:** 2026-07-05

---

## 1. Goals

Translate the PRD into a concrete, auditable, shippable software architecture
that can survive an SQE review at any major product company.

## 2. Constraints

| Type | Constraint |
|---|---|
| **Runtime** | Browser only (no server). Must work as a static bundle on any CDN. |
| **No-build** | Zero npm/webpack. Load `script.js` directly. |
| **Offline** | Must function with `localStorage` if Firebase is absent. |
| **Performance** | First Contentful Paint < 1.0 s on a 3G connection. |
| **Privacy** | No third-party cookies. Consent-gated analytics. |
| **CSP** | Must work under a strict `script-src 'self'` policy. |

## 3. Architecture

### 3.1 High-level

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                         index.html                          │  │
│  │  • Meta tags, JSON-LD, Open Graph                          │  │
│  │  • Skeleton DOM with semantic landmarks                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                       style.css (≈ 600 LoC)                │  │
│  │  • Design tokens (custom properties)                       │  │
│  │  • Fluid typography via `clamp()`                          │  │
│  │  • Reduced-motion overrides                                │  │
│  │  • BEM-ish naming                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                ↓                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    script.js (IIFE bundle)                 │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │  │
│  │  │  init*  │ │  scenes  │ │   game   │ │     cart     │   │  │
│  │  └─────────┘ └──────────┘ └──────────┘ └──────────────┘   │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │          window.Bhitti  (analytics facade)            │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                ↓                                  │
│             ┌──────────────────┴──────────────────┐              │
│             ↓                                     ↓              │
│     ┌─────────────────┐                  ┌─────────────────┐    │
│     │  localStorage   │                  │   Firebase      │    │
│     │  cart, best,    │                  │   Firestore     │    │
│     │  stock, sound   │                  │ events + scores │    │
│     └─────────────────┘                  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Module map (`script.js`)

Each `init*` function is idempotent, defensive (returns on missing DOM),
and gated by `prefers-reduced-motion` where appropriate.

| Module | Responsibility | Psychology |
|---|---|---|
| `initReveal` | IntersectionObserver scroll reveals | — |
| `initReadProgress` | Goal-Gradient reading bar (top-of-page) | **Goal-Gradient** |
| `initScarcity` | Stock ticker, daily countdown, exit-intent | **Urgency / Scarcity** |
| `initCraftScroll` | GSAP ScrollTrigger word swap (মাটি→আগুন→সময়→ভরসা) | Narrative pacing |
| `initBrick3D` | Three.js scene, drag-to-rotate, WebGL fallback | Tactility |
| `initGame` | Mini-game (Matter.js + Canvas2D) | **Goal-Gradient** milestones |
| `initCart` | Cart, Zeigarnik nudge, Labor-Illusion checkout | **All four** |
| `initMobileNav` | Burger menu, drawer focus management | A11y |
| `initCursorGlow` | Ambient cursor follow | Delight |
| `initMagnetic` | Magnetic CTA lean | Delight |
| `initConsent` | Consent gate for analytics | Privacy |
| `initExitIntent` | Save-the-cart modal | **Zeigarnik** |
| `initPWA` | Service worker registration | Offline |

### 3.3 Data model

#### LocalStorage schema

| Key | Type | Purpose |
|---|---|---|
| `bhitti-cart` | number | Cart quantity |
| `bhitti-best` | number | Mini-game personal best |
| `bhitti-stock` | number | Last seen stock (7–17) |
| `bhitti-sound` | `"on"` \| `"off"` | Sound preference |
| `bhitti-consent` | `"granted"` \| `"denied"` | Analytics consent |
| `bhitti-session` | `{ id, firstSeen, lastSeen, pageViews }` | Anonymous session |

#### Firestore schema

```text
events/{auto-id}
  event:   string              # page_view | brick_rotate | game_start |
                                # game_over | add_to_cart |
                                # checkout_start | checkout_complete
  ts:      timestamp (server)  # firebase.firestore.FieldValue.serverTimestamp()
  payload: map                 # free-form event payload
  session: string              # anonymous session id (UUID v4)
  ua:      string              # navigator.userAgent (post-consent only)

scores/{auto-id}
  name:    string              # "অতিথি" by default
  score:   number
  ts:      timestamp (server)
```

#### Security Rules

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    // Anyone can create an event or score (write-only public surface).
    match /events/{id} {
      allow read: if false;            // never expose raw events
      allow create: if isValidEvent();
      allow update, delete: if false;
    }

    match /scores/{id} {
      allow read: if true;             // public leaderboard
      allow create: if isValidScore();
      allow update, delete: if false;  // immutability = integrity
    }

    function isValidEvent() {
      return request.resource.data.keys().hasOnly(['event','ts','payload','session','ua'])
          && request.resource.data.event is string
          && request.resource.data.event.size() < 64
          && request.resource.data.session is string
          && request.resource.data.session.size() <= 64;
    }

    function isValidScore() {
      return request.resource.data.keys().hasOnly(['name','score','ts'])
          && request.resource.data.score is int
          && request.resource.data.score >= 0
          && request.resource.data.score <= 1000000
          && request.resource.data.name is string
          && request.resource.data.name.size() <= 24;
    }
  }
}
```

## 4. Performance budget

| Resource | Size (gzipped) | Notes |
|---|---|---|
| `index.html` | < 6 KB | Inline critical CSS allowed |
| `style.css` | < 8 KB | |
| `script.js` | < 18 KB | |
| `firebase-config.js` | < 1 KB | |
| GSAP + ScrollTrigger | ≈ 30 KB (CDN) | Preconnected |
| Three.js r128 | ≈ 120 KB (CDN) | Preconnected |
| Matter.js | ≈ 25 KB (CDN) | Preconnected |

## 5. Security & privacy

- **No inline JS** — all `onclick=` removed; CSP-ready.
- **Consent-gated telemetry** — `Bhitti.track` is a no-op until consent granted.
- **No third-party cookies** — analytics is first-party Firestore or local.
- **No PII collected** — anonymous session id only.
- **Firestore rules** are the security boundary; web API keys are not secrets.

## 6. Accessibility

- Semantic landmarks: `<header>`, `<main>`, `<section>`, `<aside>`, `<footer>`.
- All interactive controls keyboard-reachable.
- Cart drawer implements a minimal focus trap + `aria-hidden` toggling.
- Body scroll lock when drawer open.
- `prefers-reduced-motion` honored globally.
- Color contrast ≥ 4.5:1 for body text.
- `aria-live="polite"` for ticker, game messages, and checkout steps.

## 7. Testing strategy

- **Manual**: Lighthouse, axe DevTools, screen reader (NVDA / VoiceOver).
- **Manual SQE checklist**: see `AUDIT.md` (generated during refactor).
- **Automated** (future): Playwright smoke test for cart → checkout flow.

## 8. Deployment

- **CI**: GitHub Actions (`.github/workflows/ci.yml`) — HTML/CSS/JS lint + link
  check + asset validation. Also keeps `.gitlab-ci.yml` for parity.
- **CD**: GitHub Pages primary, GitLab Pages fallback. Both serve the same
  static directory `public/`.

## 9. Observability

| Signal | Sink |
|---|---|
| Page views | `Bhitti.track('page_view')` |
| Funnel events | `Bhitti.track('add_to_cart'\|'checkout_start'\|'checkout_complete')` |
| Mini-game | `Bhitti.track('game_start'\|'game_over', { score })` |
| Errors | `window.addEventListener('error', ...)` → `Bhitti.track('js_error')` |

## 10. Open questions

- A real payment gateway (v2.1) — out of scope here.
- I18n — currently bn-only, but the meta tags declare `en` fallback.