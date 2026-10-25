import { priceFor, type Product, type ProductVariant } from "./products";
import { selectVariant } from "./product-variants";

export {
  chairsToFreeShipping,
  discountAmount,
  FREE_SHIPPING_CHAIR_COUNT,
  findDiscount,
  isBossChairProduct,
  isChairProduct,
  SHIPPING_METHODS,
  shippingCost,
  type DiscountCode,
  type ShippingMethodId,
} from "./cart-pricing";

/* =========================================================
   CART PRICING RULES
========================================================= */

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
