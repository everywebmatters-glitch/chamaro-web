import { apiRequest } from "./api";

type AuthHeaders = { Authorization: string };

export type CheckoutAddress = {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: "SHIPPING" | "BILLING";
};

export type CheckoutAddressInput = Omit<CheckoutAddress, "id" | "addressLine2"> & {
  addressLine2?: string;
};

export type CheckoutCartItem = { productId: string; variantId?: string; quantity: number };

export type CheckoutOrder = {
  id: string;
  total: string;
  status: string;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
};

export type RazorpayPaymentSession = {
  orderId: string;
  keyId: string;
  mode: "test" | "live";
  razorpayOrderId: string;
  amount: number;
  currency: "INR";
  timeoutSeconds: number;
};

export type RazorpayPaymentCallback = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type RazorpayPaymentResult = {
  outcome: "paid" | "already_paid" | "pending" | "failed" | "review" | "refunded" | "ignored";
  order: CheckoutOrder;
};

export type CheckoutOrderInput = {
  addressId: string;
  shippingMethod: "standard" | "express";
  note?: string;
  couponCode?: string;
};

function authHeaders(token: string): AuthHeaders {
  return { Authorization: `Bearer ${token}` };
}

function jsonPost(token: string, body: unknown, headers: Record<string, string> = {}): RequestInit {
  return {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  };
}

export async function requestCheckoutOtp(token: string) {
  const { data } = await apiRequest<{ message: string }>("/auth/checkout/send-otp", {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: "{}",
  });
  return data;
}

export async function verifyCheckoutOtp(token: string, otp: string) {
  const { data } = await apiRequest<{ verified: true; expiresAt: string }>("/auth/checkout/verify-otp", {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ otp }),
  });
  return data;
}

export async function listCheckoutAddresses(token: string) {
  const { data } = await apiRequest<CheckoutAddress[]>("/addresses", { headers: authHeaders(token) });
  return data;
}

export async function createCheckoutAddress(token: string, input: CheckoutAddressInput) {
  const { data } = await apiRequest<CheckoutAddress>("/addresses", {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data;
}

export async function replaceCheckoutCart(token: string, items: CheckoutCartItem[]) {
  await apiRequest<unknown>("/cart", {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
    cache: "no-store",
  });
}

export async function createCheckoutOrder(
  token: string,
  idempotencyKey: string,
  input: CheckoutOrderInput,
) {
  const { data } = await apiRequest<CheckoutOrder>("/orders", jsonPost(token, input, { "Idempotency-Key": idempotencyKey }));
  return data;
}

export async function openRazorpayPayment(token: string, orderId: string) {
  const { data } = await apiRequest<RazorpayPaymentSession>(
    `/orders/${encodeURIComponent(orderId)}/payment`,
    jsonPost(token, {}),
  );
  return data;
}

export async function verifyRazorpayPayment(
  token: string,
  orderId: string,
  input: RazorpayPaymentCallback,
) {
  const { data } = await apiRequest<RazorpayPaymentResult>(
    `/orders/${encodeURIComponent(orderId)}/payment/verify`,
    jsonPost(token, input),
  );
  return data;
}

export async function getCheckoutOrder(token: string, orderId: string) {
  const { data } = await apiRequest<CheckoutOrder>(`/orders/${encodeURIComponent(orderId)}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  return data;
}
