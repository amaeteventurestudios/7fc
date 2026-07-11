"use client";

import { useState } from "react";
import CookieConsentModal from "./CookieConsent";

/** Permanent "Cookie Settings" control (footer + Cookie Policy page). */
export default function CookieSettingsButton({
  className = "border border-gold/40 text-gold-2 text-[11px] font-bold tracking-widest uppercase px-4 py-2 rounded hover:bg-gold/10",
  label = "Cookie Settings",
}: {
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <CookieConsentModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
