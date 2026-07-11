"use client";

import { useState } from "react";

interface TestResult {
  test_id?: string;
  recipient?: string;
  status?: string;
  provider?: string | null;
  provider_message_id?: string | null;
  error?: string | null;
}

/** Sends a real transactional test email through the outbox (admin only). */
export default function EmailTestButton() {
  const [recipient, setRecipient] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipient ? { recipient } : {}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Test failed.");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-gold/20 rounded p-4 space-y-3 max-w-xl">
      <label htmlFor="et-recipient" className="block text-[11px] tracking-[0.2em] uppercase text-gray-500">
        Recipient (optional — defaults to configured test recipient or your admin email)
      </label>
      <input
        id="et-recipient"
        type="email"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="admin@sevenfc.net"
        className="w-full bg-night border border-gold/25 rounded px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none"
      />
      <button
        onClick={run}
        disabled={busy}
        className="border border-gold/60 text-gold-2 text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded hover:bg-gold/10 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send test email"}
      </button>
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      {result && (
        <dl className="text-sm text-gray-300 space-y-1" role="status">
          <div><dt className="inline text-gray-500">Status: </dt><dd className="inline font-bold text-gold-2">{result.status}</dd></div>
          <div><dt className="inline text-gray-500">Recipient: </dt><dd className="inline">{result.recipient}</dd></div>
          <div><dt className="inline text-gray-500">Provider: </dt><dd className="inline">{result.provider ?? "—"}</dd></div>
          <div><dt className="inline text-gray-500">Message ID: </dt><dd className="inline break-all">{result.provider_message_id ?? "—"}</dd></div>
          {result.error && <div><dt className="inline text-gray-500">Error: </dt><dd className="inline text-amber-300">{result.error}</dd></div>}
        </dl>
      )}
    </div>
  );
}
