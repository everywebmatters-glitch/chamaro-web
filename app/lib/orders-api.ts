import { apiRequest } from "./api";
import type { Order } from "./order-view";

/* =========================================================
   CUSTOMER ORDERS API
   Signed-in customer only (Bearer token from AuthProvider).
   The backend returns only the caller's own orders; another
   customer's order id answers 404, like a missing one.
   - GET /api/v1/orders?page&limit   newest first, max 50
   - GET /api/v1/orders/:id          one order with tracking
========================================================= */

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` }, cache: "no-store" as const });

export async function fetchMyOrders(token: string, page = 1, limit = 10, signal?: AbortSignal) {
  return apiRequest<Order[]>(`/orders?page=${page}&limit=${limit}`, { ...auth(token), signal });
}

export async function fetchMyOrder(token: string, id: string, signal?: AbortSignal) {
  const { data } = await apiRequest<Order>(`/orders/${encodeURIComponent(id)}`, { ...auth(token), signal });
  return data;
}
