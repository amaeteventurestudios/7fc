"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AdminCard, adminInput, adminBtn } from "@/components/admin/AdminShell";

export default function SecurityPage() {
  const [info, setInfo] = useState<{ email: string; is_temporary: boolean } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function loadInfo() {
    fetch("/api/admin/security")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }
  useEffect(loadInfo, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPassword && newPassword !== confirm) {
      setMsg({ ok: false, text: "New passwords do not match." });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/security", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPassword,
        new_email: newEmail,
        new_password: newPassword,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg({ ok: false, text: json.error || "Update failed." });
      return;
    }
    setMsg({
      ok: true,
      text: "Credentials updated. Temporary setup mode is now disabled.",
    });
    setCurrentPassword("");
    setNewEmail("");
    setNewPassword("");
    setConfirm("");
    loadInfo();
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-lg font-bold text-white">Security / Change Login</h1>
      {info?.is_temporary && (
        <div className="border border-yellow-500/50 bg-yellow-500/10 rounded-lg p-4 text-sm text-yellow-400">
          ⚠️ You are using temporary bootstrap credentials. Change your
          password now to secure the admin and disable the temporary login
          button.
        </div>
      )}
      <AdminCard title={`Signed in as ${info?.email ?? "…"}`}>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gold-2 mb-1.5">
              Current password *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={adminInput}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gold-2 mb-1.5">
              New admin email (optional)
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={info?.email}
              className={adminInput}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gold-2 mb-1.5">
              New password (min 10 characters)
            </label>
            <input
              type="password"
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={adminInput}
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gold-2 mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={adminInput}
            />
          </div>
          {msg && (
            <p className={`text-sm ${msg.ok ? "text-green-400" : "text-red-400"}`} role="alert">
              {msg.text}
            </p>
          )}
          <button type="submit" className={adminBtn} disabled={busy}>
            {busy ? "Updating…" : "Update Credentials"}
          </button>
        </form>
      </AdminCard>
    </div>
  );
}
