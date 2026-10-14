import { describe, expect, it } from "vitest";
import { legacyHashPath } from "@/lib/legacyHash";

describe("legacyHashPath", () => {
  it.each([
    ["#parties", "/parties"],
    ["#online", "/online"],
    ["#faq", "/faq"],
    ["#book", "/parties#book"],
    ["#founders", "/about#founders"],
    ["#reviews", "/about#reviews"],
    ["#ages", "/about#ages"],
    ["parties", "/parties"],
    ["#PARTIES", "/parties"],
  ])("%s → %s", (hash, path) => {
    expect(legacyHashPath(hash)).toBe(path);
  });

  it.each(["", "#", "#about", "#unknown", "#parties/../x", "#constructor", "#__proto__"])("%s stays on Home", (hash) => {
    expect(legacyHashPath(hash)).toBeNull();
  });
});
