import { apiRequest } from "./api";

/* =========================================================
   PRODUCT REVIEWS API
   - GET  /api/v1/products/:slug/reviews   approved reviews + summary (public)
   - POST /api/v1/products/:slug/reviews   a signed-in customer's review; held until an admin approves it
========================================================= */

export type Review = { id: string; authorName: string; rating: number; body: string; createdAt: string };
export type ReviewSummary = { average: number; count: number };
export type ProductReviews = { summary: ReviewSummary; reviews: Review[] };

const EMPTY: ProductReviews = { summary: { average: 0, count: 0 }, reviews: [] };

export async function fetchProductReviews(slug: string, init: RequestInit = { cache: "no-store" }): Promise<ProductReviews> {
  const { data } = await apiRequest<ProductReviews>(`/products/${encodeURIComponent(slug)}/reviews`, init);
  return data;
}

/* For the page's star rating: never throws, no reviews (or an error) shows no stars filled */
export async function getReviewSummary(slug: string): Promise<ReviewSummary> {
  try {
    return (await fetchProductReviews(slug, { cache: "no-store" })).summary;
  } catch {
    return EMPTY.summary;
  }
}

export async function submitReview(token: string, slug: string, input: { rating: number; body: string }) {
  const { data } = await apiRequest<{ id: string; status: string }>(`/products/${encodeURIComponent(slug)}/reviews`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data;
}
