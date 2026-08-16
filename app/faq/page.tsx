import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ — Questions, Answered — Darro",
  description:
    "Everything you need to know about ordering from Darro: sizing, delivery, payment, customization, exchanges, and Darro Club membership.",
};

export default function FaqPage() {
  return (
    <div className="flex flex-col">
      <PageHero
        eyebrow="SUPPORT"
        title="QUESTIONS, ANSWERED"
        description="Everything you need to know about ordering from Darro."
        align="left"
      />

      <section className="w-full max-w-4xl mx-auto px-6 pb-24 sm:pb-28">
        <Reveal>
          <FaqAccordion />
        </Reveal>
      </section>
    </div>
  );
}
