"use client";

import { useEffect, useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import TurnstileWidget from "@/components/public/TurnstileWidget";
import { ERAS } from "@/lib/types";

interface SelfView {
  supporter_number: number;
  first_name: string;
  last_name: string | null;
  email: string;
  country_name: string;
  favorite_era: string | null;
  message: string | null;
  show_full_name: boolean;
  status: string;
  display_consent: boolean;
  marketing_consent: boolean;
}

const inputCls =
  "w-full bg-night border border-gold/25 rounded px-3 py-3 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none";
const labelCls = "block text-[11px] tracking-[0.2em] uppercase text-gold-2 mb-1.5";
const btnCls =
  "border border-gold/60 text-gold-2 text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded hover:bg-gold/10 transition-colors disabled:opacity-50";

function RequestLinkForm() {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action: "request_link" }),
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

  if (note)
    return (
      <div className="glass-card p-8 text-center" role="status">
        <p className="text-sm text-gray-300">{note}</p>
      </div>
    );
  return (
    <form onSubmit={onSubmit} className="glass-card p-6 md:p-8 space-y-4">
      <div>
        <label htmlFor="m-email" className={labelCls}>Email on your entry *</label>
        <input id="m-email" name="email" type="email" required maxLength={200} className={inputCls} placeholder="you@example.com" autoComplete="email" />
      </div>
      <TurnstileWidget action="manage_link" />
      {error && <p className="text-sm text-red-400 text-center" role="alert">{error}</p>}
      <div className="text-center">
        <button type="submit" disabled={busy} className="cta-glow bg-crimson text-white font-bold tracking-widest uppercase text-sm px-8 py-3.5 rounded disabled:opacity-50">
          {busy ? "Sending…" : "Email me a management link"}
        </button>
      </div>
    </form>
  );
}

