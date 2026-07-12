"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
    __turnstileLoading?: boolean;
  }
}

/**
 * Cloudflare Turnstile widget (Managed mode).
 * Site-key resolution: build-time NEXT_PUBLIC var when present, else the
 * runtime /api/turnstile/config endpoint (lets ops set the key via Worker
 * vars without a rebuild). Only the PUBLIC site key ever reaches the
 * browser. The widget auto-resets on token expiry so a stale form remains
 * usable, and exposes its status to assistive technology.
 */
export default function TurnstileWidget({ action }: { action?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [siteKey, setSiteKey] = useState<string | null>(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null
  );

  useEffect(() => {
    if (siteKey !== null) return;
    let cancelled = false;
    fetch("/api/turnstile/config")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setSiteKey(typeof j.siteKey === "string" ? j.siteKey : "");
      })
      .catch(() => {
        if (!cancelled) setSiteKey("");
      });
    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let widgetId: string | null = null;
    let cancelled = false;

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      widgetId = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: "dark",
        action,
        "response-field-name": "turnstile_token",
        // Tokens live 5 minutes; refresh in place so the form stays usable.
        "refresh-expired": "auto",
        "error-callback": () => {
          // Recoverable client error: reset instead of leaving a dead widget.
          if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
          return true;
        },
      });
    };

    if (window.turnstile) {
      render();
    } else if (!window.__turnstileLoading) {
      window.__turnstileLoading = true;
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      const poll = setInterval(() => {
        if (window.turnstile) {
          clearInterval(poll);
          render();
        }
      }, 200);
      return () => clearInterval(poll);
    }
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, action]);

  if (!siteKey) return null;
  return (
    <div
      ref={ref}
      className="flex justify-center"
      aria-label="Human verification"
      aria-live="polite"
    />
  );
}
