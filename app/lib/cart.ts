import { getProduct, type Product } from "./products";

/* =========================================================
   CART PRICING RULES
   TODO: confirm every number below with the business —
   they are placeholders so the UI can be built and tested.
========================================================= */

/* Prices are GST-inclusive, so no tax line is added */
export const FREE_SHIPPING_THRESHOLD = 10000;

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

/* TODO: move to the server before launch — client-side codes are visible to anyone */
export const DISCOUNT_CODES: DiscountCode[] = [
  { code: "CHAMARO10", label: "10% off your order", percentOff: 10 },
];

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
  quantity: number;
};

export type ResolvedLine = CartLine & {
  key: string;
  product: Product;
  lineTotal: number;
  lineCompareTotal?: number;
};

export function lineKey(line: Pick<CartLine, "slug" | "color" | "option">) {
  return `${line.slug}|${line.color}|${line.option ?? ""}`;
}

export function variantLabel(line: Pick<CartLine, "color" | "option">) {
  return [line.color, line.option].filter(Boolean).join(" / ");
}

/* Attach product data; drops lines whose product no longer exists */
export function resolveLines(cart: CartLine[]): ResolvedLine[] {
  return cart.flatMap((line) => {
    const product = getProduct(line.slug);
    if (!product) return [];
    return [
      {
        ...line,
        key: lineKey(line),
        product,
        lineTotal: product.price * line.quantity,
        lineCompareTotal: product.compareAtPrice
          ? product.compareAtPrice * line.quantity
          : undefined,
      },
    ];
  });
}

export function cartSubtotal(lines: ResolvedLine[]) {
  return lines.reduce((total, line) => total + line.lineTotal, 0);
}

export function amountToFreeShipping(subtotal: number) {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

export function shippingCost(method: ShippingMethodId, subtotal: number) {
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
