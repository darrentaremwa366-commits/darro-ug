// ─── WhatsApp Automation Playbooks ─────────────────────────────
// Shared data structure for the WhatsApp Simulator.
// When ready to deploy with a real WhatsApp Business API,
// these playbooks become the conversation flow definitions
// wired to the API via the same engine pattern used in
// moms-school/whatsapp-system (engine.ts + flows/).
// ──────────────────────────────────────────────────────────────

export type MessageSender = "customer" | "agent" | "system";
export type MessageType = "text" | "order-summary" | "product-card" | "buttons";

export interface PlaybookButton {
  label: string;
  action: string;
}

export interface OrderItem {
  name: string;
  size: string;
  qty: number;
  priceUGX: number;
}

export interface PlaybookMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  text: string;
  /** Delay before this message appears (ms) */
  delay: number;
  /** How long the typing indicator shows before the message (ms, agent only) */
  typingDuration?: number;
  /** Simulated timestamp label */
  time: string;
  metadata?: {
    orderItems?: OrderItem[];
    orderTotalUGX?: number;
    productSlug?: string;
    productName?: string;
    productPriceUGX?: number;
    productImage?: string;
    buttons?: PlaybookButton[];
  };
}

export type PlaybookPhase =
  | "speed-to-lead"
  | "drop-announcement"
  | "reactivation"
  | "delivery"
  | "upsell";

export interface Playbook {
  id: string;
  phase: PlaybookPhase;
  name: string;
  description: string;
  customerName: string;
  customerPhone: string;
  trigger: string;
  outcome: string;
  messages: PlaybookMessage[];
}

