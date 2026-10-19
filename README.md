# amitasher portfolio

Amit Asher's portfolio. Static Astro site, deployed on Vercel.

The design is a press proof: each page is a printed sheet with crop marks, registration targets and a colour strip, and every project is printed on its own process ink (cyan, magenta or yellow).

## Run it

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in dist/
npm run test:e2e     # Playwright smoke + axe (WCAG 2.2 AA), desktop and mobile
npm run check        # astro check (types)
npm run lint         # biome
```

## Add a project

One file: `src/content/projects/<slug>.mdx`. The schema lives in `src/content.config.ts`, and the build fails on a bad field.

- With screenshots: put them in `src/assets/projects/<slug>/` and point `cover` and `gallery` at them.
- Without screenshots yet: draw a diagram in `src/components/covers/<slug>.astro`, or leave it out and the page prints a "screens coming soon" plate in the project's ink.

The project shows up on the home page (`featured: true`), on `/work`, with its own page, OG image and sitemap entry. In Claude Code, the `add-project` skill drafts the file from a repo URL.

## CI/CD

- `.github/workflows/ci.yml` runs types, lint, build, Playwright + axe, the Impeccable design detector, Lighthouse budgets (Perf ≥ 95, A11y/Best Practices/SEO 100, JS < 50 KB) and a link check.
- Vercel deploys a preview for every PR and production on `main`.
- `.github/workflows/refresh.yml` rebuilds weekly so "last push" dates stay fresh (needs the `VERCEL_DEPLOY_HOOK` secret).
