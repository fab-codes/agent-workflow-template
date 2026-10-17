import { assertEquals, assertExists, assertNotMatch, assertStringIncludes } from "@std/assert";
import { reviewedShaProblem } from "../../scripts/check-reviewed-sha.ts";

const HEAD_SHA = "0123456789abcdef0123456789abcdef01234567";
const OTHER_SHA = "fedcba9876543210fedcba9876543210fedcba98";

function reviewedShaLineOf(sha: string): string {
  return `**Reviewed SHA:** \`${sha}\``;
}

function bodyWith(...reviewLines: string[]): string {
  return [
    "Adds the check.",
    "",
    "## Review",
    "",
    ...reviewLines,
    "**Model:** `gpt-5` · **Effort:** `xhigh`",
    "",
    "```",
    "No findings.",
    "```",
  ].join("\n");
}

Deno.test("accepts a body whose Reviewed SHA is the head of the PR", () => {
  assertEquals(reviewedShaProblem(bodyWith(reviewedShaLineOf(HEAD_SHA)), HEAD_SHA), null);
});

Deno.test("rejects a Reviewed SHA that is not the head, as after a commit pushed past the review", () => {
  const problem = reviewedShaProblem(bodyWith(reviewedShaLineOf(OTHER_SHA)), HEAD_SHA);

  assertStringIncludes(problem ?? "", `the Reviewed SHA ${OTHER_SHA} is not the head of the PR, ${HEAD_SHA}`);
});

Deno.test("rejects the placeholder of the template left as it is", () => {
  const body = bodyWith("**Reviewed SHA:** `<full SHA of the commit Codex reviewed>`");

  assertStringIncludes(reviewedShaProblem(body, HEAD_SHA) ?? "", "must hold the full SHA");
});

Deno.test("rejects a short SHA, even a prefix of the head", () => {
  const problem = reviewedShaProblem(bodyWith(reviewedShaLineOf(HEAD_SHA.slice(0, 7))), HEAD_SHA);

  assertStringIncludes(problem ?? "", "must hold the full SHA");
});

Deno.test("rejects the head in uppercase, which /pr never writes", () => {
  const problem = reviewedShaProblem(bodyWith(reviewedShaLineOf(HEAD_SHA.toUpperCase())), HEAD_SHA);

  assertStringIncludes(problem ?? "", "must hold the full SHA");
});

Deno.test("rejects two Reviewed SHA lines, even when both name the head", () => {
  const body = bodyWith(reviewedShaLineOf(HEAD_SHA), reviewedShaLineOf(HEAD_SHA));

  assertStringIncludes(reviewedShaProblem(body, HEAD_SHA) ?? "", "has 2 lines that start with");
});

Deno.test("rejects an empty body and a body without the Reviewed SHA line", () => {
  for (const body of ["", bodyWith()]) {
    assertStringIncludes(reviewedShaProblem(body, HEAD_SHA) ?? "", "has no line that starts with");
  }
});

Deno.test("accepts a body saved with CRLF line endings, as the GitHub web editor saves it", () => {
  const body = bodyWith(reviewedShaLineOf(HEAD_SHA)).replaceAll("\n", "\r\n");

  assertEquals(reviewedShaProblem(body, HEAD_SHA), null);
});

Deno.test("tolerates spaces and tabs after the Reviewed SHA", () => {
  assertEquals(reviewedShaProblem(bodyWith(reviewedShaLineOf(HEAD_SHA) + "  \t"), HEAD_SHA), null);
});

Deno.test("counts only the lines that start with the label, not a sentence that mentions it", () => {
  const body = bodyWith(
    "<!-- CI reads the **Reviewed SHA:** line below. -->",
    reviewedShaLineOf(HEAD_SHA),
  );

  assertEquals(reviewedShaProblem(body, HEAD_SHA), null);
});

Deno.test("rejects a malformed HEAD_SHA, without quoting it", () => {
  const body = bodyWith(reviewedShaLineOf(HEAD_SHA));
  const malformedHeadShas = [
    "",
    HEAD_SHA.slice(0, 7),
    HEAD_SHA.toUpperCase(),
    HEAD_SHA + "\n",
    "::add-mask::x",
  ];
  for (const headSha of malformedHeadShas) {
    assertEquals(
      reviewedShaProblem(body, headSha),
      "HEAD_SHA is not a full SHA of 40 lowercase hexadecimal characters",
    );
  }
});

Deno.test("keeps the body out of the message, so that it cannot become a workflow command", () => {
  const hostileBodies = [
    "::stop-commands::resume-token",
    bodyWith("::stop-commands::resume-token", "**Reviewed SHA:** `<full SHA>`"),
    bodyWith("**Reviewed SHA:** `::stop-commands::resume-token`"),
    bodyWith("**Reviewed SHA:** ::add-mask::" + HEAD_SHA, reviewedShaLineOf(HEAD_SHA)),
  ];
  for (const body of hostileBodies) {
    const problem = reviewedShaProblem(body, HEAD_SHA);

    assertExists(problem);
    assertNotMatch(problem, /::/);
  }
});
