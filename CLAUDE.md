## Agent skills

### Issue tracker

Issues live in GitHub Issues (yama-assistant/domindle), via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Working agreements

### Code review

Always run code reviews through sub-agents (e.g. `/code-review`'s parallel Standards and Spec sub-agents), never inline. The point is a fresh perspective and quality, not efficiency.

### Branch names

Always give branches an informative name that describes the work done on them (e.g. `feat/persist-guesses-and-history`), never a cryptic or auto-generated one.
