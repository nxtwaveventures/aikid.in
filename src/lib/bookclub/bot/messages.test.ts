import { describe, expect, it } from "vitest";
import { paymentRequest } from "@/lib/bookclub/bot/messages";

describe("paymentRequest", () => {
  it("gives the UPI ID and the borrow id when UPI is set", () => {
    const text = paymentRequest("L007", 40, "storylab@upi");
    expect(text).toContain("storylab@upi");
    expect(text).toContain("L007");
    expect(text).toContain("₹40");
  });

  it("promises payment details instead of a blank UPI ID when UPI is paused", () => {
    const text = paymentRequest("L007", 40, "");
    expect(text).not.toMatch(/UPI to\s/);
    expect(text).toContain("payment details");
  });
});
