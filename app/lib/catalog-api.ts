import { ApiError, apiBaseUrl, apiRequest } from "./api";
import type { Availability, Product } from "./products";
import { COLLECTION_PAGE_SLUG, DEFAULT_COLLECTION_FEATURE, toCollectionFeature, type ApiCmsPage, type CollectionFeature } from "./collection-feature";
import { B2B_PAGE_SLUG, DEFAULT_B2B_HERO, toB2bHero, type B2bHero } from "./b2b-hero";
import type { NavCategory } from "./catalog-nav";
import { CATEGORY_DISPLAY_PAGE_SLUG, iconFor, orderCategories, toCategoryDisplay, type CategoryDisplayItem } from "./category-display";
import { BEST_SELLERS_PAGE_SLUG, pickBySlugs, toBestSellerSlugs } from "./best-sellers";
import { toHeroSlides, type ApiBannerRow, type HeroBannerSlide } from "./hero-banners";
import { toInfoBoxes } from "./product-info";
import { variantChoices, variantImageIds } from "./product-variants";

/* =========================================================
   CATALOG API
   Typed calls for the public product/category endpoints and
   the mapping from backend records to the UI's Product shape.
========================================================= */

/* Prisma Decimal columns arrive as JSON strings */
type ApiDecimal = string | number;

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type ApiProductImage = {
  id: string;
  /* Uploaded image stored by the API; null for legacy externally hosted images */
  mediaId: string | null;
  /* Uploaded images: root-relative API path (/api/v1/media/{id}); legacy: the stored URL */
  url: string | null;
  altText: string | null;
  position: number;
  isPrimary: boolean;
};

export type ApiProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: ApiDecimal | null;
  options: Record<string, unknown>;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

export type ApiInventory = {
  quantity: number;
  reservedQuantity: number;
};

export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /* One line under the price, and the two Delivery & Return boxes (null until set) */
  shortDescription: string | null;
  infoBoxes: { title: string; text: string }[] | null;
  /* Product-page tab content managed in Admin (null until set) */
  features: string[] | null;
  materials: string[] | null;
  specifications: { label: string; value: string }[] | null;
  /* null = show the store-wide policy */
  returnPolicy: string | null;
  warranty: string | null;
  price: ApiDecimal;
  compareAtPrice: ApiDecimal | null;
  sku: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  categoryId: string;
  category: Pick<ApiCategory, "id" | "name" | "slug">;
  images: ApiProductImage[];
  variants: ApiProductVariant[];
  inventory: ApiInventory | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
};

/* Shown when a product has no images yet */
export const PRODUCT_IMAGE_PLACEHOLDER = "/products/placeholder.svg";

/* ---------- Endpoints ---------- */

/* Always ask the API, server or browser: this app runs as a Node.js server (next start),
   not a static export, so every request should see the live catalog. */
const fresh: RequestInit = { cache: "no-store" };

/* Server-rendered chrome (header menu, home page) may be up to a minute stale: that keeps the pages
   cacheable instead of calling the API on every visit */
const briefly: RequestInit = { next: { revalidate: 60 } };

/* GET /api/v1/products — one page of active products */
export async function fetchProducts(query: ProductListQuery = {}, init: RequestInit = fresh) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return apiRequest<ApiProduct[]>(`/products${search ? `?${search}` : ""}`, init);
}

/* Every active product, walking the backend's pages (max 100 per page) */
export async function fetchAllProducts() {
  const all: ApiProduct[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await fetchProducts({ page, limit: 100 });
    all.push(...data);
    if (!meta || page >= meta.totalPages) return all;
  }
}

