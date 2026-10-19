# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7 (static output) with React islands only where interaction needs it, Tailwind CSS v4, MDX content collections. Deployed on Vercel Hobby (free `*.vercel.app` domain for now). CI on GitHub Actions. Chosen by Amit during planning, 2026-10-19.

## Users

1. **Hiring managers and tech leads at Israeli product/SaaS companies** screening a junior backend / full-stack candidate. They arrive from a CV, LinkedIn or a GitHub link, usually on a laptop between other tasks, and decide in under a minute whether to read further.
2. **Recruiters** who need the role, stack, location and a contact route without reading code.
3. **Engineers** doing a deeper review before an interview. They open a case study and the repo.

## Product Purpose

Personal portfolio for Amit Asher, Software Developer at Landa Digital Printing and B.Sc. Software Engineering graduate (BGU, 2026). It exists to get him interviews for a first full-time junior backend / full-stack role. Success means a visitor understands within one screen what he builds and that it runs in production, then opens one case study or contacts him.

## Positioning

He ships systems other people depend on, not demos: real-time press telemetry at Landa (.NET, SignalR, Azure), Bubble.up (a live study-matching platform used by 130+ BGU students in 40+ groups), and governance tooling for AI agents (AgentGate). .NET-first backend with React/TypeScript, plus a genuine interest in AI tooling and agent security.

## Operating Context

Visitors compare him against other junior candidates and skim. Case studies get read by engineers who check whether the architecture claims hold up against the repo.

## Capabilities and Constraints

- Projects live as one MDX file each in `src/content/projects/`. Adding a project must never require touching layout code.
- Project statuses: live, building, planned, research, archived.
- Statuses must be honest. AgentGate is in progress, Meterline and RuleSmith are planned or early, and they must not be presented as finished.
- No CV PDF yet. The download link stays hidden until the file exists.

## Brand Commitments

- Name: Amit Asher. GitHub `aamitSoftware`, LinkedIn `in/amit-asher-dev`, email asherproc@gmail.com.
- Voice: down-to-earth, a bit fun, plain verbs. Not braggy, not condescending. No em dashes. Avoid "passionate", "leverage", "robust", rule-of-three lists.
- Visual concept chosen by Amit: "Press proof", from his work on Landa's digital printing presses.

## Evidence on Hand

- Bubble.up: live at https://www.bubbleup.online, source https://github.com/RonKadosh/bubble-up (built with Ron Kadosh and Gal Halifa). Java 21, Spring Boot, React/TS, PostgreSQL, AWS EC2, Terraform, Google OAuth, WebSocket. 130+ students, 40+ study groups (CV, Sep 2026).
- Adaptive Spectral Filtering on Graphs: BGU Learning on Graphs course research, https://github.com/aamitSoftware/Adaptive-Spectral-Filtering--LOG-Final-Project. Team project; final grade 92.
- AgentGate: `C:\Users\asher\Desktop\agentgate` (README, docs, src). .NET, YARP, MassTransit/RabbitMQ, Keycloak, gRPC.
- Meterline: `C:\Users\asher\Desktop\meterline\docs\PLAN.md`. Planned; nothing shipped.
- RuleSmith: idea and description only.
- Landa: cut cloud infrastructure cost by moving services to cheaper deployment models; reusable ADX/KQL functions and pipelines used by other teams; live press telemetry from Azure IoT Hub through .NET/SignalR to React.
- No testimonials, no metrics beyond the above. Do not invent any.

## Product Principles

1. Proof before adjectives: every claim points at something running or a repo.
2. One screen tells the whole story; depth is one click away.
3. Honest status beats a padded list.
4. Fast and accessible is part of the pitch for a backend engineer.

## Accessibility & Inclusion

WCAG 2.2 AA. Full keyboard support, reduced-motion respected, color never the only carrier of meaning.
