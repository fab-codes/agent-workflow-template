import { assertEquals, assertStringIncludes } from "@std/assert";
import { keepEnd } from "../../.claude/hooks/verify.ts";

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
