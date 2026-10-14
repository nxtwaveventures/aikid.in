"use client";

import { useState } from "react";
import type { ShelfBook } from "@/lib/bookclub/shelf";

function Cover({ book }: { book: ShelfBook }) {
  if (book.hasPhoto) {
    // eslint-disable-next-line @next/next/no-img-element -- served by our own route, sizes vary
    return <img src={`/api/covers/${book.id}`} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" loading="lazy" />;
  }
  return <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-lavender p-4 text-center font-display text-lg">{book.title}</div>;
}

export default function Shelf({ books, bot }: { books: ShelfBook[]; bot: string }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = needle ? books.filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(needle)) : books;
  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title or author"
        aria-label="Search the shelf"
        className="w-full rounded-full border border-line bg-white px-5 py-3 outline-none focus:border-ink-soft"
      />
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {shown.map((b) => (
          <li key={b.id} className="flex flex-col">
            <Cover book={b} />
            <p className="mt-2 font-bold leading-snug">{b.title}</p>
            <p className="text-sm text-ink-soft">{b.author}</p>
            {b.available ? (
              <a href={`https://t.me/${bot}?start=borrow_${b.id}`} target="_blank" rel="noopener" className="mt-2 text-sm font-bold underline underline-offset-4">
                Borrow on Telegram
              </a>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Out now</p>
            )}
          </li>
        ))}
      </ul>
      {!shown.length && <p className="mt-6 text-ink-soft">No books match “{q}”.</p>}
    </div>
  );
}
