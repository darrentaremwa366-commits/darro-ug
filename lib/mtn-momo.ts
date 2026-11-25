import type { CartItem } from "./store";
import { formatUGX } from "./store";
import productsData from "@/data/products.json";

export interface MoMoWhatsAppOrderTotals {
  displayTotal: number;
  memberDiscountActive: boolean;
  bundleDiscountUGX: number;
  totalSaved: number;
}

export interface MoMoOrderInputs {
  orderRef: string;
  transactionId: string;
  customerName: string;
  deliveryCity: string;
}

/**
 * Generate a unique Darro order reference.
 * Format: DARRO-YYYYMMDD-4digits
 * Example: DARRO-20261116-7348
 *
 * Client-safe — no API call, no backend. Used to cross-reference the
 * payment against the merchant's MoMo statement by amount + date + ref.
 */
export function generateOrderRef(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `DARRO-${yyyy}${mm}${dd}-${digits}`;
}

/**
 * Build the WhatsApp message Darro receives when a customer pays via
 * MTN MoMo USSD merchant code. The message contains everything Darro
 * needs to match the payment on their MoMo statement:
 *   - Unique order reference
 *   - Exact amount the customer claims to have paid
 *   - Transaction ID (MoMo receipt)
 *   - Customer name + delivery city (helps match by MSISDN on statement)
 */
export function buildMoMoWhatsAppMessage(
  items: CartItem[],
  totals: MoMoWhatsAppOrderTotals,
  inputs: MoMoOrderInputs,
  merchantCode: string,
  ussdCode: string,
): string {
  const lines: string[] = [];

  lines.push("Hello Darro — paid via MTN MoMo.");
  lines.push(`Order Ref: ${inputs.orderRef}`);
  lines.push("");
  lines.push("— ORDER —");

  items.forEach((item, idx) => {
    const unit = item.memberApplied
      ? findMemberDisplayPrice(item.productId) ?? item.priceUGX
      : item.priceUGX;
    const lineTotal = unit * item.quantity;
    lines.push(`${idx + 1}. ${item.name} (Size: ${item.size})`);
    lines.push(`   Qty: ${item.quantity}  ·  ${formatUGX(lineTotal)}`);
    if (item.memberApplied) lines.push(`   Darro Club member price`);
  });

  if (totals.bundleDiscountUGX > 0) {
    lines.push(`Bundle Discount: -${formatUGX(totals.bundleDiscountUGX)}`);
  }
  if (totals.totalSaved > 0) {
    lines.push(`Total saved: ${formatUGX(totals.totalSaved)}`);
  }

  lines.push("");
  lines.push(`TOTAL PAID: ${formatUGX(totals.displayTotal)}`);
  lines.push("");
  lines.push("— PAYMENT —");
  lines.push(`Method: MTN MoMo USSD ${ussdCode}`);
  lines.push(`Merchant code used: ${merchantCode}`);
  lines.push(`Transaction ID: ${inputs.transactionId.trim()}`);
  lines.push("");
  lines.push("— DELIVERY —");
  lines.push(`Name: ${inputs.customerName.trim() || "[missing]"}`);
  lines.push(`City: ${inputs.deliveryCity.trim() || "[missing]"}`);
  lines.push("");
  lines.push("Thank you.");

  return lines.join("\n");
}

function findMemberDisplayPrice(productId: number): number | null {
  const product = productsData.find(
    (p: { id: number; memberPriceUGX?: number }) => p.id === productId,
  );
  return product?.memberPriceUGX ?? null;
}
