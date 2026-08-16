"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  playbooks,
  phaseMeta,
  type Playbook,
  type PlaybookMessage,
} from "@/data/whatsapp-playbooks";

// ─── Helpers ──────────────────────────────────────────────────
function formatTime(ts: string) {
  // Just show the time portion after the last space
  const parts = ts.split(" ");
  return parts[parts.length - 1];
}

// ─── WhatsApp Logo SVG ───────────────────────────────────────
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.52 3.48A11.88 11.88 0 0012.04 0C5.46 0 .1 5.36.1 11.94c0 2.1.56 4.14 1.62 5.94L0 24l6.3-1.66a11.92 11.92 0 005.74 1.48h.01c6.58 0 11.94-5.36 11.94-11.94 0-3.18-1.24-6.17-3.47-8.4zM12.05 21.7h-.01a9.8 9.8 0 01-5-1.37l-.36-.21-3.74.99 1-3.64-.23-.38a9.78 9.78 0 01-1.51-5.16c0-5.41 4.4-9.81 9.85-9.81 2.63 0 5.1 1.02 6.96 2.88a9.78 9.78 0 012.88 6.95c0 5.42-4.4 9.75-9.84 9.75zm5.4-7.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.34.22-.63.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.1 4.49 2.54 1.07 3.04.86 3.59.8.55-.07 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
    </svg>
  );
}

