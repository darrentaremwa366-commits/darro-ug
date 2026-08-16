"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin/overview";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }

      router.push(data.redirect || from);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F5F2] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="font-signature text-5xl text-[var(--color-ember)] mb-3">
            Darro
          </div>
          <h1 className="font-heading text-xs uppercase tracking-[0.25em] text-[var(--color-ink)]">
            Admin Dashboard
          </h1>
        </div>

        <div className="bg-[var(--color-charcoal)] p-8 sm:p-10">
          <h2 className="font-heading text-sm uppercase tracking-[0.2em] text-white mb-8 text-center">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-sand)] mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="owner@darro.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--color-earth)] text-white px-4 py-3 font-body text-sm placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-ember)] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-sand)] mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent border border-[var(--color-earth)] text-white px-4 py-3 font-body text-sm placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-ember)] transition-colors"
              />
            </div>

            {error && (
              <div className="border border-[var(--color-ember)] bg-[var(--color-ember)]/10 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ember)]">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="button-style w-full bg-[var(--color-ember)] hover:bg-[#8a3326] text-white text-xs px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--color-earth)]/50">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-stone)] text-center leading-relaxed">
              Owner only
              <br />
              Private admin area
            </p>
          </div>
        </div>

        <p className="text-center mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
          &copy; 2026 Darro &mdash; All Rights Reserved
        </p>
      </div>
    </div>
  );
}
