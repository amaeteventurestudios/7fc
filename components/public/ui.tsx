"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  kicker,
}: {
  children: ReactNode;
  kicker?: string;
}) {
  return (
    <div className="text-center mb-8 md:mb-12">
      {kicker && (
        <p className="text-xs tracking-[0.3em] uppercase text-electric/80 mb-2">{kicker}</p>
      )}
      <h2 className="font-display text-2xl md:text-4xl font-bold tracking-wide gold-text">
        {children}
      </h2>
      <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" />
    </div>
  );
}

export function CountUp({
  target,
  suffix = "",
  duration = 1600,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        if (reduced) {
          setValue(target);
          return;
        }
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

const PARTICLES = [
  { left: "8%", size: 3, dur: 14, delay: 0, color: "rgba(212,175,94,0.7)" },
  { left: "22%", size: 2, dur: 18, delay: 3, color: "rgba(43,108,255,0.6)" },
  { left: "37%", size: 4, dur: 16, delay: 6, color: "rgba(212,175,94,0.5)" },
  { left: "52%", size: 2, dur: 20, delay: 1, color: "rgba(200,16,46,0.55)" },
  { left: "64%", size: 3, dur: 15, delay: 8, color: "rgba(212,175,94,0.65)" },
  { left: "78%", size: 2, dur: 19, delay: 4, color: "rgba(43,108,255,0.5)" },
  { left: "90%", size: 3, dur: 17, delay: 10, color: "rgba(212,175,94,0.6)" },
];

export function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Labeled WebP placeholder image that never breaks the layout if missing. */
export function PlaceholderImg({
  src,
  alt,
  className = "",
  label,
}: {
  src: string;
  alt: string;
  className?: string;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-navy-2 border border-gold/20 text-center text-xs text-gold/60 p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        {label || alt}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