// ─── Typing Indicator ────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-1.5 px-3 py-2.5 bg-[#DCF8C6] rounded-[18px] rounded-tl-[6px] w-fit shadow-sm ml-1"
    >
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#128C7E]"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────
function ChatBubble({
  message,
  showAvatar,
}: {
  message: PlaybookMessage;
  showAvatar: boolean;
}) {
  const isAgent = message.sender === "agent";
  const isCustomer = message.sender === "customer";
  const isSystem = message.sender === "system";

  // System message — notification style
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto my-3 max-w-[90%] rounded-xl bg-[#FFF8E1] border border-[#FFD54F]/40 px-3 py-2.5 text-center"
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#F57C00] mb-1">
          System Update
        </p>
        <p className="text-[10.5px] leading-relaxed text-[#5D4037] whitespace-pre-line">
          {message.text}
        </p>
        <span className="font-mono text-[8px] text-[#FFA000]/60 mt-1 block">
          {formatTime(message.time)}
        </span>
      </motion.div>
    );
  }

  const bgColor = isAgent ? "bg-[#DCF8C6]" : "bg-white";
  const align = isAgent ? "self-start ml-1" : "self-end mr-1";
  const cornerRadius = isAgent
    ? "rounded-[18px] rounded-tl-[6px]"
    : "rounded-[18px] rounded-tr-[6px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex ${align} max-w-[82%] flex-col`}
    >
      {/* Agent avatar */}
      {isAgent && showAvatar && (
        <div className="flex items-center gap-1.5 mb-0.5 ml-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#128C7E] text-white">
            <WhatsAppIcon size={11} />
          </span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#075E54]">
            Darro Agent
          </span>
        </div>
      )}

      {/* Buttons type */}
      {message.type === "buttons" && message.metadata?.buttons ? (
        <div
          className={`${bgColor} ${cornerRadius} shadow-sm border ${
            isAgent ? "border-[#25D366]/20" : "border-gray-100"
          } overflow-hidden`}
        >
          <p className="px-3.5 pt-2.5 pb-2 text-[12px] leading-snug text-[#1A1A1A] whitespace-pre-line">
            {message.text}
          </p>
          <div className="flex flex-col border-t border-[#25D366]/15">
            {message.metadata.buttons.map((btn, i) => (
              <div
                key={btn.action}
                className={`px-3.5 py-2 text-[11.5px] font-medium text-[#128C7E] hover:bg-[#128C7E]/5 cursor-pointer ${
                  i > 0 ? "border-t border-[#25D366]/10" : ""
                }`}
              >
                {btn.label}
              </div>
            ))}
          </div>
          <span className="font-mono text-[8px] text-[#075E54]/50 px-3 pb-1.5 block text-right">
            {formatTime(message.time)}
          </span>
        </div>
      ) : (
        <div
          className={`${bgColor} ${cornerRadius} shadow-sm border ${
            isAgent ? "border-[#25D366]/20" : "border-gray-100"
          } px-3.5 py-2`}
        >
          {message.type === "order-summary" && (
            <p className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#128C7E] mb-1">
              Order via WhatsApp
            </p>
          )}
          <p
            className={`text-[12px] leading-snug text-[#1A1A1A] whitespace-pre-line ${
              message.type === "order-summary" ? "font-mono text-[11px]" : ""
            }`}
          >
            {message.text}
          </p>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="font-mono text-[8px] text-[#075E54]/50">
              {formatTime(message.time)}
            </span>
            {isAgent && (
              <svg
                width="13"
                height="9"
                viewBox="0 0 16 11"
                fill="none"
                className="text-[#34B7F1]"
              >
                <path
                  d="M11.07.65a.5.5 0 01.7-.04l3.5 3.2a.5.5 0 01-.66.72l-.04-.04-3.5-3.2a.5.5 0 01-.04-.7l.04-.04z"
                  fill="#34B7F1"
                />
                <path
                  d="M1 5.5l3 3 5.5-5.5"
                  stroke="#34B7F1"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 8l1 1 5.5-5.5"
                  stroke="#34B7F1"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Date Separator ──────────────────────────────────────────
function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className="px-3 py-1 rounded-full bg-[#E9F0F6] text-[#54656F] font-mono text-[9px] uppercase tracking-[0.14em]">
        {label}
      </span>
    </div>
  );
}

// ─── Main Simulator Page ──────────────────────────────────────
export default function SimulatorPage() {
  const [selectedId, setSelectedId] = useState<string>(playbooks[0].id);
  const [visibleMessages, setVisibleMessages] = useState<PlaybookMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const selectedPlaybook =
    playbooks.find((p) => p.id === selectedId) || playbooks[0];

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach((t) => clearTimeout(t));
    timeoutRefs.current = [];
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [visibleMessages, isTyping]);

  // Play sequence
  const play = useCallback(
    (pb: Playbook) => {
      clearTimeouts();
      setVisibleMessages([]);
      setIsTyping(false);
      setIsPlaying(true);

      let cumulativeDelay = 0;

      pb.messages.forEach((msg, idx) => {
        cumulativeDelay += msg.delay;

        // Typing indicator for agent messages
        if (msg.sender === "agent" && msg.typingDuration && msg.typingDuration > 0) {
          // Start typing before message appears
          const typingStartDelay = cumulativeDelay;
          const typingTimeout = setTimeout(() => {
            if (idx === 0 || pb.messages[idx - 1].sender !== "agent") {
              setIsTyping(true);
            }
          }, typingStartDelay);
          timeoutRefs.current.push(typingTimeout);

          // Show typing for the duration
          const showTypingTimeout = setTimeout(() => {
            setIsTyping(true);
          }, typingStartDelay);
          timeoutRefs.current.push(showTypingTimeout);

          // Hide typing and show message
          const showMessageTimeout = setTimeout(
            () => {
              setIsTyping(false);
              setVisibleMessages((prev) => [...prev, msg]);
            },
            typingStartDelay + msg.typingDuration / speed
          );
          timeoutRefs.current.push(showMessageTimeout);

          cumulativeDelay += msg.typingDuration / speed;
        } else {
          // No typing — just show after delay
          const showMessageTimeout = setTimeout(
            () => {
              setVisibleMessages((prev) => [...prev, msg]);
            },
            cumulativeDelay / speed
          );
          timeoutRefs.current.push(showMessageTimeout);
        }
      });

      // End playing
      const endTimeout = setTimeout(
        () => {
          setIsPlaying(false);
          setIsTyping(false);
        },
        (cumulativeDelay + 1000) / speed
      );
      timeoutRefs.current.push(endTimeout);
    },
    [clearTimeouts, speed]
  );

  // Auto-play when selecting a new playbook
  useEffect(() => {
    clearTimeouts();
    setVisibleMessages([]);
    setIsTyping(false);
    setIsPlaying(false);
    // Auto-start after short delay
    const startTimeout = setTimeout(() => {
      play(selectedPlaybook);
    }, 400);
    timeoutRefs.current.push(startTimeout);
    return () => clearTimeouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeouts(), [clearTimeouts]);

  // Get current phase progress
  const progress = selectedPlaybook
    ? Math.round((visibleMessages.length / selectedPlaybook.messages.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0B141A] text-white overflow-x-hidden">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0B141A]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#128C7E]">
              <WhatsAppIcon size={18} />
            </span>
            <div>
              <h1 className="font-heading text-base sm:text-lg leading-tight">
                WhatsApp Automation Simulator
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
                Darro · E-commerce Agent Demo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50 hover:text-white transition-colors hidden sm:block"
            >
              ← View Site
            </Link>
            <Link
              href="/admin/conversations"
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50 hover:text-white transition-colors hidden sm:block"
            >
              Admin →
            </Link>
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/60">
                Simulator Active
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* ─── Main Layout ─── */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6">
          {/* ─── Left: Scenario Selector ─── */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 mb-3">
              Automation Playbooks
            </h2>
            <div className="flex flex-col gap-2">
              {playbooks.map((pb) => {
                const meta = phaseMeta[pb.phase];
                const active = pb.id === selectedId;
                return (
                  <button
                    key={pb.id}
                    onClick={() => setSelectedId(pb.id)}
                    className={`text-left rounded-xl border p-3.5 transition-all ${
                      active
                        ? "border-white/20 bg-white/10"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg leading-none mt-0.5">
                        {meta.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-[13px] leading-tight">
                          {pb.name}
                        </p>
                        <p className="text-[10.5px] leading-snug text-white/40 mt-0.5">
                          {pb.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]"
                            style={{
                              backgroundColor: `${meta.color}30`,
                              color: meta.color,
                            }}
                          >
                            Phase {playbooks.indexOf(pb) + 1}
                          </span>
                          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">
                            {pb.messages.length} msgs
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Speed control */}
            <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-2">
                Playback Speed
              </p>
              <div className="flex gap-1.5">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 rounded-lg py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      speed === s
                        ? "bg-[#128C7E] text-white"
                        : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Center: Phone Mockup ─── */}
          <div className="flex flex-col items-center">
            {/* Phone frame */}
            <div className="relative w-full max-w-[390px]">
              {/* Phone outer frame */}
              <div className="relative rounded-[44px] bg-[#1C1C1E] p-3 shadow-[0_0_60px_-15px_rgba(0,0,0,0.7)]">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 h-6 w-32 bg-[#1C1C1E] rounded-b-[18px] flex items-center justify-center">
                  <div className="h-1.5 w-12 rounded-full bg-[#333]" />
                </div>

                {/* Screen */}
                <div className="relative rounded-[32px] overflow-hidden bg-[#ECE5DD] h-[640px] flex flex-col">
                  {/* WhatsApp chat header */}
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#075E54] text-white shrink-0 pt-7">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <div className="relative">
                      <div className="h-9 w-9 rounded-full bg-[#128C7E] flex items-center justify-center text-[13px] font-bold">
                        {selectedPlaybook.customerName[0]}
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#25D366] border-2 border-[#075E54]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium leading-tight truncate">
                        {selectedPlaybook.customerName}
                      </p>
                      <p className="text-[10px] text-white/70 leading-tight">
                        {isTyping ? "typing…" : "online"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-white/80">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15.5 1.5a3.5 3.5 0 0 1 3.5 3.5v3M9.5 1.5A3.5 3.5 0 0 0 6 5v3" strokeLinecap="round" />
                        <path d="M15 13l-3 3-3-3M12 16V8" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="3" y="5" width="18" height="15" rx="3" />
                      </svg>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Chat area */}
                  <div
                    ref={chatScrollRef}
                    className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1"
                    style={{
                      backgroundImage:
                        "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%221%22 fill=%22%23d1c7bd%22 fill-opacity=%220.3%22/></svg>')",
                      backgroundColor: "#ECE5DD",
                    }}
                  >
                    {/* Date separator */}
                    {visibleMessages.length > 0 &&
                      (() => {
                        const firstMsg = visibleMessages[0];
                        const datePart = firstMsg.time
                          .split(" ")
                          .slice(0, -1)
                          .join(" ");
                        if (datePart && !["AM", "PM"].includes(datePart)) {
                          return <DateSeparator label={datePart} />;
                        }
                        return null;
                      })()}

                    {visibleMessages.map((msg, idx) => {
                      // Check if we need a date separator between messages
                      const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
                      const datePart = msg.time
                        .split(" ")
                        .slice(0, -1)
                        .join(" ");
                      const prevDatePart = prevMsg
                        ? prevMsg.time.split(" ").slice(0, -1).join(" ")
                        : null;
                      const showDateSep =
                        prevMsg &&
                        datePart &&
                        datePart !== prevDatePart &&
                        !["AM", "PM"].includes(datePart) &&
                        !["AM", "PM"].includes(prevDatePart || "");

                      // Show avatar if previous message was from different sender
                      const prevSender = prevMsg?.sender;
                      const showAvatar =
                        msg.sender === "agent" &&
                        prevSender !== "agent";

                      return (
                        <div key={msg.id}>
                          {showDateSep && <DateSeparator label={datePart} />}
                          <ChatBubble message={msg} showAvatar={showAvatar} />
                        </div>
                      );
                    })}

                    {/* Typing indicator */}
                    <AnimatePresence>
                      {isTyping && (
                        <div className="flex items-end gap-1.5 ml-1 mb-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#128C7E] text-white shrink-0">
                            <WhatsAppIcon size={11} />
                          </span>
                          <TypingIndicator />
                        </div>
                      )}
                    </AnimatePresence>

                    <div ref={chatEndRef} />
                  </div>

                  {/* Input bar (decorative) */}
                  <div className="shrink-0 bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-[#D1D1D1]">
                    <div className="flex-1 rounded-full bg-white px-4 py-2 flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 flex-1">
                        Type a message…
                      </span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8696A0" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M9 9c0-1 .5-2 3-2s3 1 3 2-1 1.5-2 2v1M12 17v.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-[#128C7E] flex items-center justify-center shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone controls */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    if (!isPlaying && visibleMessages.length === 0) {
                      play(selectedPlaybook);
                    } else if (!isPlaying) {
                      // Reset and replay
                      play(selectedPlaybook);
                    } else {
                      // Pause — clear timeouts
                      clearTimeouts();
                      setIsPlaying(false);
                      setIsTyping(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors bg-[#128C7E] text-white hover:bg-[#0d7266]"
                >
                  {isPlaying ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                      Pause
                    </>
                  ) : visibleMessages.length > 0 &&
                    visibleMessages.length <
                      selectedPlaybook.messages.length ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Resume
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {visibleMessages.length > 0 ? "Replay" : "Play"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    clearTimeouts();
                    setVisibleMessages([]);
                    setIsTyping(false);
                    setIsPlaying(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60 hover:bg-white/10 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Reset
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-3 mx-auto max-w-[280px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">
                    Progress
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">
                    {visibleMessages.length}/{selectedPlaybook.messages.length}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#25D366]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right: Agent Activity Panel ─── */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
            {/* Current phase info */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">
                  {phaseMeta[selectedPlaybook.phase].icon}
                </span>
                <div>
                  <p className="font-heading text-[13px]">
                    {selectedPlaybook.name}
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
                    Phase {playbooks.indexOf(selectedPlaybook) + 1} of {playbooks.length}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30 mb-0.5">
                    Trigger
                  </p>
                  <p className="text-[11px] leading-snug text-white/70">
                    {selectedPlaybook.trigger}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30 mb-0.5">
                    Expected Outcome
                  </p>
                  <p className="text-[11px] leading-snug text-white/70">
                    {selectedPlaybook.outcome}
                  </p>
                </div>
              </div>
            </div>

            {/* Live stats */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-3">
                Live Stats
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/5 p-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">
                    Messages
                  </p>
                  <p className="font-heading text-lg text-white">
                    {visibleMessages.length}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">
                    Agent Replies
                  </p>
                  <p className="font-heading text-lg text-white">
                    {visibleMessages.filter((m) => m.sender === "agent").length}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">
                    Customer
                  </p>
                  <p className="font-heading text-lg text-white">
                    {visibleMessages.filter((m) => m.sender === "customer").length}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">
                    Status
                  </p>
                  <p className="font-mono text-[10px] text-[#25D366] mt-1">
                    {isPlaying ? "ACTIVE" : progress === 100 ? "DONE" : "IDLE"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dashboard updates */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-3">
                Dashboard Updates
              </p>
              <div className="space-y-2">
                {visibleMessages
                  .filter((m) => m.sender === "system")
                  .map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="rounded-lg bg-[#FFF8E1]/10 border border-[#FFD54F]/10 p-2.5"
                    >
                      <p className="text-[10px] leading-relaxed text-[#FFD54F]/80 whitespace-pre-line">
                        {msg.text}
                      </p>
                    </motion.div>
                  ))}
                {visibleMessages.filter((m) => m.sender === "system").length === 0 && (
                  <p className="text-[10px] text-white/20 italic">
                    System updates will appear here as the conversation progresses…
                  </p>
                )}
              </div>
            </div>

            {/* Deployment note */}
            <div className="rounded-xl border border-[#128C7E]/20 bg-[#128C7E]/5 p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#25D366] mb-2">
                Production Ready
              </p>
              <p className="text-[10.5px] leading-relaxed text-white/50">
                This simulator runs the same conversation playbooks that will power
                your live WhatsApp Business API agent. When you're ready to deploy,
                these flows connect directly to Meta's Cloud API — no rewrite needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
