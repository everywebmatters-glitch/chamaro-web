import type { ApiCmsPage } from "./collection-feature";

export const B2B_PAGE_SLUG = "b2b";
export const B2B_HERO_SECTION_TYPE = "b2b-hero";

export type B2bHero = {
  eyebrow: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  buttonLabel: string;
  buttonUrl: string;
};

export const DEFAULT_B2B_HERO: B2bHero = {
  eyebrow: "Chamaro for Business",
  title: "Seating for teams of every size",
  description:
    "Furnishing a new office, a co-working floor or a café? Order in bulk with volume pricing, GST invoices and one team handling everything from quote to delivery.",
  imageUrl: "/hero/b2b-business-chair.webp",
  imageAlt: "Ergonomic office chair",
  buttonLabel: "Request a quote",
  buttonUrl: "#quote",
};

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function imageUrl(value: unknown, apiOrigin: string): string | undefined {
  const raw = text(value, 2048);
  if (!raw) return undefined;
  try {
    const url = raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")
      ? new URL(raw, apiOrigin)
      : new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function buttonUrl(value: unknown): string | undefined {
  const raw = text(value, 2048);
  if (!raw) return undefined;
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) return raw;
  if (/^#[a-zA-Z][\w:-]*$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function toB2bHero(page: ApiCmsPage | null | undefined, apiOrigin: string): B2bHero {
  if (!page || page.status !== "PUBLISHED") return DEFAULT_B2B_HERO;

  const section = [...(page.sections ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .find((item) => item.type === B2B_HERO_SECTION_TYPE);
  if (!section?.content || typeof section.content !== "object") return DEFAULT_B2B_HERO;

  const content = section.content as Record<string, unknown>;
  return {
    eyebrow: text(content.eyebrow, 120) ?? DEFAULT_B2B_HERO.eyebrow,
    title: text(content.title, 191) ?? DEFAULT_B2B_HERO.title,
    description: text(content.description, 1000) ?? DEFAULT_B2B_HERO.description,
    imageUrl: imageUrl(content.imageUrl, apiOrigin) ?? DEFAULT_B2B_HERO.imageUrl,
    imageAlt: text(content.imageAlt, 500) ?? DEFAULT_B2B_HERO.imageAlt,
    buttonLabel: text(content.buttonLabel, 60) ?? DEFAULT_B2B_HERO.buttonLabel,
    buttonUrl: buttonUrl(content.buttonUrl) ?? DEFAULT_B2B_HERO.buttonUrl,
  };
}
