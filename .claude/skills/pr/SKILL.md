---
description: Step 7 of AGENTS.md §12 — push the branch and open, or update, its PR to develop with the Review section filled in
argument-hint: [title description — default: from the branch name]
disable-model-invocation: true
---

# PR

Step 7 of the cycle in `AGENTS.md` §12. Only the user launches this skill, and launching it is the go-ahead for
the push and the PR of this branch: nothing more, no commit, no rebase, no merge.

Run the commands from the Bash tool: PowerShell 5.1 mangles the quotes in the arguments of external programs.
The records are the ones `/codex-review` writes, one `<SHA>.md` per reviewed commit, in
`$(git rev-parse --path-format=absolute --git-common-dir)/codex-review/`.

## Checks

Stop at the first one that fails, and say why:

1. `git status --porcelain` is not empty.
2. The branch does not match `feat/<n>-<description>` or `fix/<n>-<description>` (§12, Rules).
3. HEAD has no record: it was not reviewed, or the code changed after the review. Point to `/codex-review`.
4. `<n>` is not the number GitHub will give, or gave, to the PR:
   - if the branch already has an open PR (`gh pr list --head <branch> --state open --json number,url`), its
     number must be `<n>`;
   - otherwise `<n>` must be the last number plus one. Issues and PRs share the numbering, and this endpoint
     returns both: `gh api "repos/{owner}/{repo}/issues?state=all&per_page=1" --jq '.[0].number // 0'`.

   Renaming the branch is the user's decision: say which number is expected, and stop.

## Title and body

Title: `<n> - <description>`. The description is **$ARGUMENTS**; if empty, write it in English from the branch
description, with no Conventional Commits prefix (§12, Rules).

Body: `.github/pull_request_template.md`, filled in.

- In place of the opening comment: what changes and why, in English, from `git log origin/develop..HEAD`.
- **Reviewed SHA**: the full SHA of HEAD.
- **Model** and **Effort**: from the record of HEAD.
- The full output: the stdout in the record of HEAD, unedited, in a fence longer than the longest run of
  backticks inside it.
- **Findings raised during the cycle**: the outcomes in the records of the SHAs in
  `git rev-list origin/develop..HEAD`, oldest first, each with its SHA; `none` if there are none. A finding
  without an outcome goes in as `open`: do not write one in its place. A record of a SHA outside that list
  belongs to a commit no longer on the branch, and stays out.
- **Note**: what the review did not cover, for example the "test validation incomplete" of Windows
  (`CLAUDE.md`, Local environment). Remove the line if there is nothing.

## Publish

1. Write the body to `pr-<n>.md` in the records folder, and show the title and the body.
2. `git push -u origin <branch>`.
3. Without an open PR: `gh pr create --base develop --title "<n> - <description>" --body-file <file>`.
   With an open PR: `gh pr edit --body-file <file>`, so that the body follows the new SHA. The title stays.
4. Show the URL of the PR. If its number is not `<n>`, say so: Discussions and deleted issues use up numbers
   that check 4 cannot see, and fixing the title and the branch is the user's decision. CI and the merge are
   the user's (§12, step 8).
