"use client";

import { useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { playbooks, phaseMeta } from "@/data/whatsapp-playbooks";

// ─── Sample conversation data derived from playbooks ──────
interface ConversationRow {
  id: string;
  playbookId: string;
  customer: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  orderRef: string;
  orderStatus: "NEW" | "CONFIRMED" | "PROCESSING" | "OUT FOR DELIVERY" | "COMPLETED";
  phase: string;
  unread: boolean;
}

const conversations: ConversationRow[] = [
  {
    id: "c1",
    playbookId: "speed-to-lead",
    customer: "Joshua",
    phone: "+256 701 234 567",
    lastMessage: "That's all. Thank you!",
    timestamp: "10:36 AM",
    orderRef: "DRO-2026-0142",
    orderStatus: "CONFIRMED",
    phase: "speed-to-lead",
    unread: false,
  },
  {
    id: "c2",
    playbookId: "delivery",
    customer: "Joshua",
    phone: "+256 701 234 567",
    lastMessage: "Yes, received! The jersey is amazing. MESSI 10 looks 🔥",
    timestamp: "12:20 PM",
    orderRef: "DRO-2026-0142",
    orderStatus: "COMPLETED",
    phase: "delivery",
    unread: false,
  },
  {
    id: "c3",
    playbookId: "drop-announcement",
    customer: "Sarah",
    phone: "+256 772 345 678",
    lastMessage: "Got it Sarah! 🎉 Argentina World Cup — Size M...",
    timestamp: "Thu 10:02 AM",
    orderRef: "DRO-2026-0156",
    orderStatus: "CONFIRMED",
    phase: "drop-announcement",
    unread: false,
  },
  {
    id: "c4",
    playbookId: "reactivation",
    customer: "David",
    phone: "+256 759 456 789",
    lastMessage: "Awesome, David! 🎉 Argentina WC — Size M...",
    timestamp: "Wed 10:34 AM",
    orderRef: "DRO-2026-0163",
    orderStatus: "PROCESSING",
    phase: "reactivation",
    unread: false,
  },
  {
    id: "c5",
    playbookId: "upsell",
    customer: "Joshua",
    phone: "+256 701 234 567",
    lastMessage: "Locked in, Joshua! 🎉 Portugal WC Jersey (M)...",
    timestamp: "Mon 11:22 AM",
    orderRef: "DRO-2026-0171",
    orderStatus: "CONFIRMED",
    phase: "upsell",
    unread: true,
  },
];

const statusColors: Record<string, string> = {
  NEW: "#3B82F6",
  CONFIRMED: "#10B981",
  PROCESSING: "#F59E0B",
  "OUT FOR DELIVERY": "#8B5CF6",
  COMPLETED: "#6B7280",
};

function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] || "#6B7280";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState("c5");
  const selected = conversations.find((c) => c.id === selectedId);
  const selectedPlaybook = selected
    ? playbooks.find((p) => p.id === selected.playbookId)
    : null;

  // Stats
  const totalConvos = conversations.length;
  const activeOrders = conversations.filter(
    (c) => c.orderStatus !== "COMPLETED"
  ).length;
  const completedOrders = conversations.filter(
    (c) => c.orderStatus === "COMPLETED"
  ).length;
  const unreadCount = conversations.filter((c) => c.unread).length;

  return (
    <AdminLayout
      title="Conversations"
      subtitle="WhatsApp agent activity & order tracking"
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            Total Conversations
          </p>
          <p className="font-heading text-2xl text-[var(--color-ink)] mt-1">
            {totalConvos}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            Active Orders
          </p>
          <p className="font-heading text-2xl text-[var(--color-ink)] mt-1">
            {activeOrders}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            Completed
          </p>
          <p className="font-heading text-2xl text-[var(--color-ink)] mt-1">
            {completedOrders}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-stone)]">
            Unread
          </p>
          <p className="font-heading text-2xl text-[#FF5842] mt-1">
            {unreadCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Conversation list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)]">
              Recent Conversations
            </h3>
            <Link
              href="/simulator"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#128C7E] hover:underline"
            >
              Open Simulator →
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] overflow-hidden">
            {conversations.map((conv, idx) => {
              const meta = phaseMeta[conv.phase as keyof typeof phaseMeta];
              const isActive = conv.id === selectedId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-left flex items-start gap-3 p-4 transition-colors ${
                    isActive
                      ? "bg-[var(--color-bone)]"
                      : "hover:bg-[var(--color-bone)]/50"
                  } ${idx > 0 ? "border-t border-[var(--color-sand)]" : ""}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold text-sm">
                      {conv.customer[0]}
                    </div>
                    {conv.unread && (
                      <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#FF5842] border-2 border-[var(--color-background)]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-heading text-[13px] text-[var(--color-ink)] truncate">
                        {conv.customer}
                      </p>
                      <span className="font-mono text-[9px] text-[var(--color-stone)] shrink-0">
                        {conv.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-charcoal)] truncate">
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] bg-[var(--color-sand)] text-[var(--color-charcoal)]">
                        {meta?.icon} {meta?.label}
                      </span>
                      <StatusBadge status={conv.orderStatus} />
                      <span className="font-mono text-[8px] text-[var(--color-stone)]">
                        {conv.orderRef}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Order pipeline */}
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mt-6 mb-3">
            Order Pipeline
          </h3>
          <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] p-4">
            <div className="flex items-center justify-between gap-2">
              {["NEW", "CONFIRMED", "PROCESSING", "OUT FOR DELIVERY", "COMPLETED"].map(
                (status, idx) => {
                  const count = conversations.filter(
                    (c) => c.orderStatus === status
                  ).length;
                  const color = statusColors[status];
                  return (
                    <div key={status} className="flex items-center flex-1">
                      <div className="flex flex-col items-center text-center flex-1">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-xs mb-1"
                          style={{ backgroundColor: color }}
                        >
                          {count}
                        </div>
                        <span className="font-mono text-[7px] uppercase tracking-[0.1em] text-[var(--color-stone)] leading-tight">
                          {status}
                        </span>
                      </div>
                      {idx < 4 && (
                        <div className="h-px flex-1 bg-[var(--color-sand)] mb-5 mx-1" />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {selected && selectedPlaybook ? (
            <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] p-5 sticky top-20">
              {/* Conversation header */}
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-sand)]">
                <div className="h-12 w-12 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold">
                  {selected.customer[0]}
                </div>
                <div>
                  <p className="font-heading text-[15px] text-[var(--color-ink)]">
                    {selected.customer}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--color-stone)]">
                    {selected.phone}
                  </p>
                </div>
              </div>

              {/* Conversation details */}
              <div className="py-4 space-y-3 border-b border-[var(--color-sand)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-stone)]">
                    Order Ref
                  </span>
                  <span className="font-mono text-[11px] text-[var(--color-ink)]">
                    {selected.orderRef}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-stone)]">
                    Order Status
                  </span>
                  <StatusBadge status={selected.orderStatus} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-stone)]">
                    Playbook
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-ink)]">
                    {phaseMeta[selected.phase as keyof typeof phaseMeta]?.icon}{" "}
                    {phaseMeta[selected.phase as keyof typeof phaseMeta]?.label}
                  </span>
                </div>
              </div>

              {/* Playbook info */}
              <div className="py-4 space-y-2 border-b border-[var(--color-sand)]">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--color-stone)] mb-1">
                    Trigger
                  </p>
                  <p className="text-[11px] text-[var(--color-charcoal)] leading-snug">
                    {selectedPlaybook.trigger}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--color-stone)] mb-1">
                    Outcome
                  </p>
                  <p className="text-[11px] text-[var(--color-charcoal)] leading-snug">
                    {selectedPlaybook.outcome}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col gap-2">
                <Link
                  href="/simulator"
                  className="text-center rounded-lg bg-[#128C7E] text-white py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-[#0d7266] transition-colors"
                >
                  ▶ View in Simulator
                </Link>
                <button className="text-center rounded-lg border border-[var(--color-sand)] text-[var(--color-charcoal)] py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] hover:bg-[var(--color-bone)] transition-colors">
                  Mark as Read
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] p-8 text-center">
              <p className="text-[var(--color-stone)] text-sm">
                Select a conversation to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Agent activity log */}
      <div className="mt-6">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-stone)] mb-3">
          Agent Activity Log
        </h3>
        <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-background)] p-5">
          <div className="space-y-3">
            {conversations.slice().reverse().map((conv) => {
              const meta = phaseMeta[conv.phase as keyof typeof phaseMeta];
              return (
                <div
                  key={conv.id}
                  className="flex items-start gap-3 pb-3 border-b border-[var(--color-sand)] last:border-0 last:pb-0"
                >
                  <span className="text-base shrink-0">{meta?.icon}</span>
                  <div className="flex-1">
                    <p className="text-[12px] text-[var(--color-ink)]">
                      <span className="font-medium">{conv.customer}</span> —{" "}
                      <span className="text-[var(--color-charcoal)]">
                        {meta?.label}
                      </span>
                    </p>
                    <p className="text-[10px] text-[var(--color-stone)] mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-mono text-[9px] text-[var(--color-stone)]">
                      {conv.timestamp}
                    </span>
                    <StatusBadge status={conv.orderStatus} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
