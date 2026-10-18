// deno-lint-ignore-file no-console -- a CI script: GitHub Actions shows its stdout and stderr in the log.

// Run by .github/workflows/reviewed-sha.yml on every PR to develop: the Reviewed SHA of the PR body must be
// the head of the PR, the commit /codex-review reviewed and /pr wrote there (AGENTS.md §12).
// Messages carry only SHAs that already matched FULL_SHA, never text of the body (§8.3): on Actions, a body
// line printed to the log can become a workflow command, such as ::stop-commands:: or ::add-mask::.

const REVIEWED_SHA_LABEL = "**Reviewed SHA:**";

// Lowercase only: /pr writes the SHA in lowercase, as Git prints it, and so does GitHub in the event payload.
const FULL_SHA = /^[0-9a-f]{40}$/;
const REVIEWED_SHA_LINE = /^\*\*Reviewed SHA:\*\* `([0-9a-f]{40})`$/;

export function reviewedShaProblem(body: string, headSha: string): string | null {
  if (!FULL_SHA.test(headSha)) {
    return "HEAD_SHA is not a full SHA of 40 lowercase hexadecimal characters";
  }

  // trimEnd drops trailing spaces and the \r of the CRLF line endings the GitHub web editor saves.
  const reviewedShaLines = body.split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith(REVIEWED_SHA_LABEL));

  const [reviewedShaLine] = reviewedShaLines;
  if (reviewedShaLine === undefined) {
    return `the PR body has no line that starts with ${REVIEWED_SHA_LABEL}, ` +
      `and it must name the head of the PR, ${headSha}`;
  }
  if (reviewedShaLines.length > 1) {
    return `the PR body has ${reviewedShaLines.length} lines that start with ${REVIEWED_SHA_LABEL}, ` +
      "and it must have exactly one";
  }

  const reviewedSha = REVIEWED_SHA_LINE.exec(reviewedShaLine)?.[1];
  if (reviewedSha === undefined) {
    return `the ${REVIEWED_SHA_LABEL} line must hold the full SHA of the head of the PR, ` +
      `lowercase, between backticks: \`${headSha}\``;
  }
  if (reviewedSha !== headSha) {
    return `the Reviewed SHA ${reviewedSha} is not the head of the PR, ${headSha}`;
  }
  return null;
}

function main(): void {
  const headSha = Deno.env.get("HEAD_SHA") ?? "";
  const problem = reviewedShaProblem(Deno.env.get("PR_BODY") ?? "", headSha);

  if (problem !== null) {
    console.error(`check-reviewed-sha: ${problem}`);
    Deno.exit(1);
  }
  console.log(`check-reviewed-sha: the Reviewed SHA is the head of the PR, ${headSha}`);
}

if (import.meta.main) main();
