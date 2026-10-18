/* =========================================================
   PRODUCT TYPES + HELPERS
   Shared Product shape and display helpers. Products and categories
   come from the live API (see catalog-api.ts); nothing is hard-coded here.
========================================================= */

export type ProductColor = {
  name: string;
  hex: string;
};

export type Availability = "in-stock" | "pre-order" | "out-of-stock";

export type ProductOption = {
  name: string;
  values: { label: string; available: boolean }[];
};

export type Product = {
  slug: string;
  name: string;
  /* Category slug */
  category: string;
  /* Display name from the API */
  categoryName?: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  availability: Availability;
  shortDescription: string;
  description: string;
  images: { src: string; alt: string }[];
  colors: ProductColor[];
  option?: ProductOption;
  features: string[];
  materials: string[];
  specs: { label: string; value: string }[];
  /* Per-product text from Admin; storePolicies is shown when absent */
  returnPolicy?: string;
  warranty?: string;
  featured?: boolean;
  /* Lower number = sells more; drives the "Best selling" sort */
  salesRank: number;
};

export const availabilityLabels: Record<Availability, string> = {
  "in-stock": "In stock",
  "pre-order": "Pre-order",
  "out-of-stock": "Out of stock",
};

/* TODO: confirm delivery, returns and warranty terms */
export const storePolicies = {
  delivery:
    "Estimated delivery: 3–7 days (metro cities), 7–12 days (rest of India).",
  returns:
    "Return within 7 days of delivery in original packaging. Assembly and shipping charges are non-refundable.",
  warranty:
    "Every Chamaro chair carries a 1-year warranty against manufacturing defects in the frame, mechanism and gas lift. Wear and tear, misuse and upholstery damage from sharp objects are not covered.",
};

export const chairCare = [
  { icon: "droplets", text: "Wipe upholstery with a soft, damp cloth." },
  { icon: "spray", text: "Avoid harsh chemicals, solvents and bleach." },
  { icon: "sun", text: "Keep away from prolonged direct sunlight." },
  { icon: "wrench", text: "Re-tighten fittings every 6 months." },
  { icon: "weight", text: "Do not exceed the rated weight capacity." },
] as const;

/* =========================================================
   HELPERS
========================================================= */

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}

export function discountPercent(product: Product) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
    return 0;
  }

  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}

export function getRelatedProducts(product: Product, catalog: Product[], limit = 4) {
  const sameCategory = catalog.filter(
    (item) => item.slug !== product.slug && item.category === product.category
  );
  const others = catalog.filter(
    (item) => item.slug !== product.slug && item.category !== product.category
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export type SortOption =
  | "featured"
  | "best-selling"
  | "price-asc"
  | "price-desc"
  | "name";

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "best-selling", label: "Best selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

export function sortProducts(items: Product[], sort: SortOption) {
  const sorted = [...items];

  switch (sort) {
    case "best-selling":
      return sorted.sort((a, b) => a.salesRank - b.salesRank);
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted.sort(
        (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false)
      );
  }
}

export const PRICE_RANGES = [
  { value: "under-5000", label: "Under ₹5,000", min: 0, max: 5000 },
  { value: "5000-10000", label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { value: "over-10000", label: "Above ₹10,000", min: 10000, max: Infinity },
] as const;

export function allColors(catalog: Product[]) {
  const seen = new Map<string, ProductColor>();
  for (const product of catalog) {
    for (const color of product.colors) {
      if (!seen.has(color.name)) seen.set(color.name, color);
    }
  }
  return [...seen.values()];
}
