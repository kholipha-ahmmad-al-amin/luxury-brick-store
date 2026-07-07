# Contributing

Thanks for caring enough to open this file. **ভিত্তি** is small on purpose —
one page, one product, one experience. Please keep contributions aligned with
that spirit.

## Ground rules

1. **No build step.** If your change requires npm/webpack/vite, it will be
   rejected. The site is plain HTML / CSS / JS by design.
2. **No inline JS in HTML.** All event handlers must live in `script.js`.
   This is what keeps the site CSP-ready.
3. **No new dependencies without discussion.** The current stack is:
   Three.js, GSAP + ScrollTrigger, Matter.js, Firebase. Add to the list only
   if you can defend why an existing dep or ~30 lines of vanilla JS won't
   do the job.
4. **Psychology hooks are intentional.** If you remove or weaken a
   Goal-Gradient / Zeigarnik / Labor-Illusion / Scarcity surface, write
   down why in the PR.
5. **Accessibility is non-negotiable.** New interactive elements need
   `aria-*` attributes, keyboard reachability, and visible focus.

## Workflow

1. Fork the repo.
2. Create a branch: `git checkout -b feat/<short-description>`.
3. Make the change. Keep commits small and atomic.
4. Run the manual checklist below.
5. Open a PR with a before/after screenshot or short clip if it touches
   motion, 3D, or the cart.

## Manual checklist

```bash
# 1. Serve locally (any static server works)
python -m http.server 8080

# 2. Open http://localhost:8080 and verify
#    - [ ] Hero brick loads and drags with momentum
#    - [ ] Reading-progress bar fills as you scroll
#    - [ ] Craft section swaps words (or shows the final one with reduced motion)
#    - [ ] Mini-game starts and the goal bar advances at each tier
#    - [ ] Cart drawer traps focus, opens, accepts the brick, checks out
#    - [ ] Stock ticker decrements within 60 s on first visit
#    - [ ] Consent banner appears once; analytics fire only after "Yes"

# 3. Run a quick a11y sweep
#    - [ ] Tab through every interactive element
#    - [ ] Enable prefers-reduced-motion in DevTools and reload

# 4. Confirm Lighthouse Performance ≥ 95 in a private window
```

## Coding style

- ES5+ for `script.js` (no modules, no transpilation). Prefer `var` /
  `function` to keep the file runnable as-is.
- 2-space indent, single quotes, semicolons.
- Bangla strings are written directly; English ASCII in comments.

## License

By contributing you agree your work is MIT-licensed under the project's
LICENSE file.