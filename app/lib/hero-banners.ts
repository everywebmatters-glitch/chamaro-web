/* =========================================================
   HERO BANNERS
   Pure (no imports) so it can be unit-tested with `node --test`.
   Turns GET /api/v1/cms/banners rows into hero slides. The API already returns
   only ACTIVE banners inside their schedule, ordered by position; the checks
   here repeat that defensively (the page may be served from a cache up to a
   minute old) and drop anything that cannot be shown safely.
========================================================= */

export type ApiBannerRow = {
  id: string;
  title: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  status: string;
  position: number;
  startAt: string | null;
  endAt: string | null;
};

export type HeroBannerSlide = {
  id: string;
  title: string;
  image: string;
  /* Narrower artwork for phones, when the banner has one */
  mobileImage?: string;
  alt: string;
  /* Where a click leads; undefined = not clickable */
  href?: string;
};

export const MAX_HERO_BANNERS = 8;

/* Uploaded images are stored as root-relative API paths in older rows; the API origin is added here.
   Only http(s) addresses are ever returned, so a stored javascript: or data: value can't reach the page. */
function webUrl(value: string | null | undefined, apiOrigin: string): string | undefined {
  if (!value) return undefined;
  const text = value.trim();
  try {
    const url = text.startsWith("/") ? new URL(text, apiOrigin) : new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function inSchedule(row: ApiBannerRow, now: Date): boolean {
  const start = row.startAt ? new Date(row.startAt).getTime() : null;
  const end = row.endAt ? new Date(row.endAt).getTime() : null;
  if ((start !== null && Number.isNaN(start)) || (end !== null && Number.isNaN(end))) return false;
  return (start === null || start <= now.getTime()) && (end === null || end >= now.getTime());
}

export function toHeroSlides(rows: ApiBannerRow[], apiOrigin: string, now: Date = new Date()): HeroBannerSlide[] {
  return rows
    .filter((row) => row.status === "ACTIVE" && inSchedule(row, now))
    .sort((a, b) => a.position - b.position)
    .flatMap((row) => {
      const image = webUrl(row.imageUrl, apiOrigin);
      if (!image) return [];
      const mobileImage = webUrl(row.mobileImageUrl, apiOrigin);
      const href = webUrl(row.linkUrl, apiOrigin);
      return [
        {
          id: row.id,
          title: row.title,
          image,
          ...(mobileImage ? { mobileImage } : {}),
          alt: row.altText?.trim() || row.title,
          ...(href ? { href } : {}),
        },
      ];
    })
    .slice(0, MAX_HERO_BANNERS);
}
