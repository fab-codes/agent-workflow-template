// deno-lint-ignore-file no-console -- Claude Code consumes this hook's stdout and stderr.

type HookInput = {
  readonly isStopHookActive: boolean;
};

type CommandResult = {
  readonly code: number;
  readonly output: string;
};

const REPOSITORY_ROOT = new URL("../../", import.meta.url);
const MAX_COMMAND_OUTPUT_LENGTH = 8_000;

const RELEVANT_PATHS = [
  "src",
  "tests",
  "scripts",
  "deno.json",
  "deno.lock",
  "AGENTS.md",
  ".claude/hooks",
  ".claude/settings.json",
] as const;

async function readHookInput(): Promise<HookInput> {
  const rawInput = await new Response(Deno.stdin.readable).text();
  if (rawInput.length === 0) return { isStopHookActive: false };

  try {
    const parsedInput: unknown = JSON.parse(rawInput);
    if (typeof parsedInput !== "object" || parsedInput === null) {
      return { isStopHookActive: false };
    }

    const stopHookActive = (parsedInput as Record<string, unknown>).stop_hook_active;
    return { isStopHookActive: stopHookActive === true };
  } catch {
    return { isStopHookActive: false };
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "unknown command execution error";
}

async function runCommand(executable: string, commandArguments: readonly string[]): Promise<CommandResult> {
  try {
    const command = new Deno.Command(executable, {
      args: [...commandArguments],
      cwd: REPOSITORY_ROOT,
      stdout: "piped",
      stderr: "piped",
    });
    const result = await command.output();
    const decoder = new TextDecoder();
    const standardOutput = decoder.decode(result.stdout).trim();
    const standardError = decoder.decode(result.stderr).trim();

    return {
      code: result.code,
      output: [standardOutput, standardError].filter((value) => value.length > 0).join("\n"),
    };
  } catch (error: unknown) {
    return { code: 1, output: describeError(error) };
  }
}

// The failure sits at the end: deno task stops at the first failing step, and the error output is appended
// after the standard output, which holds hundreds of passing test lines.
export function keepEnd(value: string, maximumLength: number): string {
  if (value.length <= maximumLength) return value;
  return "[output truncated]\n" + value.slice(-maximumLength);
}

function reportFailure(message: string, isStopHookActive: boolean): never {
  if (!isStopHookActive) {
    console.error(message);
    Deno.exit(2);
  }

  console.log(JSON.stringify({
    systemMessage:
      "Verification still fails after the one enforced retry. Claude Code is being allowed to stop to avoid " +
      "an infinite loop.\n\n" + message,
  }));
  Deno.exit(0);
}

async function main(): Promise<void> {
  const hookInput = await readHookInput();
  const gitStatus = await runCommand("git", ["status", "--porcelain", "--", ...RELEVANT_PATHS]);

  if (gitStatus.code !== 0) {
    reportFailure(
      "git status failed: verification cannot determine whether relevant files changed.\n" +
        keepEnd(gitStatus.output, MAX_COMMAND_OUTPUT_LENGTH),
      hookInput.isStopHookActive,
    );
  }
  if (gitStatus.output.length === 0) return;

  // The Definition of Done itself (AGENTS.md §3), not a copy of its steps: a copy drifts from deno.json the
  // first time a step is added there and not here.
  const verification = await runCommand("deno", ["task", "verify"]);
  if (verification.code !== 0) {
    reportFailure(
      "deno task verify FAILED:\n" +
        keepEnd(verification.output || "[no output]", MAX_COMMAND_OUTPUT_LENGTH) +
        "\n\nFix these before reporting the work as done.",
      hookInput.isStopHookActive,
    );
  }
}

if (import.meta.main) await main();
