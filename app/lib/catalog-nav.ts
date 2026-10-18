/* =========================================================
   CATALOG NAVIGATION + SEARCH HELPERS
   Pure functions (no imports) so they can be unit-tested with
   `node --test`. Categories always come from the live API; this
   file only decides how to link to and look up what the API returned.
========================================================= */

export type NavCategory = { slug: string; name: string };

/* Icons that exist in public/icons, keyed by the category slug they were drawn for */
const CATEGORY_ICONS: Record<string, string> = {
  boss: "/icons/boss-chair.svg",
  cafe: "/icons/cafe-chair.svg",
  executive: "/icons/executive-chair.svg",
  premium: "/icons/premium-chair.svg",
  "bar-stool": "/icons/bar-stool.svg",
  visitor: "/icons/visitor-chair.svg",
  "waiting-chairs": "/icons/waiting-chairs.svg",
  workstation: "/icons/workstation.svg",
};

/* Shown for a category with no dedicated icon */
export const FALLBACK_CATEGORY_ICON = "/icons/visitor-chair.svg";

export function categoryIcon(slug: string): string {
  return CATEGORY_ICONS[slug] ?? FALLBACK_CATEGORY_ICON;
}

export function categoryHref(slug: string): string {
  return `/products?category=${encodeURIComponent(slug)}`;
}

/* The product fields search looks at */
export type SearchableProduct = {
  name: string;
  categoryName?: string;
  shortDescription: string;
  specs?: { label: string; value: string }[];
};

function haystack(product: SearchableProduct) {
  const sku = product.specs?.find((spec) => spec.label === "SKU")?.value ?? "";
  return [product.name, product.categoryName ?? "", product.shortDescription, sku].join(" ").toLowerCase();
}

/* Every word the shopper typed must appear somewhere in the product; names that start with the
   query come first, then names that contain it, then matches elsewhere (category, description, SKU).
   Returns [] until the catalog has loaded. */
export function searchCatalog<T extends SearchableProduct>(catalog: T[] | null, query: string, limit = 8): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!catalog || terms.length === 0) return [];

  const phrase = terms.join(" ");
  const rank = (product: T) => {
    const name = product.name.toLowerCase();
    return name.startsWith(phrase) ? 0 : name.includes(phrase) ? 1 : 2;
  };

  return catalog
    .map((product, index) => ({ product, index, text: haystack(product) }))
    .filter(({ text }) => terms.every((term) => text.includes(term)))
    .sort((a, b) => rank(a.product) - rank(b.product) || a.index - b.index)
    .slice(0, limit)
    .map(({ product }) => product);
}
