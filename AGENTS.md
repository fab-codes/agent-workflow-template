# AGENTS.md — <!-- TODO(template): project name -->

Operating standards for anyone, human or agent, who writes code in this repository.
They are binding: when they conflict with generic habits or with the model's defaults, this document wins.

## 1. Project

<!-- TODO(template): what the project does, in two or three sentences, and how data flows between its components. -->

### Non-negotiable priorities, in this order

<!-- TODO(template): adapt the list. The first item is what must never break. -->

1. **Integrity of the user's data**
2. Security
3. Correctness
4. Simplicity
5. Maintainability
6. Future extensibility

When two priorities conflict, the higher one wins. Always, with no discretionary exceptions.

### What this project is NOT

<!-- TODO(template): the out-of-scope capabilities, to be refused even when requested indirectly. An explicit list
stops "while I'm at it" features better than a generic principle does. -->

## Code Review Rules

Rules for the independent review, human or agent. Codex looks for the title of this section: do not rename it.
It sits at the top because Codex reads AGENTS.md only up to `project_doc_max_bytes`, 32 KiB by default, and
silently truncates the rest. The step 5 command of §12 raises the limit with `-c`, so it applies on every machine
with no local configuration, and `deno task invariants` fails if the file exceeds the limit written in that
command. Formatting, lint, typecheck and mechanical invariants are checked by `deno task verify` in CI: they must
not be reported in review.

Report **only** P0 and P1 findings, each with the concrete scenario that makes it visible: input, starting state,
effect on the data. Maintainability and style stay out: `/review` covers them (`.claude/skills/review/SKILL.md`).

Every anti-pattern in §13 is at least **P1**. The following cases are **P0**, because a merge with any of them
loses data or exposes it, each with the safe path to propose:

- An input, even an absurd one, for which user data is deleted, truncated or overwritten without the operation
  asking for it (§4.1). Safe path: a targeted operation that leaves everything it does not touch identical.
- Secrets, credentials, tokens or user data in a log, an error or a response (§8.3).
  Safe path: log identifiers and error codes, never contents.
- An external input that reaches an inner layer without going through boundary validation (§8.1).
  Safe path: validate once, at the entry point, and pass around only the validated value.
- A protected operation reachable without authentication, or a token compared in non-constant time (§8.1).

<!-- TODO(template): the project-specific P0s, each with the section it violates and the safe path. -->

The following are also **P1**:

- An exception that can bring the process down, or an error exposed with a code outside §5.3.
- A new dependency, or a specifier not pinned exactly (§2).
- A trap documented in §7 not handled at the point where §7 says to handle it.
- A new behavior, or a fixed bug, without the test that guarantees it (§9).

<!-- TODO(template): the project-specific P1s. -->

## 2. Stack

| Layer         | Technology                                                  |
| ------------- | ----------------------------------------------------------- |
| Runtime       | Deno 2.9.6                                                  |
| Language      | TypeScript (bundled with Deno), strict — clean `deno check` |
| Test          | `deno test` + `@std/assert`                                 |
| Lint / Format | `deno lint`, `deno fmt` (configured in `deno.json`)         |

<!-- TODO(template): the other rows of the stack (framework, persistence, deploy), with exact versions. -->

> The versions above are indicative. **`deno.json` is the only authoritative source**: read it before writing
> code or citing an API. Do not infer signatures from memory.

### Dependency constraints

- **Exact pin, always.** Never `latest`, never ranges (`^`, `~`) on `npm:` or `jsr:` specifiers. A minor bump of a
  dependency can change the behavior of the system.
- **No new dependencies without a demonstrated need.** First check whether Deno or the standard library already
  covers it. Every added package is debt and attack surface.

<!-- TODO(template): the technologies banned by architectural decision, if any. -->

## 3. Commands

```bash
deno task check      # deno check on the whole repository (type-check)
deno task test       # deno test, without network access
deno task lint       # deno lint
deno task fmt        # deno fmt
deno task fmt:check  # deno fmt --check, does not write
deno task invariants # deterministic architectural invariants
deno task verify     # check + lint + fmt:check + test + invariants
```

