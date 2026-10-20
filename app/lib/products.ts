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

/* A buyable variant (e.g. one colour) with its own SKU, price and photos */
export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  /* undefined = sold at the product price */
  price?: number;
  compareAtPrice?: number;
  /* Units of this variant; undefined = only the product's stock applies */
  stock?: number;
  color?: string;
  option?: string;
  /* This variant's own photos; empty = show the product's photos */
  images: { src: string; alt: string }[];
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
  /* Units that can still be bought when the API tracks stock (on hand minus reserved); undefined = not tracked */
  stockLeft?: number;
  shortDescription: string;
  /* The two Delivery & Return boxes: the admin's wording, or the store's own for a box left empty */
  infoBoxes: { title: string; text: string }[];
  description: string;
  images: { src: string; alt: string }[];
  colors: ProductColor[];
  /* Name of the colour option as written in Admin ("Color"/"Colour") */
  colorLabel?: string;
  option?: ProductOption;
  /* Active variants; empty when the product is sold as one item */
  variants: ProductVariant[];
  features: string[];
  specs: { label: string; value: string }[];
  /* Per-product text from Admin; storePolicies is shown when absent */
  warranty?: string;
  disclaimer?: string;
  featured?: boolean;
  /* Lower number = sells more; drives the "Best selling" sort */
  salesRank: number;
};

/* What one unit costs: the variant's own price when it has one, else the product's. A variant's
   own compare-at price wins; without one, a variant priced like the product keeps the product's
   compare-at price (variants saved before they had compare-at prices). A compare-at price is only
   shown when it is above the price. */
export function priceFor(
  product: Pick<Product, "price" | "compareAtPrice">,
  variant?: Pick<ProductVariant, "price" | "compareAtPrice">
) {
  const price = variant?.price ?? product.price;
  const compare = variant?.compareAtPrice ?? (price === product.price ? product.compareAtPrice : undefined);
  return { price, compareAtPrice: compare && compare > price ? compare : undefined };
}

/* How many units of a variant can be bought: the lower of its own stock and the product's */
export function unitsLeft(product: Pick<Product, "stockLeft">, variant?: Pick<ProductVariant, "stock">) {
  const limits = [product.stockLeft, variant?.stock].filter((value): value is number => value !== undefined);
  return limits.length ? Math.min(...limits) : undefined;
}

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
  /* TODO: confirm the standard disclaimer wording with the business */
  disclaimer:
    "Product colours may look slightly different from the photos because of lighting and screen settings. Dimensions and weights are approximate. Please follow the assembly instructions and the rated weight capacity for safe use.",
};

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

export function discountPercent(product: Pick<Product, "price" | "compareAtPrice">) {
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
