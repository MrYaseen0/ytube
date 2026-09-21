"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";
import type { SiteSettings } from "@/lib/site-settings";
import Avatar from "./Avatar";
import { MenuIcon, SearchIcon, UploadIcon, PlayBadgeIcon } from "./icons";

export default function Navbar({
  onMenuClick,
  header,
}: {
  onMenuClick: () => void;
  header: SiteSettings["header"];
}) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    let cancelled = false;

    async function loadProfile(userId: string) {
      const { data } = await supabase.from("profiles").select("username, is_admin").eq("id", userId).single();
      if (cancelled || !data) return;
      const p = data as { username: string; is_admin: boolean };
      setUsername(p.username);
      setIsAdmin(p.is_admin);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user);
      if (data.user) void loadProfile(data.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void loadProfile(session.user.id);
      else {
        setUsername("");
        setIsAdmin(false);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  // Escape closes the account menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query) router.push(`/results?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 bg-yt-bg px-3 md:gap-4 md:px-4">
      <button
        onClick={onMenuClick}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-yt-hover"
        aria-label="Toggle sidebar"
      >
        <MenuIcon />
      </button>
      <Link href="/" className="flex shrink-0 items-center gap-1.5">
        <PlayBadgeIcon />
        <span className="text-glow text-lg font-extrabold tracking-tight text-white">{header.logoText}</span>
      </Link>

      {(header.navLinks ?? []).length > 0 && (
        <nav className="hidden items-center gap-1 lg:flex">
          {header.navLinks.map((l) => (
            <Link
              key={`${l.label}-${l.href}`}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-yt-text/80 hover:bg-yt-hover hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}

      <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-xl flex-1 sm:flex">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="w-full rounded-l-full border border-yt-border bg-yt-bg px-4 py-2 text-sm outline-none transition-shadow placeholder:text-yt-muted focus:border-yt-pink focus:shadow-neon-sm"
        />
        <button
          type="submit"
          className="rounded-r-full border border-l-0 border-yt-border bg-yt-surface px-5 hover:bg-yt-hover"
          aria-label="Search"
        >
          <SearchIcon />
        </button>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 md:gap-2">
        {/* Mobile search icon -> results page */}
        <Link
          href="/results"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-yt-hover sm:hidden"
          aria-label="Search"
        >
          <SearchIcon className="h-6 w-6" />
        </Link>

        {configured ? (
          <>
            {isAdmin && (
              <Link
                href="/admin/videos"
                className="hidden items-center gap-1.5 rounded-full bg-yt-surface px-4 py-2 text-sm font-medium hover:bg-yt-hover sm:flex"
              >
                <UploadIcon className="h-5 w-5" />
                Upload
              </Link>
            )}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
                >
                  <Avatar name={username || user.email || "?"} size={32} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-50 w-52 overflow-hidden rounded-xl bg-yt-surface py-2 shadow-xl">
                      <div className="border-b border-yt-border px-4 py-2">
                        <p className="truncate text-sm font-semibold">{username || "Your channel"}</p>
                        <p className="truncate text-xs text-yt-muted">{user.email}</p>
                      </div>
                      <Link
                        href={`/channel/${user.id}`}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-yt-hover"
                      >
                        Your channel
                      </Link>
                      <Link
                        href="/history"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-yt-hover"
                      >
                        History
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-yt-hover"
                        >
                          Admin dashboard
                        </Link>
                      )}
                      <button
                        onClick={signOut}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-yt-hover"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/signin"
                className="rounded-full border border-yt-pink/60 px-4 py-1.5 text-sm font-semibold text-yt-pink shadow-neon-sm hover:bg-yt-pink/10"
              >
                Sign in
              </Link>
            )}
          </>
        ) : (
          <Link
            href="/setup"
            className="rounded-full bg-gradient-to-r from-yt-red to-yt-pink px-4 py-1.5 text-sm font-semibold text-white shadow-neon hover:shadow-neon-lg"
          >
            Connect Supabase
          </Link>
        )}
      </div>
    </header>
  );
}
