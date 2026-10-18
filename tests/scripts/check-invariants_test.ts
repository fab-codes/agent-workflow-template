import { assertEquals, assertStringIncludes } from "@std/assert";
import {
  codexDocumentLimitProblem,
  titleCommandLinesWithPathConversion,
  unexpectedTestTaskArguments,
} from "../../scripts/check-invariants.ts";

Deno.test("accepts the test task that only reads the environment", () => {
  assertEquals(unexpectedTestTaskArguments("deno test --allow-env"), []);
});

Deno.test("accepts the test task with no permission at all", () => {
  assertEquals(unexpectedTestTaskArguments("deno test"), []);
});

Deno.test("rejects every spelling of a network grant, scoped ones included", () => {
  for (const grant of ["--allow-net", "-N", "--allow-net=127.0.0.1:5984", "-A", "--allow-all"]) {
    assertEquals(unexpectedTestTaskArguments(`deno test --allow-env ${grant}`), [grant]);
  }
});

Deno.test("rejects a subprocess grant, through which a test could run curl", () => {
  assertEquals(unexpectedTestTaskArguments("deno test --allow-env --allow-run"), ["--allow-run"]);
});

Deno.test("rejects a permission set, through which deno.json could grant the network", () => {
  assertEquals(unexpectedTestTaskArguments("deno test -P"), ["-P"]);
  assertEquals(unexpectedTestTaskArguments("deno test --permission-set=ci"), ["--permission-set=ci"]);
});

Deno.test("rejects a flag that does not exist yet", () => {
  assertEquals(unexpectedTestTaskArguments("deno test --allow-env --future-flag"), ["--future-flag"]);
});

Deno.test("rejects a command chained after the tests", () => {
  assertEquals(
    unexpectedTestTaskArguments("deno test --allow-env && curl http://example.com"),
    ["&&", "curl", "http://example.com"],
  );
});

Deno.test("rejects a task that does not run deno test", () => {
  assertEquals(unexpectedTestTaskArguments("deno run -A tests.ts"), ["deno", "run", "-A", "tests.ts"]);
});

Deno.test("ignores the whitespace around and between the arguments", () => {
  assertEquals(unexpectedTestTaskArguments("  deno   test\t--allow-env  "), []);
});

const STEP_5_COMMAND = "`codex review -c project_doc_max_bytes=100 --base origin/develop`";

function agentsFileOf(byteLength: number): string {
  return STEP_5_COMMAND + "\n" + "x".repeat(byteLength - STEP_5_COMMAND.length - 1);
}

Deno.test("accepts an AGENTS.md exactly as long as the limit of the step 5 command", () => {
  assertEquals(codexDocumentLimitProblem(agentsFileOf(100)), null);
});

Deno.test("rejects an AGENTS.md one byte past the limit, which Codex would truncate", () => {
  const problem = codexDocumentLimitProblem(agentsFileOf(101));

  assertStringIncludes(problem ?? "", "101 bytes, past the 100");
});

Deno.test("counts an accented letter as two bytes, as Codex does", () => {
  const content = STEP_5_COMMAND + "\n" + "è".repeat(100 - STEP_5_COMMAND.length - 1);
  assertEquals(content.length, 100);

  assertStringIncludes(codexDocumentLimitProblem(content) ?? "", "past the 100");
});

Deno.test("rejects an AGENTS.md whose step 5 command leaves the limit to the machine", () => {
  const problem = codexDocumentLimitProblem("`codex review --base origin/develop`");

  assertStringIncludes(problem ?? "", "must raise project_doc_max_bytes");
});

Deno.test("does not take a limit set in a local Codex configuration for the one in the command", () => {
  const problem = codexDocumentLimitProblem(
    "`project_doc_max_bytes = 65536` in `~/.codex/config.toml`\n`codex review --base origin/develop`",
  );

  assertStringIncludes(problem ?? "", "must raise project_doc_max_bytes");
});

Deno.test("accepts a gh title command that turns the path conversion of Git Bash off", () => {
  const skill = '2. `MSYS_NO_PATHCONV=1 gh issue create --title "<title>" --body-file <file>`, as written.';

  assertEquals(titleCommandLinesWithPathConversion(skill), []);
});

Deno.test("rejects a gh title command whose title Git Bash would rewrite into a Windows path", () => {
  const skill = '2. `gh issue create --title "<title>" --body-file <file>`, as written.';

  assertEquals(titleCommandLinesWithPathConversion(skill), [1]);
});

Deno.test("reports only the title command without the prefix, by its line", () => {
  const skill = [
    '1. `MSYS_NO_PATHCONV=1 gh issue create --title "<title>" --body-file <file>`.',
    "2. Look for an open PR: `gh pr list --head <branch> --state open --json number,url`.",
    '3. Without one: `gh pr create --base develop --title "<n> - <title>" --body-file <file>`.',
  ].join("\n");

  assertEquals(titleCommandLinesWithPathConversion(skill), [3]);
});

Deno.test("does not take the prefix of one command for the next one on the same line", () => {
  const skill = '`MSYS_NO_PATHCONV=1 gh issue create --title "a"`, then `gh pr create --title "b"`.';

  assertEquals(titleCommandLinesWithPathConversion(skill), [1]);
});

Deno.test("checks a title command inside a fenced block too", () => {
  const skill = ["```bash", 'gh issue create --title "<title>" --body-file <file>', "```"].join("\n");

  assertEquals(titleCommandLinesWithPathConversion(skill), [2]);
});
