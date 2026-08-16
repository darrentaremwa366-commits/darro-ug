"use client";

import { useState } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import brand from "@/data/brand.json";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "Are these original jerseys?",
    a: "Premium quality jerseys sourced from the most reputable manufacturers. We stand by every piece we sell.",
  },
  {
    q: "What sizes are available?",
    a: "S, M, L, XL, XXL as standard. Size guides are on each product page.",
  },
  {
    q: "Do you deliver?",
    a: "Nationwide delivery across Uganda 🇺🇬. Free around Makerere University.",
  },
  {
    q: "How long does delivery take?",
    a: "3-5 working days after order confirmation via WhatsApp.",
  },
  {
    q: "Can I exchange sizes?",
    a: "Yes — unused items in original packaging may be exchanged within 7 days of delivery. WhatsApp us to arrange.",
  },
  {
    q: "How do I join Darro Club?",
    a: "Tap the JOIN DARRO CLUB button on this site to open our WhatsApp community. It's free to join.",
  },
  {
    q: "What payment methods do you support?",
    a: "Currently: Mobile Money (MTN & Airtel) and cash on delivery in Kampala. All orders processed via WhatsApp.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <div className="flex flex-col gap-4 max-w-3xl">
        {faqs.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="border-b border-foreground/10"
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                className="w-full flex items-start justify-between gap-6 py-5 text-left"
              >
                <span className="font-heading uppercase tracking-[0.18em] text-sm text-foreground pr-4">
                  {item.q}
                </span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 text-stone transition-transform duration-300 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="p-4 bg-bone mb-5 text-stone leading-relaxed text-sm sm:text-base">
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto w-full bg-bone border border-bone p-8 sm:p-10 text-center flex flex-col gap-5">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
          SUPPORT
        </div>
        <h3 className="font-heading uppercase tracking-heading text-xl sm:text-2xl text-foreground leading-tight">
          STILL HAVE QUESTIONS?
        </h3>
        <p className="text-stone leading-relaxed max-w-md mx-auto text-sm sm:text-base">
          Can&apos;t find what you&apos;re looking for? Reach out directly on
          WhatsApp and our team will get back to you as soon as we can.
        </p>
        <a
          href={buildWhatsAppUrl(
            brand.contact.whatsapp,
            "Hello Darro, I have a question."
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="button-style inline-flex items-center justify-center w-full py-4 bg-charcoal text-white text-[11px] hover:bg-ink transition-colors mt-2"
        >
          MESSAGE US DIRECTLY ON WHATSAPP →
        </a>
      </div>
    </div>
  );
}
