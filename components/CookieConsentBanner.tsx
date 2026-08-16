"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "darro_cookie_consent"; // "granted" | "denied"

type Consent = "granted" | "denied" | null;

declare global {
  interface Window {
    __darroAnalyticsConsent?: Consent;
  }
}

function readConsent(): Consent {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw === "granted") return "granted";
    if (raw === "denied") return "denied";
  } catch {
    /* ignore */
  }
  return null;
}

function setConsent(value: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  try {
    window.__darroAnalyticsConsent = value;
  } catch {
    /* ignore */
  }
  // Dispatch event so AnalyticsTracker can re-check consent state
  window.dispatchEvent(new CustomEvent("darro:consent-change", { detail: value }));
}

export default function CookieConsentBanner() {
  const [consent, setConsentState] = useState<Consent>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConsentState(readConsent());
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (consent !== null) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm z-[60] animate-[fadein_0.3s_ease]">
      <div className="bg-[#F7F5F2] border border-[#0F0F0F]/15 shadow-[0_10px_30px_-10px_rgba(15,15,15,0.25)] rounded-[14px] p-4 sm:p-5">
        <p className="font-heading text-[11px] uppercase tracking-[0.16em] text-[#0F0F0F] mb-1">
          Cookies
        </p>
        <p className="text-[12px] leading-relaxed text-[#5C5344] mb-4">
          We use a tiny bit of local storage &amp; cookies to remember your
          cart and understand how the shop is used. No selling of data, ever.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setConsent("granted");
              setConsentState("granted");
            }}
            className="button-style flex-1 bg-[#0F0F0F] px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-[#2C2C2C] transition-colors"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => {
              setConsent("denied");
              setConsentState("denied");
            }}
            className="button-style flex-1 border border-[#8A8680]/40 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-[#5C5344] hover:border-[#0F0F0F] hover:text-[#0F0F0F] transition-colors"
          >
            Reject all
          </button>
        </div>
      </div>
    </div>
  );
}

export function getAnalyticsConsent(): "granted" | "denied" {
  if (typeof window === "undefined") return "granted";
  const v = readConsent();
  return v ?? "granted";
}
