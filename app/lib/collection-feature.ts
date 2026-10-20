/* =========================================================
   COLLECTION FEATURE ("A Collection Made for Comfort")
   Pure (no imports) so it can be unit-tested with `node --test`.
   The admin stores this section as the published CMS page "home-collection" with one section of type
   "collection-feature". Anything missing or unsafe falls back to the built-in content, so the home page
   never shows an empty block.
========================================================= */

export const COLLECTION_PAGE_SLUG = "home-collection";
export const COLLECTION_SECTION_TYPE = "collection-feature";
export const MAX_COLLECTION_IMAGES = 6;

export type CollectionImage = { src: string; alt: string };

export type CollectionFeature = {
  heading: string;
  text: string;
  buttonLabel: string;
  buttonHref: string;
  images: CollectionImage[];
};

export const DEFAULT_COLLECTION_FEATURE: CollectionFeature = {
  heading: "A Collection Made for Comfort",
  text: "Discover thoughtfully designed seating that brings together comfort, quality, and contemporary design across every Chamaro collection.",
  buttonLabel: "Explore Collection",
  buttonHref: "/products",
  images: [
    { src: "/elevate-chair.webp", alt: "Grey upholstered Chamaro cafe chair with black and brass legs" },
    { src: "/hero/boss-green.webp", alt: "Chamaro boss chair in green upholstery" },
    { src: "/hero/executive-tan.webp", alt: "Chamaro executive chair in tan leatherette" },
    { src: "/hero/cafe-grey.webp", alt: "Chamaro cafe chair in grey upholstery" },
  ],
};

export type ApiCmsPage = {
  status?: string;
  sections?: { type: string; content: unknown; position?: number }[];
};

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

/* Uploaded images are root-relative API paths; only http(s) addresses are ever returned */
function webUrl(value: unknown, apiOrigin: string): string | undefined {
  const raw = text(value, 2048);
  if (!raw) return undefined;
  try {
    const url = raw.startsWith("/") ? new URL(raw, apiOrigin) : new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/* The button goes to a page of this site ("/products") or a web address; "//host" and javascript: are refused */
function linkHref(value: unknown): string | undefined {
  const raw = text(value, 2048);
  if (!raw) return undefined;
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function toCollectionFeature(page: ApiCmsPage | null | undefined, apiOrigin: string): CollectionFeature {
  const defaults = DEFAULT_COLLECTION_FEATURE;
  if (!page || page.status !== "PUBLISHED") return defaults;
  const section = [...(page.sections ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .find((item) => item.type === COLLECTION_SECTION_TYPE);
  const content = section?.content;
  if (!content || typeof content !== "object") return defaults;
  const c = content as Record<string, unknown>;

  const images = (Array.isArray(c.images) ? c.images : []).flatMap((entry): CollectionImage[] => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const src = webUrl(item.url, apiOrigin);
    return src ? [{ src, alt: text(item.alt, 500) ?? "" }] : [];
  });

  return {
    heading: text(c.heading, 191) ?? defaults.heading,
    text: text(c.text, 1000) ?? defaults.text,
    buttonLabel: text(c.buttonLabel, 60) ?? defaults.buttonLabel,
    buttonHref: linkHref(c.buttonUrl) ?? defaults.buttonHref,
    images: images.length ? images.slice(0, MAX_COLLECTION_IMAGES) : defaults.images,
  };
}
