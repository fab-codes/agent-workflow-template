# CLAUDE.md

The engineering standards of this repository live in a single file, shared with every AI tool.
Read it and apply it in full:

@AGENTS.md

What follows applies **in addition** and is specific to Claude Code.

## Repository status

This repository is built incrementally, one layer at a time, from the bottom up. Before making changes, check which
layers already exist in `src/` and keep the work consistent with their actual state: the code says where we are,
not this list.

<!-- TODO(template): the build order of the first version, one numbered step per layer, from the bottom up. A
decision still open is written in the step where it must be settled with the user, before the code that depends
on it. -->

Each step is one or more PRs, following the cycle in `AGENTS.md` §12.

## Local environment

<!-- TODO(template): the local services (for example Docker) and how to start them. -->

- On Windows the primary shell is PowerShell 5.1: no `&&`, no ternary operators, no bash here-strings.
  For POSIX scripts use the Bash tool.
- In the Bash tool, Git Bash rewrites as a Windows path every argument to a native program (`git`, `gh`, `deno`,
  `codex`) that starts with `/` or `@/`, and the value of `--option=/…`: `/issue x` becomes
  `C:/Program Files/Git/issue x`. Free text on a command line, such as a title, goes after `MSYS_NO_PATHCONV=1`:
  `MSYS_NO_PATHCONV=1 gh issue create --title "…"`, and `deno task invariants` checks it in the skills. Not in the
  `env` block of `.claude/settings.json`: it would turn off the rewriting that makes `$PWD`, `~`, `mktemp` and
  `/dev/null` work as arguments of a native program. The `ask` rules match past the assignment, so the prompt
  stays. Text passed through a file, such as `--body-file`, is not touched.
- The Codex review (step 5 of `AGENTS.md` §12) writes the review to stdout and the session transcript to
  stderr. The PR gets stdout, in full; model and effort are read from the stderr header (`model:`,
  `reasoning effort:`). On Windows `deno test` panics inside Codex's read-only sandbox, and the review ends
  with "test validation incomplete": this is expected, the tests are covered by `deno task verify` and CI.

## Portability

The workflow must work right after a `git pull` on another PC, with no local configuration. Commands, rules and
checks live in the repository: in `AGENTS.md`, in `.claude/settings.json`, in `deno task verify`. Never only in
`~/.claude` or in `~/.codex`. The only things left to the PC are Claude's model and effort, chosen by whoever
opens the session.

Claude's memory holds on one PC and one path only. A fact needed to work on the project, such as a decision by the
user or a discovered trap, goes in this file or in `AGENTS.md`, not in memory: if the memory disappears, nothing
must break.

## Workflow

1. **Read before writing.** Before modifying a file, open it. Before citing a version or adding a dependency,
   open `deno.json`. Before using a library's API, open its `.d.ts` files.
   **Do not infer signatures from memory**: the traps already discovered are in `AGENTS.md` §7.
2. **Plan before non-trivial changes.** If the work touches more than three files, changes the folder structure
   or modifies the configuration, lay out the plan and wait for confirmation.
3. **Incremental, never big bang.** One layer at a time, with `deno task check` after each step. Do not pile up
   a large, unverified rewrite.
4. **Always verify.** Close every task with `deno task verify`, which runs check, lint, formatting, tests and
   project invariants, and report the actual output. If something fails, say so explicitly: never round up to
   "it works".
5. **Follow the cycle of a change**, in `AGENTS.md` §12: carry out your steps in order and stop at every step
   that belongs to the user. The output of the independent review is shown, and reported in the PR, in full,
   never summarized: it is the only guarantee that no finding gets filtered out by whoever wrote the code.
   The independent review is Codex's: Claude Code's `/code-review` and `/security-review` do not replace it,
   because the judgment of the same model that wrote the code is correlated with it. They can be added as an
   extra check, never used in place of step 5.
6. **Stay in scope.** Do what was asked. Collateral refactors, file reshuffles, dependency upgrades and "while
   I'm at it" improvements are proposed, not carried out.
7. **No side files.** Do not create extra READMEs, summaries, `.md` documentation or helper scripts unless
   explicitly asked.
8. **Flag real problems.** If a request conflicts with `AGENTS.md` — for example it makes a violation of an
   invariant of §4.1 possible, or adds an out-of-scope capability (§1) — say so in one sentence and propose the
   alternative, instead of silently going ahead.

## Real data and services

<!-- TODO(template): which services and data are real (production database, accounts, paid APIs) and whether a
staging environment exists. -->

- **Never run write operations against real services or data** on your own initiative: not with `curl`, not
  with scripts, not with tests, not as a "quick check". The user decides on and launches writes.
- Tests run on in-memory fakes and without network (`AGENTS.md` §9).
- If an end-to-end test is needed, prepare the command, explain what it will do and on which data, and let the
  user run it.
- When in doubt about an operation that modifies data: stop and ask. A question costs less than corrupted data.

## Reference documentation

When an API is not obvious, consult the source instead of guessing:

- Deno runtime — https://docs.deno.com/runtime/
- `deno.json` configuration — https://docs.deno.com/runtime/fundamentals/configuration/
- Testing in Deno — https://docs.deno.com/runtime/fundamentals/testing/

<!-- TODO(template): the documentation of the project's libraries and services. -->

For a poorly documented library the authoritative source is not the web: it is the pinned package. Read its
`.d.ts` files and its sources.

If a real doubt remains, ask. A wrong assumption costs more than a question.

## Requires explicit confirmation

- Installing, removing or upgrading dependencies.
- Modifying `deno.json`, the `Dockerfile` or the deploy configuration.
- Any operation that writes to real services or data.
- Any Git or GitHub operation that writes: `commit`, `push`, `merge`, `rebase`, `reset`, creating a branch, a PR
  or an issue.
- Deleting files or folders.

<!-- TODO(template): the other changes that require confirmation, for example changing a public contract. -->

Some of these rules are also enforced by `.claude/settings.json`, in every permission mode: push, PR and issue
operations, `reset`, `clean`, `restore` and deleting branches or stashes show a prompt to the user. So does every
`gh api` call, reads included: `gh api` turns into a write as soon as a field is passed, in more forms than a rule
can name. The prompt adds to the confirmation in chat, it does not replace it. The rules match the command in the
form it is written in: git commands that write go in the normal form, without options such as `-C` or `-c` before
the subcommand. To work in another folder, `cd` into it and then `git push`, never `git -C folder push`.

`.env` files are neither readable nor editable, except `.env.example`: the user writes the `.env`. Every shell rule
comes in a pair, `Bash(...)` and `PowerShell(...)`: on Windows a `deny` on Bash without its twin PowerShell rule
silently turns off the PowerShell tool.

The `attribution` block of `.claude/settings.json` uses the form `"commit": "", "pr": "", "sessionUrl": false`.
The short form `"attribution": false` requires Claude Code 2.1.281: on an earlier version it makes the file
invalid, and Claude Code ignores an invalid `settings.json` entirely, permissions and Stop hook included. After
every change to the file, `claude doctor` must not report invalid settings.

In auto mode the Claude Code classifier may block changes to `.claude/settings.json` as self-modification: to
change these rules the user leaves auto mode, and comes back to it for testing.
