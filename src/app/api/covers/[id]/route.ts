import * as store from "@/lib/bookclub/store";

const notFound = () => new Response(null, { status: 404 });
const timeout = () => AbortSignal.timeout(8000);

// Streams a listed book's cover photo from Telegram so the bot token never reaches the browser.
export async function GET(_req: Request, ctx: RouteContext<"/api/covers/[id]">) {
  const { id } = await ctx.params;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return notFound();

  try {
    const { books } = await store.readAll();
    const book = books.find((b) => b.id === id && b.status === "listed" && b.photoFileId);
    if (!book) return notFound();

    const info = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(book.photoFileId)}`, { signal: timeout() }).then((r) => r.json());
    const path = info.ok && info.result?.file_path;
    if (!path) return notFound();
    const img = await fetch(`https://api.telegram.org/file/bot${token}/${path}`, { signal: timeout() });
    if (!img.ok) return notFound();

    // Short s-maxage so an unlisted book's cover stops being served within an hour.
    return new Response(img.body, {
      headers: { "Content-Type": img.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=3600" },
    });
  } catch {
    return notFound();
  }
}
