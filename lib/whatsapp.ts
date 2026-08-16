import type { CartItem } from "./store";
import { formatUGX } from "./store";
import productsData from "@/data/products.json";

export interface WhatsappOrderCustomizations {
  jerseyBackName?: string;
  jerseyNumber?: string;
  notes?: string;
}

export interface WhatsappOrderTotals {
  subtotalRegular: number;
  bundleDiscountUGX: number;
  memberTotal: number;
  totalSaved: number;
}

export function buildWhatsAppOrderMessage(
  items: CartItem[],
  totals: WhatsappOrderTotals,
  isMember: boolean,
  customerName?: string,
  deliveryLocation?: string,
  customizations?: WhatsappOrderCustomizations,
): string {
  const lines: string[] = [];

  lines.push("Hello Darro, I want to place an order:");
  lines.push("");
  lines.push("— ORDER DETAILS —");

  items.forEach((item, idx) => {
    const unit = item.memberApplied
      ? findMemberDisplayPrice(item.productId) ?? item.priceUGX
      : item.priceUGX;
    const lineTotal = unit * item.quantity;

    lines.push(
      `${idx + 1}. ${item.name} (Size: ${item.size})`,
    );
    lines.push(
      `   Qty: ${item.quantity}  ·  ${formatUGX(lineTotal)}`,
    );

    if (item.memberApplied) {
      lines.push(`   Darro Club member price applied`);
    }

    if (idx < items.length - 1) {
      lines.push("");
    }
  });

  lines.push("");
  lines.push(`Subtotal: ${formatUGX(totals.subtotalRegular)}`);
  lines.push(`Bundle Discount: -${formatUGX(totals.bundleDiscountUGX)}`);
  lines.push(`Darro Club Member: ${isMember ? "Yes" : "No"}`);

  const grandTotal = isMember ? totals.memberTotal : totals.subtotalRegular - totals.bundleDiscountUGX;
  lines.push(`Total: ${formatUGX(Math.max(0, grandTotal))}`);

  if (totals.totalSaved > 0) {
    lines.push(`You saved: ${formatUGX(totals.totalSaved)} 🎉`);
  }

  if (customizations?.jerseyBackName || customizations?.jerseyNumber) {
    lines.push("");
    lines.push("— CUSTOMIZATION —");
    if (customizations.jerseyBackName) {
      lines.push(`Back name: ${customizations.jerseyBackName}`);
    }
    if (customizations.jerseyNumber) {
      lines.push(`Number: ${customizations.jerseyNumber}`);
    }
  }

  if (customizations?.notes) {
    lines.push("");
    lines.push("— NOTES —");
    lines.push(customizations.notes);
  }

  lines.push("");
  lines.push(`Delivery location: ${deliveryLocation ?? "[________]"}`);
  lines.push(`Name: ${customerName ?? "[________]"}`);
  lines.push(`WhatsApp number: [________]`);
  lines.push("");
  lines.push("Thank you.");

  return lines.join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = cleanPhoneIntl(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

/**
 * Cleans any phone number for wa.me (international format without + or spaces).
 * Examples:
 *   "+86 158 1740 4017" → "8615817404017"
 *   "+256 701 234 567" → "256701234567"
 *   "0701234567" (Uganda) → "256701234567"  (legacy Uganda shortcut)
 */
export function cleanPhoneIntl(raw: string): string {
  let cleaned = raw.replace(/[+\s-()]/g, "");

  // Legacy Uganda shortcut: if user typed 0xxx... (no country code) → assume +256
  if (cleaned.startsWith("0") && cleaned.length <= 10) {
    cleaned = "256" + cleaned.slice(1);
  }

  cleaned = cleaned.replace(/\D/g, "");

  return cleaned;
}

// Backward compat alias (in case anything still imports cleanPhoneUG)
export const cleanPhoneUG = cleanPhoneIntl;

function findMemberDisplayPrice(productId: number): number | null {
  const product = productsData.find((p: { id: number; memberPriceUGX?: number }) => p.id === productId);
  return product?.memberPriceUGX ?? null;
}
