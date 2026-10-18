// deno-lint-ignore-file no-console -- this is a developer-facing CLI script, not application code.

// Deterministic checks for the AGENTS.md invariants that require no judgment.
// Judgment-based review lives in AGENTS.md under "Code Review Rules" and in .claude/skills/review/SKILL.md;
// style rules live in deno.json under "lint".
// Nothing is duplicated across the three: a rule enforced by deno lint is deliberately absent here.
// TODO(template): add the project's own invariants, each tied to the AGENTS.md section it enforces.

type Violation = {
  readonly file: string;
  readonly line: number;
  readonly rule: string;
  readonly detail: string;
};

type LayerRule = {
  readonly directory: string;
  readonly forbiddenSpecifier: RegExp;
  readonly detail: string;
};

const SCANNED_ROOTS = ["src", "tests"] as const;

const DEFAULT_EXPORT = /^\s*export\s+default\b/;

// AGENTS.md §5.2: no barrel files, no utils.ts dumping ground.
const FORBIDDEN_FILENAMES = ["index.ts", "mod.ts", "utils.ts"];

// AGENTS.md §9: no test may reach a real service. Running the suite without network permission makes that a
// property of the runtime instead of a promise every test has to keep. The arguments are allowlisted because a
// denylist misses every grant it does not name: -N, --allow-run (a spawned curl), -P (a permission set declared
// in deno.json, which deno test applies only through that flag), and any flag Deno adds later.
const DENO_CONFIG_FILE = "deno.json";
const TEST_TASK_ALLOWED_ARGUMENTS = ["--allow-env"];

// AGENTS.md "Code Review Rules": Codex reads AGENTS.md up to project_doc_max_bytes and drops the rest silently.
// The limit is read from the step 5 command of §12, which carries it to every machine through the repository, so
// the command and this check cannot drift apart.
const AGENTS_FILE = "AGENTS.md";
const CODEX_REVIEW_DOCUMENT_LIMIT = /codex review [^`\n]*-c project_doc_max_bytes=(\d+)/;

// AGENTS.md §12: the title of an issue or a PR says what changes. In the Bash tool Git Bash rewrites as a
// Windows path every argument to a native program that starts with "/" (CLAUDE.md, "Local environment"), so the
// title "/issue x" reaches GitHub as "C:/Program Files/Git/issue x": every gh command of the skills that passes
// a title turns the rewriting off. On macOS and Linux the bug cannot be seen and the prefix looks like noise:
// this check keeps it from being removed.
const SKILLS_DIRECTORY = ".claude/skills";
const SKILL_FILENAME = "SKILL.md";
const GH_TITLE_COMMAND = /\bgh [^`\n]*--title\b/g;
const PATH_CONVERSION_OFF = "MSYS_NO_PATHCONV=1";

// AGENTS.md §12: no commit, push, PR or issue without the user's go-ahead, and .claude/settings.json backs it with
// prompts. A shell rule binds one tool only (CLAUDE.md, "Requires explicit confirmation"): an ask rule without its
// twin leaves the command unguarded from the other shell, and a deny on Bash alone silently turns off the
// PowerShell tool on Windows.
const CLAUDE_SETTINGS_FILE = ".claude/settings.json";
const PAIRED_RULE_LISTS = ["ask", "deny"] as const;
const SHELL_RULE = /^(Bash|PowerShell)\((.*)\)$/;

// AGENTS.md §5.1: dependencies point downwards only.
// TODO(template): one rule per forbidden direction, for example
//   { directory: "src/domain/", forbiddenSpecifier: /(^|\/)infrastructure\//,
//     detail: "domain/ must not import infrastructure/" },
const LAYER_RULES: readonly LayerRule[] = [];

async function directoryExists(path: string): Promise<boolean> {
  try {
    const info = await Deno.stat(path);
    return info.isDirectory;
  } catch {
    return false;
  }
}

