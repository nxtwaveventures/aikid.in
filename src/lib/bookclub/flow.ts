// The two multi-step chats — joining and adding a book — as a pure step machine.
import type { Flow, Session } from "@/lib/bookclub/types";

export const CONDITIONS = ["Like new", "Good", "Well-loved"];

export type Input =
  | { kind: "text"; text: string }
  | { kind: "contact"; phone: string }
  | { kind: "photo"; fileId: string }
  | { kind: "skip" };
export type Ask = { text: string; options?: string[]; contact?: boolean; skippable?: boolean };
export type Step = { session: Session | null; ask?: Ask; error?: string; done?: { flow: Flow; draft: Record<string, string> } };

type Field = { key: string; ask: Ask; accept: "text" | "contact" | "photo"; max?: number; options?: string[] };

const flows: Record<Flow, Field[]> = {
  join: [
    { key: "name", accept: "text", max: 60, ask: { text: "Welcome to the Story Lab Book Club! 📚 What's your name? (parent's name)" } },
    { key: "flat", accept: "text", max: 20, ask: { text: "Your flat number?" } },
    { key: "childName", accept: "text", max: 40, ask: { text: "Your child's first name? (optional)", skippable: true } },
    { key: "phone", accept: "contact", ask: { text: "Last step — tap the button below to share your phone number.", contact: true } },
  ],
  add: [
    { key: "title", accept: "text", max: 120, ask: { text: "What's the book's title?" } },
    { key: "author", accept: "text", max: 80, ask: { text: "Who wrote it?" } },
    { key: "condition", accept: "text", options: CONDITIONS, ask: { text: "What condition is it in?", options: CONDITIONS } },
    { key: "photoFileId", accept: "photo", ask: { text: "Send a photo of the cover (or skip).", skippable: true } },
  ],
};

function at(flow: Flow, draft: Record<string, string>, telegramId: string, i: number): Step {
  const fields = flows[flow];
  if (i >= fields.length) return { session: null, done: { flow, draft } };
  const f = fields[i];
  return { session: { telegramId, flow, step: f.key, draft }, ask: f.ask };
}

export const startJoin = (telegramId: string) => at("join", {}, telegramId, 0);
export const startAdd = (telegramId: string) => at("add", {}, telegramId, 0);

export function advance(session: Session, input: Input): Step {
  const fields = flows[session.flow];
  if (!fields) return { session: null, error: "Sorry, something got mixed up — please start again." };
  const i = fields.findIndex((f) => f.key === session.step);
  if (i < 0) return { ...at(session.flow, {}, session.telegramId, 0), error: "Let's start again." };
  const f = fields[i];
  const again = (error: string): Step => ({ session, ask: f.ask, error });

  let value: string;
  if (input.kind === "skip") {
    if (!f.ask.skippable) return again("This one is needed — please answer.");
    value = "";
  } else if (f.accept === "contact") {
    if (input.kind !== "contact") return again("Please use the “Share my phone number” button.");
    value = input.phone;
  } else if (f.accept === "photo") {
    if (input.kind !== "photo") return again("Please send a photo, or tap Skip.");
    value = input.fileId;
  } else {
    if (input.kind !== "text") return again("Please type your answer.");
    value = input.text.trim().replace(/\s+/g, " ");
    if (!value) return again("Please type your answer.");
    if (f.max && value.length > f.max) return again(`That's a bit long — please keep it under ${f.max} characters.`);
    if (f.options && !f.options.includes(value)) return again("Please pick one of the buttons.");
  }
  return at(session.flow, { ...session.draft, [f.key]: value }, session.telegramId, i + 1);
}
