# Product Requirements Document — ভিত্তি (Bhitti)

**Owner:** কholipha Ahmmad Al Amin
**Status:** v2.0 — *World-class engineering overhaul*
**Last updated:** 2026-07-05

---

## 1. Vision

Sell the dullest object on earth — a single red brick — to a stranger in three
seconds, without lying, without dark patterns, and without ever being boring.

> **One-liner:** *"প্রতিটি স্বপ্নের প্রথম ইট — The first brick of every dream."*

## 2. Mission

Reframe a commodity building material as a deeply emotional artifact through
**cinematic motion**, **tactile 3D**, **frictionless gameplay**, and a
**research-anchored psychology layer**.

## 3. Target audience

| Persona | Description | Why they care |
|---|---|---|
| **The Dreamer (Primary)** | Bangladeshi homeowner, 25–45, building their first house. | A brick = the first physical proof of their dream. |
| **The Skeptic (Secondary)** | Tech-savvy visitor who bounced 5 sites before landing here. | Has to feel premium in < 3 seconds. |
| **The Player (Tertiary)** | Visits sites to be entertained, not to buy. | Mini-game + tactile 3D buy us dwell time. |

## 4. Goals & success metrics

| KPI | Target | Measurement |
|---|---|---|
| **Bounce rate** | < 35 % | Plausible analytics via `Bhitti.track` |
| **Time on page** | > 90 s | `performance.now()` deltas |
| **Cart-add intent** | > 12 % of unique visitors | `add_to_cart` event / `page_view` |
| **Checkout-start intent** | > 60 % of cart-adds | `checkout_start` event |
| **Mobile Lighthouse** | ≥ 95 across the board | Manual + CI |
| **3-second comprehension** | > 80 % self-report | Qualitative (manual testing) |

## 5. Non-goals

- Real e-commerce backend — the site is a **single-page commerce experience**.
- Multi-currency / i18n — Bangla-first, English secondary in code comments.
- User accounts — anonymous, consent-based telemetry only.
- Multi-product — the brick is the product.

## 6. Core experience pillars

### P1. Cinematic scroll story
- Sticky section + GSAP ScrollTrigger
- Word swap: **মাটি → আগুন → সময় → ভরসা** (Earth → Fire → Time → Trust)
- Each panel reveals one emotional beat of the brick's life.

### P2. Tactile 3D object
- Three.js, procedural color + bump + roughness textures (no asset downloads)
- Drag-to-rotate with inertial spin
- Soft shadows, dust particles, cinematic key+rim+fill lighting
- WebGL fallback (static SVG of the brick) for unsupported devices.

### P3. Frictionless mini-game
- Canvas 2D stacking game with Matter.js physics
- **Goal-Gradient milestone bar** (5 → 10 → 20 → 35 → 50)
- WebAudio blips for stack + milestone + game-over
- Local best + optional global leaderboard via Firestore

### P4. Research-anchored psychology layer
The four pillars applied **everywhere**, not in pockets:

| Effect | Where applied |
|---|---|
| **Goal-Gradient Effect** (Hull, 1932) | Reading progress bar, milestone bar in-game, progress on hero CTA hover, checkout stepper, cart counter increment |
| **Zeigarnik Effect** (Zeigarnik, 1927) | Persisted unfinished cart, dynamic-island nudge, ticker reminder, exit-intent save-the-cart modal |
| **Labor Illusion** (Sherman, 1985) | Add-to-cart micro-progress, multi-step checkout, "ভরসা" delivery promise in confirmation |
| **Urgency / Scarcity** (Cialdini, 1984) | Live stock counter (decrements on session + visits), end-of-day countdown, "limited batch" tag |

### P5. Trust & craft signals
- 100% quality guarantee
- "★★★★★" implicit trust marker
- Hand-crafted, no-machine messaging
- Clear typography (Hind Siliguri + Tiro Bangla)

## 7. User stories

| ID | As a… | I want… | So that… |
|---|---|---|---|
| US-01 | Dreamer | to feel the brick in 3 seconds | I trust this is premium |
| US-02 | Skeptic | to skip past marketing fluff | I see the price and craft fast |
| US-03 | Player | to play the stacking game | I stay on the page longer |
| US-04 | Mobile user | the same experience as desktop | I can buy from my phone |
| US-05 | Returning buyer | my unfinished cart to follow me | I complete the order |
| US-06 | Accessibility user | to navigate with keyboard | I can buy without a mouse |
| US-07 | SQE reviewer | the codebase to be auditable | I can ship it to production |

## 8. Acceptance criteria (release gate)

- [x] Lighthouse Performance ≥ 95
- [x] Lighthouse Accessibility ≥ 95
- [x] Lighthouse Best Practices ≥ 95
- [x] Lighthouse SEO = 100
- [x] `prefers-reduced-motion` honored
- [x] All psychology hooks wired & tracked in analytics
- [x] Offline-capable via service worker
- [x] No inline JS in HTML (CSP-ready)
- [x] `script.js` < 25 KB minified-equivalent after refactor
- [x] All Firestore writes validated by Security Rules (see SDD §9)

## 9. Out of scope (v2.1+)

- Real checkout / payment gateway
- A/B testing framework (currently single-rolled)
- Server-side rendering
- Multi-locale (only `bn` and `en` meta tags)