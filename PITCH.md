# ভিত্তি (Bhitti) — Pitch Document

**Project:** A one-page luxury online store that sells a single red brick.
**Live site:** <https://kholipha-ahmmad-al-amin.github.io/luxury-brick-store/>
**Stack:** Three.js + GSAP + Matter.js + Firebase (zero build, no bundler)

---

## The Vision (150 words)

My goal was ruthless: take the dullest object alive — a plain red brick — and
make a stranger *feel* something in three seconds. So I built **ভিত্তি**, where
a brick is not concrete but the **first step of a dream** — owning your own
home, an emotion every Bangladeshi understands. The vision: *quiet luxury
that refuses to bore*. Visitors scroll a cinematic story (মাটি → আগুন → সময় → ভরসা),
grab and spin a real-time **3D brick**, and play a brick-stacking **mini-game**.
Underneath sits a research-backed psychology layer: **Goal-Gradient** progress
bars, a **Zeigarnik** unfinished-cart nudge, a **Labor-Illusion** checkout,
and **honest scarcity**. Every byte ships with semantic HTML, ARIA, JSON-LD,
and consent-gated analytics. Zero build, zero backend required.

---

## What's New in v2.0

- **Full SEO/a11y/social audit** — JSON-LD, OG, Twitter Card, theme-color, semantic landmarks
- **Strict consent gating** — Firebase is opt-in, no third-party cookies, no PII
- **Optimized Three.js** — singleton texture cache, `dpr ≤ 2`, no asset round-trips
- **Optimized mini-game** — one Canvas2D sprite, translated per brick (no churn)
- **Prefers-reduced-motion** honored globally
- **CI/CD** — GitHub Actions + GitLab CI parity with the same audit checks
- **Docs** — PRD.md + SDD.md + this PITCH.md re-positioned around engineer-grade handoff

---

## What I deliberately did *not* build

- **No framework.** Vanilla JS in a single IIFE; runs from `file://`.
- **No dependency hell.** Three CDNs, all SRI-able, all swappable.
- **No tracking that requires a popup banner on first paint.** The consent
  banner appears only after the page is interactive, and analytics stays off
  until the user grants it.
- **No fast-tracked checkout.** The 4-step Labor-Illusion sequence is the
  whole point of the UX — removing it would erase the emotional payoff.

---

## Tools & prompting

GitLab Duo + GitHub Copilot as pair-programmers with Three.js, GSAP, and
Matter.js. I prompted iteratively — set the mood first (*"premium, emotional,
never boring"*) — then refined each interaction and audited the code like an
SQE.

## Satisfaction

Genuinely proud. Fluid, intentional, human.
