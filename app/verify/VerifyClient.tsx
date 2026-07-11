"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CONTAINER } from "@/components/public/ui";

interface VerifyResult {
  ok?: boolean;
  already?: boolean;
  supporter_number?: number;
  status?: string;
  error?: string;
}

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch("/api/wall/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "Something went wrong. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${CONTAINER} py-16 md:py-24`}>
      <div className="glass-card max-w-xl mx-auto p-8 md:p-12 text-center">
        <h1 className="font-display text-2xl md:text-3xl font-bold gold-text">
          Confirm your email
        </h1>
        {!token ? (
          <p className="text-sm text-gray-300 mt-6" role="alert">
            This verification link is incomplete. Please open the full link
            from your email, or request a new one from the signup form.
          </p>
        ) : result?.ok ? (
          <div role="status">
            <p className="text-sm text-gray-300 mt-6">
              {result.already
                ? "Your email was already verified."
                : "Your email is verified. Welcome to 7FC!"}
            </p>
            {result.supporter_number ? (
              <p className="font-display text-3xl text-white mt-4 font-black">
                Supporter #{String(result.supporter_number).padStart(4, "0")}
              </p>
            ) : null}
            <p className="text-xs text-gray-400 mt-4">
              {result.status === "pending_moderation" || result.status === "pending"
                ? "Your entry is now in moderation review and will appear on the Global 7 Wall once approved. A welcome email is on its way."
                : "Your entry is live on the Global 7 Wall. A welcome email is on its way."}
            </p>
            <Link
              href="/wall"
              className="cta-gold-glow inline-block mt-7 border border-gold/60 text-gold-2 font-semibold tracking-widest uppercase text-sm px-8 py-3 rounded"
            >
              View the Global 7 Wall
            </Link>
          </div>
        ) : result?.error ? (
          <div role="alert">
            <p className="text-sm text-red-400 mt-6">{result.error}</p>
            <Link
              href="/wall#wall"
              className="inline-block mt-6 text-xs tracking-[0.2em] uppercase text-gold-2 underline underline-offset-4"
            >
              Back to signup
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-300 mt-6">
              Click the button below to confirm your email address and
              complete your Global 7 Wall signup. This link works once and
              expires 24 hours after it was sent.
            </p>
            <button
              onClick={confirm}
              disabled={busy}
              className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-10 py-4 rounded disabled:opacity-50 mt-7"
            >
              {busy ? "Confirming…" : "Confirm my email"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyClient() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
