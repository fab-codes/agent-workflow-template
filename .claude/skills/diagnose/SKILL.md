---
description: Step 1 of AGENTS.md §12 — find the confirmed cause of a bug with a red feedback loop, before /issue
argument-hint: [the bug — default: the one under discussion in this conversation]
disable-model-invocation: true
---

# Diagnose

Step 1 of the cycle in `AGENTS.md` §12, before `/issue`, for a bug whose cause is not known. Only the user launches
this skill. It is optional: a bug whose cause is already clear needs only the plan.

The diagnosis ends at the confirmed cause. The regression test and the fix are written at step 2, on the `fix/`
branch of the issue, with `/tdd`: there the first red is the regression test.

## Source

The bug is **$ARGUMENTS**, read together with this conversation; if empty, the bug under discussion in this
conversation. If there is none, ask what the bug is, and stop.

The scope is a bug present on `origin/develop`, the code a `fix/` branch starts from (§12, Rules). A bug that
exists only on a branch not yet merged is the work of that branch, not of a `fix/` issue.

## The copy

The diagnosis never touches the repository. It works on a copy of `origin/develop`, in a new folder of the
session's scratchpad. From the Bash tool, at the root of the repository:

```bash
git status --porcelain
git fetch origin
copy="$(mktemp -d "<scratchpad>/diagnose-XXXXXX")"
git archive origin/develop | tar -x -C "$copy"
```

Keep the output of `git status --porcelain`: at the end it must be the same. Shell variables do not survive
between Bash calls: write the path of the copy out.

Loops, harnesses, probes and captured artifacts live in the copy, or next to it in the scratchpad. In the copy
`deno task test <file>` runs with the permissions of the suite, from the `deno.json` of `origin/develop`. Nothing
written there reaches a commit, and the Stop hook does not see it.

## Real services and data

- Every command that reaches a real service, a read as much as a write, you prepare and the user runs: say what it
  does and on which data, and the user reports the output (`CLAUDE.md`, Real data and services). A read brings
  real user data into the conversation, and from there into the issue.
- Temporary instrumentation in production is a change of its own, with its own issue: production is reached only
  through a PR (§12, Rules).
- Captured artifacts, such as logs, payloads and dumps, stay in the scratchpad, outside the repository. What you
  show quotes only the lines that carry the signal, with every secret written as `<REDACTED>`. If the redacted
  output is not enough to diagnose the bug, say so and ask the user.
- The minimised repro is rewritten with synthetic values: only that reaches the summary, and from there the issue
  and the regression test (§8.3, §12 Rules).

## Phase 1 — A tight loop

This is the skill. With a pass/fail signal that goes red on this bug, the cause will be found: bisection,
hypotheses and probes only consume it. Without one, no amount of reading code will find it. Spend the effort
here.

Ways to build one, roughly in this order:

1. A failing test at the seam that reaches the bug, run in the copy with `deno task test <file>`.
2. A CLI invocation with a fixture input, its output compared with the expected one.
3. The replay of a redacted captured artifact through the code path, in isolation.
4. A throwaway harness: the smallest part of the system that reaches the bug with one call, with in-memory fakes.
   A handler is called in-process, never through a dev server, which can reach real services.
5. A property loop, for output that is only sometimes wrong: many inputs generated from a fixed seed, written by
   hand, with no new dependency (§2).
6. A differential loop: the same input through the old version and the current one, with the old version read
   with `git show <sha>:<path>`.
7. Bisection, when the bug appeared between two known commits: `git bisect run` with the loop. It moves HEAD of
   the repository: only with the user's go-ahead, on a clean working tree, and with `git bisect reset` before the
   turn ends.

Then tighten it: faster, by cutting setup and narrowing the scope; sharper, by asserting the specific symptom,
not "did not crash"; deterministic, by pinning time and seeds. A slow, flaky loop is barely better than none.

For a bug that shows up only sometimes, the goal is a higher reproduction rate, not a clean repro: loop the
trigger, add stress, narrow timing windows, until the rate is high enough to debug against.

When you cannot build a loop, stop and say so: list what you tried, and ask the user for a redacted captured
artifact, or to run a command you prepare where the bug reproduces. Do not go on to hypotheses.

Phase 1 is done when you can name one command, already run, with its invocation and its output shown, that is:

