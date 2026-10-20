/* =========================================================
   BEST SELLERS
   Pure (no imports) so it can be unit-tested with `node --test`.
   The admin stores its picks as the published CMS page "home-best-sellers" with one section of type
   "best-sellers" whose content is { slugs: string[] } in display order. Nothing picked means the section is hidden.
========================================================= */

export const BEST_SELLERS_PAGE_SLUG = "home-best-sellers";
export const BEST_SELLERS_SECTION_TYPE = "best-sellers";
export const MAX_BEST_SELLERS = 8;

type CmsPageLike = {
  status?: string;
  sections?: { type: string; content: unknown; position?: number }[];
};

export function toBestSellerSlugs(page: CmsPageLike | null | undefined): string[] {
  if (!page || page.status !== "PUBLISHED") return [];
  const section = [...(page.sections ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .find((item) => item.type === BEST_SELLERS_SECTION_TYPE);
  const slugs = (section?.content as { slugs?: unknown } | undefined)?.slugs;
  if (!Array.isArray(slugs)) return [];
  const unique = slugs.filter((slug): slug is string => typeof slug === "string" && slug.trim() !== "");
  return [...new Set(unique)].slice(0, MAX_BEST_SELLERS);
}

/* The picked products that are still on sale, in the admin's order */
export function pickBySlugs<T extends { slug: string }>(products: T[], slugs: string[]): T[] {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  return slugs.flatMap((slug) => {
    const product = bySlug.get(slug);
    return product ? [product] : [];
  });
}
