import { describe, expect, it } from "vitest";
import { isActive } from "@/lib/pages";

describe("isActive", () => {
  it("matches home only on /", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/parties", "/")).toBe(false);
  });
  it("matches a page and its subpaths", () => {
    expect(isActive("/about", "/about")).toBe(true);
    expect(isActive("/about/team", "/about")).toBe(true);
    expect(isActive("/aboutx", "/about")).toBe(false);
  });
});
