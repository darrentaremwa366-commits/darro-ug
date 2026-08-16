"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import brand from "@/data/brand.json";

const WA_NUMBER_RAW = brand.contact.whatsapp || "";
const WA_NUMBER = WA_NUMBER_RAW.replace(/[^0-9]/g, "");
const WA_MESSAGE = encodeURIComponent(
  "Hi Darro — I saw the website and I'd like to chat about jerseys, sizing, or an order."
);
const whatsappUrl = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

export default function FloatingWhatsAppWidget() {
  const [dismissed, setDismissed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulseKey((k) => k + 1), 4200);
    return () => clearInterval(t);
  }, []);

  const showInvite = !dismissed;

  return (
    <div
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-7 z-50 flex flex-col items-end gap-2 sm:gap-3 max-w-[calc(100vw-2.5rem)]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <AnimatePresence>
        {showInvite && (
          <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setDismissed(true)}
            key="invite-card"
            initial={{ opacity: 0, y: 12, x: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, x: 6, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="
              group relative block
              w-[160px] sm:w-[170px]
              rounded-[14px] sm:rounded-[16px]
              bg-gradient-to-br from-[#E8F4E8] via-[#F2F9F1] to-[#F7FCF6]
              border border-[#2B6B4A]/25
              shadow-[0_8px_24px_-10px_rgba(27,94,62,0.35),0_3px_10px_-4px_rgba(15,15,15,0.1)]
              px-3 py-2.5 sm:px-3.5 sm:py-3
              cursor-pointer
            "
          >
            <span
              aria-hidden
              className="
                absolute -bottom-1.5 right-6 sm:right-7
                h-4 w-4 rotate-45
                bg-gradient-to-br from-[#F2F9F1] to-[#F7FCF6]
                border-b border-r border-[#2B6B4A]/25
              "
            />

            <div className="flex flex-col items-center gap-1">
              <p className="text-[11px] sm:text-[11.5px] leading-tight text-[#1A1A1A] text-center font-heading uppercase tracking-[0.12em]">
                Any inquiries?
              </p>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2B6B4A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-bounce"
                aria-hidden
              >
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </motion.a>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Darro on WhatsApp"
        initial={{ opacity: 0, scale: 0.85, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        className="
          relative isolate inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center
          rounded-full
          bg-gradient-to-br from-[#1F5F46] via-[#174B37] to-[#0F3A29]
          text-white
          shadow-[0_14px_34px_-10px_rgba(15,58,41,0.7),0_6px_16px_-6px_rgba(15,15,15,0.25)]
          ring-1 ring-white/15
          hover:from-[#247153] hover:via-[#1c5c41] hover:to-[#134530]
          transition-colors
        "
      >
        <AnimatePresence mode="wait">
          {!hovering && (
            <motion.span
              key={pulseKey}
              aria-hidden
              className="absolute inset-0 rounded-full ring-2 ring-[#25D366]/50"
              initial={{ opacity: 0.55, scale: 0.92 }}
              animate={{ opacity: 0, scale: 1.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <span
          aria-hidden
          className="
            absolute inset-1 rounded-full
            bg-[radial-gradient(circle_at_30%_30%,rgba(37,211,102,0.55),transparent_60%)]
            opacity-80
          "
        />

        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
        >
          <path d="M20.52 3.48A11.88 11.88 0 0012.04 0C5.46 0 .1 5.36.1 11.94c0 2.1.56 4.14 1.62 5.94L0 24l6.3-1.66a11.92 11.92 0 005.74 1.48h.01c6.58 0 11.94-5.36 11.94-11.94 0-3.18-1.24-6.17-3.47-8.4zM12.05 21.7h-.01a9.8 9.8 0 01-5-1.37l-.36-.21-3.74.99 1-3.64-.23-.38a9.78 9.78 0 01-1.51-5.16c0-5.41 4.4-9.81 9.85-9.81 2.63 0 5.1 1.02 6.96 2.88a9.78 9.78 0 012.88 6.95c0 5.42-4.4 9.75-9.84 9.75zm5.4-7.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.34.22-.63.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.1 4.49 2.54 1.07 3.04.86 3.59.8.55-.07 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
        </svg>

        {showInvite && (
          <span className="absolute -top-0.5 -right-0.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5842] text-white font-mono text-[9px] font-bold ring-2 ring-[#F7F5F2]">
            1
          </span>
        )}
      </motion.a>
    </div>
  );
}
