---
description: Step 1 of AGENTS.md §12 — interview the user, round by round, until every decision of a change is settled
argument-hint: [the change — default: the one under discussion in this conversation]
disable-model-invocation: true
---

# Grill me

Step 1 of the cycle in `AGENTS.md` §12, before `/issue`. Only the user launches this skill: it settles the
decisions of a change by interviewing the user, so that `/issue` records decisions instead of making them. It is
optional: a change with no open decision needs only the plan.

## Source

The change is **$ARGUMENTS**, read together with this conversation; if empty, the change under discussion in this
conversation. If there is none, ask what the change is, and stop.

## The design tree

Map the change as a design tree: every decision branches into the decisions that hang off it. The **frontier** is
every open decision whose prerequisites are already settled: the questions that can be asked now, without guessing
at answers not yet heard.

## Rounds

Ask the whole frontier in one round, then wait for the answers. Each question in this form:

```markdown
**Q<n> — <title>.** <The question, with the options when there are several.>

Recommended: **<the answer you recommend>**. <Why, in one or two sentences.>
```

- Number the questions across the whole session, not per round: an answer can then refer to any of them.
- Word each question so that "yes" accepts the recommended answer.
- A question whose answer depends on another question still open belongs to a later round, not this one.
- The answers reshape the tree: a settled decision unblocks the ones that hang off it. Recompute the frontier
  before the next round.
- An answer that is a doubt, not a decision, leaves the question open: answer the doubt, and ask the question
  again, revised, in the next round.

## Facts and decisions

Finding facts is your job, never the user's. Before asking, read what can be read: the code, `deno.json`, the
`.d.ts` files of the dependencies (`CLAUDE.md`, Workflow), the open issues with `gh issue list`. Never ask the user
something you can look up.

A targeted fact you read yourself. For a broad search, across many files or naming conventions, you may launch an
`Explore` subagent, and meanwhile ask the questions of the round that do not depend on it: a running search leaves
open only the questions downstream of it.

Decisions are the user's: put each one to them, with your recommendation, and wait. Never answer one in their
place, not even an obvious one.

## Against AGENTS.md

Check every recommendation and every answer against `AGENTS.md`: the scope (§1), the invariants (§4.1), zero
over-engineering (§4.2). When a decision conflicts with it, say so in one sentence and propose the alternative
(`CLAUDE.md`, Workflow).

## Read-only

Nothing is written during the session: no file, no branch, nothing on GitHub. Commands only read.

## The end

The session ends when the frontier is empty: every branch of the tree visited, nothing silently assumed. Then
write the summary in the sections of `.github/ISSUE_TEMPLATE/change.md`, each as its comment describes, in the
language of the conversation: `/issue` writes the issue in English (§11).

If the summary holds independent changes, say so and propose how to split them: one issue is one branch and one
PR (§12, Rules).

Wait for the user to confirm that the summary is the shared understanding, and do not act on it: the next step,
`/issue`, is the user's.
