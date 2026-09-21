# Skill: decisions (Decision logging)

## What it does
Records lasting technical choices in `docs/DECISIONS.md` with the context, alternatives considered, reason, consequences, and a revisit trigger — so future sessions don't re-litigate settled choices.

## When to use it
Any choice that constrains future work: auth model, admin policy, upload policy, theme, data-model change, third-party service, demo-mode behavior, or a security trade-off.

## Reusable pattern
`Date | Decision | Context | Alternatives | Reason | Consequences | Revisit trigger`

## YTUBE guidance
- Log decisions that already shaped the repo: admin-only uploads, `site_settings`
  editable header/nav/footer/home copy, deep red + pink theme, demo mode when
  Supabase env is absent, hydration-safe sidebar, `requireAdmin()` + RLS,
  ~500 MB video / ~5 MB thumbnail validation, `admin_audit` logging.
- One row per decision; keep each cell to 1–3 sentences.
- "Revisit trigger" must be a concrete event (e.g. "Supabase connected and real
  users exist", "upload abuse observed"), not "someday".
- Update the log in the same change that implements the decision.

## Checklist
- [ ] Decision, context, and alternatives are all present
- [ ] Reason names the deciding factor (security, UX, scope — not taste)
- [ ] Consequences name what is harder or impossible now
- [ ] Revisit trigger is a concrete, observable event
- [ ] Dated 2026-09-21 or later; no future dates
