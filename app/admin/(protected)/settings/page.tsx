"use client";

import { useEffect, useState } from "react";
import { AdminCard } from "@/components/admin/AdminShell";
import type { GlobalWallSettings } from "@/lib/types";

const LABELS: Array<[keyof GlobalWallSettings, string, string?]> = [
  ["enable_submissions", "Enable submissions"],
  ["require_manual_approval", "Require manual approval"],
  ["show_supporter_count", "Show supporter count"],
  ["show_country_count", "Show country count"],
  ["show_latest_supporters", "Show latest supporters"],
  ["show_country_flags", "Show country flags"],
  ["allow_fan_messages", "Allow fan messages"],
  ["allow_full_names", "Allow full names"],
  ["show_favorite_era", "Show favorite era"],
  ["emergency_lock", "Emergency lock submissions", "danger"],
];

export default function WallSettingsPage() {
  const [settings, setSettings] = useState<GlobalWallSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  async function toggle(key: keyof GlobalWallSettings) {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Global Wall Settings</h1>
        {saved && <span className="text-xs text-green-400">Saved ✓</span>}
      </div>
      <AdminCard>
        {!settings ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {LABELS.map(([key, label, danger]) => (
              <li key={key} className="flex items-center justify-between py-3">
                <span className={`text-sm ${danger ? "text-red-400" : "text-gray-300"}`}>
                  {label}
                </span>
                <button
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => toggle(key)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    settings[key]
                      ? danger
                        ? "bg-crimson"
                        : "bg-gold"
                      : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                      settings[key] ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
