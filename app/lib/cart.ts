import { priceFor, type Product, type ProductVariant } from "./products";
import { selectVariant } from "./product-variants";

/* =========================================================
   CART PRICING RULES
   TODO: confirm every number below with the business —
   they are placeholders so the UI can be built and tested.
========================================================= */

/* Prices are GST-inclusive, so no tax line is added */
export const FREE_SHIPPING_THRESHOLD = 10000;

/* TEMPORARY (launch testing): every shipping method is free on every order. The API charges the same only while its
   FREE_SHIPPING_FOR_ALL=true setting is on; change both together, or the price shown and the amount charged differ. */
export const FREE_SHIPPING_FOR_ALL = true;

export type ShippingMethodId = "standard" | "express";

export const SHIPPING_METHODS: {
  id: ShippingMethodId;
  label: string;
  eta: string;
  price: number;
  freeAboveThreshold: boolean;
}[] = [
  { id: "standard", label: "Standard delivery", eta: "3–7 business days", price: 499, freeAboveThreshold: true },
  { id: "express", label: "Express delivery", eta: "1–3 business days", price: 999, freeAboveThreshold: false },
];

export type DiscountCode = {
  code: string;
  label: string;
  percentOff: number;
};

/* Coupons are off: the server prices every order and knows no coupon codes, so a code accepted here would show a
   discount that is never charged. A code saved in a shopper's browser earlier (e.g. CHAMARO10) no longer resolves,
   so it discounts nothing anywhere. Add codes back only together with server-side validation and pricing. */
export const DISCOUNT_CODES: DiscountCode[] = [];

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export const PIN_CODE_PATTERN = /^[1-9][0-9]{5}$/;

/* =========================================================
   CART LINES
========================================================= */

export type CartLine = {
  slug: string;
  color: string;
  option?: string;
  /* The chosen variant (own SKU and price); absent for products sold as one item */
  variantId?: string;
  quantity: number;
};

export type ResolvedLine = CartLine & {
  key: string;
  product: Product;
  variant?: ProductVariant;
  /* The variant's price when it has one, else the product's */
  unitPrice: number;
  /* Shown struck through only when it is above the unit price */
  compareAtPrice?: number;
  lineTotal: number;
  lineCompareTotal?: number;
};

export function lineKey(line: Pick<CartLine, "slug" | "color" | "option">) {
  return `${line.slug}|${line.color}|${line.option ?? ""}`;
}

export function variantLabel(line: Pick<CartLine, "color" | "option">) {
  return [line.color, line.option].filter(Boolean).join(" / ");
}

/* Attach live product data (from the store's API catalog); drops lines whose product
   no longer exists or is no longer on sale, and lines whose variant has gone. Lines saved
   before the product had variants are matched to one by their colour/option. */
export function resolveLines(
  cart: CartLine[],
  findProduct: (slug: string) => Product | undefined
): ResolvedLine[] {
  return cart.flatMap((line) => {
    const product = findProduct(line.slug);
    if (!product) return [];
    const variant = line.variantId
      ? product.variants.find((candidate) => candidate.id === line.variantId)
      : selectVariant(product.variants, line.color || undefined, line.option);
    if (line.variantId && !variant) return [];
    const { price: unitPrice, compareAtPrice } = priceFor(product, variant);
    return [
      {
        ...line,
        key: lineKey(line),
        product,
        variant,
        unitPrice,
        compareAtPrice,
        lineTotal: unitPrice * line.quantity,
        lineCompareTotal: compareAtPrice ? compareAtPrice * line.quantity : undefined,
      },
    ];
  });
}

export function cartSubtotal(lines: ResolvedLine[]) {
  return lines.reduce((total, line) => total + line.lineTotal, 0);
}

export function amountToFreeShipping(subtotal: number) {
  return FREE_SHIPPING_FOR_ALL ? 0 : Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

export function shippingCost(method: ShippingMethodId, subtotal: number) {
  if (FREE_SHIPPING_FOR_ALL) return 0;
  const rule = SHIPPING_METHODS.find((item) => item.id === method)!;
  return rule.freeAboveThreshold && subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : rule.price;
}

export function findDiscount(code: string) {
  const normalised = code.trim().toUpperCase();
  return DISCOUNT_CODES.find((item) => item.code === normalised);
}

export function discountAmount(subtotal: number, discount?: DiscountCode) {
  return discount ? Math.round(subtotal * discount.percentOff) / 100 : 0;
}