async function* walkTypeScriptFiles(root: string): AsyncGenerator<string> {
  if (!(await directoryExists(root))) return;
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      yield* walkTypeScriptFiles(path);
    } else if (entry.isFile && path.endsWith(".ts")) {
      yield path;
    }
  }
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function checkImportSpecifiers(file: string, content: string): Violation[] {
  const violations: Violation[] = [];
  // Matching "from" rather than whole import statements survives multi-line imports.
  for (const match of content.matchAll(/from\s+["']([^"']+)["']/g)) {
    const specifier = match[1];
    if (specifier === undefined) continue;
    const line = lineNumberAt(content, match.index);

    for (const layerRule of LAYER_RULES) {
      if (file.startsWith(layerRule.directory) && layerRule.forbiddenSpecifier.test(specifier)) {
        violations.push({ file, line, rule: "§5.1", detail: `${layerRule.detail} (imports "${specifier}")` });
      }
    }
  }
  return violations;
}

function checkLines(file: string, content: string): Violation[] {
  const violations: Violation[] = [];

  content.split(/\r?\n/).forEach((text, index) => {
    const line = index + 1;

    if (DEFAULT_EXPORT.test(text)) {
      violations.push({ file, line, rule: "§6", detail: "named exports only, never export default" });
    }
  });

  return violations;
}

function checkFilename(file: string): Violation[] {
  const basename = file.slice(file.lastIndexOf("/") + 1);

  if (FORBIDDEN_FILENAMES.includes(basename)) {
    return [{ file, line: 1, rule: "§5.2", detail: `"${basename}" is a barrel file or a catch-all` }];
  }
  return [];
}

// A task is either a command string or an object carrying one; anything else yields null.
function testTaskCommandOf(configuration: unknown): string | null {
  if (typeof configuration !== "object" || configuration === null) return null;
  const tasks = (configuration as Record<string, unknown>)["tasks"];
  if (typeof tasks !== "object" || tasks === null) return null;

  const task = (tasks as Record<string, unknown>)["test"];
  if (typeof task === "string") return task;
  if (typeof task !== "object" || task === null) return null;
  const command = (task as Record<string, unknown>)["command"];
  return typeof command === "string" ? command : null;
}

export function unexpectedTestTaskArguments(command: string): string[] {
  const tokens = command.trim().split(/\s+/);
  const [executable, subcommand, ...taskArguments] = tokens;
  if (executable !== "deno" || subcommand !== "test") return tokens;
  return taskArguments.filter((argument) => !TEST_TASK_ALLOWED_ARGUMENTS.includes(argument));
}

async function checkTestTaskPermissions(): Promise<Violation[]> {
  const content = await Deno.readTextFile(DENO_CONFIG_FILE);
  let configuration: unknown;
  try {
    configuration = JSON.parse(content);
  } catch {
    return [{
      file: DENO_CONFIG_FILE,
      line: 1,
      rule: "§9",
      detail: "not valid JSON, the test task is unchecked",
    }];
  }

  const command = testTaskCommandOf(configuration);
  const line = lineNumberAt(content, Math.max(content.indexOf(`"test"`), 0));
  if (command === null) {
    return [{ file: DENO_CONFIG_FILE, line, rule: "§9", detail: "no test task command found to check" }];
  }
  const unexpectedArguments = unexpectedTestTaskArguments(command);
  if (unexpectedArguments.length > 0) {
    return [{
      file: DENO_CONFIG_FILE,
      line,
      rule: "§9",
      detail: `the test task must be "deno test" with at most ${TEST_TASK_ALLOWED_ARGUMENTS.join(", ")}, ` +
        `or a test could reach a real service (unexpected: ${unexpectedArguments.join(" ")})`,
    }];
  }
  return [];
}

// Codex counts bytes, not characters: every accented letter of AGENTS.md takes two.
export function codexDocumentLimitProblem(agentsContent: string): string | null {
  const limit = CODEX_REVIEW_DOCUMENT_LIMIT.exec(agentsContent)?.[1];
  if (limit === undefined) {
    return "the step 5 command must raise project_doc_max_bytes, or Codex reviews against a truncated AGENTS.md";
  }
  const size = new TextEncoder().encode(agentsContent).length;
  if (size > Number(limit)) {
    return `${size} bytes, past the ${limit} the step 5 command lets Codex read: the rest is dropped silently`;
  }
  return null;
}

