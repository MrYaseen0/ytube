# Skill: testing (QA and verification)

## What it does
Runs focused, evidence-based checks: reproduce first, make the smallest fix, run targeted checks, then the full gate. Report commands and actual results — never claim success from inspection alone.

## When to use it
Every bug fix, regression, or behavior change. Also before any commit.

## Reusable instruction
```
Reproduce first, write the smallest test that catches the failure, implement
the narrow fix, run targeted checks, then run the full gate. Report commands
and actual results.
```

## YTUBE specifics
- This repo has no test runner and no lint script. The full gate is
  `npm run build` (Next.js 14 production build; must compile all 16 routes).
- Targeted checks: `npx tsc --noEmit` for a TypeScript-only change (fast, runs
  without the full build).
- Manual smoke: `npm run dev` on port 3000, then verify pages render:
  `/` (feed + categories), `/signin`, `/signup`, `/watch/[id]`, `/admin`
  (redirects to `/setup` in demo mode).
- UI checks: 360px, 390px, 768px, desktop. Tap every changed control; check
  for horizontal overflow, sticky-header overlap, and drawer behavior.
- Auth-mode matrix (once Supabase is connected): anonymous, signed-in user,
  admin — including direct server-action calls, not just button clicks.

## Checklist
- [ ] Issue reproduced or baseline recorded before the fix
- [ ] Smallest fix applied; no drive-by refactors
- [ ] `npm run build` passed with output pasted as evidence
- [ ] Changed pages/buttons smoke-tested at mobile + desktop widths
- [ ] Failure states exercised (invalid input, demo mode, non-admin)
