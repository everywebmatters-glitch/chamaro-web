/* =========================================================
   CATEGORY DISPLAY (order + icons chosen in Admin)
   Pure (no imports) so it can be unit-tested with `node --test`.
   The admin stores it as the published CMS page "category-display" with one section of type "category-display"
   whose content is { items: [{ slug, iconUrl? }] } in display order. Categories the admin didn't list keep the
   API's order after the listed ones, and a category without an uploaded icon keeps its built-in icon.
========================================================= */

export const CATEGORY_DISPLAY_PAGE_SLUG = "category-display";
export const CATEGORY_DISPLAY_SECTION_TYPE = "category-display";

export type CategoryDisplayItem = { slug: string; icon?: string };

type CmsPageLike = {
  status?: string;
  sections?: { type: string; content: unknown; position?: number }[];
};

function webUrl(value: unknown, apiOrigin: string): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const raw = value.trim();
    const url = raw.startsWith("/") ? new URL(raw, apiOrigin) : new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function toCategoryDisplay(page: CmsPageLike | null | undefined, apiOrigin: string): CategoryDisplayItem[] {
  if (!page || page.status !== "PUBLISHED") return [];
  const section = [...(page.sections ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .find((item) => item.type === CATEGORY_DISPLAY_SECTION_TYPE);
  const items = (section?.content as { items?: unknown } | undefined)?.items;
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.flatMap((entry): CategoryDisplayItem[] => {
    if (!entry || typeof entry !== "object") return [];
    const { slug, iconUrl } = entry as Record<string, unknown>;
    if (typeof slug !== "string" || !slug || seen.has(slug)) return [];
    seen.add(slug);
    return [{ slug, icon: webUrl(iconUrl, apiOrigin) }];
  });
}

/* Listed categories first in the admin's order, then the rest in their original order */
export function orderCategories<T extends { slug: string }>(categories: T[], display: CategoryDisplayItem[]): T[] {
  const position = new Map(display.map((item, index) => [item.slug, index]));
  return categories
    .map((category, index) => ({ category, index }))
    .sort((a, b) => (position.get(a.category.slug) ?? Infinity) - (position.get(b.category.slug) ?? Infinity) || a.index - b.index)
    .map(({ category }) => category);
}

export function iconFor(slug: string, display: CategoryDisplayItem[]): string | undefined {
  return display.find((item) => item.slug === slug)?.icon;
}
