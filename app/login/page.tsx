"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.19 7.19 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const urlError = params.get("error");
  const notice =
    urlError === "google-denied"
      ? "Google sign-in was cancelled."
      : urlError === "google-not-configured"
        ? "Google login is not configured on this server. Use email instead."
        : urlError === "google-failed"
          ? "Google sign-in failed. Try again or use email."
          : "";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({ error: "Login failed. Try again." }));
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.push(params.get("next") || "/ai-studio");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="text-lg font-semibold text-white">Welcome back</h1>
        <p className="mt-1 text-xs text-zinc-500">Sign in to continue to octa-studio.</p>

        {(error || notice) && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error || notice}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            window.location.href = `/api/auth/google${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`;
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-zinc-600">
          <span className="h-px flex-1 bg-zinc-800" />
          or
          <span className="h-px flex-1 bg-zinc-800" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-zinc-800 bg-[#0c0c0e] px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#7C3AED]"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-800 bg-[#0c0c0e] px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[#7C3AED]"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6D28D9] disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-500">
          No account?{" "}
          <Link href={`/signup${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`} className="font-medium text-violet-400 transition hover:text-violet-300">
            Sign up free
          </Link>
        </p>
      </div>

      <p className="mt-4 text-center">
        <Link href="/" className="text-xs text-zinc-600 transition hover:text-zinc-400">
          ← Back to homepage
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0c] px-4 py-10">
      <Link href="/" className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#a78bfa] text-lg font-bold text-white">
        C
      </Link>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
