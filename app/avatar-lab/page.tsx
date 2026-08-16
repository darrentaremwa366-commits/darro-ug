"use client";

import Image from "next/image";
import { useState } from "react";
import variants from "@/data/avatar-variants.json";
import ProductPhotoFrame from "@/components/ProductPhotoFrame";

interface AvatarVariant {
  id: string;
  name: string;
  headline: string;
  description: string;
  tags: string[];
  promptSeed: string;
  hair: { style: string; color: string; detail: string };
  face: { expression: string };
  body: { pose: string; build: string };
  background: { style: string; color: string; lighting: string };
  camera: { shot: string; lens: string };
  wardrobeBase: string;
}

const IMAGE_MAP: Record<string, string> = {
  "builder-v1-classic": "/images/avatars/builder-v1-classic.jpg",
  "builder-v2-sunrise-rooftop": "/images/avatars/builder-v2-sunrise.jpg",
  "builder-v3-product-shot-athlete": "/images/avatars/builder-v3-product.jpg",
  "builder-v4-social-reel-closeup": "/images/avatars/builder-v4-social.jpg",
  "builder-v5-long-hair-alt": "/images/avatars/builder-v1-classic.jpg",
};

function copyToClipboard(text: string) {
  if (typeof navigator === "undefined") return;
  navigator.clipboard?.writeText(text).catch(() => {});
}

export default function AvatarLabPage() {
  const [selectedId, setSelectedId] = useState<string>(variants[0].id);
  const [copied, setCopied] = useState(false);
  const selected = (variants as AvatarVariant[]).find((v) => v.id === selectedId)!;
  const imageSrc = IMAGE_MAP[selected.id];

  const handleCopyPrompt = () => {
    copyToClipboard(selected.promptSeed);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="min-h-screen bg-[#F7F5F2] text-[#0F0F0F]">
      {/* Header */}
      <section className="px-5 pt-14 pb-8 md:px-10 md:pt-20">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8A8680] mb-3">
            /avatar-lab · v0.1 · Iterate with me
          </p>
          <h1 className="font-heading text-3xl md:text-5xl uppercase tracking-[0.04em] leading-[1.05] max-w-3xl">
            Pick your Builder.
            <br />
            <span className="text-[#A63D2F]">Iterate until it feels like you.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[#4A4640] max-w-2xl">
            These are the first 5 starting directions. Click any card below to see it
            big, copy the prompt, and tell me what to change — hair, expression,
            background, vibe — and I&apos;ll regenerate a new variant right here.
          </p>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-10">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: big preview */}
          <div className="flex flex-col gap-5">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E8E4DD] border border-[#0F0F0F]/5">
              {imageSrc ? (
                <ProductPhotoFrame warmth={0.7}>
                  <Image
                    src={imageSrc}
                    alt={selected.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </ProductPhotoFrame>
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-[11px] uppercase tracking-[0.2em] text-[#8A8680]">
                  No render yet — regenerate to create
                </div>
              )}
              <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
                <span className="inline-flex items-center px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] bg-[#0F0F0F]/85 text-white backdrop-blur-sm">
                  {selected.id}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] bg-white/80 text-[#0F0F0F] backdrop-blur-sm">
                  {selected.camera.shot} · {selected.camera.lens}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-sm border border-[#0F0F0F]/10 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-sm uppercase tracking-[0.18em]">
                    {selected.name}
                  </h3>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-[#A63D2F]">
                    {selected.headline}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] border border-[#0F0F0F]/15 text-[#4A4640]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-[#4A4640]">
                {selected.description}
              </p>

              <div className="grid gap-3 pt-2 md:grid-cols-3">
                {[
                  ["Hair", `${selected.hair.style.replace(/-/g, " ")} · ${selected.hair.detail.replace(/-/g, " ")}`],
                  ["Face / Vibe", selected.face.expression.replace(/-/g, " ")],
                  ["Body", `${selected.body.pose.replace(/-/g, " ")} · ${selected.body.build.replace(/-/g, " ")}`],
                ].map(([k, v]) => (
                  <div key={k} className="border-t border-[#0F0F0F]/10 pt-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8A8680]">
                      {k}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-[#0F0F0F]">
                      {v}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 pt-1 md:grid-cols-2">
                {[
                  ["Background", `${selected.background.style.replace(/-/g, " ")} · ${selected.background.color.replace(/-/g, " ")} · ${selected.background.lighting.replace(/-/g, " ")}`],
                  ["Wardrobe base", selected.wardrobeBase.replace(/WEARING-JERSEY-TO-SWAP.*— /, "").replace(/-/g, " ")],
                ].map(([k, v]) => (
                  <div key={k} className="border-t border-[#0F0F0F]/10 pt-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8A8680]">
                      {k}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-[#0F0F0F]">
                      {v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#0F0F0F]/10 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8A8680]">
                    Prompt seed (paste into image tool for remixes)
                  </p>
                  <button
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] border border-[#0F0F0F]/20 hover:bg-[#0F0F0F] hover:text-white transition-colors"
                  >
                    {copied ? "Copied ✓" : "Copy prompt"}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={selected.promptSeed}
                  className="w-full h-28 p-3 font-mono text-[10.5px] leading-relaxed text-[#4A4640] border border-[#0F0F0F]/10 bg-[#F7F5F2] resize-y"
                />
              </div>
            </div>
          </div>

          {/* Right: variant list */}
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8A8680] mb-1">
              {variants.length} starting variants
            </p>
            {(variants as AvatarVariant[]).map((v) => {
              const active = v.id === selectedId;
              const img = IMAGE_MAP[v.id];
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={`
                    text-left w-full rounded-sm border transition-all
                    ${active ? "border-[#0F0F0F] bg-white shadow-sm" : "border-[#0F0F0F]/10 bg-white/60 hover:bg-white"}
                  `}
                >
                  <div className="flex gap-4 p-3">
                    <div className="relative aspect-[3/4] w-24 flex-shrink-0 overflow-hidden bg-[#E8E4DD]">
                      {img ? (
                        <ProductPhotoFrame warmth={0.5} hideBanner>
                          <Image
                            src={img}
                            alt={v.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </ProductPhotoFrame>
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-mono text-[8px] uppercase tracking-[0.16em] text-[#8A8680]">
                          pending
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-heading text-[12px] uppercase tracking-[0.14em]">
                            {v.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#A63D2F] line-clamp-2">
                            {v.headline}
                          </p>
                        </div>
                        {active && (
                          <span className="mt-0.5 inline-flex px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.16em] bg-[#0F0F0F] text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[11px] leading-snug text-[#4A4640] line-clamp-3">
                        {v.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Add iteration request box */}
            <div className="mt-4 rounded-sm border border-dashed border-[#A63D2F]/50 bg-[#A63D2F]/5 p-4">
              <p className="font-heading text-[11px] uppercase tracking-[0.18em] text-[#A63D2F] mb-2">
                + Request a new iteration
              </p>
              <p className="text-[12px] leading-relaxed text-[#4A4640]">
                Tell me what to change — e.g. <em>&quot;v1 but hair is longer twisted locs, lose the stubble, smiling with teeth, Darro hoodie not plain tee, dark wood studio instead of tile floor.&quot;</em>
                I&apos;ll add the new variant to this page with a new ID like{" "}
                <code className="font-mono text-[10.5px]">v1.1, v1.2</code>, etc.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
