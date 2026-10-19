---
name: portfolio-orchestrator
description: Routes any change to Amit's portfolio site to the right installed skills, in the right order, and holds the shared design rules they all work from. Use for any UI, copy, content, motion, performance, accessibility or SEO change in this repo, before editing files, and before opening a PR.
---

# Portfolio orchestrator

This repo has many skills installed. They overlap, and several would happily redesign the site in their own taste. This skill decides which one runs, when, and what it is allowed to change.

**Authority order, highest first:**
1. Amit's words in chat.
2. `PRODUCT.md` (product truth) and `.impeccable/surfaces/*.md` (the direction contract).
3. `DESIGN.md` once it exists, plus the tokens in `src/styles/global.css`.
4. Any skill's general advice.

When a skill's advice conflicts with a higher level, the higher level wins. Say so in one line and move on.

## Routing table

| The task is... | Run, in order | Notes |
|---|---|---|
| New section, new page, or a visual change | `frontend-design` (plan pass) → build → `impeccable critique <file>` | Extends the existing world. Do not reopen the direction or run `concept-seed` unless Amit asks for a redesign. |
| A new project on the site | `add-project` | One MDX file, never layout code. |
| Copy anywhere (hero, case studies, meta descriptions) | `humanizer` | Amit's voice: plain, a bit fun, no em dashes, no "passionate/leverage/robust", no rule-of-three lists. |
| Tailwind config, tokens, theme | `tailwind-v4-shadcn` (Tailwind v4 parts only) | Tokens live in `global.css` under `@theme`. Do not add the shadcn neutral palette. |
| An interactive React island | `shadcn` for primitives, then `vercel-react-best-practices` | Islands only where static HTML cannot do the job. Keep the JS budget (below). |
| Motion | `motion-framer` for reference, `impeccable animate` for judgement | One authored moment per page. CSS or WAAPI first; add a library only if CSS cannot do it. |
| Stuck on a UX question (wayfinding, a form, an empty state) | `ui-ux-pro-max` as a second opinion | Its style catalog never overrides the direction contract. |
| Before every PR | `web-design-guidelines` → `accessibility-scan` + `accessibility-inspect` → `web-quality-audit` → `impeccable audit` → `impeccable detect --json src` | Fix, then rerun until clean. `accessibility-fix` for mechanical a11y fixes. |
| Slow page or bad Lighthouse score | `performance`, `core-web-vitals` | Measure first. |
| Meta tags, sitemap, structured data | `seo` | |

## Shared design rules (every skill follows these)

**World:** "Press proof". Each page is a press sheet with crop marks, registration targets, a slug line that holds the nav, and a colour-control strip. Process inks (C, M, Y) appear only in the plates, the marks and status. Everything else is key black on paper.

**Tokens:** use the CSS variables in `src/styles/global.css` and never hard-code a hex. `--paper`, `--ink`, `--meta`, `--rule`, `--bed`, `--plate-c`, `--plate-m`, `--plate-y`, `--blend`.

**Type:** Archivo Variable only, with the width axis as the voice. JetBrains Mono is allowed only inside real code blocks.

**Status encoding:** a live project's registration mark is in register. Building, planned and research projects are mis-registered. Status is always written as text too.

**Banned (the detector and reviewers check these):** eyebrow/kicker labels, ALL-CAPS labels, `A · B · C` meta strings, `→` on buttons, fade-up on every section, card grids, monospace as decoration, a single accented word in a headline, gradient text, glass, Inter/Geist/Space Grotesk/IBM Plex, cream + terracotta, a ⌘K palette, numbered section markers that are not a sequence, invented metrics or testimonials.

**Budgets:** total JS on any page under 50 KB (it is ~0 KB today). Lighthouse Perf ≥ 95, A11y/Best Practices/SEO = 100. WCAG 2.2 AA. `prefers-reduced-motion` renders the plates already in register.

## Truth rules

- Claims come from `PRODUCT.md` → Evidence on Hand, or from the project's own repo. If a fact is not there, ask Amit. Never round up a number.
- Status must be honest: unfinished work stays `building` or `planned`.
- Private repos (AgentGate today) get no public repo link until Amit makes them public.
