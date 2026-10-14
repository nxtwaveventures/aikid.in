import { describe, expect, it } from "vitest";
import { advance, startAdd, startJoin, type Step } from "@/lib/bookclub/flow";

const go = (s: Step, ...inputs: Parameters<typeof advance>[1][]) =>
  inputs.reduce<Step>((step, input) => advance(step.session!, input), s);

describe("join", () => {
  it("asks name, flat, child (skippable), then phone via contact", () => {
    const s = go(startJoin("42"), { kind: "text", text: "Riya Sharma" }, { kind: "text", text: "1204" }, { kind: "skip" });
    expect(s.ask?.contact).toBe(true);
    const done = advance(s.session!, { kind: "contact", phone: "+919800000000" });
    expect(done.session).toBeNull();
    expect(done.done).toEqual({ flow: "join", draft: { name: "Riya Sharma", flat: "1204", childName: "", phone: "+919800000000" } });
  });

  it("re-asks on empty or too-long text without moving on", () => {
    const s = startJoin("42");
    const bad = advance(s.session!, { kind: "text", text: "   " });
    expect(bad.error).toBeTruthy();
    expect(bad.session?.step).toBe("name");
    expect(advance(s.session!, { kind: "text", text: "x".repeat(121) }).session?.step).toBe("name");
  });

  it("only accepts a contact at the phone step", () => {
    const s = go(startJoin("42"), { kind: "text", text: "Riya" }, { kind: "text", text: "1204" }, { kind: "text", text: "Aarav" });
    expect(advance(s.session!, { kind: "text", text: "98000" }).session?.step).toBe("phone");
  });
});

describe("add", () => {
  it("asks title, author, condition (options), photo (skippable)", () => {
    const s = go(startAdd("42"), { kind: "text", text: "Wonder" }, { kind: "text", text: "R.J. Palacio" });
    expect(s.ask?.options).toEqual(["Like new", "Good", "Well-loved"]);
    const bad = advance(s.session!, { kind: "text", text: "Amazing" });
    expect(bad.session?.step).toBe("condition");
    const photo = go(s, { kind: "text", text: "Good" });
    expect(photo.ask?.skippable).toBe(true);
    const done = advance(photo.session!, { kind: "photo", fileId: "AgAC123" });
    expect(done.done).toEqual({ flow: "add", draft: { title: "Wonder", author: "R.J. Palacio", condition: "Good", photoFileId: "AgAC123" } });
  });

  it("skipping the photo finishes with an empty photo", () => {
    const s = go(startAdd("42"), { kind: "text", text: "Holes" }, { kind: "text", text: "Louis Sachar" }, { kind: "text", text: "Good" });
    expect(advance(s.session!, { kind: "skip" }).done?.draft.photoFileId).toBe("");
  });

  it("rejects skip on a step that isn't skippable", () => {
    expect(advance(startAdd("42").session!, { kind: "skip" }).session?.step).toBe("title");
  });
});

describe("recovery from a stale session", () => {
  it("restarts the flow when the stored step is unknown", () => {
    const s = advance({ telegramId: "42", flow: "add", step: "bogus", draft: { title: "x" } }, { kind: "text", text: "Wonder" });
    expect(s.session?.step).toBe("title");
    expect(s.session?.draft).toEqual({});
    expect(s.error).toBeTruthy();
  });

  it("ends the conversation when the stored flow is unknown", () => {
    const s = advance({ telegramId: "42", flow: "nope" as never, step: "x", draft: {} }, { kind: "skip" });
    expect(s.session).toBeNull();
    expect(s.error).toBeTruthy();
  });
});
