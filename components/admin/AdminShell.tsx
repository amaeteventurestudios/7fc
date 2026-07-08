"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/supporters", label: "Supporters" },
  { href: "/admin/settings", label: "Wall Settings" },
  { href: "/admin/products", label: "Affiliate Products" },
  { href: "/admin/legal", label: "Legal" },
  { href: "/admin/settings/security", label: "Security" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-night text-gray-200">
      <header className="border-b border-gold/20 bg-navy/70">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <span className="font-display font-black gold-text text-lg">
            7FC <span className="text-xs text-gray-400 font-body font-normal">Admin</span>
          </span>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-crimson border border-gray-700 hover:border-crimson rounded px-3 py-1.5 transition-colors"
          >
            Log out
          </button>
        </div>
        <nav className="mx-auto max-w-6xl px-4 flex gap-1 overflow-x-auto">
          {NAV.map((n) => {
            const active =
              n.href === "/admin" || n.href === "/admin/settings"
                ? pathname === n.href
                : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap text-xs px-3 py-2 border-b-2 transition-colors ${
                  active
                    ? "border-gold text-gold-2"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export function AdminCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-navy/60 border border-gold/15 rounded-lg p-5 ${className}`}>
      {title && (
        <h2 className="text-sm font-bold text-gold-2 tracking-wide uppercase mb-4">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

export const adminInput =
  "w-full bg-night border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none";
export const adminBtn =
  "bg-gold/90 hover:bg-gold text-night text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors disabled:opacity-50";
export const adminBtnSecondary =
  "border border-gray-700 hover:border-gold text-gray-300 text-xs px-3 py-1.5 rounded transition-colors";
export const adminBtnDanger =
  "border border-crimson/60 hover:bg-crimson/20 text-red-400 text-xs px-3 py-1.5 rounded transition-colors";
