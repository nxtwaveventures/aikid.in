import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

import { createBot } from "@/lib/bookclub/bot";

describe("createBot", () => {
  it("constructs without network access", () => {
    expect(() => createBot("123:abc")).not.toThrow();
  });
});
