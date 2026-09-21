# Skill: ui-animations (UI motion)

## What it does
Adds restrained, performant motion to YTUBE: subtle enter/hover feedback on the sign-in/sign-up showcase pages and video cards. Transform/opacity only, fast interaction feedback, `prefers-reduced-motion` respected, and content never hidden by animation.

## When to use it
Auth-page polish, card hover feedback, drawer/menu transitions. Never for loading spinners that replace content.

## Reusable instruction
```
Audit current motion before adding more. Keep frequent interactions subtle,
make exits quieter than entrances, avoid layout-triggering properties, clean
up observers/timelines and verify touch plus reduced-motion behavior.
Define the purpose and emotional target first. Animate transform and opacity
where possible, keep interaction feedback fast, stage one primary action, use
restrained secondary motion and support prefers-reduced-motion.
```

## YTUBE motion rules (verified 2026-09-21)
- Keyframes live in `app/globals.css` (`@keyframes fade-up`); utility class
  `.animate-fade-up` with `animation-fill-mode: both` so the final state is
  always visible even if the animation never runs.
- `@media (prefers-reduced-motion: reduce)` disables the entrance animation
  globally — check this media query is still present after editing CSS.
- Sign-in/sign-up (`components/AuthForms.tsx` `AuthShell`): one gentle
  fade-up on the card (400ms), staggered feature-list items in the branded
  panel — opacity/translate only.
- Video cards (`components/VideoCard.tsx`): thumbnail hover uses
  `transition-transform` scale on the image and `hover:shadow-neon` /
  `hover:ring-yt-pink/50` on the frame; the `group` class must be present on
  the card wrapper for `group-hover:` variants to work.
- Drawer (`components/Sidebar.tsx` mobile): no JS animation library; the
  backdrop fade is CSS-only. Keep open/close instant and quiet.
- Never: entrance animations that start `opacity-0` without fill-mode,
  layout-triggering properties (width/height/margin), parallax, or delays
  longer than 150ms on interactive feedback.

## Checklist
- [ ] Only transform/opacity animated
- [ ] `prefers-reduced-motion` disables motion
- [ ] Final state visible (fill-mode or no hidden initial state)
- [ ] Hover feedback <= 200ms, no layout thrash
- [ ] Touch devices: motion doesn't block taps or hide controls
