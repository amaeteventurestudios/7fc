"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface VerifyResult {
  ok?: boolean;
  completed?: boolean;
  needs_deletion_confirmation?: boolean;
  message?: string;
  export?: unknown;
  error?: string;
}

function Inner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function confirm(confirmDeletion = false) {
    setBusy(true);
    try {
      const res = await fetch("/api/privacy-request/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, confirm_deletion: confirmDeletion }),
      });
      const json: VerifyResult = await res.json();
      setResult(json);
      if (json.export) {
        const blob = new Blob([JSON.stringify(json.export, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "7fc-personal-data.json";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setResult({ error: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card p-8 md:p-12 text-center">
      {!token ? (
        <p className="text-sm text-gray-300" role="alert">
          This verification link is incomplete. Please open the full link from
          your email.
        </p>
      ) : result?.needs_deletion_confirmation ? (
        <div role="status">
          <p className="text-sm text-gray-300">{result.message}</p>
          <p className="text-xs text-red-300 mt-4">
            This permanently deletes your personal information and removes any
            public Wall entry. It cannot be undone.
          </p>
          <button
            onClick={() => confirm(true)}
            disabled={busy}
            className="mt-6 border border-crimson/70 text-red-300 text-xs font-bold tracking-widest uppercase px-6 py-3 rounded hover:bg-crimson/20 disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Yes, permanently delete my data"}
          </button>
        </div>
      ) : result?.ok ? (
        <div role="status">
          <p className="font-display text-xl gold-text font-bold">
            {result.completed ? "Request completed" : "Request verified"}
          </p>
          <p className="text-sm text-gray-300 mt-4 leading-relaxed">{result.message}</p>
        </div>
      ) : result?.error ? (
        <p className="text-sm text-red-400" role="alert">{result.error}</p>
      ) : (
        <>
          <p className="text-sm text-gray-300">
            Click below to confirm that you made this privacy request. This
            link works once and expires 24 hours after it was sent.
          </p>
          <button
            onClick={() => confirm(false)}
            disabled={busy}
            className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-10 py-4 rounded disabled:opacity-50 mt-7"
          >
            {busy ? "Verifying…" : "Verify my request"}
          </button>
        </>
      )}
    </div>
  );
}

export default function PrivacyVerifyClient() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
