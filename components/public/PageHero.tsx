import Link from "next/link";

/** Server-safe cinematic page header with the page's single H1. */
export default function PageHero({
  kicker,
  title,
  intro,
  crumb,
}: {
  kicker: string;
  title: string;
  intro: string;
  crumb: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto pt-10 md:pt-16 px-4">
      <nav className="text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gold-2">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-300">{crumb}</span>
      </nav>
      <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-electric/80">
        {kicker}
      </p>
      <h1 className="font-display text-3xl md:text-6xl font-bold tracking-wide gold-text mt-4">
        {title}
      </h1>
      <div className="mx-auto mt-6 h-px w-32 md:w-48 bg-gradient-to-r from-transparent via-gold to-transparent" />
      <p className="text-sm md:text-base text-gray-300 mt-6 leading-relaxed">{intro}</p>
    </div>
  );
}