function ManagePanel({ token }: { token: string }) {
  const [record, setRecord] = useState<SelfView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/manage?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Link invalid.");
        setRecord(json.supporter);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Link invalid."));
  }, [token]);

  async function act(payload: Record<string, unknown>) {
    setBusy(true);
    setNote(null);
    setError(null);
    try {
      const res = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      if (json.deleted) {
        setDeleted(true);
        setNote(json.message);
        return;
      }
      if (json.export) {
        const blob = new Blob([JSON.stringify(json.export, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "7fc-supporter-data.json";
        a.click();
        URL.revokeObjectURL(url);
        setNote("Your data export has been downloaded.");
        return;
      }
      if (json.supporter) setRecord(json.supporter);
      setNote(json.message || "Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await act({
      action: "update",
      first_name: String(data.get("first_name") ?? ""),
      last_name: String(data.get("last_name") ?? ""),
      favorite_era: String(data.get("favorite_era") ?? ""),
      message: String(data.get("message") ?? ""),
      show_full_name: data.get("show_full_name") === "1",
    });
  }

  if (error && !record)
    return (
      <div>
        <div className="glass-card p-8 text-center" role="alert">
          <p className="text-sm text-red-400">{error}</p>
        </div>
        <div className="mt-8">
          <RequestLinkForm />
        </div>
      </div>
    );
  if (deleted)
    return (
      <div className="glass-card p-8 text-center border-gold/60" role="status">
        <p className="font-display text-xl gold-text font-bold">Entry deleted</p>
        <p className="text-sm text-gray-300 mt-4">{note}</p>
      </div>
    );
  if (!record)
    return <p className="text-center text-sm text-gray-400" role="status">Loading your entry…</p>;

  return (
    <div className="space-y-6">
      {(note || error) && (
        <p
          className={`text-center text-sm ${error ? "text-red-400" : "text-gold-2"}`}
          role={error ? "alert" : "status"}
        >
          {error || note}
        </p>
      )}
      <div className="glass-card p-6 md:p-8">
        <h2 className="font-display text-base font-bold text-gold-2 tracking-wide uppercase">
          Supporter #{String(record.supporter_number).padStart(4, "0")}
        </h2>
        <dl className="grid md:grid-cols-2 gap-x-8 gap-y-3 mt-5 text-sm">
          <div><dt className="text-[11px] tracking-[0.2em] uppercase text-gray-500">Email (private)</dt><dd className="text-gray-200 break-all">{record.email}</dd></div>
          <div><dt className="text-[11px] tracking-[0.2em] uppercase text-gray-500">Country</dt><dd className="text-gray-200">{record.country_name}</dd></div>
          <div><dt className="text-[11px] tracking-[0.2em] uppercase text-gray-500">Status</dt><dd className="text-gray-200">{record.status === "pending" ? "pending review" : record.status}</dd></div>
          <div><dt className="text-[11px] tracking-[0.2em] uppercase text-gray-500">Public display</dt><dd className="text-gray-200">{record.display_consent ? "Consented" : "Withdrawn / not granted"}</dd></div>
        </dl>
      </div>

      <form onSubmit={saveDetails} className="glass-card p-6 md:p-8 space-y-4">
        <h2 className="font-display text-base font-bold text-gold-2 tracking-wide uppercase">
          Correct your details
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mg-first" className={labelCls}>First name *</label>
            <input id="mg-first" name="first_name" required maxLength={60} defaultValue={record.first_name} className={inputCls} />
          </div>
          <div>
            <label htmlFor="mg-last" className={labelCls}>Last name</label>
            <input id="mg-last" name="last_name" maxLength={60} defaultValue={record.last_name ?? ""} className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="mg-era" className={labelCls}>Favorite era</label>
            <select id="mg-era" name="favorite_era" defaultValue={record.favorite_era ?? ""} className={inputCls}>
              <option value="">None</option>
              {ERAS.map((era) => (
                <option key={era} value={era}>{era}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="mg-message" className={labelCls}>Message</label>
            <textarea id="mg-message" name="message" rows={3} maxLength={500} defaultValue={record.message ?? ""} className={inputCls} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input type="checkbox" name="show_full_name" value="1" defaultChecked={record.show_full_name} className="accent-[#d4af5e]" />
          Show my full name on the Global 7 Wall
        </label>
        <p className="text-[11px] text-gray-500">
          Changes to public text are re-reviewed before they reappear on the Wall.
        </p>
        <button type="submit" disabled={busy} className={btnCls}>Save changes</button>
      </form>

      <div className="glass-card p-6 md:p-8 space-y-4">
        <h2 className="font-display text-base font-bold text-gold-2 tracking-wide uppercase">
          Privacy controls
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => act({ action: "set_display", value: !record.display_consent })}
            className={btnCls}
          >
            {record.display_consent ? "Withdraw public-display consent" : "Grant public-display consent"}
          </button>
          <button disabled={busy} onClick={() => act({ action: "unpublish" })} className={btnCls}>
            Unpublish my entry
          </button>
          <button
            disabled={busy}
            onClick={() => act({ action: "set_marketing", value: !record.marketing_consent })}
            className={btnCls}
          >
            {record.marketing_consent ? "Disable news & updates" : "Enable news & updates"}
          </button>
          <button disabled={busy} onClick={() => act({ action: "export" })} className={btnCls}>
            Export my data (JSON)
          </button>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 border-crimson/40">
        <h2 className="font-display text-base font-bold text-red-400 tracking-wide uppercase">
          Delete my information
        </h2>
        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
          Permanently deletes your personal information and removes your entry
          from the public Wall. Your supporter number is retired, not
          reassigned. This cannot be undone.
        </p>
        <label className="flex items-start gap-2 text-xs text-gray-300 mt-4">
          <input
            type="checkbox"
            checked={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.checked)}
            className="accent-[#c8102e] mt-0.5"
          />
          <span>I understand this is permanent and I want to delete my information.</span>
        </label>
        <button
          disabled={busy || !confirmDelete}
          onClick={() => act({ action: "delete", confirm: true })}
          className="mt-4 border border-crimson/70 text-red-300 text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded hover:bg-crimson/20 transition-colors disabled:opacity-40"
        >
          Delete permanently
        </button>
      </div>
    </div>
  );
}

function ManageInner() {
  const params = useSearchParams();
  const token = params.get("token");
  return token ? <ManagePanel token={token} /> : <RequestLinkForm />;
}

export default function ManageClient() {
  return (
    <Suspense fallback={null}>
      <ManageInner />
    </Suspense>
  );
}
