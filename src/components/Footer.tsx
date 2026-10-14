import Star from "@/components/Star";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-night py-14 pb-28 text-paper/60 md:pb-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm sm:flex-row sm:px-6">
        <p className="hover-wiggle flex items-center gap-2 font-display text-lg text-paper">
          <Star className="wiggle-target h-5 w-5 text-saffron" /> Story Lab
        </p>
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <p className="flex flex-wrap justify-center gap-x-5 gap-y-1 font-bold text-paper/80">
            {site.instagram && (
              <a href={`https://www.instagram.com/${site.instagram}/`} target="_blank" rel="noopener" className="hover:text-saffron">
                📸 @{site.instagram}
              </a>
            )}
            <a href={site.forms.hiring} target="_blank" rel="noopener" className="hover:text-saffron">
              🎙️ We&apos;re hiring storytellers
            </a>
            <a href={site.forms.survey} target="_blank" rel="noopener" className="hover:text-saffron">
              📋 Parents: 2-minute survey
            </a>
          </p>
          <p>© 2026 Story Lab · Women-founded by Neha &amp; Anamika · Made for curious kids.</p>
        </div>
      </div>
    </footer>
  );
}