- **red-capable**: it drives the code path of the bug and asserts the user's exact symptom, so it goes red on
  this bug and green once it is fixed;
- **deterministic**: the same verdict on every run, or, for a bug that shows up only sometimes, a pinned and high
  reproduction rate;
- **fast**: seconds, not minutes;
- **yours to run**: without the user in the loop.

If you catch yourself reading code to build a theory before this command exists, stop: jumping to a hypothesis
is the failure this skill prevents.

If the loop stays green on the copy while the user still sees the symptom, either the loop misses the bug or the
bug is not on `origin/develop`. Say which, with the evidence; in the second case the bug is out of scope, and you
stop.

## Phase 2 — Reproduce and minimise

Run the loop and confirm that:

- the failure is the one the user described, not a nearby one: wrong bug, wrong fix;
- it reproduces on every run, or at a rate high enough to debug against;
- the exact symptom is captured: the error, the wrong output, the timing.

Then shrink the repro to the smallest scenario that still goes red: cut inputs, callers, configuration, data and
steps one at a time, re-running the loop after each cut. It is done when every remaining element is
load-bearing: show that removing any one of them turns the loop green. An element that validation requires stays,
reduced to its simplest value: removing it gets the input rejected, which is not green.

Rewrite the minimised repro with synthetic values, and see it still red.

## Phase 3 — Hypotheses

Generate 3 to 5 ranked hypotheses before testing any of them: a single one anchors on the first plausible idea.
Each is falsifiable, with its prediction:

> If <X> is the cause, then <changing Y> makes the bug disappear, or <changing Z> makes it worse.

A hypothesis without a prediction is discarded or sharpened.

Show the ranked list and stop: the user confirms it or re-ranks it, and may know some of them already ruled out.
No probe before the answer.

## Phase 4 — Probes

Each probe maps to one prediction of Phase 3, and changes one variable at a time. Prefer an assertion in the
loop, or a call in the harness. Otherwise, a targeted log at the boundary that tells two hypotheses apart; never
"log everything and grep".

Every debug log carries a tag, such as `[DEBUG-a4f2]`, and lives only in the copy, where it can last across
turns. It never goes through the logger: a probe prints values, which are user data, and §8.3 keeps them out of
the logs.

A cause is confirmed when its prediction holds in the copy: the change it names turns the loop green, and undoing
the change turns it red again.

For a performance regression, logs are usually the wrong tool. Measure a baseline in the copy before changing
anything, then bisect: measure first, fix second. The regression test of step 2 asserts a deterministic measure,
such as calls to a fake, iterations or a size, never a time: a timing assertion makes the suite flaky, and the
Stop hook and CI run it on every change. Without a deterministic measure, there is no correct seam.

## The seam of the regression test

A correct seam is one where the test exercises the bug as it occurs at the call site. A seam that is too shallow,
such as a single caller when the bug needs several, or a unit test that cannot replicate the chain that triggers
it, gives a test that passes while the bug survives.

If no correct seam exists, say so: a fix without its test breaks §9. Propose a split, by the rules of `/issue`:
first a prefactoring issue that opens the seam, then the `fix/` issue, blocked by it.

## The end

Check that `git status --porcelain` of the repository is the same as at the start, and that no bisection is in
progress. The copy stays in the scratchpad.

Write the summary in the sections of `.github/ISSUE_TEMPLATE/change.md`, each as its comment describes, in the
language of the conversation: `/issue` writes the issue in English (§11).

- **Why**: the symptom, as the user reported it, with synthetic values.
- **Decisions**: the confirmed cause, the proposed fix at the level of modules and behaviors, and the seam of the
  regression test.
- **Acceptance**: the minimised repro, with synthetic values, which the regression test turns into its first red
  at step 2; and one item checked by hand at step 2: the original scenario no longer reproduces, re-run by Claude
  when it is local and synthetic, by the user otherwise.

The rejected hypotheses and the loop command stay out: the issue records decisions, and at step 2 `/tdd` rebuilds
the test from the repro. If the fix leaves decisions open, say so: the user can run `/grill-me` on them before
`/issue`.

Wait for the user to confirm that the summary is the shared understanding, and do not act on it: no issue, no
branch, no commit. The next step, `/issue`, is the user's.
