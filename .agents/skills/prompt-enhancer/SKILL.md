# Skill: prompt-enhancer (Prompt enhancer)

## What it does
Converts a rough request into one precise, copy-pasteable coding-agent task without changing intent. Adds acceptance criteria, files to inspect, constraints, verification commands, and a required final change summary. Diagnoses before editing; never invents completed work.

## When to use it
When the request is terse ("fix the sidebar", "make it prettier") or spans subsystems. For Yaseen's style — short Roman-Urdu bug reports — always enhance before implementing.

## Reusable instruction
```
Rewrite my request as one copy-pasteable implementation prompt. Preserve my
requirements, add acceptance criteria, likely files to inspect, constraints,
verification commands and a required final change summary. Diagnose before
editing; never invent completed work.
```

## YTUBE enhancement template
```
Task: <one line>

Context: YTUBE is Next.js 14 + TypeScript + Tailwind + Supabase at ~/workspace/ytube.
Relevant skill: .agents/skills/<skill>/SKILL.md

Inspect first: <exact files, e.g. components/Sidebar.tsx, lib/admin-actions.ts>

Constraints:
- Server-side authorization via requireAdmin() for privileged actions; UI hiding is not security.
- Demo mode must keep working when Supabase env keys are absent.
- Theme tokens in tailwind.config.ts only; no one-off colors.
- No new dependencies; no branding changes.

Acceptance criteria:
- <observable behavior 1>
- <observable behavior 2>

Verification: npm run build passes (paste the tail of the output).
Mobile: check 360px / 390px / 768px widths, tap every changed control.

Final summary must state: root cause, changed files, checks with actual
results, remaining limitations.
```

## Checklist
- [ ] Intent preserved — no new features smuggled in
- [ ] Files to inspect named with exact paths
- [ ] Acceptance criteria are observable, not vague ("looks better")
- [ ] Verification command named (`npm run build`)
- [ ] Final summary format required
