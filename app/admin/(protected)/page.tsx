"use client";

import { useEffect, useState } from "react";
import { AdminCard } from "@/components/admin/AdminShell";

interface Stats {
  total_supporters: number;
  pending_approval: number;
  flagged_review: number;
  auto_approved: number;
  unpublished: number;
  countries: number;
  email_signups: number;
  affiliate_clicks: number;
  top_era: string;
  today_signups: number;
}
interface Activity {
  id: string;
  type: string;
  detail: string;
  created_at: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
  supporter_submitted: "text-electric",
  supporter_approved: "text-green-400",
  affiliate_click: "text-gold-2",
  legal_edited: "text-yellow-400",
  supporter_deleted: "text-red-400",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setActivity(d.activity ?? []);
      })
      .catch(() => {});
  }, []);

  const cards = stats
    ? ([
        ["Flagged for Review", stats.flagged_review, true],
        ["Live Supporters", stats.auto_approved, false],
        ["Unpublished", stats.unpublished, false],
        ["Total Supporters", stats.total_supporters, false],
        ["Countries Represented", stats.countries, false],
        ["Email Signups", stats.email_signups, false],
        ["Affiliate Clicks", stats.affiliate_clicks, false],
        ["Today's Signups", stats.today_signups, false],
      ] as const)
    : [];

  return (
    <div className="space-y-8">
      <h1 className="text-lg font-bold text-white">Dashboard</h1>
      <p className="text-xs text-gray-500 -mt-4">
        Verified clean signups publish automatically — only flagged submissions
        need your review. See the <span className="text-gold-2">Readiness</span>{" "}
        page for reports and email-delivery health.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, value, highlight]) => (
          <AdminCard key={label}>
            <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                highlight && Number(value) > 0 ? "text-amber-300" : "gold-text"
              }`}
            >
              {value}
            </p>
          </AdminCard>
        ))}
        {!stats && <p className="text-sm text-gray-500">Loading…</p>}
      </div>
      <AdminCard title="Latest Activity">
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-3 text-xs">
                <span className={`shrink-0 ${ACTIVITY_COLORS[a.type] ?? "text-gray-400"}`}>
                  ●
                </span>
                <span className="text-gray-300 flex-1">{a.detail}</span>
                <span className="text-gray-600 shrink-0">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