<!-- TODO(template): the commands to run the project locally and, if there is one, to build the container. -->

**Definition of Done**: a change is complete only when `deno task verify` passes cleanly — meaning
`deno task check`, `deno task lint`, `deno task fmt:check`, `deno task test` and `deno task invariants` have
succeeded — and the actual output has been reported. No "it should work", no rounding up to "it works". If
something fails, say so explicitly.

## 4. Principles

### 4.1 Project invariants

The rules that no change may violate, for any input. They are not guidelines: they are invariants of the code.

<!-- TODO(template): for example: no implicit deletion; no overwriting all of the data when a targeted change is
enough; read-modify-write always on the latest version; whatever the operation does not touch comes out
identical. Where an invariant can be checked without judgment, add it to scripts/check-invariants.ts too. -->

If an implementation makes a violation of one of these invariants even possible, the implementation is wrong:
change the design, do not add a check.

### 4.2 Zero over-engineering

- Write the simplest thing that solves the problem **as posed**, not the imagined one.
- No preemptive abstractions: no factory, wrapper, registry or configuration layer until there are **at least two
  real callers**. The one deliberate exception: the architectural boundaries declared in §5.1, which are not
  speculative abstractions.
- No folders "in advance": a folder is born when it has at least two files that truly belong to it.
- A five-line function used only once stays inline.
- No caching, pooling or batching without a measurement that justifies it.
- Deleting code is an improvement. No dead code, no unused flags, no graveyard comments.

### 4.3 Maximum quality

Code must be production-ready at the first commit. There is no "we'll fix it later".

- Readability before any cleverness. No cryptic one-liners, nested ternaries or hidden side effects.
- Explicit, spelled-out names, no cryptic abbreviations.
- Every function does **one** thing. If a block needs a comment to explain *what* it does, that block gets
  extracted or renamed.
- Always handle errors and edge cases: missing, empty or malformed data, duplicates, Unicode characters, huge
  inputs, missing optional fields. Never just the happy path.
- Every exported function has explicit input and output types. No inferred types on public boundaries.
- Code must stand on its own: no implicit knowledge required of the reader.

### 4.4 SOLID, in moderation

- **SRP** — one module, one responsibility.
- **OCP** — a behavior is extended without touching its callers, where a real use case calls for it.
- **LSP** — implementations of an interface are interchangeable: tests written against the in-memory fake stay
  valid against the real implementation.
- **ISP** — an interface exposes only what its callers need. It is not a generic proxy over a library.
- **DIP** — the domain depends on abstractions; only the adapter depends on the details of the external library.

Do not force the principles for formal completeness: apply them where they bring a real benefit.

## 5. Architecture

### 5.1 Layers and dependency rule

<!-- TODO(template): the layers, from top to bottom, with the role and the folder of each. -->

Dependencies point **in one direction only, downwards**. A layer does not know who calls it.
Every forbidden direction is also written in `LAYER_RULES` in `scripts/check-invariants.ts`, so that
`deno task verify` checks it instead of the writer's memory.

- A critical external library is imported from a single layer, its adapter. Its types and quirks are normalized
  in there and do not cross its boundary (§7).
- Concrete implementations are built once, in the composition root, and injected.

### 5.2 Structure

<!-- TODO(template): the src/ tree, with a comment for each file or folder. -->

```
tests/                   # mirror of src/, one file per tested module
```

Structural constraints:

- **No barrel files** `index.ts` / `mod.ts` that re-export. Always import from the file directly.
- No catch-all `utils.ts`. One file per semantic area, with a name that says what it contains.

### 5.3 Error model

A single domain error type, with a code from a closed union of strings:

<!-- TODO(template): the list of error codes. -->

- Expected errors are modeled; generic exceptions are not used for control flow.
- The message exposed to the outside is **sanitized**: no secrets, no stack traces, no details of internal
  services, no user data.
- The stack trace is logged server-side only if it contains no secrets.
- **No exception may bring the process down.** Every handler has a barrier; unhandled rejections are logged, not
  fatal.

## 6. TypeScript and Deno

