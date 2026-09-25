import { ApiError, apiRequest } from "./api";
import type { Availability, Product } from "./products";

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
  url: string;
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

/* GET /api/v1/products — one page of active products */
export async function fetchProducts(query: ProductListQuery = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const search = params.toString();
  return apiRequest<ApiProduct[]>(`/api/v1/products${search ? `?${search}` : ""}`);
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
      `/api/v1/products/${encodeURIComponent(slug)}`
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/* GET /api/v1/categories — active categories, sorted by name */
export async function fetchCategories() {
  const { data } = await apiRequest<ApiCategory[]>("/api/v1/categories");
  return data;
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
  const images = [...api.images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position
  );

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
    features: [],
    materials: [],
    specs: api.sku ? [{ label: "SKU", value: api.sku }] : [],
    /* Backend lists newest first; keep that order for "Best selling" until sales data exists */
    salesRank: index + 1,
  };
}
