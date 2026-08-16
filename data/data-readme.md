# Data Files Reference

This folder contains all content and configuration that changes per client / per deployment.

**Rule #1**: No hardcoded prices, phone numbers, delivery lines, league names, or social URLs directly in components. If a page needs it, add a field to the appropriate JSON here and import it.

---

## `brand.json`

**What it is**: Single source of truth for brand identity, contact info, Darro Club membership program, and delivery terms.

**Used by**:
- `Navbar.tsx` — brand name, tagline
- `Footer.tsx` — social links, contact email, delivery line
- `FloatingWhatsApp.tsx` / `FloatingWhatsAppWidget.tsx` — WhatsApp phone number
- `app/page.tsx` — homepage hero tagline, worldValues for storytelling, Darro Club CTA section, delivery trust badges
- `app/membership` page — club headline, benefits, consent text, free delivery zone
- Cart drawer, checkout flow — WhatsApp group link, delivery timeline

**Always update first** for any client. Missing fields cause 404s or broken social links.

---

## `products.json`

**What it is**: The entire catalog. Each object = one SKU / product detail page.

**Used by**:
- `/shop` page — grid listing, search/filter (by league, team)
- `/shop/[slug]` dynamic route — renders product page (gallery, description, sizing, price, related products)
- `/collections` page — groups by league
- Homepage "Best Sellers" — filtered by `isBestSeller: true`
- Admin `/admin/products` — product management table (15 rows)
- Cart & WhatsApp order builder — validates size selection, shows member vs regular price

**Key fields**:
- `stockStatus: "inStock" | "lowStock" | "soldOut"` — controls badge visibility, not removal from catalog (sold-out items stay for SEO/scarcity)
- `relatedProducts[]` — slugs of 3 other jerseys shown on the PDP
- `memberPriceUGX` — required if the product should show Darro Club pricing. Keep it ~10-12% below `regularPriceUGX`.
- `images[]` — put placeholder paths first (`/images/products/slug-1.jpg`), replace with real JPEGs once available.

---

## `offers.json`

**What it is**: Promotional bundles, BOGO offers, quantity discounts, and product badge labels.

**Used by**:
- `lib/store.tsx` → `calculateCartTotals()` — auto-applies "bundle-2" (buy 2 save UGX 5k) and "bundle-1" (league + free WC jersey) rules.
- `ProductCard`, Product pages — surfaces `productBadges[]` ribbons.
- Admin `/admin/marketing` page — bundle list, edit skeleton, badge manager.

**Notes**:
- Toggling a bundle `active: false` in the JSON disables the discount globally (rebuild required, admin toggle is UI-only in v1).
- `triggerLeague[]` vs `minQuantity` are mutually exclusive patterns; pick one per bundle.

---

## `reviews.json`

**What it is**: Verified customer reviews, attached to products by `productId`.

**Used by**:
- Product detail page — review count, average rating, "verified buyer" carousel
- Homepage — social proof / review quotes section (pick top 3-4 by rating)

**Content note**: Real reviews should include `verified: true`, realistic Ugandan names, and specific comments (fit, fabric, delivery speed). Generic 5-star-only text hurts conversion.