/* GET /api/v1/products/{slug} — null when the product doesn't exist or isn't active */
export async function fetchProduct(slug: string) {
  try {
    const { data } = await apiRequest<ApiProduct>(
      `/products/${encodeURIComponent(slug)}`,
      fresh
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/* The order and icons Admin chose for the categories (published CMS page "category-display"). Never throws:
   no page (or an API error) means the API's order and the built-in icons. */
async function fetchCategoryDisplay(init: RequestInit): Promise<CategoryDisplayItem[]> {
  try {
    const { data } = await apiRequest<ApiCmsPage>(`/cms/pages/${CATEGORY_DISPLAY_PAGE_SLUG}`, init);
    return toCategoryDisplay(data, new URL(apiBaseUrl()).origin);
  } catch {
    return [];
  }
}

/* GET /api/v1/categories — active categories in the order Admin chose (unlisted ones after, sorted by name),
   each with the icon Admin uploaded for it, if any */
export async function fetchCategories(init: RequestInit = fresh) {
  const [{ data }, display] = await Promise.all([apiRequest<ApiCategory[]>("/categories", init), fetchCategoryDisplay(init)]);
  return orderCategories(data, display).map((category) => ({ ...category, icon: iconFor(category.slug, display) }));
}

/* Categories for the header, mobile menu and home page. Fetched fresh on every request (no cache) so a category
   added or renamed in Admin shows up at once. Never throws: if the API is unreachable the
   menu simply shows no category links rather than breaking every page. */
export async function getNavCategories(): Promise<NavCategory[]> {
  try {
    return (await fetchCategories(fresh)).map(({ slug, name, icon }) => ({ slug, name, icon }));
  } catch {
    return [];
  }
}

/* GET /api/v1/cms/banners — active banners inside their schedule, ordered by position */
export async function fetchBanners(init: RequestInit = fresh) {
  const { data } = await apiRequest<ApiBannerRow[]>("/cms/banners", init);
  return data;
}

/* Banners for the home page hero. Never throws: no banners (or an API error) means the hero keeps its
   built-in slide. The page revalidates every minute, so a schedule change shows up within about a minute. */
export async function getHeroBanners(): Promise<HeroBannerSlide[]> {
  try {
    return toHeroSlides(await fetchBanners(briefly), new URL(apiBaseUrl()).origin);
  } catch {
    return [];
  }
}

/* The home page's "A Collection Made for Comfort" block, managed in Admin as a published CMS page. Never throws:
   no page (or an API error) means the built-in content. */
export async function getCollectionFeature(): Promise<CollectionFeature> {
  try {
    const { data } = await apiRequest<ApiCmsPage>(`/cms/pages/${COLLECTION_PAGE_SLUG}`, briefly);
    return toCollectionFeature(data, new URL(apiBaseUrl()).origin);
  } catch {
    return DEFAULT_COLLECTION_FEATURE;
  }
}

/* The B2B hero is managed as the published CMS page "b2b". Missing content or an API error keeps the built-in hero. */
export async function getB2bHero(): Promise<B2bHero> {
  try {
    const { data } = await apiRequest<ApiCmsPage>(`/cms/pages/${B2B_PAGE_SLUG}`, briefly);
    return toB2bHero(data, new URL(apiBaseUrl()).origin);
  } catch {
    return DEFAULT_B2B_HERO;
  }
}

/* The home page's Best Sellers: only the products the admin picked (published CMS page "home-best-sellers"),
   in the admin's order, skipping any that are no longer on sale. Never throws; an empty list hides the section. */
export async function getBestSellers(): Promise<Product[]> {
  try {
    const { data: page } = await apiRequest<ApiCmsPage>(`/cms/pages/${BEST_SELLERS_PAGE_SLUG}`, briefly);
    const slugs = toBestSellerSlugs(page);
    if (slugs.length === 0) return [];
    const all: ApiProduct[] = [];
    for (let pageNumber = 1; ; pageNumber++) {
      const { data, meta } = await fetchProducts({ page: pageNumber, limit: 100 }, briefly);
      all.push(...data);
      if (!meta || pageNumber >= meta.totalPages) break;
    }
    return pickBySlugs(all, slugs).map((product) => toProduct(product));
  } catch {
    return [];
  }
}

/* ---------- Mapping ---------- */

function availabilityOf(inventory: ApiInventory | null): Availability {
  /* No inventory row means stock isn't tracked for this product */
  if (!inventory) return "in-stock";
  return inventory.quantity - inventory.reservedQuantity > 0 ? "in-stock" : "out-of-stock";
}

function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

/* Backend product → the Product shape the existing components render */
export function toProduct(api: ApiProduct, index = 0): Product {
  const description = api.description?.trim() ?? "";
  /* Uploaded images are served by the Fastify API, so their paths resolve against its origin */
  const allImages = api.images
    .filter((image): image is ApiProductImage & { url: string } => Boolean(image.url))
    .map((image) => ({ ...image, url: image.url.startsWith("/") ? new URL(image.url, apiBaseUrl()).href : image.url }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);
  /* Active variants become colour swatches and option pills, each with its own SKU, price and photos */
  const choices = variantChoices(api.variants);
  /* A variant's own photos are product images too (so the API keeps their files) but only show
     for that variant; the product gallery shows the rest */
  const variantOwned = new Set(api.variants.flatMap((variant) => variantImageIds(variant.options)));
  const mainImages = allImages.filter((image) => !image.mediaId || !variantOwned.has(image.mediaId));
  const images = mainImages.length ? mainImages : allImages;
  const byMediaId = new Map(allImages.flatMap((image) => (image.mediaId ? [[image.mediaId, image] as const] : [])));
  const variants = choices.variants.map(({ imageIds, ...variant }) => ({
    ...variant,
    images: imageIds.flatMap((id) => {
      const image = byMediaId.get(id);
      return image ? [{ src: image.url, alt: image.altText ?? `${api.name} – ${variant.name}` }] : [];
    }),
  }));

  return {
    apiId: api.id,
    slug: api.slug,
    name: api.name,
    category: api.category.slug,
    categoryName: api.category.name,
    price: Number(api.price),
    /* Admin may keep a compare-at price equal to the price (the API can't clear one); only a higher one is a discount */
    compareAtPrice: api.compareAtPrice != null && Number(api.compareAtPrice) > Number(api.price) ? Number(api.compareAtPrice) : undefined,
    rating: 0,
    reviewCount: 0,
    availability: availabilityOf(api.inventory),
    stockLeft: api.inventory ? Math.max(0, api.inventory.quantity - api.inventory.reservedQuantity) : undefined,
    shortDescription: api.shortDescription?.trim() || firstSentence(description),
    infoBoxes: toInfoBoxes(api.infoBoxes),
    description,
    images: images.length
      ? images.map((image) => ({ src: image.url, alt: image.altText ?? api.name }))
      : [{ src: PRODUCT_IMAGE_PLACEHOLDER, alt: api.name }],
    colors: choices.colors,
    colorLabel: choices.colorLabel,
    option: choices.option,
    variants,
    features: api.features ?? [],
    specs: [...(api.sku ? [{ label: "SKU", value: api.sku }] : []), ...(api.specifications ?? [])],
    warranty: api.warranty ?? undefined,
    /* Admin's Disclaimer box is stored in the returnPolicy column (per-product return policies are no longer edited) */
    disclaimer: api.returnPolicy ?? undefined,
    /* Backend lists newest first; keep that order for "Best selling" until sales data exists */
    salesRank: index + 1,
  };
}
