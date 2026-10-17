---
description: Maintainability review against AGENTS.md — over-engineering, consistency, comments
argument-hint: [path or git ref — default: uncommitted changes]
---

# Review

Target: **$ARGUMENTS** — if empty, the uncommitted changes (`git status --porcelain` and `git diff`).

This is a **reading**, not an intervention: produce a report, do not modify files. The user decides on the fixes
after seeing the findings.

## Before looking at the code

1. Run `deno task lint` and `deno task invariants`. They cover the mechanical part
   of `AGENTS.md` §13. **Do not redo by hand what they already flag**: their outcome goes into the report as a
   status line, not as your finding.
2. `AGENTS.md` is the source of truth. Cite it by section (`§4.2`) instead of summarizing it: if you find yourself
   rewriting a rule here, the rule already lives elsewhere and your job is to apply it, not to repeat it.
3. **Open the files, do not trust the diff.** A consistency violation is invisible in a diff: it shows only when
   you compare the new file with the neighboring files that do the same thing.

## Scope

This review looks at maintainability. Correctness and security, that is the P0 and P1 items of **Code Review
Rules** in `AGENTS.md`, are judged by the independent review (§12), on a different model: repeating them here
would produce two correlated judgments counted as two independent checks. If while reading you still come across
a problem of that kind, do not keep quiet about it: put it at the top of the report. But do not go looking for it.

## The lenses

### Lens 1 — Over-engineering (§4.2)

Question, for each abstraction: _how many real callers does it have, right now?_ Count them with grep, not by
intuition. Fewer than two callers → it gets inlined. The only exceptions are the architectural boundaries
declared in §5.1.

Signals: factories, wrappers, registries, configuration layers; a folder with a single file; a five-line function
used only once; caching, pooling or batching without a measurement that justifies them; optional parameters that
no caller passes; flags never read; dead code; generalization for a second use case that does not exist yet.

### Lens 2 — Consistency with the codebase (§5, §6, §10)

The yardstick is not an abstract ideal: it is the files that already exist. Pick two or three sibling files —
same layer, same role — and compare.

Question: _would a reader understand that this file and the ones next to it were written by the same hand?_

Signals: dependency direction inverted with respect to §5.1; an error handled in a form different from the single
domain error model of §5.3; naming outside the table in §10; `type` where the neighbors use `interface` or vice
versa; imports without the `.ts` extension, or without `import type` when importing only types; a test structure
different from that of the other test files; a type crossing a boundary that the others respect.

### Lens 3 — Comments (§11, §4.3)

Question, for each comment: _does it say WHAT the code does, or WHY it is done this way?_

The **what** gets deleted: if it is needed to understand the block, the problem is the block's name or length,
and that is the finding. The **why** stays, if it is true.

Signals of too much: JSDoc that restates the signature; decorative banners and section separators; commented-out
code; comments that describe a previous version of the code and now lie; prose translations of an obvious line.

Signals of too little — they count as much as the previous ones: a trap of a critical dependency used without the
note that explains it (§7), a security decision without its reason, a cast at a library boundary without the
comment that justifies it (§6).

## Report

For each finding, ordered by severity:

- `file.ts:line` — the section of `AGENTS.md` it violates — what is wrong, in one sentence
- why it is a problem **here**, with the concrete scenario that makes it visible
- the proposed fix, in one line

Close with the status of `deno task lint` and of the invariants script.

**If you find nothing, say so.** An empty report is a valid and frequent outcome on code written following
`AGENTS.md`. Padding it with marginal remarks so as not to hand it in empty is the fastest way to make this
command useless.

## What not to report

Stylistic preferences not written in `AGENTS.md`; anything already covered by `deno fmt` or `deno lint`; generic
rewrites not tied to a project rule; feature proposals — even good ones, even small ones: they are out of scope
under §4.2 and must be asked of the user, not slipped into a review.
