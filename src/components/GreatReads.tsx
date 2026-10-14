import { greatReads } from "@/lib/content";

export default function GreatReads() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {greatReads.map(({ title, author, cover }) => (
        <li key={title} className="flex flex-col">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- external cover, sizes vary
            <img
              src={`https://covers.openlibrary.org/b/id/${cover}-M.jpg`}
              alt=""
              loading="lazy"
              className="aspect-[2/3] w-full rounded-2xl bg-lavender object-cover"
            />
          ) : (
            <div className="flex aspect-[2/3] items-center justify-center rounded-2xl bg-lavender p-3 text-center font-display">{title}</div>
          )}
          <p className="mt-2 font-bold leading-snug">{title}</p>
          <p className="text-sm text-ink-soft">{author}</p>
        </li>
      ))}
    </ul>
  );
}