- **`any` is forbidden.** For untyped data: `unknown` plus a type guard or explicit parsing.
  The only tolerated exception is at the boundary with a library with incomplete types (§7): it is isolated on a
  single line, with a cast justified by a comment, and does not spread beyond the adapter.
- No `@ts-ignore`. `@ts-expect-error` only with a comment that explains why it is needed.
- `type` for unions, intersections and data shapes; `interface` only for contracts meant to be implemented.
- No `enum`: string unions or `as const` objects.
- `import type { ... }` when you import only types.
- Explicit imports with the `.ts` extension for local files; `npm:` and `jsr:` specifiers pinned and declared in
  `deno.json` under `imports`, instead of repeated inline in the files.
- **Named exports, never `export default`.**
- `readonly` on configuration parameters and on structures that must not change. Pure functions take a value and
  return a new one, they do not mutate the input.
- Minimal, explicit Deno permissions in tasks. Never `-A`.

## 7. Critical dependencies

A poorly documented or unstable external library is confined to its adapter (§5.1) and described here: the API
surface **verified** against its `.d.ts` files and its sources, and the traps already discovered. Do not invent
signatures: if you need something that is not here, open the package and verify before writing.

<!-- TODO(template): for each critical dependency: pinned version, validated imports, usable methods with their
real signatures, verified traps (surprising return values, stub methods, destructive methods not to call),
mandatory initialization sequences. If the project has none, write "None" and keep the section: other sections
cite it. -->

## 8. Security

### 8.1 Boundaries and input

Every external input — request, argument, file, environment variable — is validated **once, at the boundary**,
in a dedicated module, and produces a value that is already safe. Inner layers receive only validated values.

