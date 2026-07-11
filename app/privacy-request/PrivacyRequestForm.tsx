"use client";

import { useState, type FormEvent } from "react";
import TurnstileWidget from "@/components/public/TurnstileWidget";

const TYPES = [
  ["access", "Access — what information do you hold about me?"],
  ["correction", "Correction — fix inaccurate information"],
  ["export", "Export — a copy of my data (JSON)"],
  ["deletion", "Deletion — delete my personal information"],
  ["wall_removal", "Remove my public Global 7 Wall entry"],
  ["consent_withdrawal", "Withdraw public-display consent"],
  ["marketing_opt_out", "Opt out of news and updates"],
  ["other", "Other privacy concern"],
] as const;

const inputCls =
  "w-full bg-night border border-gold/25 rounded px-3 py-3 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none";
const labelCls = "block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5";

export default function PrivacyRequestForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/privacy-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setDone(json.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="glass-card p-8 md:p-10 text-center border-gold/60" role="status">
        <p className="font-display text-xl gold-text font-bold">Request recorded</p>
        <p className="text-sm text-gray-300 mt-4 leading-relaxed">{done}</p>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="glass-card p-6 md:p-10 space-y-4" noValidate>
      <div>
        <label htmlFor="pr-email" className={labelCls}>Your email *</label>
        <input id="pr-email" name="email" type="email" required maxLength={200} className={inputCls} placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <label htmlFor="pr-type" className={labelCls}>Request type *</label>
        <select id="pr-type" name="request_type" required defaultValue="access" className={inputCls}>
          {TYPES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="pr-details" className={labelCls}>Details (optional)</label>
        <textarea id="pr-details" name="details" rows={4} maxLength={2000} className={inputCls} placeholder="Anything that helps us handle your request" />
      </div>
      {/* Honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <TurnstileWidget action="privacy_request" />
      {error && <p className="text-center text-sm text-red-400" role="alert">{error}</p>}
      <div className="text-center pt-2">
        <button type="submit" disabled={busy} className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-10 py-4 rounded disabled:opacity-50 w-full md:w-auto">
          {busy ? "Submitting…" : "Submit privacy request"}
        </button>
      </div>
    </form>
  );
}
