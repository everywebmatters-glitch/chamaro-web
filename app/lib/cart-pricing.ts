import type { Product } from "./products";

/* Prices are GST-inclusive, so no tax line is added */
export const FREE_SHIPPING_CHAIR_COUNT = 2;

export type ShippingMethodId = "standard" | "express";

export const SHIPPING_METHODS: {
  id: ShippingMethodId;
  label: string;
  eta: string;
  price: number;
}[] = [
  { id: "standard", label: "Standard delivery", eta: "3–7 business days", price: 499 },
  { id: "express", label: "Express delivery", eta: "1–3 business days", price: 999 },
];

export type DiscountCode = {
  code: string;
  label: string;
  percentOff: number;
  appliesTo: "chair" | "boss-chair";
};

export const DISCOUNT_CODES: DiscountCode[] = [
  { code: "WELCOME10", label: "10% off Boss chairs", percentOff: 10, appliesTo: "boss-chair" },
  { code: "WELCOME5", label: "5% off chairs", percentOff: 5, appliesTo: "chair" },
];

export function isChairProduct(product: Pick<Product, "name" | "category" | "categoryName">) {
  const terms = `${product.name} ${product.category} ${product.categoryName ?? ""}`.toLowerCase();
  return /\bchairs?\b/.test(terms) || /\bboss\b/.test(terms);
}

export function isBossChairProduct(product: Pick<Product, "name" | "category" | "categoryName">) {
  const terms = `${product.name} ${product.category} ${product.categoryName ?? ""}`.toLowerCase();
  return /\bboss\b/.test(terms) && isChairProduct(product);
}

export function chairsToFreeShipping(chairCount: number) {
  return Math.max(0, FREE_SHIPPING_CHAIR_COUNT - chairCount);
}

export function shippingCost(method: ShippingMethodId, chairCount: number) {
  const rule = SHIPPING_METHODS.find((item) => item.id === method)!;
  return method === "standard" && chairCount >= FREE_SHIPPING_CHAIR_COUNT ? 0 : rule.price;
}

export function findDiscount(code: string) {
  const normalised = code.trim().toUpperCase();
  return DISCOUNT_CODES.find((item) => item.code === normalised);
}

export function discountAmount(
  subtotal: number,
  discount?: DiscountCode,
  lines?: { product: Pick<Product, "name" | "category" | "categoryName">; lineTotal: number }[],
) {
  if (!discount) return 0;
  const eligibleSubtotal = lines
    ? lines.reduce((total, line) => {
        const eligible = discount.appliesTo === "boss-chair"
          ? isBossChairProduct(line.product)
          : isChairProduct(line.product);
        return eligible ? total + line.lineTotal : total;
      }, 0)
    : subtotal;
  return Math.round(eligibleSubtotal * discount.percentOff) / 100;
}
