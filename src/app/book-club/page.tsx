import type { Metadata } from "next";
import GreatReads from "@/components/GreatReads";
import Shelf from "@/components/Shelf";
import { Bullets, Button, Facts, Page, Section, Steps } from "@/components/ui";
import { bookClubRules, bookClubSteps } from "@/lib/content";
import { getShelf } from "@/lib/bookclub/shelf";
import { site } from "@/lib/site";

const { bookClub } = site;

export const metadata: Metadata = {
  title: "Book Club 10+",
  description: `Novels shared between families for readers aged 10+. Borrow for ₹${bookClub.price} a week; owners earn ₹${bookClub.ownerShare} every time.`,
};

const join = bookClub.telegramBot
  ? { href: `https://t.me/${bookClub.telegramBot}`, label: "Join on Telegram" }
  : { href: `https://ig.me/m/${site.instagram}`, label: "Message us to join" };

export default async function BookClubPage() {
  const books = bookClub.telegramBot ? await getShelf() : [];
  return (
    <Page
      title="Book Club 10+"
      lead="A novel-sharing circle for readers aged 10 and up. Families share novels their kids have finished, and other kids borrow them for a week."
    >
      <div className="mt-10">
        <Facts items={[["Borrow", `₹${bookClub.price} / week`], ["Owners earn", `₹${bookClub.ownerShare} each time`], ["Ages", bookClub.ages]]} />
      </div>

      {bookClub.telegramBot && (
        <Section id="shelf" title="On the shelf">
          {books.length > 0 ? (
            <Shelf books={books} bot={bookClub.telegramBot} />
          ) : (
            <p className="text-ink-soft">The shelf is being stocked — be the first to share a novel.</p>
          )}
        </Section>
      )}

      <Section id="great-reads" title="Books we hope to share">
        <p className="mb-6 text-ink-soft">
          Favourites many homes already have. One copy, read again and again — have one of these on your shelf? Share it.
        </p>
        <GreatReads />
      </Section>

      <Section title="How it works">
        <Steps items={bookClubSteps} />
      </Section>

      <Section title="Good to know">
        <Bullets items={bookClubRules} />
      </Section>

      <Section id="join" title={`Starting in ${bookClub.societies.join(", ")}`}>
        <p className="text-ink-soft">
          {bookClub.telegramBot
            ? "Join on Telegram to see the shelf, add your books and borrow."
            : "We're opening the shelf soon. Message us to join or to share your first novel — and tell us if you'd like the Book Club in your society."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={join.href}>{join.label}</Button>
          {bookClub.telegramBot && <Button href={`https://t.me/${bookClub.telegramBot}?start=add`}>Add your book</Button>}
        </div>
      </Section>
    </Page>
  );
}
