import Link from "next/link";
import type { SiteSettings } from "@/lib/site-settings";

/** Site footer. Content is editable from /admin/settings (site_settings key "footer"). */
export default function Footer({
  footer,
  logoText,
}: {
  footer: SiteSettings["footer"];
  logoText: string;
}) {
  return (
    <footer className="border-t border-yt-border">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-glow text-lg font-extrabold tracking-tight text-white">{logoText}</p>
            <p className="mt-2 text-sm text-yt-muted">Watch, share and discover videos.</p>
          </div>
          {footer.columns.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-sm font-semibold">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={`${l.label}-${l.href}`}>
                    <Link href={l.href} className="text-sm text-yt-muted hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-yt-border pt-4">
          <p className="text-xs text-yt-muted">{footer.bottomText}</p>
        </div>
      </div>
    </footer>
  );
}
