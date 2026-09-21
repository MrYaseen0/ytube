# Skill: responsive-ui (Responsive and mobile interaction QA)

## What it does
Tests actual behavior at narrow widths — taps, drawers, overflow, sticky elements — not just CSS appearance. Plus accessibility requirements for interactive controls.

## When to use it
Any layout change, new button/control, drawer/menu/modal work, or auth-page restyle.

## Reusable instruction
```
Test 360px, 390px and 768px widths. Tap every visible control. Check overflow,
stacking, sticky headers, z-index, focus trapping, scroll locking and touch
targets. Keep separate headers, triggers and menu content independent.
```

## YTUBE specifics (verified 2026-09-21)
- Layout shell: `components/AppShell.tsx` — fixed navbar (`h-14`), sidebar
  starts **closed on <768px** (corrected in `useEffect` after mount;
  `components/Sidebar.tsx` renders a mobile drawer only when open).
- Mobile drawer (`components/Sidebar.tsx`): Escape closes it, backdrop closes
  it, `role="dialog"` + `aria-modal="true"`, close button is focusable, and
  initial focus moves into the drawer.
- Touch targets: every icon-only control (navbar menu toggle, mobile search,
  drawer close, account avatar) is at least 44px on mobile.
- Escape also closes the navbar account menu (`components/Navbar.tsx`).
- Icon-only buttons carry `aria-label`; menus use `aria-haspopup`/`aria-expanded`.
- Mobile search lives behind the search icon linking to `/results`
  (the search input itself is hidden below `sm:` in `components/Navbar.tsx`).
- Video grids use `line-clamp-2` + `min-w-0` to prevent overflow;
  `components/VideoCard.tsx` supports `grid` and `row` layouts.

## Checklist
- [ ] No horizontal overflow at 360px / 390px / 768px
- [ ] Every interactive control reachable by tap and keyboard
- [ ] Drawers/menus: Escape closes, backdrop closes, aria labels present
- [ ] Icon-only buttons >= 44px touch target on mobile
- [ ] Focus styles visible (`:focus-visible` neon ring in `app/globals.css`)
- [ ] No content hidden behind the fixed navbar or drawer overlay
