---
name: add-project
description: Adds a project to Amit's portfolio as one MDX file, drafted from the project's real README and docs, then builds and opens a PR. Use when Amit says "add project", "put X on the portfolio", "new case study", or gives a repo URL or local path to feature.
argument-hint: <github-url | local-path> [status]
---

# Add a project

The site is built so a new project is one file: `src/content/projects/<slug>.mdx`. The home row, the `/work` row, the case-study page, the OG image and the sitemap entry all come from it. Never touch layout code to add a project.

## 1. Gather the facts

- **GitHub URL:** run `gh repo view <owner/repo> --json name,description,visibility,pushedAt,homepageUrl,languages`, then `gh api repos/<owner/repo>/readme --jq .content | base64 -d`. Also read `docs/` if it exists.
- **Local path:** read `README.md`, `docs/`, and `git log --oneline | head -20`.
- Note the visibility. A **private** repo gets no `links.repo` until Amit makes it public; ask him.

## 2. Ask only what the files can't answer

Use AskUserQuestion, at most three questions: his role on the project (solo or team, and who with), the honest status (`live` / `building` / `planned` / `research` / `archived`), and the one result he would want a hiring manager to remember. Skip anything already answered.

## 3. Draft the file

Copy the frontmatter shape from an existing file in `src/content/projects/`. The schema in `src/content.config.ts` is the contract, and the build fails on a bad field.

- `summary`: one line, under 70 characters, saying what it does for whom.
- `ink`: pick the plate (`c`, `m` or `y`) used least by the existing projects.
- `order`: lower numbers sort first. `featured: true` puts it on the home page.
- Body sections, in order: `## Problem`, `## What I built`, `## How it works` (use `<Flow steps={[...]} />` for a pipeline), `## Hard parts`, `## Results` (or `## Where it stands` when it isn't finished), `## What's next`.
- Run the `humanizer` skill over the prose. Follow the voice rules in `portfolio-orchestrator`.

## 4. Verify and ship

1. `npm run build`. It must pass.
2. `npm run test:e2e` runs the smoke tests, which cover every project page automatically.
3. Create a branch `project/<slug>`, commit as Amit (no Claude attribution), push, and run `gh pr create`. The Vercel preview URL on the PR is the review. Ask before pushing.
