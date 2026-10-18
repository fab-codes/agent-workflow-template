---
description: Step 7 of AGENTS.md §12 — push the branch and open, or update, its PR to develop with the Review section filled in
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
4. `#<n>` is not an open issue: `gh issue view <n> --json state,title,url` must give the state `OPEN` and a URL
   with `/issues/`. On the number of a PR, `gh issue view` answers with the PR, with no error. Renaming the
   branch is the user's decision.
5. The default branch on GitHub is not `develop`
   (`gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`): GitHub ignores `Closes #<n>` in a PR to
   any other branch, and the issue would stay open after the merge (§12, Rules). Changing it is the user's
   decision: `gh repo edit --default-branch develop`.

## Title and body

Title: `<n> - <title of the issue>` (§12, Rules).

Body: `.github/pull_request_template.md`, filled in.

- In place of the opening comment: what changes and why, in English, from `git log origin/develop..HEAD`.
- `Closes #<n>`, with the number of the issue.
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

In the body every paragraph and every list item sits on one line, because GitHub renders even a single line break
of the body as a line break. The lines of the template stay as they are, and so does the Codex stdout inside the
fence, line breaks included.

## Publish

1. Write the body to `pr-<n>.md` in the records folder, and show the title and the body.
2. `git push -u origin <branch>`.
3. Look for an open PR of the branch: `gh pr list --head <branch> --state open --json number,url`.
   Without one: `MSYS_NO_PATHCONV=1 gh pr create --base develop --title "<n> - <title of the issue>" --body-file <file>`,
   with the prefix every title on a command line carries (`CLAUDE.md`, Local environment).
   With one: `gh pr edit --body-file <file>`, so that the body follows the new SHA. The title stays.
4. Show the URL of the PR. CI and the merge are the user's (§12, step 8); the merge closes the issue.
