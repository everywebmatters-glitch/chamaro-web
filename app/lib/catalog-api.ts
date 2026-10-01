import { ApiError, apiBaseUrl, apiRequest } from "./api";
import type { Availability, Product, ProductOption } from "./products";

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

/* Slug of the prerendered /products/_/ shell page, which public/.htaccess serves for
   products created after the last build (ProductDetail reads the real slug from the URL) */
export const SHELL_SLUG = "_";

/* ---------- Endpoints ---------- */

/* In the browser, always ask the API: Admin edits must show up on the next page view.
   Not applied during the static build, where a no-store fetch would stop the export. */
const fresh: RequestInit | undefined =
  typeof window === "undefined" ? undefined : { cache: "no-store" };

/* GET /api/v1/products — one page of active products */
export async function fetchProducts(query: ProductListQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return apiRequest<ApiProduct[]>(`/products${search ? `?${search}` : ""}`, fresh);
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

/* GET /api/v1/categories — active categories, sorted by name */
export async function fetchCategories() {
  const { data } = await apiRequest<ApiCategory[]>("/categories", fresh);
  return data;
}

/* ---------- Mapping ---------- */

function availabilityOf(inventory: ApiInventory | null): Availability {
  /* No inventory row means stock isn't tracked for this product */
  if (!inventory) return "in-stock";
  return inventory.quantity - inventory.reservedQuantity > 0 ? "in-stock" : "out-of-stock";
}

/* Active variants become the purchase box's option pills. The public API returns every
   variant; only ACTIVE ones are offered. Variant prices aren't shown (the purchase box
   prices by product). */
function optionOf(variants: ApiProductVariant[]): ProductOption | undefined {
  const active = variants.filter((variant) => variant.status === "ACTIVE");
  if (!active.length) return undefined;
  return {
    name: "Variant",
    values: active.map((variant) => ({ label: variant.name, available: true })),
  };
}

function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

/* Backend product → the Product shape the existing components render */
export function toProduct(api: ApiProduct, index = 0): Product {
  const description = api.description?.trim() ?? "";
  /* Uploaded images are served by the Fastify API, so their paths resolve against its origin */
  const images = api.images
    .filter((image): image is ApiProductImage & { url: string } => Boolean(image.url))
    .map((image) => ({ ...image, url: image.url.startsWith("/") ? new URL(image.url, apiBaseUrl()).href : image.url }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);

  return {
    slug: api.slug,
    name: api.name,
    category: api.category.slug,
    categoryName: api.category.name,
    price: Number(api.price),
    compareAtPrice: api.compareAtPrice != null ? Number(api.compareAtPrice) : undefined,
    rating: 0,
    reviewCount: 0,
    availability: availabilityOf(api.inventory),
    shortDescription: firstSentence(description),
    description,
    images: images.length
      ? images.map((image) => ({ src: image.url, alt: image.altText ?? api.name }))
      : [{ src: PRODUCT_IMAGE_PLACEHOLDER, alt: api.name }],
    colors: [],
    option: optionOf(api.variants),
    features: api.features ?? [],
    materials: api.materials ?? [],
    specs: [...(api.sku ? [{ label: "SKU", value: api.sku }] : []), ...(api.specifications ?? [])],
    returnPolicy: api.returnPolicy ?? undefined,
    warranty: api.warranty ?? undefined,
    /* Backend lists newest first; keep that order for "Best selling" until sales data exists */
    salesRank: index + 1,
  };
}
