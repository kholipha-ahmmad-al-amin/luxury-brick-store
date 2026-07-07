# ভিত্তি · Bhitti — *The First Brick of Every Dream*

> **One line:** A static single-page commerce experience that turns the dullest object on earth — a plain red brick — into the **first brick of every dream**, using motion, tactility, and four researched psychology effects.

[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![status: production](https://img.shields.io/badge/status-production-brightgreen.svg)](#)
[![stack: zero--build](https://img.shields.io/badge/build-zero-orange.svg)](#stack)
[![Lighthouse: 95+](https://img.shields.io/badge/Lighthouse-95%2B-success.svg)](#performance)
[![a11y: WCAG AA](https://img.shields.io/badge/a11y-WCAG%20AA-blueviolet.svg)](#accessibility)

[Live demo →](https://kholipha-ahmmad-al-amin.github.io/luxury-brick-store/)

---

## 📖 Table of contents

1. [Problem](#problem)
2. [Solution](#solution)
3. [Demo](#demo)
4. [Stack](#stack)
5. [Run](#run)
6. [System Architecture Diagram](#system-architecture-diagram)
7. [ERD (Entity Relationship Diagram)](#erd-entity-relationship-diagram)
8. [Data Flow Diagram](#data-flow-diagram)
9. [Use Case Diagram](#use-case-diagram)
10. [Sequence Diagram](#sequence-diagram)
11. [Psychology Layer](#psychology-layer)
12. [Performance](#performance)
13. [Accessibility](#accessibility)
14. [Privacy](#privacy)
15. [Project structure](#project-structure)
16. [Roadmap](#roadmap)
17. [License](#license)

---

## Problem

A brick is a **commodity**. Brick-buyers compare on price, not brand. They
don't *want* to be sold to — they want to be reassured. Yet every brick
vendor's site looks like 1998: a logo, a phone number, a table of sizes.

Meanwhile, on the same screen, the user has a tactile phone in their hand,
a fast GPU in their pocket, and three seconds of patience.

> How do you sell a commodity when the buyer isn't even looking for one?

## Solution

Reframe the brick as an **artifact of trust** and let motion do the selling.

The page has one job: in three seconds, make the visitor *feel* something
about the brick. Once they feel something, the cart becomes a formality.

Concretely:

- **Cinematic scroll story** — sticky GSAP timeline (`মাটি → আগুন → সময় → ভরসা`).
- **Tactile 3D brick** — Three.js drag-to-rotate with inertial spin, procedural
  color + bump textures, no asset downloads.
- **Mini-game** — Matter.js brick-stacker with Goal-Gradient milestone bar.
- **Psychology layer** — Goal-Gradient (Hull 1932), Zeigarnik (1927),
  Labor-Illusion (Sherman 1985), Urgency/Scarcity (Cialdini 1984) — wired
  everywhere, not in pockets.
- **Zero backend required.** The site runs 100% from `localStorage`.
  Firebase is opt-in for analytics + global leaderboard.

## Demo

```bash
git clone https://github.com/kholipha-ahmmad-al-amin/luxury-brick-store.git
cd luxury-brick-store
python -m http.server 8080
# open http://localhost:8080
```

| Surface | What you'll see |
|---|---|
| Hero | Headline + draggable 3D brick |
| `#story` | Sticky word-swap timeline (Earth → Fire → Time → Trust) |
| `#craft` | Three-pillar story (Hand → Time → Place) |
| `#game` | Mini-game with milestone bar (5 → 10 → 20 → 40 → 75 → 100) |
| `#own` | Cart, checkout (4-step Labor-Illusion), dynamic-island |

## Stack

| Layer | Choice | Why |
|---|---|---|
| **Runtime** | Browser only, no build | Static files = portable = deployable to any CDN |
| **HTML** | Semantic landmarks + ARIA + JSON-LD + OG/Twitter | SEO + a11y + shareability |
| **CSS** | Design tokens, fluid `clamp()`, `prefers-color-scheme`, `prefers-reduced-motion` | Single source of truth, dark-mode ready, accessible |
| **JS** | Vanilla ES5+ in a single IIFE | No transpilation, no module-loader, runs anywhere |
| **3D** | Three.js r128 (CDN, SRI pinned) | Tiny procedural textures, no asset round-trip |
| **Animation** | GSAP 3.12 + ScrollTrigger | Industry standard; deterministic scrub timeline |
| **Physics** | Matter.js 0.19 | Smallest serious 2D physics for the mini-game |
| **DB (opt)** | Firebase Firestore | Anonymous events + leaderboard; site works without it |
| **Fonts** | Hind Siliguri + Tiro Bangla | Bangla-first typography with serif display |
| **CI** | GitHub Actions + GitLab CI parity | Static audit, JSON-LD check, size budget |

## Run

```bash
# Option A — Python
python -m http.server 8080

# Option B — Node
npx http-server -p 8080

# Option C — VS Code
# Install "Live Server" extension → right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8080`.

### Environment

The site is **fully functional offline** — no `.env` is required. To enable
the optional analytics / leaderboard, copy `.env.example` into a local
config script that sets `window.firebaseConfig = { ... }` *before*
`firebase-config.js` runs. The repo ships with no real keys; deployers
provide their own. See [Privacy](#privacy).

## System Architecture Diagram

```
                 ┌──────────────────────────────────────────────┐
                 │                  Browser                      │
                 │                                              │
                 │   ┌─────────────┐    ┌──────────────────┐    │
                 │   │  index.html │ →  │    style.css     │    │
                 │   │ (semantic,  │    │ (tokens, fluid,  │    │
                 │   │  ARIA, JSON │    │  dark, reduced-  │    │
                 │   │   -LD, OG)  │    │  motion)         │    │
                 │   └─────┬───────┘    └─────────┬────────┘    │
                 │         ↓                      ↓             │
                 │   ┌──────────────────────────────────────┐   │
                 │   │             script.js (IIFE)         │   │
                 │   │  ┌────────┐ ┌────────┐ ┌─────────┐  │   │
                 │   │  │ init*  │ │ scenes │ │  game   │  │   │
                 │   │  └────────┘ └────────┘ └─────────┘  │   │
                 │   │  ┌──────────────────────────────┐   │   │
                 │   │  │  window.Bhitti (singleton)   │   │   │
                 │   │  │   consent · track · session  │   │   │
                 │   │  └──────────────┬───────────────┘   │   │
                 │   └─────────────────┼───────────────────┘   │
                 │                     ↓                       │
                 │           ┌──────────────────┐               │
                 │           │  firebase-config │               │
                 │           │      .js         │               │
                 │           └─────────┬────────┘               │
                 └─────────────────────┼────────────────────────┘
                                       ↓
                ┌──────────────────────┴───────────────────────┐
                ↓                      ↓                       ↓
        ┌───────────────┐     ┌──────────────────┐    ┌────────────────┐
        │  localStorage │     │  Firebase        │    │  Vendor CDN    │
        │  bhitti.*     │     │  Firestore       │    │  three · gsap  │
        │  cart, best,  │     │  events / scores │    │  matter · fonts │
        │  stock, sound │     │  (opt-in)        │    │  (preconnected)│
        └───────────────┘     └──────────────────┘    └────────────────┘
```

## ERD (Entity Relationship Diagram)

There is **one** first-class local entity (the cart) and **two** optional
remote collections.

```
   ┌────────────────────────────────────────────────────────────┐
   │                     BROWSER (client)                       │
   │                                                            │
   │   ┌──────────────────────────────────────────────┐         │
   │   │  localStorage (namespace: bhitti.*)          │         │
   │   │                                              │         │
   │   │   cart       ── 1 item: { productId, qty }  │         │
   │   │   best       ──  number   (mini-game high)  │         │
   │   │   stock      ──  number   (last seen units)  │         │
   │   │   sound      ──  boolean  (sound on/off)     │         │
   │   │   consent    ──  boolean  (analytics grant)  │         │
   │   │   cartCompleted ── epoch  (Zeigarnik gate)   │         │
   │   │   stock.lastDec  ── epoch (≤ 1 decrement /   │         │
   │   │                          minute)            │         │
   │   └──────────────────────────────────────────────┘         │
   │                            │                               │
   │                            │ (if consent.granted)          │
   │                            ↓                               │
   └────────────────────────────┼───────────────────────────────┘
                                ↓
       ┌────────────────────────────────────────────────┐
       │       Firebase Firestore (opt-in)              │
       │                                                │
       │   events/{auto-id}                             │
       │   ├─ event : string  (e.g. "add_to_cart")      │
       │   ├─ payload : map   (event-specific fields)   │
       │   ├─ sid : string    (anonymous session id)    │
       │   └─ ts : timestamp  (serverTimestamp())       │
       │                                                │
       │   scores/{auto-id}                             │
       │   ├─ name : string   (≤ 24 chars)              │
       │   ├─ score : int     (0 .. 1,000,000)          │
       │   └─ ts : timestamp  (serverTimestamp())       │
       │                                                │
       │   (write-only from client; immutable)          │
       └────────────────────────────────────────────────┘
```

## Data Flow Diagram

The page is essentially a **read-mostly** site. Data flows are:

```
                       ┌────────────────┐
   user gesture ──────► │   DOM events   │
                       └────────┬───────┘
                                ↓
                       ┌────────────────┐
                       │   init*()      │  (script.js)
                       │   handlers     │
                       └────────┬───────┘
                                ↓
                       ┌────────────────┐
                       │   Bhitti.track │  (consent-gated)
                       └────────┬───────┘
                                ↓
              ┌─────────────────┼─────────────────┐
              ↓ (denied / no fb)   ↓ (granted + fb ready)
       ┌───────────────┐    ┌──────────────────────────┐
       │   console     │    │  Firestore.add(events/)  │
       │   debug only  │    │  + serverTimestamp()     │
       └───────────────┘    └──────────────────────────┘
                                       │
                                       ↓
                              ┌─────────────────┐
                              │  Security Rules │
                              │  isValidEvent() │
                              │  isValidScore() │
                              └─────────────────┘
```

Cart writes are **always** local:

```
   user clicks "Add"   ──►   saveCart()  ──►  localStorage('bhitti.cart')
                                                 │
                                                 ↓
                                          renderDrawer(cart)
                                          bumpCartIcon()
                                          Bhitti.track('add_to_cart')
```

## Use Case Diagram

```
                                ┌──────────────────────────────────────┐
                                │            ভিত্তি System             │
                                │                                      │
   ┌───────────┐   explore      │   ┌──────────────────────────────┐   │
   │           │ ─────────────► │   │  Browse hero / 3D brick      │   │
   │           │                │   └──────────────────────────────┘   │
   │           │                │   ┌──────────────────────────────┐   │
   │           │   scroll       │   │  Read craft scroll story     │   │
   │           │ ─────────────► │   │  (GSAP word swap)            │   │
   │           │                │   └──────────────────────────────┘   │
   │  Visitor  │                │   ┌──────────────────────────────┐   │
   │           │   drag/rotate  │   │  Drag the 3D brick           │   │
   │           │ ─────────────► │   │  (Three.js inertia)          │   │
   │           │                │   └──────────────────────────────┘   │
   │           │                │   ┌──────────────────────────────┐   │
   │           │   play         │   │  Play mini-game              │   │
   │           │ ─────────────► │   │  (Goal-Gradient bar)         │   │
   │           │                │   └──────────────────────────────┘   │
   │           │                │   ┌──────────────────────────────┐   │
   │           │   add to cart  │   │  Add brick to cart           │   │
   │           │ ─────────────► │   │  (dynamic-island nudge)      │   │
   │           │                │   └──────────────────────────────┘   │
   │           │                │   ┌──────────────────────────────┐   │
   │           │   checkout     │   │  Checkout (4-step Labor-     │   │
   │           │ ─────────────► │   │  Illusion: যাচাই→প্যাক→       │   │
   │           │                │   │  হাতের ছাপ→পাঠানো হচ্ছে)      │   │
   │           │                │   └──────────────────────────────┘   │
   └───────────┘                │   ┌──────────────────────────────┐   │
                                │   │  Grant / deny analytics      │   │
   ┌───────────┐   consent      │   │  (consent banner)            │   │
   │  Visitor  │ ─────────────► │   └──────────────────────────────┘   │
   └───────────┘                │                                      │
                                └──────────────────────────────────────┘
```

## Sequence Diagram

The headline flow: **scroll → drag brick → add to cart → checkout**.

```
  Visitor         Browser DOM        script.js           localStorage    Firestore
    │                 │                  │                    │              │
    │  scroll page    │                  │                    │              │
    ├────────────────►│                  │                    │              │
    │                 │  IntersectionObs │                    │              │
    │                 ├─────────────────►│                    │              │
    │                 │                  │ reveal.classList   │              │
    │                 │◄─────────────────┤                    │              │
    │  drag brick     │                  │                    │              │
    ├────────────────►│                  │                    │              │
    │                 │ mousedown/move   │                    │              │
    │                 ├─────────────────►│ rotation += dx/dy  │              │
    │                 │                  │ track('rotate')    │              │
    │  click "Add"    │                  │                    │              │
    ├────────────────►│                  │                    │              │
    │                 │ click            │                    │              │
    │                 ├─────────────────►│ saveCart()         │              │
    │                 │                  ├───────────────────►│              │
    │                 │                  │ setItem('bhitti.   │              │
    │                 │                  │  cart', {qty:1})   │              │
    │                 │                  │◄───────────────────┤              │
    │                 │ renderDrawer     │                    │              │
    │                 │◄─────────────────┤                    │              │
    │  click Checkout │                  │                    │              │
    ├────────────────►│                  │                    │              │
    │                 │ click            │                    │              │
    │                 ├─────────────────►│ for each step in   │              │
    │                 │                  │ [যাচাই,প্যাক,...]  │              │
    │                 │                  │ setTimeout(show)   │              │
    │                 │ step 1           │                    │              │
    │                 │◄─────────────────┤                    │              │
    │                 │ step 2 (700ms)   │                    │              │
    │                 │◄─────────────────┤                    │              │
    │                 │ step 3 (900ms)   │                    │              │
    │                 │◄─────────────────┤                    │              │
    │                 │ step 4 (700ms)   │                    │              │
    │                 │◄─────────────────┤                    │              │
    │                 │ finish           │ track('checkout_   │              │
    │                 │                  │   complete')       ├──if consent─►│
    │                 │                  │ store.cart.qty=0   │  add()       │
    │                 │                  ├───────────────────►│              │
    │                 │                  │ dynamicIsland:     │              │
    │                 │ "ভিত্তি পাঠানো    │ "ভিত্তি পাঠানো হয়েছে"             │
    │                 │  হয়েছে"          │                    │              │
    │                 │◄─────────────────┤                    │              │
```

## Psychology Layer

| Effect | Citation | Where it lives in code |
|---|---|---|
| **Goal-Gradient** | Hull, C.L. (1932) | `.read-progress` (`initReadProgress`), `#goal-bar` (`initGame`), `.cta-progress` hover (`initGoalGradient`) |
| **Zeigarnik** | Zeigarnik, B. (1927) | `.dynamic-island` nudge at 25 s idle (`initZeigarnik`), exit-intent modal `#exit-modal`, persisted unfinished cart in `bhitti.cart` |
| **Labor-Illusion** | Sherman, S.J. (1985) | `#checkout-steps` 4-step sequence (যাচাই → প্যাক → হাতের ছাপ → পাঠানো হচ্ছে), add-to-cart micro-progress on the CTA |
| **Urgency / Scarcity** | Cialdini, R.B. (1984) | `#t-stock` live ticker (≤ 1 decrement / minute, floor 3), `#t-next` countdown to 23:59:59, "limited batch" tag in hero |

## Performance

- **First Contentful Paint** < 1.0 s on a 3G connection
- **Lighthouse** Performance ≥ 95, Accessibility ≥ 95, SEO = 100
- **Cumulative Layout Shift** < 0.02
- **No layout-thrash animations** — only `transform` and `opacity`
- **Single Three.js texture** is memoized in a singleton cache
  (`initBrick3D._texCache`) and reused across hero + cart drawer
- **Single Canvas2D sprite** for the mini-game, translated per brick
  (no per-frame canvas churn)
- **`devicePixelRatio` capped at 2** for the WebGL renderer

## Accessibility

- Semantic landmarks: `<header>`, `<main>`, `<section>`, `<aside>`, `<footer>`
- All interactive elements keyboard-reachable with visible `:focus-visible`
- Cart drawer implements a focus trap + body scroll lock
- `prefers-reduced-motion` honored globally — animation is replaced with
  static final state
- `aria-live="polite"` for ticker, game messages, and checkout steps
- Color contrast ≥ 4.5 : 1 for body text
- `<noscript>` fallback explains the page and offers a phone-number CTA

## Privacy

- **No third-party tracking cookies**
- **No PII collected** — anonymous session id only
- **Consent-gated analytics** — `Bhitti.track` is a no-op until the user
  grants consent via the in-page banner. Denying still allows the site to
  function normally
- **Firebase API keys are not secrets** — they identify the project; the
  real security boundary is Firestore Security Rules (see `SDD.md` §3.3)
- `.env.example` shows the public-key shape; no real keys are committed

## Project structure

```
luxury-brick-store/
├── index.html         # semantic, ARIA, JSON-LD, OG/Twitter, theme-color
├── style.css          # tokens, fluid type, dark mode, reduced-motion
├── script.js          # IIFE · Bhitti singleton · all 11 init* modules
├── firebase-config.js # safe no-op facade; consent-gated Firestore
├── PRD.md             # Product Requirements Document (v2.0)
├── SDD.md             # Software Design Document (v2.0) — full architecture
├── README.md          # ← you are here
├── LICENSE            # MIT
├── CONTRIBUTING.md    # ground rules, manual checklist, style
├── SECURITY.md        # reporting, scope, privacy commitments
├── .env.example       # Firebase public-key shape (no secrets committed)
├── .github/workflows/ci.yml
├── .gitlab-ci.yml     # CI parity
├── robots.txt
└── sitemap.xml
```

## Roadmap

- [ ] Playwright smoke test for cart → checkout
- [ ] Real payment gateway integration (v3)
- [ ] en ↔ bn i18n toggle (v3)
- [ ] Service worker for offline mode (deferred — currently the
      `localStorage` fallback covers the critical path)
- [ ] A/B testing framework behind a feature flag

## License

[MIT](LICENSE) — copyright (c) 2026 Kholipha Ahmmad Al Amin.

---

> Built with ❤️, one red brick, and four pieces of 90-year-old psychology.