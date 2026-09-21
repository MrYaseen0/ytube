"use client";

import { useState } from "react";
import { saveSiteSetting } from "@/lib/admin-actions";
import type { SiteSettings, NavLinkItem, FooterColumn } from "@/lib/site-settings";

const inputCls =
  "w-full rounded-lg border border-yt-border bg-yt-bg px-3 py-2 text-sm outline-none transition-shadow placeholder:text-yt-muted focus:border-yt-pink focus:shadow-neon-sm";
const btnCls =
  "rounded-full bg-gradient-to-r from-yt-red to-yt-pink px-5 py-2 text-sm font-semibold text-white shadow-neon hover:shadow-neon-lg disabled:opacity-50";
const ghostCls = "rounded-full bg-yt-surface px-3 py-1.5 text-xs font-semibold hover:bg-yt-hover";
const dangerCls = "rounded-full bg-red-800/60 px-3 py-1.5 text-xs font-semibold hover:bg-red-700/60";

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-yt-surface p-5 md:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-yt-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SaveNote({ section, busy, msg }: { section: string; busy: string | null; msg: { section: string; ok: boolean; text: string } | null }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      <SaveButton section={section} busy={busy} />
      {msg?.section === section && (
        <p className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}

function SaveButton({ section, busy }: { section: string; busy: string | null }) {
  return (
    <button type="submit" disabled={busy !== null} className={btnCls}>
      {busy === section ? "Saving..." : "Save changes"}
    </button>
  );
}

function LinkRows({ links, onChange }: { links: NavLinkItem[]; onChange: (l: NavLinkItem[]) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {links.map((l, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={l.label}
            onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
            placeholder="Label"
            className={inputCls}
          />
          <input
            value={l.href}
            onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))}
            placeholder="/path"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => onChange(links.filter((_, j) => j !== i))}
            className={dangerCls}
            aria-label="Remove link"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...links, { label: "", href: "/" }])} className={`${ghostCls} self-start`}>
        + Add link
      </button>
    </div>
  );
}

export default function SettingsEditor({ initial }: { initial: SiteSettings }) {
  const [header, setHeader] = useState(initial.header);
  const [footer, setFooter] = useState(initial.footer);
  const [home, setHome] = useState(initial.home);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ section: string; ok: boolean; text: string } | null>(null);

  async function save(section: "header" | "footer" | "home", value: unknown) {
    setBusy(section);
    setMsg(null);
    try {
      await saveSiteSetting(section, value);
      setMsg({ section, ok: true, text: "Saved. The live site updates immediately." });
    } catch (e) {
      setMsg({ section, ok: false, text: e instanceof Error ? e.message : "Save failed." });
    }
    setBusy(null);
  }

  function addColumn() {
    setFooter({ ...footer, columns: [...footer.columns, { title: "New column", links: [] }] });
  }

  function updateColumn(i: number, col: FooterColumn) {
    setFooter({ ...footer, columns: footer.columns.map((c, j) => (j === i ? col : c)) });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card title="Header" hint="Logo text and the navigation links shown next to it in the top bar.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save("header", header);
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Logo text</label>
            <input
              value={header.logoText}
              onChange={(e) => setHeader({ ...header, logoText: e.target.value })}
              className={`${inputCls} max-w-xs`}
              maxLength={24}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Nav links</label>
            <LinkRows links={header.navLinks} onChange={(navLinks) => setHeader({ ...header, navLinks })} />
          </div>
          <SaveNote section="header" busy={busy} msg={msg} />
        </form>
      </Card>

      {/* Footer */}
      <Card title="Footer" hint="Link columns at the bottom of every page, plus the bottom copyright line.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save("footer", footer);
          }}
          className="flex flex-col gap-4"
        >
          {footer.columns.map((col, i) => (
            <div key={i} className="rounded-lg border border-yt-border p-4">
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={col.title}
                  onChange={(e) => updateColumn(i, { ...col, title: e.target.value })}
                  placeholder="Column title"
                  className={`${inputCls} font-semibold`}
                />
                <button type="button" onClick={() => setFooter({ ...footer, columns: footer.columns.filter((_, j) => j !== i) })} className={dangerCls}>
                  Remove
                </button>
              </div>
              <LinkRows links={col.links} onChange={(links) => updateColumn(i, { ...col, links })} />
            </div>
          ))}
          <button type="button" onClick={addColumn} className={`${ghostCls} self-start`}>
            + Add column
          </button>
          <div>
            <label className="mb-1 block text-sm font-medium">Bottom text</label>
            <input
              value={footer.bottomText}
              onChange={(e) => setFooter({ ...footer, bottomText: e.target.value })}
              className={inputCls}
              maxLength={200}
            />
          </div>
          <SaveNote section="footer" busy={busy} msg={msg} />
        </form>
      </Card>

      {/* Homepage */}
      <Card title="Homepage copy" hint="The hero heading above the feed and the empty-state text when a category has no videos.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save("home", home);
          }}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">Hero title</label>
            <input value={home.heroTitle} onChange={(e) => setHome({ ...home, heroTitle: e.target.value })} className={inputCls} maxLength={80} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Hero subtitle</label>
            <input value={home.heroSubtitle} onChange={(e) => setHome({ ...home, heroSubtitle: e.target.value })} className={inputCls} maxLength={160} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Empty-state title</label>
            <input value={home.emptyTitle} onChange={(e) => setHome({ ...home, emptyTitle: e.target.value })} className={inputCls} maxLength={80} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Empty-state subtitle</label>
            <input value={home.emptySubtitle} onChange={(e) => setHome({ ...home, emptySubtitle: e.target.value })} className={inputCls} maxLength={160} />
          </div>
          <SaveNote section="home" busy={busy} msg={msg} />
        </form>
      </Card>
    </div>
  );
}
