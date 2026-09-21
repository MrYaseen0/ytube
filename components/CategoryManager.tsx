"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "@/lib/admin-actions";
import type { Category } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-yt-border bg-yt-bg px-3 py-2 text-sm outline-none transition-shadow placeholder:text-yt-muted focus:border-yt-pink focus:shadow-neon-sm";
const btnCls =
  "rounded-full bg-gradient-to-r from-yt-red to-yt-pink px-4 py-1.5 text-xs font-semibold text-white shadow-neon-sm hover:shadow-neon disabled:opacity-50";
const ghostCls = "rounded-full bg-yt-hover px-4 py-1.5 text-xs font-semibold hover:bg-yt-border";
const dangerCls = "rounded-full bg-red-800/60 px-4 py-1.5 text-xs font-semibold hover:bg-red-700/60";

interface Draft {
  name: string;
  slug: string;
  icon: string;
  color: string;
  sort_order: string;
}

const emptyDraft: Draft = { name: "", slug: "", icon: "", color: "", sort_order: "0" };

export default function CategoryManager({ initial }: { initial: Category[] }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function run(fn: () => Promise<void>, onOk?: () => void) {
    setBusy(true);
    setError("");
    try {
      await fn();
      onOk?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed.");
    }
    setBusy(false);
  }

  function toInput(d: Draft) {
    return {
      name: d.name.trim(),
      slug: d.slug.trim(),
      icon: d.icon.trim(),
      color: d.color.trim(),
      sort_order: parseInt(d.sort_order, 10) || 0,
    };
  }

  function startEdit(c: Category) {
    setEditing(c.id);
    setEditDraft({ name: c.name, slug: c.slug, icon: c.icon ?? "", color: c.color ?? "", sort_order: String(c.sort_order) });
    setError("");
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="rounded-lg bg-red-900/40 px-4 py-2 text-sm text-red-300">{error}</p>}

      {/* Add new */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => createCategory(toInput(draft)), () => setDraft(emptyDraft));
        }}
        className="rounded-xl bg-yt-surface p-5"
      >
        <h2 className="text-lg font-bold">Add category</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name *" required className={inputCls} maxLength={40} />
          <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="slug (auto)" className={inputCls} maxLength={40} />
          <input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} placeholder="Icon (emoji or text)" className={inputCls} maxLength={12} />
          <div className="flex gap-2">
            <input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="#ff4d6d" className={inputCls} maxLength={16} />
            {draft.color && <span className="h-9 w-9 shrink-0 rounded-full border border-yt-border" style={{ background: draft.color }} />}
          </div>
          <input value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} placeholder="Order" inputMode="numeric" className={inputCls} />
        </div>
        <button type="submit" disabled={busy} className={`${btnCls} mt-3 px-6 py-2 text-sm`}>
          {busy ? "Saving..." : "Add category"}
        </button>
      </form>

      {/* List */}
      <div className="overflow-x-auto rounded-xl bg-yt-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-yt-border text-yt-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Icon</th>
              <th className="px-4 py-3 font-medium">Color</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initial.map((c) =>
              editing === c.id ? (
                <tr key={c.id} className="border-b border-yt-border bg-yt-bg/50">
                  <td className="px-4 py-3"><input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className={inputCls} maxLength={40} /></td>
                  <td className="px-4 py-3"><input value={editDraft.slug} onChange={(e) => setEditDraft({ ...editDraft, slug: e.target.value })} className={inputCls} maxLength={40} /></td>
                  <td className="px-4 py-3"><input value={editDraft.icon} onChange={(e) => setEditDraft({ ...editDraft, icon: e.target.value })} className={inputCls} maxLength={12} /></td>
                  <td className="px-4 py-3"><input value={editDraft.color} onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })} className={inputCls} maxLength={16} /></td>
                  <td className="px-4 py-3"><input value={editDraft.sort_order} onChange={(e) => setEditDraft({ ...editDraft, sort_order: e.target.value })} inputMode="numeric" className={`${inputCls} w-20`} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button disabled={busy} onClick={() => run(() => updateCategory(c.id, toInput(editDraft)), () => setEditing(null))} className={btnCls}>
                        Save
                      </button>
                      <button onClick={() => setEditing(null)} className={ghostCls}>Cancel</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={c.id} className="border-b border-yt-border last:border-0">
                  <td className="px-4 py-3 font-semibold">{c.icon ? `${c.icon} ` : ""}{c.name}</td>
                  <td className="px-4 py-3 text-yt-muted">{c.slug}</td>
                  <td className="px-4 py-3 text-yt-muted">{c.icon ?? "-"}</td>
                  <td className="px-4 py-3">
                    {c.color ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border border-yt-border" style={{ background: c.color }} />
                        <span className="text-yt-muted">{c.color}</span>
                      </span>
                    ) : (
                      <span className="text-yt-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-yt-muted">{c.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className={ghostCls}>Edit</button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Delete the "${c.name}" category? Videos using it block deletion.`))
                            void run(() => deleteCategory(c.id));
                        }}
                        className={dangerCls}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-yt-muted">
        Renaming a category updates every video in it automatically (the database keeps them in sync). A category cannot be deleted while videos still use it.
      </p>
    </div>
  );
}