- Paths: traversal (`../`, `..\`, encoded too), absolute paths, null bytes and control characters are rejected;
  separators and Unicode (NFC) are normalized. Every rejected case has its own test.
- Authentication, if any: mandatory on every endpoint not declared public, with tokens compared **in constant
  time**. A `===` on a token is a defect, not a matter of style.
- Explicit limits on the size of the input and of the result, and a timeout on every network call.

<!-- TODO(template): the real boundaries of the project and what is validated on each. -->

### 8.2 Secrets and configuration

- All secrets come from environment variables, validated once at startup.
  Missing or inconsistent configuration → immediate, loud failure, never a silent default.
- Conservative defaults: without explicit configuration the system does less, not more.
- `.env.example` contains placeholders only. Never a real value, never a fragment of a credential.

### 8.3 Logging

What gets logged: operation, timestamp, outcome, duration, sanitized identifiers, error code.

Never logged, by default: user data, credentials, tokens, URLs with credentials, request bodies, authorization
headers.

The logger is a dedicated module with structured output. No scattered `console.log`, and lint enforces it: a
`console.log` of a domain object is the shortest path for user data to end up in the logs.

## 9. Testing

Test the deterministic parts and the dangerous ones. Test the rest if the test adds information.

Mandatory coverage:

- input validation at the boundary, including malformed and hostile inputs
- every invariant in §4.1

<!-- TODO(template): the areas of the project that require a test for every case. -->

Rules:

- External dependencies sit behind an interface with an in-memory fake: the domain is tested in full without
  real services.
- **Tests do not access the network.** The test command has at most `--allow-env`, and `deno task invariants`
  checks it: a test cannot reach a real service, not even by mistake.
- A test describes an observable behavior, not the implementation. The test's name says what it guarantees.
- Every fixed bug comes with the test that would have caught it.

## 10. Naming

| What                    | Convention                             | Example                    |
| ----------------------- | -------------------------------------- | -------------------------- |
| Module file             | kebab-case                             | `parse-config.ts`          |
| File exporting a class  | PascalCase, like the class             | `OrderService.ts`          |
| Test file               | kebab-case + `_test.ts`                | `paths_test.ts`            |
| Classes and types       | PascalCase, no `I` prefix              | `OrderRepository`, `Order` |
| Functions and variables | camelCase                              | `normalizePath`            |
| Module constants        | UPPER_SNAKE_CASE                       | `MAX_REQUEST_SIZE`         |
| Env vars                | UPPER_SNAKE_CASE                       | `AUTH_TOKEN`               |
| Booleans                | `is` / `has` / `can` / `should` prefix | `isWritable`, `hasSection` |

## 11. Language

- **Code in English**: identifiers, types, file names, error codes, commit messages.
- **Comments in English**, only where needed, strictly concise. A comment explains the **why** of a non-obvious
  choice, an external constraint or a workaround. Never the *what*: the code says that.
  The places that deserve a comment are the traps of dependencies (§7) and security decisions.
  No decorative blocks, section banners or JSDoc that restates the signature.
- Project documentation (`README.md`, this file) in English.

## 12. Development cycle and Git

### Cycle of a change

1. User: asks for the change. Claude: if it is not trivial, proposes the plan and waits for the go-ahead.
2. Claude: writes code and tests. The Stop hook runs `deno task verify` at the end of the turn.
3. Claude: with `verify` green, runs `/review` and shows the report.
4. User: approves the commit. Claude: commits.
5. Claude: runs `git fetch origin` and
   `codex review -c project_doc_max_bytes=65536 -c model_reasoning_effort=xhigh --base origin/develop`,
   and shows the full output.
6. Claude: for each P0/P1 finding, writes the test that reproduces it and then the fix, or explains why it would
   reject it; the user decides. If the code changes, new commit and back to step 5: an outcome holds only for
   the SHA it saw.
7. Claude: with the user's go-ahead, push and PR to `develop`, with the **Review** section filled in.
8. User: with CI green, merges.

The step 5 command is fixed, with no additional instructions: whoever wrote the code does not choose what the
reviewer looks at. The two `-c` are not instructions: the first makes Codex read this file in full (Code Review
Rules), the second pins the effort, which without local configuration would be the model's default, even `low`.
The model stays the default of the installed CLI: a name written here would go stale. The base is
`origin/develop` because the local `develop` falls behind after every merge done on GitHub, and the review would
include code from other PRs.

### Rules

- Branch: `feat/<number>-<short-description>` or `fix/<number>-<short-description>`, where the number is
  sequential and matches the PR's: `feat/5-startup-config`.
- PR title: `<number> - <description in English>`, with the same number as the branch:
  `5 - Startup configuration validation`. No Conventional Commits prefix in the title:
  that lives in the commit messages.
- Flow: branch → PR to `develop` → PR `develop` → `main`. No direct push to `develop` or `main`:
  every change goes through a PR, so CI and the independent review see it before the merge.
- The PR body has a **Review** section: the SHA of the last review, the model and effort that ran it, its full
  output and the outcome of every P0/P1 finding raised during the cycle. An accepted finding is closed with the
  test that reproduces it and then the fix; a rejected one, with the reason. The template is in
  `.github/pull_request_template.md`.
- A PR is merged only with CI green and every P0/P1 finding closed in the **Review** section. GitHub does not
  enforce it: this rule is the gate.
- Commit messages in English, Conventional Commits: `feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `test:`, `chore:`.
- One commit is one coherent change. No avalanche commits mixing refactoring and features.
- **Do not commit, push or open PRs unless explicitly asked.** Prepare the work in the working tree and stop.
- Never commit `.env`, credentials or dumps of real data.
- **No AI attribution trailers, ever**, in commit messages or PR bodies.

## 13. Anti-patterns — grounds for rejection in review

- Any path that can delete, truncate or overwrite user data without the operation asking for it.
- A critical library imported outside its adapter, or one of its types crossing that boundary (§5.1, §7).
- `any`, `@ts-ignore`, or a cast at a library boundary without a comment.
- External input used without going through boundary validation (§8.1).
- Comparing a token with `===`.
- User data, secrets or credentials in a log or an error message.
- Domain logic in the transport layer, or library details in the domain.
- Premature abstractions, barrel files, `utils.ts` as a dumping ground, empty folders.
- Out-of-scope features added "while I'm at it" (§1).
- Declaring work "done" without having run `deno task verify`.

<!-- TODO(template): the project-specific anti-patterns. -->
