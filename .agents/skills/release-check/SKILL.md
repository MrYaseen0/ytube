# Skill: release-check (Release verification)

## What it does
Defines the release gate for YTUBE: the exact commands and checks that must pass before a change is committed or pushed. Completion requires real tool evidence, not inspection.

## When to use it
Before every commit and push. No exceptions.

## Reusable instruction
```
Run the repository's full check/build gate. Completion requires real
command/tool evidence. Use the commands supported by that repository; do not
claim lint passed when no lint script exists.
```

## YTUBE release gate
1. `npm run build` in `~/workspace/ytube` — must exit 0 and compile all
   16 routes (check the tail: route list + "Compiled successfully" style output).
   This repo has **no lint script** — never claim lint ran.
2. Verify the changed pages render: desktop `/`, mobile-width `/`, `/signin`,
   `/signup`, and any admin page touched (in demo mode `/admin` redirects to
   `/setup` — confirm the redirect, not a crash).
3. `git status` reviewed: only intended files changed; no `.env.local`,
   credentials, or build artifacts staged.
4. Commit message names what changed and why. Push to `MrYaseen0/ytube`
   (verify `git remote -v` first).

## Checklist
- [ ] `npm run build` passed; output tail recorded
- [ ] Changed pages smoke-tested (mobile + desktop)
- [ ] No secrets or `.env.local` in the commit
- [ ] Remote verified as `MrYaseen0/ytube` before push
- [ ] Commit hash recorded as push evidence
