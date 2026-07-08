"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [setup, setSetup] = useState<{
    setup_mode: boolean;
    temp_email: string | null;
    temp_password: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then(setSetup)
      .catch(() => {});
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed.");
      router.push(json.is_temporary ? "/admin/settings/security" : "/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-night flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-display font-black gold-text text-3xl">7FC</p>
          <p className="text-xs tracking-[0.3em] uppercase text-gray-500 mt-1">
            Admin Access
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="bg-navy/60 border border-gold/15 rounded-lg p-6 space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-[11px] uppercase tracking-wider text-gold-2 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-night border border-gray-700 rounded px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[11px] uppercase tracking-wider text-gold-2 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-night border border-gray-700 rounded px-3 py-2.5 text-sm text-white focus:border-gold focus:outline-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 text-center" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gold/90 hover:bg-gold text-night font-bold text-sm uppercase tracking-wider py-2.5 rounded transition-colors disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
          {setup?.setup_mode && (
            <button
              type="button"
              onClick={() => {
                setEmail(setup.temp_email ?? "");
                setPassword(setup.temp_password ?? "");
              }}
              className="w-full border border-electric/50 text-electric text-xs py-2 rounded hover:bg-electric/10 transition-colors"
            >
              Fill Temporary Admin Login
            </button>
          )}
        </form>
        {setup?.setup_mode && (
          <p className="text-[11px] text-yellow-500/80 text-center mt-4">
            Setup mode is active. Sign in and change your credentials to
            disable the temporary login.
          </p>
        )}
      </div>
    </div>
  );
}
