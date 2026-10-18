---
description: Steps 2 and 6 of AGENTS.md §12 — test first: every Acceptance item, or Codex finding, seen red before the code turns it green
---

# TDD

Steps 2 and 6 of the cycle in `AGENTS.md` §12: the red → green loop, which writes every test before the code it
checks. What makes a test worth keeping is written in §9; this skill is how to get there, one cycle at a time.

## Source

At step 2, the Acceptance of the issue of the branch: `gh issue view <n>`, with `<n>` from `feat/<n>-…` or
`fix/<n>-…`. Without an issue, stop and say why, without falling back on the conversation: after a `/clear` or on
another PC the issue is the only record of what was agreed (§12, Rules).

At step 6, the scenario of each finding the user accepted (`/codex-review`).

## What goes through the loop

Every Acceptance item checked by a test of `deno task test`. An item checked by hand, such as the behavior of a
skill or a document, does not: say which ones, and why. In a mixed change only the testable items go through the
loop.

On a `fix/` branch the first red is the regression test that reproduces the bug on the current code (§9).

## Seams

A seam is the public interface where a behavior is observed without reaching inside. Tests live at seams, never
against internals.

The seams come from the Acceptance, which the user already agreed in the issue: they need no second confirmation.
Stop and ask, before writing the test, when an item cannot be observed from a public interface, or when the shape
of the interface is still open: that is a decision, and decisions are the user's.

At the seam of an item, add without asking the tests that §9 and §8.1 make mandatory: malformed and hostile
inputs, one test for each rejected case. Do not open a seam that no item implies without asking.

Such a test can be green at its first run, when an earlier cycle already covers its case: it stays, because §9
requires it, and the report marks it `green at first run`. Never weaken the code to see it red.

## The loop

- **Red before green.** Write the failing test first, then only the code that makes it pass. Do not anticipate
  later tests and do not add speculative features (§4.2).
- **One slice at a time.** One seam, one test, one minimal implementation per cycle. Never horizontal slicing, all
  the tests first and then all the code: tests written in bulk check imagined behavior, the shape of things
  instead of what a caller sees, and fix the structure of the tests before the implementation has taught anything.
  Each test is a tracer bullet that answers to what the last cycle taught.
- **Red at run time.** Red is the test failing on what it asserts. A type error is not red: `deno test`
  type-checks first, and a missing name proves only that the name is missing, not that the assertion can fail.
  For a name that does not exist yet, write its signature first, with a body that compiles without the behavior,
  see the assertion fail, then implement. Under the `compilerOptions` of `deno.json` a parameter the body does not
  read yet is a type error: its name takes a leading `_` until the implementation reads it.
- **Same permissions as the suite.** Observe red and green with `deno task test <file>`, never with a `deno test`
  run with permissions of its own: a test green only thanks to extra permissions is what the invariant on the
  network rules out (§9).
- **Within one turn.** Every cycle closes in the turn it starts in: at the end of the turn the Stop hook runs
  `deno task verify`, and a red test fails it. To stop and ask, stop before writing the test or after green, never
  on red.
- **No refactoring.** Refactoring is not part of the loop: it comes from the `/review` findings the user accepts
  (§12, step 3), with `deno task verify` green afterwards.

## Anti-patterns

The rules are in §9. These are the signs that a test breaks them:

- **Implementation-coupled**: it tests a private function, or verifies through a side channel, such as the
  internal state of a fake instead of reading back through the interface. The tell: it breaks on a refactoring
  that does not change behavior.
- **Tautological**: the expected value is recomputed the way the code computes it, as in
  `assertEquals(add(a, b), a + b)`, so the test passes by construction and can never disagree with the code.
- **More than one behavior**: a test with several logical assertions, which fails without saying which behavior
  broke. One logical assertion per test.

## Step 6

The test that reproduces an accepted finding goes through the same loop: it is seen red on the reviewed SHA,
before the fix. If it does not turn red, the finding is not reproduced: say so, with the output of the test, and
stop. The user decides.

## Report

At the end of step 2, for each Acceptance item: the name of its test and the failure line seen at red, or
`checked by hand` for an item that does not go through the loop. Then each test added at the seam of an item,
with its failure line or `green at first run`. At step 6 the failure line goes into the outcome of the finding,
in the record of `/codex-review`.
