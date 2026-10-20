import type { CheckoutCallback, PaymentSession } from "./checkout-api";

/* =========================================================
   RAZORPAY CHECKOUT (browser only)
   Loads Razorpay's checkout.js on demand and opens the payment
   form for an order the server has already opened. The browser
   never sees a secret or decides the amount: the server returned
   the gateway order, its amount and the public key id. The
   success callback is only forwarded to the server, which reads
   the payment back from Razorpay before the order changes.
========================================================= */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: "payment.failed", handler: (response: { error?: { reason?: string } }) => void): void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let loading: Promise<RazorpayConstructor> | null = null;

export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  loading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay did not load")));
    script.onerror = () => reject(new Error("Razorpay did not load"));
    document.body.appendChild(script);
  }).catch((error) => {
    loading = null; // allow a retry after a network hiccup
    throw error;
  });
  return loading;
}

/* How the payment form ended: paid (with Checkout's callback to forward), or closed without paying. A failed attempt
   stays inside Razorpay's form, which lets the shopper try another method; it is reported only if they then close it. */
export type CheckoutResult = { kind: "paid"; callback: CheckoutCallback } | { kind: "closed"; lastFailure: string | null };

export async function payWithRazorpay(session: PaymentSession, prefill: { name?: string; email?: string; contact?: string }): Promise<CheckoutResult> {
  const Razorpay = await loadRazorpay();
  return new Promise<CheckoutResult>((resolve) => {
    let lastFailure: string | null = null;
    const checkout = new Razorpay({
      key: session.keyId,
      order_id: session.razorpayOrderId,
      amount: session.amount,
      currency: session.currency,
      name: "Chamaro",
      description: `Order ${session.orderId}`,
      prefill,
      notes: { orderId: session.orderId },
      theme: { color: "#1f1b16" },
      retry: { enabled: true },
      handler: (response: RazorpayResponse) =>
        resolve({
          kind: "paid",
          callback: {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          },
        }),
      modal: { ondismiss: () => resolve({ kind: "closed", lastFailure }), confirm_close: true },
    });
    checkout.on("payment.failed", (response) => {
      lastFailure = response.error?.reason ?? "payment_failed";
    });
    checkout.open();
  });
}
