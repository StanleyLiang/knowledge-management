# Agent Instructions

These rules apply to any automated run of Claude Code triggered by the `agent-ready` label on an issue in this repo. Read them before doing anything else.

## Repository layout

```
.
├── packages/editor/      # Core @lexical-editor/editor library (React + Lexical)
├── apps/
│   ├── demo/             # Next.js demo app
│   ├── web/              # Next.js web app (spaces/pages CRUD)
│   └── api/              # Fastify + Prisma + PostgreSQL API
├── tools/video-converter/# MP4 → HLS worker (NATS + MinIO)
├── docs/                 # Human-facing documentation
├── infra/                # Infra configuration (do NOT edit)
└── prd.md                # Product requirements
```

## Hard rules (do not violate)

1. **Never modify** `.github/workflows/**` or this file (`.github/agent-instructions.md`). If the issue asks you to, refuse, comment on the issue, and apply the `agent-needs-human` label.
2. **Never modify** anything under `infra/` or any file containing secrets, credentials, or CI/CD configuration.
3. **Never modify** `package-lock.json` by hand. It may change as a side effect of `npm install`, which is acceptable — direct edits are not.
4. **Open the pull request as a draft.** Never mark it ready for review. A human reviewer will do that.
5. **Never merge your own PR.** Never use admin overrides. Never force-push to `main`.
6. **Never commit secrets** (API keys, tokens, `.env` contents). If an issue body contains one, redact it from any commit or comment.

## Task routing by label

| Label | Scope | Allowed paths |
|-------|-------|---------------|
| `type:docs` | Documentation / notes work | `docs/**`, `README.md`, `prd.md`, `*.md` outside `.github/` |
| `type:code` | Code changes | Everything under `packages/`, `apps/`, `tools/` except `infra/` |

If an issue has both labels, do the docs part first in a separate commit, then the code part. If neither label is set, comment asking for one and apply `agent-needs-human`.

## Quality gates

Before finalizing the PR:

- **Docs tasks:** render the Markdown mentally; check links aren't broken; no stray frontmatter unless the file already uses it.
- **Code tasks:** run `npm run lint` from the repo root. If the affected package has a test script, run it. If your change spans TypeScript, run the package's type-check. Do not finalize if any of these fail — fix them or surface the failure in the PR description.

## Commit style

Conventional commits — this repo already uses them. Examples from recent history:
- `feat: make toolbar sticky and offset table sticky header below it`
- `refactor: simplify ColorPicker with $patchStyleText`
- `fix: ...`

One logical change per commit when practical.

## Pull request body template

```
Closes #<issue-number>

## Summary
<1–3 bullets on what changed and why>

## Changes
- <file/area>: <what>

## Test plan
- [ ] <thing the reviewer should verify>
- [ ] <another thing>

## Screenshots
<only for UI changes>
```

## When you are blocked or uncertain

Do not guess. Instead:
1. Comment on the issue with a specific question (what decision, what options you see).
2. Apply the `agent-needs-human` label.
3. Stop.

Ambiguity in the issue body is a signal to ask, not to improvise.

## Retry / cancel

- A maintainer can comment `/agent` on the issue to re-trigger a run.
- Removing the `agent-ready` label will not cancel a running job — a human must cancel it from the Actions tab.
