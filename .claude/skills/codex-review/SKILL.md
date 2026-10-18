---
description: Steps 5 and 6 of AGENTS.md §12 — the independent Codex review of HEAD, its record, a proposal for each finding
---

# Codex review

Steps 5 and 6 of the cycle in `AGENTS.md` §12, on HEAD of the current branch. The judgment is Codex's: your part
is to launch the command exactly as written, keep the record and show the output whole. Nothing you do here may
change what Codex looks at.

## Before launching

Stop, and say why, if:

- `git status --porcelain` is not empty: Codex reviews commits, and an outcome holds only for the SHA it saw;
- the branch does not match `feat/<n>-<description>` or `fix/<n>-<description>` (§12, Rules);
- HEAD already has a record (path below): show it. Reviewing the same SHA again is the user's call, and the new
  run replaces the record, outcomes included.

## Launch

1. Run `git fetch origin`.
2. Read the step 5 command in `AGENTS.md` §12 and run it exactly as written there: no `[PROMPT]` argument, no
   flag added, removed or changed. Do not copy the command into this file or anywhere else: the invariant reads
   the copy in `AGENTS.md`, and a second copy would drift from it.
3. Run it from the Bash tool: PowerShell 5.1 wraps every stderr line of an external program in an error record.
   Run it in the background, because at `xhigh` effort it can go past the ten minutes of a foreground command,
   with stdout and stderr in two separate files:

   ```bash
   records="$(git rev-parse --path-format=absolute --git-common-dir)/codex-review"
   sha="$(git rev-parse HEAD)"
   mkdir -p "$records"
   <step 5 command> >"$records/$sha.stdout" 2>"$records/$sha.stderr"
   ```

   `--git-common-dir` because in a worktree `.git` is a file, not a folder: the records live in the repository's
   Git folder, shared by all its worktrees. Shell variables do not survive between Bash calls: recompute them, or
   write the paths out. Wait for the notification that the command ended, do not poll.
4. If the command exits with a code other than 0, or the stdout is empty, show the end of the stderr file and
   stop, without writing a record.

## Record

Write `$records/$sha.md`:

````markdown
# Codex review of <full SHA>

- SHA: `<full SHA>`
- Model: `<model>` · Effort: `<effort>`
- Date: <when the run ended, ISO 8601 with time zone>

## Output

```
<stdout, whole and unedited>
```

## Outcomes

<one line per P0/P1 finding, once the user decides>
````

- Model and effort come from the header of the stderr file, the `model:` and `reasoning effort:` lines. If one is
  missing, write `not in the stderr header` and tell the user: do not guess it.
- The fence around the output is longer than the longest run of backticks inside it, or the output closes it.
- The stderr is the session transcript and stays out of the record.

## Findings

Show the stdout whole, as Codex wrote it: no summary, no reordering, nothing left out (`CLAUDE.md`, Workflow).
Then, for each P0/P1 finding, propose either the test that reproduces it and the fix (§12, step 6), or its
rejection with the reason. And stop: the user decides, and until then you write neither tests nor fixes.

On Windows the review ends with "test validation incomplete": this is expected (`CLAUDE.md`, Local environment),
it is not a finding.

## After the decision

An accepted finding goes through `/tdd`, its Step 6, before its outcome is written.

Write the outcome of each finding under `## Outcomes` in the record, `none` if there were no P0/P1 findings:

- accepted: the name of the test that reproduces it, the failure line seen at red and what the fix changes. The
  code changes, so this is a new commit, with the user's go-ahead, and the new HEAD comes back to this skill;
- rejected: the reason.

To close a finding, never modify `AGENTS.md`, `GLOSSARY.md`, the ADRs or the step 5 command. A finding is closed
by the code, or rejected: a rejected finding is closed in the **Review** section of the PR, with its reason,
which `/pr` takes from this record. If you think one of those files is what is wrong, say so: changing it is a
separate change, and the user asks for it.

The next step, push and PR, is the user's: `/pr`.
