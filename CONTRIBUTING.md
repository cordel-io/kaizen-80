# Contributing

Kaizen-80 is built using an issue-driven, agentic development workflow.

## How work gets picked up

Work is scoped as structured GitHub Issues. Issues labeled **`agent:build`** are
automatically picked up by an automated **Builder Agent** running in GitHub Actions,
which implements the issue's acceptance criteria and opens a pull request. An
independent **QA Agent** then reviews that PR against the issue's acceptance criteria
before it can be merged.

For the full architecture — how issues are scoped, how the Builder and QA agents
interact, retry behavior, and merge gating — see
[`docs/AGENT_WORKFLOW.md`](docs/AGENT_WORKFLOW.md).

## Opening issues

If you'd like to propose a change, open an issue describing the objective and, where
possible, a checklist of acceptance criteria. Well-scoped issues are easier for both
human contributors and the Builder Agent to act on.

## Human contributions

Human pull requests are welcome too. Please keep changes focused and include tests
where applicable — see the [README](README.md) for the local development setup and
test stack.
