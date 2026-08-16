import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import RevealGroup from "@/components/RevealGroup";
import RevealItem from "@/components/RevealItem";
import brand from "@/data/brand.json";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Darro Club — Membership — Darro",
  description:
    "Join Darro Club for exclusive member prices, early access to new drops, limited offers, and special bundles. Uganda's football jersey community.",
};

const benefits = brand.club.benefits;

const steps = [
  {
    num: "01",
    title: "JOIN VIA WHATSAPP",
    desc: "Tap the button below to open our WhatsApp community link. Free to join, no fees ever.",
  },
  {
    num: "02",
    title: "ACCESS MEMBER PRICES",
    desc: "Save on every jersey with exclusive Darro Club member pricing across the entire catalog.",
  },
  {
    num: "03",
    title: "EARLY ACCESS & BUNDLES",
    desc: "First dibs on new drops, limited bundles, and members-only offers before everyone else.",
  },
];

export default function MembershipPage() {
  const whatsappHref = brand.contact.whatsappGroup;

  return (
    <div className="flex flex-col">
      <PageHero
        eyebrow="MEMBERSHIP"
        title="DARRO CLUB"
        description="Belonging is earned. Not bought."
        align="left"
      />

      <section className="w-full bg-charcoal text-white py-24 sm:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <div className="grid md:grid-cols-2 items-center gap-10 md:gap-16">
              <div className="flex flex-col gap-6">
                <h2 className="font-heading uppercase tracking-heading text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-white">
                  QUIET DISCIPLINE.
                  <br />
                  EARNED BELONGING.
                </h2>
                <p className="text-sand/70 leading-relaxed max-w-md text-sm sm:text-base">
                  Darro Club is more than a discount. It&apos;s a circle of
                  people who show up — to training, to study, to the quiet work
                  that no one sees. When you join, you&apos;re not just buying a
                  jersey. You&apos;re wearing the same shirt as people who
                  respect the grind.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-6 sm:p-10 flex flex-col gap-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-sand/80">
                  MEMBER BENEFITS
                </div>
                <ul className="flex flex-col gap-4">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="pt-0.5 flex-shrink-0">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#E8E4DD"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sand/60">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sand/90 text-sm sm:text-base leading-relaxed">
                          {b}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto px-6 py-24 sm:py-28">
        <Reveal className="flex flex-col gap-14">
          <SectionHeader eyebrow="THE PATH" title="HOW MEMBERSHIP WORKS" />
          <RevealGroup className="grid md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((s) => (
              <RevealItem key={s.num}>
                <div className="flex flex-col gap-4">
                  <div className="font-heading text-6xl sm:text-7xl tracking-tight text-sand">
                    {s.num}
                  </div>
                  <h3 className="font-heading uppercase tracking-[0.18em] text-base sm:text-lg text-foreground pt-2">
                    {s.title}
                  </h3>
                  <p className="text-stone leading-relaxed text-sm sm:text-base">
                    {s.desc}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Reveal>
      </section>

      <section className="w-full max-w-6xl mx-auto px-6 pb-24 sm:pb-28">
        <Reveal>
          <div className="max-w-2xl mx-auto border border-sand bg-sand/10 p-8 sm:p-10 text-center flex flex-col gap-5">
            <div className="font-signature text-4xl sm:text-5xl text-foreground leading-none">
              {brand.name}
            </div>
            <h3 className="font-heading uppercase tracking-heading text-xl sm:text-2xl text-foreground leading-tight">
              JOIN UGANDA&apos;S FOOTBALL JERSEY COMMUNITY
            </h3>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="button-style inline-flex items-center justify-center w-full py-4 bg-ink text-white text-[11px] hover:bg-charcoal transition-colors"
            >
              JOIN DARRO CLUB · WHATSAPP
            </a>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone leading-relaxed max-w-lg mx-auto mt-2 whitespace-pre-line">
              {brand.club.consentText}
            </p>
          </div>
        </Reveal>
      </section>

      <section className="w-full max-w-6xl mx-auto px-6 pb-24 sm:pb-28">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center flex flex-col gap-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
              STILL NOT SURE?
            </div>
            <h3 className="font-heading uppercase tracking-heading text-xl sm:text-2xl text-foreground">
              QUESTIONS?
            </h3>
            <p className="text-stone leading-relaxed max-w-md mx-auto">
              Floating WhatsApp icon is always on the bottom right of every
              page. Or message us directly.
            </p>
            <a
              href={buildWhatsAppUrl(
                brand.contact.whatsapp,
                "Hello Darro, I have a question about Darro Club membership."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center mx-auto font-heading uppercase tracking-[0.18em] text-[11px] text-ember hover:underline underline-offset-4 gap-1"
            >
              Message us →
            </a>
            <div className="pt-6">
              <Link
                href="/faq"
                className="inline-flex items-center justify-center mx-auto font-mono uppercase tracking-[0.18em] text-[11px] text-stone hover:text-foreground transition-colors gap-1"
              >
                View FAQ →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
