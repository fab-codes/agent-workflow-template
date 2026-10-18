---
description: Step 1 of AGENTS.md §12 — write the agreed change as a GitHub issue, or one issue per slice, from the issue template
argument-hint: [the change — default: the plan agreed in this conversation]
disable-model-invocation: true
---

# Issue

Step 1 of the cycle in `AGENTS.md` §12. Only the user launches this skill, and launching it is the go-ahead for
one issue on GitHub: nothing more, no branch, no commit. Several issues take a second go-ahead, on their
breakdown (Split).

Run the commands from the Bash tool: PowerShell 5.1 mangles the quotes in the arguments of external programs.

## Source

The change is **$ARGUMENTS**, read together with this conversation; if empty, the plan agreed in this
conversation. Stop, and say why, if nothing was agreed, or one of the decisions is still open: the issue records
decisions, it does not make them.

## Split

One issue is one branch and one PR (§12, Rules). Split the change only when some of its parts can each be merged
on their own, or when it does not fit one session; the number of files it touches does not matter. Otherwise the
change is one issue.

Each part is a slice, and every slice is a tracer bullet:

- a narrow but complete path through every layer it needs (§5.1), never one layer of the change;
- verifiable on its own: its Acceptance fails on the commit the slice starts from, and passes within the slice
  with `deno task verify` green;
- small enough for a fresh session to finish it reading only its issue.

Prefactoring, if any, comes first, as its own slice.

Show the breakdown as a numbered list, each slice with its title, its Blocked by and what it delivers end to end,
and stop: nothing is created without the user's go-ahead on this list, even when a split was sketched earlier in
the conversation. Each slice is then a complete issue, with its own title and body.

## Title and body

Title: what changes, in English, with no number and no Conventional Commits prefix. The PR will take it as
`<n> - <title>` (§12, Rules).

Body: `.github/ISSUE_TEMPLATE/change.md` without its front matter, each comment replaced by the content of its
section, in English (§11).

- **Decisions**: what was agreed, at the level of modules and behaviors, with no code and no line numbers.
- **Acceptance**: one observable behavior per item, the one its test will check (§9).
- **Blocked by**: one `#<n>` per item, for each issue that must be closed as completed before this one starts
  (§12, Rules), or "Nothing". The Out of scope of a slice names the other slices by title: the ones created
  after it have no number yet.
- No secrets and no user data (§8.3): whoever can read the repository reads its issues.

Every paragraph and every list item sits on one line, because GitHub renders even a single line break of the
body as a line break.

## Publish

One issue at a time, blocking issues first, so that every Blocked by cites real numbers:

1. Write the body to `issue.md` in `$(git rev-parse --path-format=absolute --git-common-dir)`, and show the
   title and the body.
2. `MSYS_NO_PATHCONV=1 gh issue create --title "<title>" --body-file <file>`, as written: no labels, no parent
   issue. The prefix keeps Git Bash from rewriting a title that starts with `/` into a Windows path (`CLAUDE.md`,
   Local environment).
3. Show the URL of the issue.

If a creation fails or its prompt is denied, stop. The issues already created stay as they are: list them, with
their URLs, and the slices still missing. No issue is deleted or edited, not even to add a number later.

## After

Propose the branch of the issue, as §12, Rules, describes it, and create it only on the user's go-ahead: the
work on an issue can also start later. After a split, propose the branch of the first issue with no blockers: the
others start at step 2, when the user names them.
