"use client";

import Link from "next/link";
import brand from "@/data/brand.json";

export default function MembershipPage() {
  const joinUrl = brand.contact.whatsappGroup;
  const benefits = brand.club.benefits ?? [];
  const intro = brand.club.introParagraph ?? "";

  return (
    <div className="flex flex-col bg-[#F7F5F2] min-h-screen">
      {/* --- DARRO CLUB heading --- */}
      <section className="w-full bg-[#0F0F0F] text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24 text-center flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
            MEMBERSHIP
          </span>
          <h1 className="font-heading uppercase tracking-[0.14em] text-[clamp(1.8rem,7vw,4rem)] leading-[0.95]">
            DARRO CLUB
          </h1>
          <p className="text-white/60 text-xs sm:text-sm font-mono uppercase tracking-[0.2em]">
            {brand.club.headline}
          </p>
        </div>
      </section>

      {/* --- JOIN BUTTON FIRST (mobile-optimized) --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col items-center text-center gap-6">
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-style w-full sm:w-auto inline-flex items-center justify-center bg-[#0F0F0F] text-[#F7F5F2] px-8 py-4 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-[#2C2C2C] transition-colors"
          >
            JOIN DARRO CLUB · WHATSAPP
          </a>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8A8680] leading-relaxed max-w-md">
            {brand.club.consentText}
          </p>
        </div>
      </section>

      {/* --- PARAGRAPH (brand story) --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <p className="text-[#0F0F0F] text-base sm:text-lg leading-[1.7]">
            {intro}
          </p>
        </div>
      </section>

      {/* --- BENEFITS --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">
            WHAT YOU GET
          </span>
          <ul className="flex flex-col gap-4">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="pt-1 font-mono text-[11px] text-[#A63D2F] flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] sm:text-sm text-[#0F0F0F] leading-relaxed">
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- JOIN LINK AT BOTTOM --- */}
      <section className="w-full bg-[#F7F5F2] border-t border-[#E8E4DD]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col items-center text-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8680]">
            READY?
          </span>
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-style w-full sm:w-auto inline-flex items-center justify-center border border-[#0F0F0F] text-[#0F0F0F] px-8 py-3.5 text-[11px] font-heading uppercase tracking-[0.18em] hover:bg-[#0F0F0F] hover:text-[#F7F5F2] transition-colors"
          >
            JOIN DARRO CLUB →
          </a>
          <Link
            href="/faq"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A8680] hover:text-[#0F0F0F] transition-colors"
          >
            Have questions? View FAQ →
          </Link>
        </div>
      </section>
    </div>
  );
}
