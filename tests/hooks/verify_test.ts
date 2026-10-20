import { assertEquals, assertStringIncludes } from "@std/assert";
import type { CommandRunner } from "../../.claude/hooks/verify.ts";
import { keepEnd, readWorkingTreeStatus } from "../../.claude/hooks/verify.ts";

// A git that knows only `git status`. Like the real one, it lists only the changed paths selected by the
// pathspecs after "--", if any: a pathspec selects the file it names, or the files under the folder it names.
function fakeGitStatus(changedPaths: readonly string[]): CommandRunner {
  return (executable, commandArguments) => {
    if (executable !== "git" || commandArguments[0] !== "status") {
      return Promise.resolve({ code: 1, output: `fake git: unsupported command ${executable}` });
    }

    const separatorIndex = commandArguments.indexOf("--");
    const pathspecs = separatorIndex === -1 ? [] : commandArguments.slice(separatorIndex + 1);
    const listedPaths = pathspecs.length === 0
      ? changedPaths
      : changedPaths.filter((path) =>
        pathspecs.some((pathspec) => path === pathspec || path.startsWith(pathspec + "/"))
      );
    return Promise.resolve({ code: 0, output: listedPaths.map((path) => ` M ${path}`).join("\n") });
  };
}

// The forms of the option with which `git status` lists untracked files whatever the configuration says.
const UNTRACKED_FILES_OVERRIDES = [
  "-u",
  "-unormal",
  "-uall",
  "--untracked-files",
  "--untracked-files=normal",
  "--untracked-files=all",
];

// A git configured with status.showUntrackedFiles=no: like the real one, it lists the untracked files only
// when the command line overrides the configuration.
function fakeGitHidingUntrackedFiles(untrackedPaths: readonly string[]): CommandRunner {
  return (executable, commandArguments) => {
    if (executable !== "git" || commandArguments[0] !== "status") {
      return Promise.resolve({ code: 1, output: `fake git: unsupported command ${executable}` });
    }

    const isListingUntrackedFiles = commandArguments.some((argument) =>
      UNTRACKED_FILES_OVERRIDES.includes(argument)
    );
    const listedPaths = isListingUntrackedFiles ? untrackedPaths : [];
    return Promise.resolve({ code: 0, output: listedPaths.map((path) => `?? ${path}`).join("\n") });
  };
}

Deno.test("keeps an output within the limit untouched", () => {
  assertEquals(keepEnd("lint failed", 100), "lint failed");
  assertEquals(keepEnd("12345", 5), "12345");
});

Deno.test("keeps the end of a long output, where deno task leaves the failure", () => {
  const failure = "error: Found 1 not formatted file";
  const output = "ok | passing test\n".repeat(5_000) + failure;

  const kept = keepEnd(output, 100);

  assertStringIncludes(kept, failure);
  assertEquals(kept, "[output truncated]\n" + output.slice(-100));
});

Deno.test("has something to verify when only a skill changed", async () => {
  const status = await readWorkingTreeStatus(fakeGitStatus([".claude/skills/pr/SKILL.md"]));

  assertEquals(status, { kind: "changed" });
});

Deno.test("has nothing to verify in a repository without changes", async () => {
  const status = await readWorkingTreeStatus(fakeGitStatus([]));

  assertEquals(status, { kind: "clean" });
});

Deno.test("has something to verify when only an untracked file exists, even where git hides them", async () => {
  const status = await readWorkingTreeStatus(fakeGitHidingUntrackedFiles(["src/new-module.ts"]));

  assertEquals(status, { kind: "changed" });
});

Deno.test("reports a failing git status as a failure, not as nothing to verify", async () => {
  const failure = "fatal: not a git repository (or any of the parent directories): .git";
  const failingGit: CommandRunner = () => Promise.resolve({ code: 128, output: failure });

  const status = await readWorkingTreeStatus(failingGit);

  assertEquals(status, { kind: "failed", output: failure });
});
