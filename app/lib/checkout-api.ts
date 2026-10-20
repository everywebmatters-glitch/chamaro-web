import { apiRequest } from "./api";
import type { AddressInput, ServerCartItem } from "./checkout-flow";

/* =========================================================
   CHECKOUT + PAYMENT API
   Signed-in customer only (Bearer token from AuthProvider).
   The server owns the cart, the prices and the order total:
   - PUT  /cart                         replace the server cart
   - GET  /addresses, POST /addresses   saved delivery addresses
   - POST /orders                       place it (Idempotency-Key)
   - POST /auth/checkout/send-otp       email a checkout code
   - POST /auth/checkout/verify-otp     { otp }
   - POST /orders/:id/payment           open Razorpay for the order
   - POST /orders/:id/payment/verify    Checkout's success callback;
                                        the server re-reads the payment
                                        from Razorpay before anything changes
========================================================= */

export type SavedAddress = AddressInput & { id: string; addressLine2?: string | null };
export type PlacedOrder = { id: string; total: string; status: string; paymentStatus: string };
/* timeoutSeconds: how long is left to pay (set by the server from when the order was placed); Checkout closes then */
export type PaymentSession = { orderId: string; keyId: string; mode: "test" | "live"; razorpayOrderId: string; amount: number; currency: string; timeoutSeconds: number };
export type CheckoutCallback = { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string };
export type PaymentResult = { outcome: string; order: PlacedOrder };

function post(token: string, body: unknown, headers: Record<string, string> = {}): RequestInit {
  return {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  };
}

export async function replaceServerCart(token: string, items: ServerCartItem[]) {
  await apiRequest<unknown>("/cart", { ...post(token, { items }), method: "PUT" });
}

export async function listAddresses(token: string) {
  const { data } = await apiRequest<SavedAddress[]>("/addresses", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  return data;
}

export async function createAddress(token: string, address: AddressInput) {
  const { data } = await apiRequest<SavedAddress>("/addresses", post(token, address));
  return data;
}

export async function placeOrder(token: string, idempotencyKey: string, body: { addressId: string; shippingMethod: string; note?: string }) {
  const { data } = await apiRequest<PlacedOrder>("/orders", post(token, body, { "Idempotency-Key": idempotencyKey }));
  return data;
}

export async function sendCheckoutCode(token: string) {
  await apiRequest<{ message: string }>("/auth/checkout/send-otp", post(token, {}));
}

export async function verifyCheckoutCode(token: string, otp: string) {
  await apiRequest<{ verified: boolean; expiresAt: string }>("/auth/checkout/verify-otp", post(token, { otp }));
}

export async function openPayment(token: string, orderId: string) {
  const { data } = await apiRequest<PaymentSession>(`/orders/${encodeURIComponent(orderId)}/payment`, post(token, {}));
  return data;
}

export async function verifyPayment(token: string, orderId: string, callback: CheckoutCallback) {
  const { data } = await apiRequest<PaymentResult>(`/orders/${encodeURIComponent(orderId)}/payment/verify`, post(token, callback));
  return data;
}
