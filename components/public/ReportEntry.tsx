"use client";

import { useState, type FormEvent } from "react";
import TurnstileWidget from "./TurnstileWidget";

const REASONS = [
  ["spam", "Spam"],
  ["harassment_or_hate", "Harassment or hate"],
  ["impersonation", "Impersonation"],
  ["private_information", "Someone's private information"],
  ["illegal_or_unsafe", "Illegal or unsafe content"],
  ["copyright_or_trademark", "Copyright or trademark issue"],
  ["other", "Other"],
] as const;

const inputCls =
  "w-full bg-night border border-gold/25 rounded px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none";

/** "Report this entry" — flags a public Wall entry for moderation review.
 *  Reporters are never publicly identified. */
export default function ReportEntry() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/wall/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          supporter_number: Number(String(data.supporter_number).replace(/^#/, "")),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setNote(json.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-sm font-bold tracking-[0.2em] uppercase text-gold-2 text-center">
        Report an Entry
      </h3>
      {note ? (
        <p className="text-xs text-gray-300 text-center mt-4" role="status">{note}</p>
      ) : !open ? (
        <>
          <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
            See something that breaks the{" "}
            <a href="/community-guidelines" className="text-gold-2 underline underline-offset-2">
              Community Guidelines
            </a>
            ? Flag it for review. Reports are confidential.
          </p>
          <div className="text-center mt-4">
            <button
              onClick={() => setOpen(true)}
              className="border border-gold/50 text-gold-2 text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded hover:bg-gold/10"
            >
              Report an entry
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="rp-number" className="block text-[10px] tracking-[0.2em] uppercase text-gold-2 mb-1">
              Supporter number (e.g. #0007) *
            </label>
            <input id="rp-number" name="supporter_number" required maxLength={10} className={inputCls} placeholder="#0007" inputMode="numeric" />
          </div>
          <div>
            <label htmlFor="rp-reason" className="block text-[10px] tracking-[0.2em] uppercase text-gold-2 mb-1">
              Reason *
            </label>
            <select id="rp-reason" name="reason" required defaultValue="" className={inputCls}>
              <option value="" disabled>Choose a reason</option>
              {REASONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rp-details" className="block text-[10px] tracking-[0.2em] uppercase text-gold-2 mb-1">
              Details (optional)
            </label>
            <textarea id="rp-details" name="details" rows={2} maxLength={1000} className={inputCls} />
          </div>
          <TurnstileWidget action="entry_report" />
          {error && <p className="text-xs text-red-400 text-center" role="alert">{error}</p>}
          <div className="text-center">
            <button type="submit" disabled={busy} className="border border-gold/50 text-gold-2 text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded hover:bg-gold/10 disabled:opacity-50">
              {busy ? "Sending…" : "Submit report"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
