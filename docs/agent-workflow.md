# Claude Issue Agent — Workflow Guide

This repo has an automation that turns GitHub issues into pull requests opened by Claude. This doc explains how to use it.

## Who this is for

Maintainers with write access to `StanleyLiang/knowledge-management`. Only trusted senders (OWNER / MEMBER / COLLABORATOR) can trigger a run — external contributors filing an issue will not cause the agent to spend API credits.

## How to file an agent-ready task

1. Open **New issue** and pick one of the templates:
   - *Docs task for agent* — for Markdown / documentation work
   - *Code task for agent* — for code changes
2. Fill in every field. Ambiguity is the #1 reason the agent asks for help instead of finishing.
3. Submit the issue. At this point nothing runs — the issue just sits there with `type:docs` or `type:code`.
4. When you're ready for the agent to start, add the `agent-ready` label. This fires the workflow.

## What happens next

1. The `Claude Issue Agent` workflow in `.github/workflows/claude-issue-agent.yml` triggers.
2. Claude reads `.github/agent-instructions.md`, then the issue title/body/comments.
3. It creates a branch named `agent/issue-<number>-<slug>` off `main`.
4. It commits its changes there and opens a **draft pull request** linked back to the issue (`Closes #<n>`).
5. It posts a comment on the issue with the PR link.
6. You review the PR like any other. If good, mark it ready for review, merge, and the issue auto-closes.

## Re-running or iterating

- To re-trigger the agent on an issue (after a comment or updated body), comment `/agent` on the issue. Only maintainers can do this.
- To ask for changes on an open PR, use the normal GitHub review flow — the agent does not yet watch PR comments (that's a future extension).

## If the agent gets stuck

The agent will apply the `agent-needs-human` label and leave a comment with a specific question. Resolve the ambiguity in a reply, remove `agent-needs-human`, and comment `/agent` to restart.

## Labels reference

| Label | Who applies | Meaning |
|-------|-------------|---------|
| `agent-ready` | Maintainer | Kicks off the workflow. |
| `agent-in-progress` | Workflow | A run is active. |
| `agent-needs-human` | Agent | Blocked on a question; will not retry until resolved. |
| `type:docs` | Issue template | Route to docs rules (edits under `docs/`, `README.md`, `prd.md`). |
| `type:code` | Issue template | Route to code rules (edits under `packages/`, `apps/`, `tools/`). |

## Cancelling a run

Open the **Actions** tab, find the in-flight `Claude Issue Agent` run, and click **Cancel workflow**. Removing the label does *not* stop a run already underway.

## One-time setup (already done by Stanley)

- `ANTHROPIC_API_KEY` secret at Settings → Secrets and variables → Actions.
- Workflow permissions set to "Read and write" at Settings → Actions → General.
- Branch protection on `main` requiring PR review before merge — prevents a rogue agent PR from auto-merging.
- Labels created via `gh label create` (see the repo's `.github/` setup).

## Cost guard

Each run is capped at 20 minutes and `--max-turns 40`. Consider also setting a monthly budget alert in the Anthropic console.
