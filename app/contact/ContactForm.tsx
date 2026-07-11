"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import TurnstileWidget from "@/components/public/TurnstileWidget";

const CATEGORIES = [
  ["general", "General inquiry"],
  ["media", "Media or partnership"],
  ["wall_support", "Global 7 Wall support"],
  ["technical", "Technical support"],
  ["kit", "Kit or affiliate question"],
  ["privacy", "Privacy request"],
  ["legal", "Legal, copyright, trademark, or IP"],
  ["security", "Security report"],
] as const;

const inputCls =
  "w-full bg-night border border-gold/25 rounded px-3 py-3 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none";
const labelCls = "block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5";

export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/contact", {
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

  if (done) {
    return (
      <div className="glass-card p-8 md:p-10 text-center border-gold/60" role="status">
        <p className="font-display text-xl md:text-2xl gold-text font-bold">
          Message received
        </p>
        <p className="text-sm text-gray-300 mt-4 leading-relaxed">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass-card p-6 md:p-10 space-y-4" noValidate>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="c-name" className={labelCls}>Name *</label>
          <input id="c-name" name="name" required maxLength={100} className={inputCls} placeholder="Your name" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="c-email" className={labelCls}>Email *</label>
          <input id="c-email" name="email" type="email" required maxLength={200} className={inputCls} placeholder="you@example.com" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="c-category" className={labelCls}>Category *</label>
          <select id="c-category" name="category" required defaultValue="general" className={inputCls}>
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="c-subject" className={labelCls}>Subject *</label>
          <input id="c-subject" name="subject" required maxLength={150} className={inputCls} placeholder="Subject" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="c-message" className={labelCls}>Message *</label>
          <textarea id="c-message" name="message" required rows={6} maxLength={4000} className={inputCls} placeholder="How can we help?" />
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs text-gray-300">
        <input type="checkbox" name="terms_accepted" value="1" required className="accent-[#d4af5e] mt-0.5" />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-gold-2 underline underline-offset-2" target="_blank">Terms of Use</Link>{" "}
          and acknowledge the{" "}
          <Link href="/privacy" className="text-gold-2 underline underline-offset-2" target="_blank">Privacy Policy</Link>. *
        </span>
      </label>
      {/* Honeypot — humans never see or fill this */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <TurnstileWidget />
      {error && (
        <p className="text-center text-sm text-red-400" role="alert">{error}</p>
      )}
      <div className="text-center pt-2">
        <button
          type="submit"
          disabled={busy}
          className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-10 py-4 rounded disabled:opacity-50 w-full md:w-auto"
        >
          {busy ? "Sending…" : "Send Message"}
        </button>
      </div>
    </form>
  );
}
