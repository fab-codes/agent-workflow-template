---
description: The quick lane of AGENTS.md §12 — a small, settled change from issue to PR without stops, every check kept
argument-hint: [the change, described in full — default: the change agreed in this conversation]
disable-model-invocation: true
---

# Quick

The quick lane of `AGENTS.md` §12: the cycle of a small, settled change, from the issue to the PR. Only the user
launches this skill, and launching it is the go-ahead for the issue, the branch, the commit, the push and the PR
of this change: nothing more, no merge.

The lane removes the stops, not the checks. `deno task verify`, `/review`, Codex and CI run as in the normal
cycle, and you stop only when one of them has something to say. The prompts of `.claude/settings.json` on
`gh issue create`, `git push` and `gh pr create` stay: they are the only questions on the way. The body of the
issue, the name of the branch and the commit message are not confirmed one by one: the user reads them in the PR,
before the merge.

Run the commands from the Bash tool: PowerShell 5.1 mangles the quotes in the arguments of external programs.

## Source

The change is **$ARGUMENTS**, read together with this conversation; if empty, the change agreed in this
conversation. If there is none, ask what the change is, and stop.

## Boundary

The four conditions of `AGENTS.md` §12, Quick lane. Check them twice:

- **At launch**, on the description, before anything is created. Condition 1 takes judgment: the issue records
  decisions, it does not make them. If writing it means picking between alternatives the description leaves open,
  that pick is the open decision.
- **Before the commit**, on the diff: `git status --porcelain --untracked-files=normal`, which lists new files
  whatever the Git configuration of the PC, and `git diff`. Every file listed counts, changes already in the
  working tree at launch included.

A condition that fails is an exit: name it, by its number and in words.

## The lane

In this order, each step as the normal cycle of §12 runs it:

1. **The boundary**, on the description.
2. **The issue**, written from the change, following the Title and body and the Publish sections of
   `.claude/skills/issue/SKILL.md`.
3. **The branch** of the new issue, as §12, Rules, describes it.
4. **The change.** For a change of behavior, `/tdd`, from the Acceptance of the new issue (§9). A change with no
   behavior for a test to check, such as a fix to a document, is written directly.
5. **`deno task verify`**, run by you: the Stop hook runs it only when the turn ends, and the lane does not end its
   turn before the commit. If it is red, fix it and run it again, once: the one retry the Stop hook allows.
6. **`/review`**, on the uncommitted changes. A report with no finding, only the status of lint and of the
   invariants, lets the lane go on.
7. **The boundary**, on the diff.
8. **The commit** of every file of the diff: in English, Conventional Commits, with the why in the body (§12,
   Rules).
9. **`/codex-review`**, as it is. With no P0/P1 finding its record gets `none` under Outcomes, and the lane goes
   on: the launch is the go-ahead for the push and the PR that its last line leaves to the user.
10. **The PR**, following the Title and body and the Publish sections of `.claude/skills/pr/SKILL.md`. CI and the
    merge are the user's (§12, step 8).

## Exits

The lane ends at the first of these, and the work goes on in the normal cycle of §12 from the step named here.
Say which step that is, and what already exists: the issue with its URL, the branch, the commit.

- **The boundary fails at launch**: nothing is created. Name the condition, and for condition 1 the open
  decision. Step 1: the plan, `/grill-me` or `/issue`, as the change needs.
- **`/tdd` needs to ask the user**, or so does a change written directly: step 2, from the question.
- **`deno task verify` stays red after the retry**: show its output, or its end when it is long. Step 2.
- **`/review` reports a finding**: step 3. The user decides on the findings, then on the commit.
- **The boundary fails on the diff**: name the condition and the files. The issue and the branch stay, and the
  changes stay uncommitted. Step 4: the commit waits for the user's go-ahead.
- **Codex reports a P0/P1**: step 6, as `/codex-review` describes it. Then the user launches `/pr`.

A prompt the user denies, or a step that stops by its own rules, ends the lane the same way, at that step.
