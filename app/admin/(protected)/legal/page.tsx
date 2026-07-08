"use client";

import { useEffect, useState } from "react";
import { AdminCard, adminInput, adminBtn } from "@/components/admin/AdminShell";
import type { LegalDisclaimers } from "@/lib/types";

const FIELDS: Array<[keyof LegalDisclaimers, string]> = [
  ["top_disclaimer", "Top disclaimer bar"],
  ["footer_disclaimer", "Footer disclaimer"],
  ["affiliate_disclosure", "Affiliate disclosure"],
  ["privacy_note", "Privacy note"],
  ["product_note", "Product / affiliate note"],
];

export default function LegalPage() {
  const [legal, setLegal] = useState<LegalDisclaimers | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/legal")
      .then((r) => r.json())
      .then((d) => setLegal(d.legal))
      .catch(() => {});
  }, []);

  async function save() {
    if (!legal) return;
    setBusy(true);
    await fetch("/api/admin/legal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(legal),
    });
    setBusy(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Legal Disclaimers</h1>
        {saved && <span className="text-xs text-green-400">Saved ✓</span>}
      </div>
      <AdminCard>
        {!legal ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            {FIELDS.map(([key, label]) => (
              <div key={key}>
                <label className="block text-[11px] uppercase tracking-wider text-gold-2 mb-1.5">
                  {label}
                </label>
                <textarea
                  value={legal[key]}
                  onChange={(e) => setLegal({ ...legal, [key]: e.target.value })}
                  rows={key === "footer_disclaimer" ? 5 : 3}
                  className={adminInput}
                />
              </div>
            ))}
            <button className={adminBtn} onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save Disclaimers"}
            </button>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
