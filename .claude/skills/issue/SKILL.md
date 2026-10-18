---
description: Step 1 of AGENTS.md §12 — write the agreed change as a GitHub issue, from the issue template
argument-hint: [the change — default: the plan agreed in this conversation]
disable-model-invocation: true
---

# Issue

Step 1 of the cycle in `AGENTS.md` §12. Only the user launches this skill, and launching it is the go-ahead for
one issue on GitHub: nothing more, no branch, no commit.

Run the commands from the Bash tool: PowerShell 5.1 mangles the quotes in the arguments of external programs.

## Source

The change is **$ARGUMENTS**, read together with this conversation; if empty, the plan agreed in this
conversation. Stop, and say why, if:

- nothing was agreed, or one of the decisions is still open: the issue records decisions, it does not make them;
- it holds independent changes: one issue is one branch and one PR (§12, Rules). Propose how to split it.

## Title and body

Title: what changes, in English, with no number and no Conventional Commits prefix. The PR will take it as
`<n> - <title>` (§12, Rules).

Body: `.github/ISSUE_TEMPLATE/change.md` without its front matter, each comment replaced by the content of its
section, in English (§11).

- **Decisions**: what was agreed, at the level of modules and behaviors, with no code and no line numbers.
- **Acceptance**: one observable behavior per item, the one its test will check (§9).
- No secrets and no user data (§8.3): whoever can read the repository reads its issues.

Every paragraph and every list item sits on one line, because GitHub renders even a single line break of the
body as a line break.

## Publish

1. Write the body to `issue.md` in `$(git rev-parse --path-format=absolute --git-common-dir)`, and show the
   title and the body.
2. `gh issue create --title "<title>" --body-file <file>`.
3. Show the URL of the issue.

## After

Propose the branch of the issue, as §12, Rules, describes it, and create it only on the user's go-ahead: the
work on an issue can also start later.
