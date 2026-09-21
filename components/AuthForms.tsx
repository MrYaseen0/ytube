"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { PlayBadgeIcon, CheckIcon } from "./icons";

const FEATURES = [
  "Upload videos with instant worldwide playback",
  "Grow your audience with subscriptions & comments",
  "Track every view with real-time analytics",
];

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl items-stretch overflow-hidden rounded-2xl border border-yt-border bg-yt-surface shadow-neon">
      {/* Branded panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#23060c] via-[#5c0f1c] to-[#a31621] p-10 md:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-yt-pink/30 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-yt-red/40 blur-[100px]"
        />
        <div className="relative flex items-center gap-2">
          <PlayBadgeIcon className="h-10 w-10 drop-shadow-[0_0_12px_rgba(255,77,109,0.8)]" />
          <span className="text-glow text-3xl font-extrabold tracking-tight text-white">YTUBE</span>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-tight text-white">
            Your stage.
            <br />
            <span className="text-glow-sm text-yt-pink">Your audience.</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
            Upload, watch and share videos on the platform built for creators.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {FEATURES.map((f, i) => (
              <li
                key={f}
                className="animate-fade-up flex items-center gap-3 text-sm text-white/85"
                style={{ animationDelay: `${120 + i * 80}ms` }}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yt-pink/20 text-yt-pink shadow-neon-sm">
                  <CheckIcon className="h-4 w-4" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">© 2026 YTUBE — broadcast yourself.</p>
      </div>

      {/* Form side */}
      <div className="flex w-full flex-col justify-center p-8 md:w-1/2 md:p-12">
        <div className="mb-6 flex items-center gap-2 md:hidden">
          <PlayBadgeIcon className="h-8 w-8 drop-shadow-[0_0_12px_rgba(255,77,109,0.8)]" />
          <span className="text-glow text-2xl font-extrabold tracking-tight text-white">YTUBE</span>
        </div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-yt-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-yt-border bg-yt-bg/70 px-4 py-3 text-sm outline-none transition-all placeholder:text-yt-muted focus:border-yt-pink focus:shadow-neon-sm"
    />
  );
}

function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="rounded-xl bg-gradient-to-r from-yt-red to-yt-pink py-3 text-sm font-bold text-white shadow-neon transition-shadow hover:shadow-neon-lg disabled:opacity-50 disabled:shadow-none"
    >
      {busy ? "Please wait..." : children}
    </button>
  );
}

export function SignInForm({ next, demo }: { next?: string; demo?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (demo) {
      setError("Demo mode — connect Supabase to enable sign-in.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push(next || "/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your YTUBE channel to continue.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-yt-rose">{error}</p>}
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-yt-muted">
        New to YTUBE?{" "}
        <Link href="/signup" className="font-semibold text-yt-pink hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function SignUpForm({ demo }: { demo?: boolean }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (demo) {
      setError("Demo mode — connect Supabase to enable sign-up.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setMessage("Account created! Check your email for a confirmation link, then sign in.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your channel" subtitle="Join YTUBE and start uploading in seconds.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field required placeholder="Channel name" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Field type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          type="password"
          required
          minLength={6}
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-yt-rose">{error}</p>}
        {message && <p className="text-sm text-green-400">{message}</p>}
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-yt-muted">
        Already have an account?{" "}
        <Link href="/signin" className="font-semibold text-yt-pink hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
