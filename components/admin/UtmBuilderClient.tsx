"use client";

import { useState } from "react";

interface UtmBuilderProps {
  defaultLanding?: string;
}

type SavedState = "idle" | "saving" | "saved" | "error";

export default function UtmBuilderClient({ defaultLanding = "" }: UtmBuilderProps) {
  const [name, setName] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [landingUrl, setLandingUrl] = useState(defaultLanding || "https://darro.co");
  const [savedState, setSavedState] = useState<SavedState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const sourcePresets = [
    { label: "WhatsApp", value: "whatsapp" },
    { label: "Instagram", value: "instagram" },
    { label: "TikTok", value: "tiktok" },
    { label: "Facebook", value: "facebook" },
    { label: "Google", value: "google" },
    { label: "Email", value: "email" },
  ];
  const mediumPresets = [
    { label: "Social / DM", value: "social" },
    { label: "Paid Ads", value: "cpc" },
    { label: "Organic Search", value: "organic" },
    { label: "Email Blast", value: "email" },
    { label: "Referral Link", value: "referral" },
    { label: "Banner", value: "banner" },
  ];
  const campaignPresets = [
    { label: "Tier 3 — WhatsApp Hook", value: "tier3_whatsapp_hook" },
    { label: "World Cup 2026", value: "worldcup_2026" },
    { label: "Darro Club Upsell", value: "darro_club_upsell" },
    { label: "Membership Offer", value: "membership_launch" },
    { label: "Back-to-School", value: "back_to_school_2026" },
  ];

  const buildUrl = (): string => {
    try {
      const base = landingUrl.trim() || "https://darro.co";
      const url = new URL(base);
      if (utmSource.trim()) url.searchParams.set("utm_source", utmSource.trim());
      if (utmMedium.trim()) url.searchParams.set("utm_medium", utmMedium.trim());
      if (utmCampaign.trim()) url.searchParams.set("utm_campaign", utmCampaign.trim());
      if (utmContent.trim()) url.searchParams.set("utm_content", utmContent.trim());
      if (utmTerm.trim()) url.searchParams.set("utm_term", utmTerm.trim());
      return url.toString();
    } catch {
      return landingUrl || "";
    }
  };

  const builtUrl = buildUrl();

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg("Campaign name is required");
      setSavedState("error");
      return;
    }
    setSavedState("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          utm_source: utmSource.trim() || null,
          utm_medium: utmMedium.trim() || null,
          utm_campaign: utmCampaign.trim() || null,
          utm_content: utmContent.trim() || null,
          utm_term: utmTerm.trim() || null,
          landing_url: landingUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setSavedState("saved");
      setTimeout(() => {
        setSavedState("idle");
        setName("");
        setUtmSource("");
        setUtmMedium("");
        setUtmCampaign("");
        setUtmContent("");
        setUtmTerm("");
      }, 2200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setErrorMsg(msg);
      setSavedState("error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(builtUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // swallow
    }
  };

  return (
    <div className="bg-[var(--color-bone)] border border-[var(--color-sand)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-1">
            UTM Link Builder
          </h3>
          <p className="font-mono text-[10px] text-[var(--color-stone)]">
            Build a tracked link → save to campaigns table
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            Campaign Name *
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. WhatsApp Outreach — Dental Demo Aug 2026"
            className="w-full px-3 py-2.5 bg-white border border-[var(--color-sand)] text-xs font-mono tracking-wide placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-charcoal)]"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            utm_source
          </span>
          <input
            type="text"
            value={utmSource}
            onChange={(e) => setUtmSource(e.target.value)}
            placeholder="whatsapp, instagram, tiktok, google..."
            className="w-full px-3 py-2.5 bg-white border border-[var(--color-sand)] text-xs font-mono tracking-wide placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-charcoal)]"
          />
          <div className="flex flex-wrap gap-1.5">
            {sourcePresets.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setUtmSource(p.value)}
                className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                  utmSource === p.value
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : "bg-transparent text-[var(--color-stone)] border-[var(--color-sand)] hover:border-[var(--color-charcoal)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            utm_medium
          </span>
          <input
            type="text"
            value={utmMedium}
            onChange={(e) => setUtmMedium(e.target.value)}
            placeholder="social, cpc, email, banner..."
            className="w-full px-3 py-2.5 bg-white border border-[var(--color-sand)] text-xs font-mono tracking-wide placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-charcoal)]"
          />
          <div className="flex flex-wrap gap-1.5">
            {mediumPresets.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setUtmMedium(p.value)}
                className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                  utmMedium === p.value
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : "bg-transparent text-[var(--color-stone)] border-[var(--color-sand)] hover:border-[var(--color-charcoal)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            utm_campaign
          </span>
          <input
            type="text"
            value={utmCampaign}
            onChange={(e) => setUtmCampaign(e.target.value)}
            placeholder="worldcup_2026, tier3_whatsapp_hook..."
            className="w-full px-3 py-2.5 bg-white border border-[var(--color-sand)] text-xs font-mono tracking-wide placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-charcoal)]"
          />
          <div className="flex flex-wrap gap-1.5">
            {campaignPresets.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => {
                  setUtmCampaign(p.value);
                  if (!name.trim()) setName(p.label);
                }}
                className={`px-2 py-1 font-mono text-[9px] uppercase tracking-wider border transition-colors ${
                  utmCampaign === p.value
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : "bg-transparent text-[var(--color-stone)] border-[var(--color-sand)] hover:border-[var(--color-charcoal)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            utm_content (optional)
          </span>
          <input
            type="text"
            value={utmContent}
            onChange={(e) => setUtmContent(e.target.value)}
            placeholder="variant name, ad creative id..."
            className="w-full px-3 py-2.5 bg-white border border-[var(--color-sand)] text-xs font-mono tracking-wide placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-charcoal)]"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            utm_term (optional)
          </span>
          <input
            type="text"
            value={utmTerm}
            onChange={(e) => setUtmTerm(e.target.value)}
            placeholder="paid keyword, search term..."
            className="w-full px-3 py-2.5 bg-white border border-[var(--color-sand)] text-xs font-mono tracking-wide placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-charcoal)]"
          />
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            Landing URL
          </span>
          <input
            type="url"
            value={landingUrl}
            onChange={(e) => setLandingUrl(e.target.value)}
            placeholder="https://darro.co/shop/portugal-world-cup"
            className="w-full px-3 py-2.5 bg-white border border-[var(--color-sand)] text-xs font-mono tracking-wide placeholder:text-[var(--color-stone)] focus:outline-none focus:border-[var(--color-charcoal)]"
          />
        </label>
      </div>

      <div className="mb-6 p-4 bg-[var(--color-ink)]/95 border border-[var(--color-ink)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/60">
            Generated Link
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={`font-mono text-[9px] uppercase tracking-[0.16em] transition-colors ${
              copied ? "text-[var(--color-moss)]" : "text-white/70 hover:text-white"
            }`}
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
        </div>
        <code className="block text-[11px] text-white/90 break-all font-mono leading-relaxed">
          {builtUrl || "—"}
        </code>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-h-[18px]">
          {savedState === "saved" && (
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-moss)]">
              ✓ Campaign saved to database
            </p>
          )}
          {savedState === "error" && (
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ember)]">
              {errorMsg || "Save failed"}
            </p>
          )}
        </div>
        <div className="flex gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setName("");
              setUtmSource("");
              setUtmMedium("");
              setUtmCampaign("");
              setUtmContent("");
              setUtmTerm("");
              setSavedState("idle");
              setErrorMsg("");
            }}
            className="inline-flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em] px-5 py-3 border border-[var(--color-sand)] text-[var(--color-charcoal)] hover:bg-[var(--color-sand)]/50 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={savedState === "saving"}
            className="inline-flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.18em] px-6 py-3 bg-[var(--color-charcoal)] text-white hover:bg-[var(--color-ink)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savedState === "saving" ? "Saving..." : "Save to Campaigns"}
          </button>
        </div>
      </div>
    </div>
  );
}
