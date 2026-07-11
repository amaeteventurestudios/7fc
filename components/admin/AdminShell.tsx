"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/supporters", label: "Supporters" },
  { href: "/admin/settings", label: "Wall Settings" },
  { href: "/admin/products", label: "Affiliate Products" },
  { href: "/admin/legal", label: "Legal" },
  { href: "/admin/readiness", label: "Readiness" },
  { href: "/admin/settings/security", label: "Security" },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function isActive(href: string) {
    return href === "/admin" || href === "/admin/settings"
      ? pathname === href
      : pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-night text-gray-200">
      <header className="border-b border-gold/20 bg-navy/70 sticky top-0 z-40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-2">
          <span className="font-display font-black gold-text text-lg">
            7FC <span className="text-xs text-gray-400 font-body font-normal">Admin</span>
          </span>
          <div className="flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="text-xs text-gold-2 border border-gold/40 hover:border-gold rounded px-3 py-1.5 transition-colors"
            >
              View Site ↗
            </a>
            <button
              onClick={logout}
              className="hidden md:block text-xs text-gray-400 hover:text-crimson border border-gray-700 hover:border-crimson rounded px-3 py-1.5 transition-colors"
            >
              Log out
            </button>
            <button
              type="button"
              aria-label={menuOpen ? "Close admin menu" : "Open admin menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden text-gold-2 border border-gold/40 rounded px-3 py-1.5 text-sm"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {/* Desktop nav */}
        <nav className="hidden md:flex mx-auto max-w-6xl px-4 gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap text-xs px-3 py-2 border-b-2 transition-colors ${
                isActive(n.href)
                  ? "border-gold text-gold-2"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {/* Mobile menu panel */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gold/15 bg-navy/95 px-4 py-3 space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded px-3 py-2.5 text-sm ${
                  isActive(n.href)
                    ? "bg-gold/15 text-gold-2"
                    : "text-gray-300 hover:bg-gold/10"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="block w-full text-left rounded px-3 py-2.5 text-sm text-red-400 hover:bg-crimson/10"
            >
              Log out
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">{children}</main>
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
    <div className={`bg-navy/60 border border-gold/15 rounded-lg p-4 md:p-5 ${className}`}>
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
