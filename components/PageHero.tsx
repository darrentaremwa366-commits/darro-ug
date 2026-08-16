import Reveal from "./Reveal";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  align?: "left" | "center";
}

export default function PageHero({
  eyebrow,
  title,
  description,
  count,
  countLabel,
  align = "left",
}: PageHeroProps) {
  const alignClass =
    align === "center" ? "text-center mx-auto items-center" : "text-left items-start";

  return (
    <section className="relative w-full pt-20 pb-12 sm:pt-28 sm:pb-16">
      <div className={`max-w-6xl mx-auto px-6 flex flex-col gap-4 ${alignClass}`}>
        <Reveal>
          {eyebrow && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
              {eyebrow}
            </span>
          )}
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="font-heading uppercase tracking-[0.18em] text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight">
            {title}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          {description && (
            <p className="max-w-xl text-stone leading-relaxed text-sm sm:text-base">
              {description}
            </p>
          )}
        </Reveal>
        <Reveal delay={0.15}>
          {typeof count === "number" && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-earth mt-2">
              {count} {countLabel || "Products"}
            </span>
          )}
        </Reveal>
      </div>
      <div className="w-full h-px bg-foreground/10 mt-12" />
    </section>
  );
}