export const playbooks: Playbook[] = [
  // ═══════════════════════════════════════════════════════════
  // PHASE 1: SPEED TO LEAD — Post-purchase order intake
  // Triggered when customer clicks "Order via WhatsApp" on website
  // ═══════════════════════════════════════════════════════════
  {
    id: "speed-to-lead",
    phase: "speed-to-lead",
    name: "Speed to Lead",
    description:
      "Customer clicks 'Order via WhatsApp' on the website. The agent confirms the order, collects delivery details, and finalizes — all in under 2 minutes.",
    customerName: "Joshua",
    customerPhone: "+256 701 234 567",
    trigger: "Customer clicked 'Order via WhatsApp' on /shop/argentina-world-cup",
    outcome: "Order confirmed · Delivery scheduled · Status: NEW → CONFIRMED",
    messages: [
      {
        id: "s1",
        sender: "customer",
        type: "order-summary",
        text: "Hello Darro, I want to place an order:\n\nORDER DETAILS\n1. Argentina World Cup Champions — Size M — Qty 1 — UGX 65,000\n\nSubtotal: UGX 65,000\nDarro Club Member: No\nTotal: UGX 65,000\n\nDelivery location: [________]\nName: [________]\nWhatsApp number: [________]\n\nThank you.",
        delay: 0,
        time: "10:32 AM",
        metadata: {
          orderItems: [
            { name: "Argentina World Cup Champions", size: "M", qty: 1, priceUGX: 65000 },
          ],
          orderTotalUGX: 65000,
        },
      },
      {
        id: "s2",
        sender: "agent",
        type: "text",
        text: "Hey Joshua! 🙌 Thanks for your order — I can see Argentina World Cup Champions, Size M, UGX 65,000.\n\nGot it. Just need a couple of details to confirm:",
        delay: 1200,
        typingDuration: 1800,
        time: "10:33 AM",
      },
      {
        id: "s3",
        sender: "agent",
        type: "buttons",
        text: "What's your delivery location?",
        delay: 600,
        typingDuration: 800,
        time: "10:33 AM",
        metadata: {
          buttons: [
            { label: "Makerere University", action: "location-makerere" },
            { label: "Kampala (other)", action: "location-kampala" },
            { label: "Outside Kampala", action: "location-outside" },
          ],
        },
      },
      {
        id: "s4",
        sender: "customer",
        type: "text",
        text: "Makerere University, Livingstone Hall",
        delay: 2000,
        time: "10:34 AM",
      },
      {
        id: "s5",
        sender: "agent",
        type: "text",
        text: "Perfect — free delivery around Makerere! 🎉\n\nHere's your confirmed order:\n\n📦 Argentina World Cup Champions\n   Size M × 1\n   UGX 65,000\n\nDelivery: Makerere University, Livingstone Hall\nDelivery fee: FREE\nTimeline: 3–5 working days\n\nWould you like to add name + number customization for UGX 10,000?",
        delay: 1000,
        typingDuration: 2000,
        time: "10:34 AM",
      },
      {
        id: "s6",
        sender: "customer",
        type: "text",
        text: "Yes please! Add MESSI 10",
        delay: 2500,
        time: "10:35 AM",
      },
      {
        id: "s7",
        sender: "agent",
        type: "text",
        text: "Love it — MESSI 10 on the back! ⚽\n\nUpdated total:\nArgentina jersey (M): UGX 65,000\nCustomization (MESSI 10): UGX 10,000\nGrand Total: UGX 75,000\n\nYour order is confirmed ✅\nReference: DRO-2026-0142\n\nI'll message you when it ships. Anything else?",
        delay: 1000,
        typingDuration: 2200,
        time: "10:35 AM",
      },
      {
        id: "s8",
        sender: "customer",
        type: "text",
        text: "That's all. Thank you!",
        delay: 1800,
        time: "10:36 AM",
      },
      {
        id: "s9",
        sender: "agent",
        type: "text",
        text: "You're welcome, Joshua! 🙏\n\nQuick tip: Join Darro Club to get UGX 5,000 off your next jersey + early access to drops. Want the link?",
        delay: 800,
        typingDuration: 1500,
        time: "10:36 AM",
      },
      {
        id: "s10",
        sender: "system",
        type: "text",
        text: "✅ Order DRO-2026-0142 confirmed\n📊 Admin dashboard updated: NEW → CONFIRMED\n⏱️ Response time: 3 minutes 42 seconds",
        delay: 1500,
        time: "10:37 AM",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 2: DROP ANNOUNCEMENT — Pre-sale sequence
  // Triggered 3 days before a new drop
  // ═══════════════════════════════════════════════════════════
  {
    id: "drop-announcement",
    phase: "drop-announcement",
    name: "Drop Announcement",
    description:
      "3-day countdown sequence before a new jersey drop. Builds urgency from announcement to sell-out. Sent to Darro Club members.",
    customerName: "Sarah",
    customerPhone: "+256 772 345 678",
    trigger: "Scheduled broadcast — 3 days before Argentina/Portugal restock",
    outcome: "Customer orders during early access · Conversion achieved",
    messages: [
      {
        id: "d1",
        sender: "agent",
        type: "text",
        text: "🚨 DARRO CLUB — NEW DROP INCOMING\n\nArgentina & Portugal World Cup jerseys restock this Thursday.\n\n⏰ Darro Club early access: 10 AM\n🔓 General access: 2 PM\n\nMember price: UGX 60,000 (save UGX 5,000)\n\nOnly 8 units available. Reply REMIND to get a ping when the drop goes live.",
        delay: 0,
        typingDuration: 0,
        time: "Mon 9:00 AM",
      },
      {
        id: "d2",
        sender: "customer",
        type: "text",
        text: "REMIND",
        delay: 3000,
        time: "Mon 9:04 AM",
      },
      {
        id: "d3",
        sender: "agent",
        type: "text",
        text: "You're on the list, Sarah! ✅\n\nI'll ping you Thursday at 9:55 AM — 5 minutes before early access opens. You'll get first pick of sizes.",
        delay: 1000,
        typingDuration: 1200,
        time: "Mon 9:05 AM",
      },
      // T-1 day
      {
        id: "d4",
        sender: "agent",
        type: "text",
        text: "⏰ TOMORROW — Argentina & Portugal drop\n\nSarah, you're on the early access list. Here's your timeline:\n\n🕘 9:55 AM — Reminder ping\n🔟 10:00 AM — Early access opens (your link)\n📦 Sizes: S, M, L, XL available\n💰 Member price: UGX 60,000\n\nOnly 8 units. Last restock sold out in 2 hours.",
        delay: 4000,
        typingDuration: 1800,
        time: "Wed 9:00 AM",
      },
      {
        id: "d5",
        sender: "customer",
        type: "text",
        text: "Can I reserve a Size M now?",
        delay: 3000,
        time: "Wed 9:15 AM",
      },
      {
        id: "d6",
        sender: "agent",
        type: "text",
        text: "I wish! 😅 But to keep it fair for all Darro Club members, reservations open at 10 AM tomorrow.\n\nYou're first on the list though — I'll send your direct order link at 9:55 AM. You'll have a 5-minute head start before everyone else.",
        delay: 1000,
        typingDuration: 1600,
        time: "Wed 9:16 AM",
      },
      // Drop day
      {
        id: "d7",
        sender: "agent",
        type: "text",
        text: "🔴 DROP LIVE IN 5 MINUTES\n\nSarah, early access opens at 10:00 AM sharp.\n\nArgentina World Cup — Size M available\nPortugal World Cup — S, M, L available\n\nYour direct WhatsApp order link is coming at 10:00. Be ready! 🏃",
        delay: 5000,
        typingDuration: 1200,
        time: "Thu 9:55 AM",
      },
      {
        id: "d8",
        sender: "agent",
        type: "buttons",
        text: "🟢 EARLY ACCESS OPEN\n\nArgentina World Cup Champions — Size M\nMember price: UGX 60,000 (save UGX 5,000)\n\nOrder now before it's gone — only 3 Size M left!",
        delay: 5000,
        typingDuration: 1000,
        time: "Thu 10:00 AM",
        metadata: {
          buttons: [
            { label: "Order Argentina M", action: "order-argentina-m" },
            { label: "Order Portugal M", action: "order-portugal-m" },
            { label: "Order both (bundle)", action: "order-bundle" },
          ],
        },
      },
      {
        id: "d9",
        sender: "customer",
        type: "text",
        text: "Order Argentina M please!",
        delay: 2500,
        time: "Thu 10:01 AM",
      },
      {
        id: "d10",
        sender: "agent",
        type: "text",
        text: "Got it Sarah! 🎉\n\nArgentina World Cup Champions — Size M\nMember price: UGX 60,000\n\nOrder confirmed ✅\nRef: DRO-2026-0156\n\nDelivery: 3–5 working days. I'll update you when it ships. Enjoy your jersey! ⚽",
        delay: 800,
        typingDuration: 1800,
        time: "Thu 10:02 AM",
      },
      {
        id: "d11",
        sender: "system",
        type: "text",
        text: "✅ Drop converted — Sarah ordered during early access\n📊 Drop stats: 5/8 units sold in first 10 minutes\n⏱️ Sarah's response time: 1 minute after drop went live",
        delay: 2000,
        time: "Thu 10:03 AM",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 3: REACTIVATION — Abandoned cart / win-back
  // Triggered when cart is abandoned for 24 hours
  // ═══════════════════════════════════════════════════════════
  {
    id: "reactivation",
    phase: "reactivation",
    name: "Cart Reactivation",
    description:
      "3-day win-back sequence for a customer who added a jersey to cart but didn't complete the order. Escalates from gentle reminder to time-sensitive discount.",
    customerName: "David",
    customerPhone: "+256 759 456 789",
    trigger: "Cart abandoned 24 hours ago — Argentina jersey, Size M, was in cart",
    outcome: "Customer returns and completes purchase with discount code",
    messages: [
      // Day 1
      {
        id: "r1",
        sender: "agent",
        type: "text",
        text: "Hey David 👋\n\nI noticed you had an Argentina World Cup jersey (Size M) in your cart but didn't finish checking out.\n\nStill interested? I can hold it for you for 24 hours — no pressure. Just reply HOLD and I'll reserve it.",
        delay: 0,
        typingDuration: 0,
        time: "Tue 2:00 PM",
      },
      {
        id: "r2",
        sender: "customer",
        type: "text",
        text: "Hey, sorry I got distracted. I do want it but I'm not sure about the price.",
        delay: 4000,
        time: "Tue 2:15 PM",
      },
      {
        id: "r3",
        sender: "agent",
        type: "text",
        text: "No worries at all! 💬\n\nThe Argentina World Cup jersey is UGX 65,000. If you join Darro Club (it's free), you unlock member pricing at UGX 60,000 — that's UGX 5,000 off instantly.\n\nWant me to share the Darro Club link?",
        delay: 1000,
        typingDuration: 1800,
        time: "Tue 2:17 PM",
      },
      {
        id: "r4",
        sender: "customer",
        type: "text",
        text: "Hmm, let me think about it.",
        delay: 5000,
        time: "Tue 2:20 PM",
      },
      {
        id: "r5",
        sender: "agent",
        type: "text",
        text: "Of course, take your time! 🙏\n\nJust a heads-up: we only have 2 Size M left in stock. I'll hold one for you until tomorrow evening. No obligation — just reply ORDER when you're ready.",
        delay: 1000,
        typingDuration: 1500,
        time: "Tue 2:21 PM",
      },
      // Day 2
      {
        id: "r6",
        sender: "agent",
        type: "text",
        text: "Quick reminder, David ⏰\n\nI've held the Argentina jersey (Size M) for you, but the hold expires tonight at 6 PM.\n\nCurrent stock: Only 2 Size M remaining. If you'd like to grab it, just reply ORDER.\n\nStill thinking? No problem — just let me know and I'll release the hold.",
        delay: 6000,
        typingDuration: 1500,
        time: "Wed 10:00 AM",
      },
      {
        id: "r7",
        sender: "customer",
        type: "text",
        text: "Okay I'll order. But can I get the member price?",
        delay: 4000,
        time: "Wed 10:30 AM",
      },
      {
        id: "r8",
        sender: "agent",
        type: "text",
        text: "I can do you one better, David 💪\n\nSince you came back, here's a special reactivation code:\n\n💳 Code: COMEBACK10\nUGX 10,000 off your Argentina jersey\n\nThat brings it to UGX 55,000 — the lowest price we've ever offered.\n\nExpires in 24 hours. Want to order now?",
        delay: 1000,
        typingDuration: 2000,
        time: "Wed 10:31 AM",
      },
      {
        id: "r9",
        sender: "customer",
        type: "text",
        text: "Yes! Let me order now. COMEBACK10",
        delay: 2000,
        time: "Wed 10:33 AM",
      },
      {
        id: "r10",
        sender: "agent",
        type: "text",
        text: "Awesome, David! 🎉\n\nArgentina World Cup Champions — Size M\nOriginal: UGX 65,000\nCode COMEBACK10: -UGX 10,000\nTotal: UGX 55,000\n\nOrder confirmed ✅\nRef: DRO-2026-0163\n\nDelivery: 3–5 working days. Where should we deliver?",
        delay: 800,
        typingDuration: 1800,
        time: "Wed 10:34 AM",
      },
      {
        id: "r11",
        sender: "system",
        type: "text",
        text: "✅ Abandoned cart recovered\n📊 Reactivation: 2-day sequence, UGX 10,000 discount code\n💰 Revenue recovered: UGX 55,000\n⏱️ Cart was abandoned for 44 hours before conversion",
        delay: 2000,
        time: "Wed 10:35 AM",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 4: DELIVERY CONFIRMATION — Post-shipment tracking
  // Triggered when order is marked as "Out for Delivery"
  // ═══════════════════════════════════════════════════════════
  {
    id: "delivery",
    phase: "delivery",
    name: "Delivery Confirmation",
    description:
      "Customer receives delivery updates from shipment to doorstep. When they confirm receipt, the admin dashboard auto-updates the order to COMPLETED.",
    customerName: "Joshua",
    customerPhone: "+256 701 234 567",
    trigger: "Order DRO-2026-0142 marked as 'Out for Delivery'",
    outcome: "Customer confirms delivery · Order status: OUT FOR DELIVERY → COMPLETED",
    messages: [
      {
        id: "v1",
        sender: "agent",
        type: "text",
        text: "📦 ORDER SHIPPED\n\nHey Joshua! Your order is on the way.\n\nRef: DRO-2026-0142\nArgentina World Cup Champions — Size M\nCustomization: MESSI 10\n\nYour rider will deliver within 3–5 working days. I'll message you the morning of delivery.",
        delay: 0,
        typingDuration: 0,
        time: "Mon 8:00 AM",
      },
      {
        id: "v2",
        sender: "customer",
        type: "text",
        text: "Great! Thank you 🙏",
        delay: 2000,
        time: "Mon 8:05 AM",
      },
      // Delivery day
      {
        id: "v3",
        sender: "agent",
        type: "text",
        text: "🚀 OUT FOR DELIVERY\n\nJoshua, your jersey is out for delivery today!\n\nRider: Emmanuel\nEstimated arrival: 11 AM – 1 PM\nAmount due: UGX 75,000 (cash on delivery)\n\nPlease have the amount ready. The rider will call you when he's 10 minutes away.",
        delay: 5000,
        typingDuration: 1500,
        time: "Wed 9:00 AM",
      },
      {
        id: "v4",
        sender: "customer",
        type: "text",
        text: "Perfect, I'll be at Livingstone Hall. Should I wait outside?",
        delay: 3000,
        time: "Wed 9:10 AM",
      },
      {
        id: "v5",
        sender: "agent",
        type: "text",
        text: "No need to wait outside 😊\n\nEmmanuel will call you when he arrives at Makerere. Just come down to pick it up — takes 2 minutes.\n\nSee you soon! ⚽",
        delay: 1000,
        typingDuration: 1400,
        time: "Wed 9:11 AM",
      },
      // Delivered
      {
        id: "v6",
        sender: "agent",
        type: "buttons",
        text: "✅ DELIVERED\n\nYour rider has marked this as delivered. Did you receive your jersey?\n\nReply YES to confirm, or NO if there's an issue.",
        delay: 6000,
        typingDuration: 1000,
        time: "12:15 PM",
        metadata: {
          buttons: [
            { label: "Yes, received!", action: "confirm-delivery" },
            { label: "No, not yet", action: "issue-delivery" },
          ],
        },
      },
      {
        id: "v7",
        sender: "customer",
        type: "text",
        text: "Yes, received! The jersey is amazing. MESSI 10 looks 🔥",
        delay: 2000,
        time: "12:20 PM",
      },
      {
        id: "v8",
        sender: "agent",
        type: "text",
        text: "So glad you love it, Joshua! 🎉⚽\n\nYour order is now complete. Here's a quick recap:\n\n✅ Order DRO-2026-0142 — COMPLETED\n Argentina WC Jersey (M) + MESSI 10\n Total: UGX 75,000\n Delivered: Makerere University\n\n📸 Share a pic wearing it and tag @darro on Instagram for a chance to win a free jersey next drop!\n\nThanks for building with Darro. 🙏",
        delay: 800,
        typingDuration: 2200,
        time: "12:22 PM",
      },
      {
        id: "v9",
        sender: "system",
        type: "text",
        text: "✅ Delivery confirmed by customer\n📊 Admin dashboard updated: OUT FOR DELIVERY → COMPLETED\n📦 Order DRO-2026-0142 closed\n⏱️ Delivery time: 3 working days",
        delay: 1500,
        time: "12:23 PM",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 5: UPSELL / CROSS-SELL — Post-purchase
  // Triggered 7 days after first purchase
  // ═══════════════════════════════════════════════════════════
  {
    id: "upsell",
    phase: "upsell",
    name: "Cross-Sell / Upsell",
    description:
      "7 days after purchase, the agent checks in with the customer and offers a complementary jersey at a bundle discount. Uses purchase history to personalize.",
    customerName: "Joshua",
    customerPhone: "+256 701 234 567",
    trigger: "7 days after order DRO-2026-0142 (Argentina jersey delivered)",
    outcome: "Customer adds Portugal jersey · Bundle order placed · AOV increased by 85%",
    messages: [
      {
        id: "u1",
        sender: "agent",
        type: "text",
        text: "Hey Joshua! 👋\n\nHope you're loving the Argentina jersey! How's the MESSI 10 looking? ⚽\n\nQuick question — we just restocked Portugal World Cup jerseys. Since you already have Argentina, I thought you might want to complete the pair.",
        delay: 0,
        typingDuration: 0,
        time: "Mon 11:00 AM",
      },
      {
        id: "u2",
        sender: "customer",
        type: "text",
        text: "Oh nice! How much for the Portugal one?",
        delay: 4000,
        time: "Mon 11:10 AM",
      },
      {
        id: "u3",
        sender: "agent",
        type: "text",
        text: "Here's the thing — since you already bought Argentina, I can do a bundle deal for you:\n\n👕 Argentina (yours) — already delivered\n👕 Portugal World Cup — Size M\n\nRegular price: UGX 65,000\nBundle price for existing customers: UGX 55,000\n\nThat's UGX 10,000 off. Plus free delivery since you're at Makerere. 💪",
        delay: 1000,
        typingDuration: 2000,
        time: "Mon 11:11 AM",
      },
      {
        id: "u4",
        sender: "customer",
        type: "text",
        text: "That's a good deal. But do you have Size M? Last time it was limited.",
        delay: 3000,
        time: "Mon 11:15 AM",
      },
      {
        id: "u5",
        sender: "agent",
        type: "text",
        text: "Yes! Size M is in stock right now ✅\n\nBut just like the Argentina drop, we only have 5 units. I'd recommend grabbing it before the weekend.\n\nWant me to reserve one for you?",
        delay: 1000,
        typingDuration: 1600,
        time: "Mon 11:16 AM",
      },
      {
        id: "u6",
        sender: "customer",
        type: "text",
        text: "Yes, reserve it for me. Can I add RONALDO 7?",
        delay: 2500,
        time: "Mon 11:18 AM",
      },
      {
        id: "u7",
        sender: "agent",
        type: "text",
        text: "RONALDO 7 — let's go! 🔥\n\nHere's your bundle order:\n\n Portugal World Cup — Size M\n Customization: RONALDO 7\n Bundle price: UGX 55,000\n Customization: UGX 10,000\n Total: UGX 65,000\n\n (Original would've been UGX 75,000 — you save UGX 10,000)\n\nConfirm and I'll lock it in?",
        delay: 800,
        typingDuration: 2200,
        time: "Mon 11:19 AM",
      },
      {
        id: "u8",
        sender: "customer",
        type: "text",
        text: "Confirmed!",
        delay: 1500,
        time: "Mon 11:21 AM",
      },
      {
        id: "u9",
        sender: "agent",
        type: "text",
        text: "Locked in, Joshua! 🎉\n\nOrder confirmed ✅\nRef: DRO-2026-0171\nPortugal WC Jersey (M) + RONALDO 7\nTotal: UGX 65,000\nDelivery: Makerere University — FREE\nTimeline: 3–5 working days\n\nNow you've got both World Cup champions! 🇦🇷🇵🇹\n\nI'll message you when it ships. Enjoy! ⚽",
        delay: 800,
        typingDuration: 2000,
        time: "Mon 11:22 AM",
      },
      {
        id: "u10",
        sender: "system",
        type: "text",
        text: "✅ Upsell converted\n📊 Customer AOV: UGX 75,000 → UGX 140,000 (+85%)\n🛒 Portugal jersey sold via cross-sell\n⏱️ Conversion time: 21 minutes from first message",
        delay: 2000,
        time: "Mon 11:23 AM",
      },
    ],
  },
];

// ─── Helper: get playbook by ID ──────────────────────────────
export function getPlaybook(id: string): Playbook | undefined {
  return playbooks.find((p) => p.id === id);
}

// ─── Phase metadata for UI ───────────────────────────────────
export const phaseMeta: Record<
  PlaybookPhase,
  { label: string; icon: string; color: string; description: string }
> = {
  "speed-to-lead": {
    label: "Speed to Lead",
    icon: "⚡",
    color: "#1F5F46",
    description: "Instant order intake & confirmation",
  },
  "drop-announcement": {
    label: "Drop Announcement",
    icon: "🚨",
    color: "#B8860B",
    description: "3-day countdown to build urgency",
  },
  reactivation: {
    label: "Cart Reactivation",
    icon: "🔄",
    color: "#8B4513",
    description: "Win back abandoned carts",
  },
  delivery: {
    label: "Delivery Confirmation",
    icon: "📦",
    color: "#1B3A5B",
    description: "Track shipment to doorstep",
  },
  upsell: {
    label: "Cross-Sell / Upsell",
    icon: "📈",
    color: "#4B0082",
    description: "Increase average order value",
  },
};
