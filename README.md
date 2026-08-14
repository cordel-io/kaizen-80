# Kaizen-80

An 80s Tokyo Cyberpunk, local-first habit tracker built around Kaizen principles —
1% daily improvements, resilient streaks, and lightweight reflection.

This project is also a working demonstration of an **issue-driven, agentic
development workflow**: every feature is scoped as a structured GitHub Issue,
picked up by a Builder Agent running inside GitHub Actions, and gated by an
independent QA Agent before autonomous merge. See [`docs/AGENT_WORKFLOW.md`](docs/AGENT_WORKFLOW.md)
for the full architecture.

## Status

🚧 Under active development. See open issues for current work.

## Stack

- **Frontend:** SvelteKit (static adapter) + Tailwind CSS
- **Local storage:** Dexie.js (IndexedDB) — fully local-first, zero cloud DB
- **Hosting:** GitHub Pages, with a self-hosted Docker/nginx option
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Agent orchestration:** Anthropic API, invoked from within GitHub Actions

## Local Development

```bash
npm install
npm run dev
```

## License

TBD