async function checkCodexDocumentLimit(): Promise<Violation[]> {
  const content = await Deno.readTextFile(AGENTS_FILE);
  const problem = codexDocumentLimitProblem(content);
  if (problem === null) return [];

  const line = lineNumberAt(content, Math.max(content.search(CODEX_REVIEW_DOCUMENT_LIMIT), 0));
  return [{ file: AGENTS_FILE, line, rule: "§12", detail: problem }];
}

export function titleCommandLinesWithPathConversion(skillContent: string): number[] {
  return [...skillContent.matchAll(GH_TITLE_COMMAND)]
    .filter((match) => !skillContent.slice(0, match.index).endsWith(`${PATH_CONVERSION_OFF} `))
    .map((match) => lineNumberAt(skillContent, match.index));
}

async function checkSkillTitleCommands(): Promise<Violation[]> {
  if (!(await directoryExists(SKILLS_DIRECTORY))) return [];

  const violations: Violation[] = [];
  for await (const entry of Deno.readDir(SKILLS_DIRECTORY)) {
    if (!entry.isDirectory) continue;
    const file = `${SKILLS_DIRECTORY}/${entry.name}/${SKILL_FILENAME}`;
    let content: string;
    try {
      content = await Deno.readTextFile(file);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }

    for (const line of titleCommandLinesWithPathConversion(content)) {
      violations.push({
        file,
        line,
        rule: "§12",
        detail: `a gh command with --title must start with ${PATH_CONVERSION_OFF}, or Git Bash rewrites ` +
          `a title starting with "/" into a Windows path (CLAUDE.md, Local environment)`,
      });
    }
  }
  return violations;
}

// A permission list is an array of rule strings; anything else holds no rule to check.
function permissionRulesOf(settings: unknown, listName: string): string[] {
  if (typeof settings !== "object" || settings === null) return [];
  const permissions = (settings as Record<string, unknown>)["permissions"];
  if (typeof permissions !== "object" || permissions === null) return [];
  const rules = (permissions as Record<string, unknown>)[listName];
  if (!Array.isArray(rules)) return [];
  return rules.filter((rule: unknown): rule is string => typeof rule === "string");
}

export function unpairedShellRules(rules: readonly string[]): string[] {
  return rules.filter((rule) => {
    const [, shell, pattern] = SHELL_RULE.exec(rule) ?? [];
    if (shell === undefined || pattern === undefined) return false;
    const twinShell = shell === "Bash" ? "PowerShell" : "Bash";
    return !rules.includes(`${twinShell}(${pattern})`);
  });
}

async function checkShellRulePairs(): Promise<Violation[]> {
  const content = await Deno.readTextFile(CLAUDE_SETTINGS_FILE);
  let settings: unknown;
  try {
    settings = JSON.parse(content);
  } catch {
    return [{
      file: CLAUDE_SETTINGS_FILE,
      line: 1,
      rule: "§12",
      detail: "not valid JSON: Claude Code ignores the whole file, prompts included",
    }];
  }

  const violations: Violation[] = [];
  for (const listName of PAIRED_RULE_LISTS) {
    for (const rule of unpairedShellRules(permissionRulesOf(settings, listName))) {
      violations.push({
        file: CLAUDE_SETTINGS_FILE,
        line: lineNumberAt(content, Math.max(content.indexOf(`"${rule}"`), 0)),
        rule: "§12",
        detail:
          `the ${listName} rule ${rule} has no twin for the other shell (CLAUDE.md, Requires explicit ` +
          `confirmation)`,
      });
    }
  }
  return violations;
}

async function main(): Promise<void> {
  const violations: Violation[] = [
    ...(await checkTestTaskPermissions()),
    ...(await checkCodexDocumentLimit()),
    ...(await checkSkillTitleCommands()),
    ...(await checkShellRulePairs()),
  ];

  for (const root of SCANNED_ROOTS) {
    for await (const file of walkTypeScriptFiles(root)) {
      const content = await Deno.readTextFile(file);
      violations.push(
        ...checkFilename(file),
        ...checkImportSpecifiers(file, content),
        ...checkLines(file, content),
      );
    }
  }

  if (violations.length === 0) {
    console.log("check-invariants: no violations");
    return;
  }

  console.error(`check-invariants: ${violations.length} violation(s)\n`);
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line}  AGENTS.md ${violation.rule}  ${violation.detail}`);
  }
  Deno.exit(1);
}

if (import.meta.main) await main();
