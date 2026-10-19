# agent-workflow-template

A repository skeleton for developing with Claude Code and Codex. Every change starts from a GitHub issue. Claude
writes the code, `deno task verify` checks everything that needs no judgment, `/review` looks at maintainability,
and Codex, a different model, does the independent correctness and security review before every PR. The full
cycle is in [`docs/workflow.md`](docs/workflow.md).

## Requirements

Deno 2.9.6, Claude Code, Codex CLI and `gh`, installed and authenticated.

## Publishing the template

Once, after creating the repository on GitHub, mark it as a template, with `develop` as its default branch: a
project created from the template starts from that branch, and GitHub reads `Closes #<n>` only in PRs to the
default branch (`AGENTS.md` §12).

```bash
gh repo edit <owner>/agent-workflow-template --template --default-branch develop
```

## New project

1. Create the repository from the template. A `git clone` would carry along the template's history and remote;
   this way you start from a clean commit:

   ```bash
   gh repo create <name> --private --template <owner>/agent-workflow-template --clone
   ```

2. Create `main` from `develop` and publish it. The new repository holds only the template's default branch,
   `develop`, which stays the default: step 5 reviews against `origin/develop`, PRs target it, and `Closes #<n>`
   closes an issue only in PRs to the default branch.

   ```bash
   git push origin develop:main
   ```

3. Fill in the placeholders, starting from `AGENTS.md` §1. Each one says what to write; when the search finds
   only this README, the template is adapted.

   ```bash
   git grep -n "TODO(template)"
   ```

4. Replace this README with the project's own.
5. Run `deno task verify`: it must pass before the first PR.
6. Optional: a ruleset on `develop` that requires the checks `verify` and `reviewed-sha`, the jobs of `ci.yml`
   and `reviewed-sha.yml`. Without it a red check is visible, but it does not block the merge. Rulesets are
   available in public repositories on every plan, GitHub Free included, and in private ones with GitHub Pro,
   GitHub Team and GitHub Enterprise Cloud. Once both checks have passed on a first PR:

   - **Settings** → **Rulesets** → **New ruleset** → **New branch ruleset**, enforcement status **Active**;
   - under "Target branches", **Add a target** with the pattern `develop`;
   - **Require status checks before merging**: add `verify` and `reviewed-sha`, each with the **+** button;
   - **Create**.

## What it contains

| File                                                                  | Status                                                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `AGENTS.md`, `CLAUDE.md`                                              | Generic rules plus placeholders to fill in                                      |
| `scripts/check-invariants.ts`                                         | Generic invariants; the project's own are added here                            |
| `.claude/settings.json`, `.claude/hooks/verify.ts`                    | Ready: permissions, attribution, Stop hook                                      |
| `.claude/skills/grill-me/SKILL.md`, `.claude/skills/grill-me/LICENSE` | Ready: `/grill-me`, the interview that settles the plan, its terms and its ADRs |
| `.claude/skills/diagnose/SKILL.md`, `.claude/skills/diagnose/LICENSE` | Ready: `/diagnose`, the confirmed cause of a bug, before `/issue`               |
| `.claude/skills/issue/SKILL.md`, `.claude/skills/issue/LICENSE`       | Ready: `/issue`, the agreed change as one issue, or one per slice               |
| `.claude/skills/tdd/SKILL.md`, `.claude/skills/tdd/LICENSE`           | Ready: `/tdd`, each test seen red before its code                               |
| `.claude/skills/review/SKILL.md`                                      | Ready: `/review`, maintainability and fit with the issue                        |
| `.claude/skills/codex-review/SKILL.md`                                | Ready: `/codex-review`, the Codex review and its record                         |
| `.claude/skills/pr/SKILL.md`                                          | Ready: `/pr`, push and PR with the Review section                               |
| `.github/ISSUE_TEMPLATE/change.md`                                    | Ready: the sections of an issue                                                 |
| `.github/workflows/ci.yml`, `.github/pull_request_template.md`        | Ready: CI and the PR's Review section                                           |
| `.github/workflows/reviewed-sha.yml`, `scripts/check-reviewed-sha.ts` | Ready: the CI check of the Reviewed SHA                                         |
| `deno.json`, `.gitattributes`, `.gitignore`, `tests/`                 | Ready; `deno.json` grows with the project's dependencies                        |
| `docs/workflow.md`                                                    | Ready: the cycle on one page                                                    |

## If the project does not use Deno

The template assumes Deno, which the Stop hook and the invariants script need anyway. With another stack, these
change:

- the command run by `.claude/hooks/verify.ts`;
- the `Verify` step of `.github/workflows/ci.yml`;
- §2, §3, §6 and §9 of `AGENTS.md`;
- the check on the test command in `scripts/check-invariants.ts`, which reads it from `deno.json`.
