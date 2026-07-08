"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminCard,
  adminInput,
  adminBtnSecondary,
  adminBtnDanger,
} from "@/components/admin/AdminShell";
import { flagEmoji } from "@/lib/countries";
import { ERAS, type Supporter } from "@/lib/types";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  hidden: "bg-gray-500/20 text-gray-400",
};

export default function SupportersPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [status, setStatus] = useState("");
  const [era, setEra] = useState("");
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (era) params.set("era", era);
    if (country) params.set("country", country);
    if (q) params.set("q", q);
    return fetch(`/api/admin/supporters?${params}`)
      .then((res) => res.json())
      .then((json) => {
        setSupporters(json.supporters ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, era, country, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: string) {
    if (action === "delete" && !confirm("Delete this supporter?")) return;
    await fetch("/api/admin/supporters", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  const countries = [...new Set(supporters.map((s) => `${s.country_code}|${s.country_name}`))];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-white">Supporters</h1>
      <AdminCard>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={adminInput}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="hidden">Hidden</option>
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={adminInput}>
            <option value="">All countries</option>
            {countries.map((c) => {
              const [code, name] = c.split("|");
              return (
                <option key={code} value={code}>
                  {flagEmoji(code)} {name}
                </option>
              );
            })}
          </select>
          <select value={era} onChange={(e) => setEra(e.target.value)} className={adminInput}>
            <option value="">All eras</option>
            {ERAS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className={adminInput}
          />
        </div>
      </AdminCard>
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                {["#", "Flag", "First Name", "Last Name", "Email", "Country", "Era", "Full Name?", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} className="py-2 pr-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supporters.map((s) => (
                <tr key={s.id} className="border-b border-gray-800/60 text-gray-300">
                  <td className="py-2.5 pr-3 text-gold-2 font-bold">
                    #{String(s.supporter_number).padStart(4, "0")}
                  </td>
                  <td className="pr-3">{flagEmoji(s.country_code)}</td>
                  <td className="pr-3">{s.first_name}</td>
                  <td className="pr-3">{s.last_name ?? "—"}</td>
                  <td className="pr-3 text-gray-400">{s.email}</td>
                  <td className="pr-3">{s.country_name}</td>
                  <td className="pr-3">{s.favorite_era ?? "—"}</td>
                  <td className="pr-3">{s.show_full_name ? "Yes" : "No"}</td>
                  <td className="pr-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${STATUS_BADGE[s.status] ?? ""}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="pr-3 text-gray-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-1">
                    <div className="flex gap-1.5">
                      {s.status !== "approved" && (
                        <button onClick={() => act(s.id, "approve")} className={adminBtnSecondary}>
                          Approve
                        </button>
                      )}
                      {s.status !== "hidden" && (
                        <button onClick={() => act(s.id, "hide")} className={adminBtnSecondary}>
                          Hide
                        </button>
                      )}
                      <button onClick={() => act(s.id, "delete")} className={adminBtnDanger}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="text-sm text-gray-500 py-4">Loading…</p>}
          {!loading && supporters.length === 0 && (
            <p className="text-sm text-gray-500 py-4">No supporters found.</p>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
