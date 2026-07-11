"use client";

/**
 * 7FC cookie preferences.
 *
 * The current cookie audit found only strictly necessary technologies
 * (admin session, this preference cookie, Cloudflare security), so no
 * blocking banner is shown. This modal is the permanent "Cookie Settings"
 * control (footer link) and the ready-to-use consent framework: if an
 * optional category is ever introduced, add it to CATEGORIES with
 * enabled-by-consent wiring and bump COOKIE_POLICY_VERSION — stored choices
 * from older versions are re-requested automatically.
 *
 * Accessibility: focus is trapped in the dialog, Escape closes it, focus
 * returns to the opener, and all controls are labeled.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { COOKIE_POLICY_VERSION } from "@/lib/policy";

const COOKIE_NAME = "7fc_cookie_prefs";

interface Prefs {
  version: string;
  necessary: true;
  analytics: boolean;
  savedAt: string;
}

export function readPrefs(): Prefs | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
    if (parsed?.version !== COOKIE_POLICY_VERSION) return null;
    return parsed as Prefs;
  } catch {
    return null;
  }
}

function savePrefs(analytics: boolean) {
  const prefs: Prefs = {
    version: COOKIE_POLICY_VERSION,
    necessary: true,
    analytics,
    savedAt: new Date().toISOString(),
  };
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(prefs)
  )}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax; Secure`;
}

/** Honor Global Privacy Control: treat as a standing objection to optional categories. */
function gpcActive(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}

export default function CookieConsentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const [analytics, setAnalytics] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const prefs = readPrefs();
    setAnalytics(prefs?.analytics ?? false);
    setSaved(false);
    // Focus the dialog on open.
    const t = setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>("button, [href], input")
        ?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        (openerRef.current as HTMLElement | null)?.focus?.();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!open) return null;

  function finish(analyticsChoice: boolean) {
    savePrefs(analyticsChoice && !gpcActive());
    setSaved(true);
    setTimeout(() => {
      onClose();
      (openerRef.current as HTMLElement | null)?.focus?.();
    }, 900);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-4"
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-title"
        className="glass-card w-full max-w-lg p-6 md:p-8 border-gold/40 bg-navy"
      >
        <h2 id="cookie-title" className="font-display text-lg font-bold gold-text">
          Your Privacy, Your Choice
        </h2>
        <p className="text-sm text-gray-300 mt-3 leading-relaxed">
          7FC uses necessary technologies to operate this site. With your
          permission, we may also use analytics to understand how the site is
          used. You can accept all, reject non-essential technologies, or
          manage your preferences.
        </p>
        <div className="mt-5 space-y-3">
          <div className="flex items-start justify-between gap-4 border border-gold/20 rounded p-3">
            <div>
              <p className="text-sm font-bold text-gray-100">Necessary</p>
              <p className="text-xs text-gray-400 mt-1">
                Security, admin sign-in, and remembering this choice. Always
                active.
              </p>
            </div>
            <span className="text-[10px] tracking-[0.15em] uppercase text-gold-2 border border-gold/40 rounded-full px-2.5 py-1 shrink-0">
              Always on
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 border border-gold/20 rounded p-3">
            <div>
              <p className="text-sm font-bold text-gray-100">Analytics</p>
              <p className="text-xs text-gray-400 mt-1">
                Not currently used — 7FC runs no analytics today. This
                preference only takes effect if analytics are ever introduced.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-300 shrink-0">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="accent-[#d4af5e] w-4 h-4"
                aria-label="Allow analytics"
              />
              Allow
            </label>
          </div>
        </div>
        {saved && (
          <p className="text-center text-xs text-gold-2 mt-4" role="status">
            Preferences saved.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => finish(true)}
            className="bg-gradient-to-b from-gold to-gold/70 text-navy text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded"
          >
            Accept All
          </button>
          <button
            onClick={() => finish(false)}
            className="border border-gold/60 text-gold-2 text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded hover:bg-gold/10"
          >
            Reject Non-Essential
          </button>
          <button
            onClick={() => finish(analytics)}
            className="border border-gold/40 text-gray-300 text-xs font-bold tracking-widest uppercase px-5 py-2.5 rounded hover:bg-gold/10"
          >
            Save Preferences
          </button>
        </div>
        <p className="text-center mt-4">
          <a href="/cookies" className="text-[11px] text-gold-2 underline underline-offset-2">
            Cookie Policy
          </a>
        </p>
      </div>
    </div>
  );
}
