/* =========================================================
   CHECKOUT FLOW HELPERS
   Pure (no imports) so they can be unit-tested with `node --test`.
   Turns the browser cart and the delivery form into what the API
   accepts, and API error codes into words for the shopper. Prices
   and totals are never sent: the server computes the order total,
   and that is the amount Razorpay charges.
========================================================= */

/* A cart line as resolveLines() returns it: `variant` is the variant the shopper chose (matched by id, or for older
   saved lines by colour/option), absent for a product sold as one item. */
type CartLineLike = {
  quantity: number;
  variant?: { id: string };
  product: { id: string; name: string; variants: { id: string }[] };
};

export type ServerCartItem = { productId: string; variantId?: string; quantity: number };

/* The browser cart as PUT /api/v1/cart items. A line for a product that has variants but no matching one can't be
   bought as chosen, so it is reported instead of being sent as the plain product. */
export function toServerCartItems(lines: CartLineLike[]): { items: ServerCartItem[]; unavailable: string[] } {
  const merged = new Map<string, ServerCartItem>();
  const unavailable: string[] = [];
  for (const line of lines) {
    const variantId = line.variant?.id;
    if (!variantId && line.product.variants.length > 0) {
      unavailable.push(line.product.name);
      continue;
    }
    const key = `${line.product.id}|${variantId ?? ""}`;
    const current = merged.get(key);
    if (current) current.quantity += line.quantity;
    else merged.set(key, { productId: line.product.id, ...(variantId ? { variantId } : {}), quantity: line.quantity });
  }
  return { items: [...merged.values()], unavailable };
}

export type DeliveryForm = {
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
};

export type AddressInput = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: "IN";
};

/* The delivery form as POST /api/v1/addresses. */
export function toAddressInput(form: DeliveryForm): AddressInput {
  const apartment = form.apartment.trim();
  return {
    name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
    phone: form.phone.replace(/\s+/g, " ").trim(),
    addressLine1: form.address.trim(),
    ...(apartment ? { addressLine2: apartment } : {}),
    city: form.city.trim(),
    state: form.state,
    postalCode: form.pin.trim(),
    country: "IN",
  };
}

type SavedAddress = { id: string; name: string; phone: string; addressLine1: string; addressLine2?: string | null; city: string; state: string; postalCode: string; country: string };

const norm = (value: string | null | undefined) => (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/* A saved address identical to the one entered, so checking out again doesn't save the same address twice. */
export function findSameAddress(saved: SavedAddress[], input: AddressInput): SavedAddress | undefined {
  return saved.find(
    (address) =>
      norm(address.name) === norm(input.name) &&
      norm(address.phone) === norm(input.phone) &&
      norm(address.addressLine1) === norm(input.addressLine1) &&
      norm(address.addressLine2) === norm(input.addressLine2) &&
      norm(address.city) === norm(input.city) &&
      norm(address.state) === norm(input.state) &&
      norm(address.postalCode) === norm(input.postalCode) &&
      norm(address.country) === norm(input.country)
  );
}

/* Identifies one checkout attempt: the same cart, address, shipping and note reuse the order already placed (and its
   Idempotency-Key), anything different places a new one. */
export function checkoutFingerprint(items: ServerCartItem[], address: AddressInput, shippingMethod: string, note: string): string {
  const cart = [...items].sort((a, b) => `${a.productId}|${a.variantId ?? ""}`.localeCompare(`${b.productId}|${b.variantId ?? ""}`));
  return JSON.stringify({ cart, address, shippingMethod, note: note.trim() });
}

/* A delivery phone in the "+91XXXXXXXXXX" form Razorpay Checkout's prefill expects; undefined if it isn't an Indian
   mobile number (Checkout then asks for it). */
export function razorpayContact(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : undefined;
}

/* What to tell the shopper for an API error code. Anything unexpected gets the generic message. */
export function checkoutErrorMessage(code: string): string {
  switch (code) {
    case "NETWORK_ERROR":
      return "We couldn't reach Chamaro. Check your connection and try again.";
    case "UNAUTHENTICATED":
    case "INVALID_TOKEN":
      return "Your session has ended. Please log in again to pay.";
    case "ITEM_UNAVAILABLE":
    case "INSUFFICIENT_STOCK":
      return "Something in your cart is no longer available in that quantity. Please review your cart.";
    case "CART_EMPTY":
      return "Your cart is empty.";
    case "OTP_INVALID":
      return "That code isn't right. Check the email and try again.";
    case "OTP_EXPIRED":
      return "That code has expired. Send a new one.";
    case "OTP_MAX_ATTEMPTS":
      return "Too many incorrect attempts. Send a new code.";
    case "OTP_RESEND_COOLDOWN":
      return "Please wait a minute before asking for another code.";
    case "ORDER_PAYMENT_EXPIRED":
      return "The time to pay for this order ran out, so it was not kept. Please check out again.";
    case "ORDER_NOT_PAYABLE":
      return "This order can no longer be paid. Please check your orders or check out again.";
    case "PAYMENT_IN_PROGRESS":
      return "We've received a payment for this order and are confirming it. Please check your orders in a minute.";
    case "PAYMENTS_NOT_CONFIGURED":
    case "PAYMENTS_LIVE_MODE_BLOCKED":
      return "Online payment isn't available right now. Your order has been saved; please try again later or contact us.";
    case "PAYMENT_GATEWAY_UNAVAILABLE":
      return "The payment service couldn't be reached. You have not been charged; please try again.";
    case "PAYMENT_SIGNATURE_INVALID":
      return "We couldn't verify this payment. If money left your account, it will be confirmed or returned automatically.";
    default:
      return "Something went wrong. Please try again, or contact us if it keeps happening.";
  }
}

/* What the shopper sees once the server has checked a payment with Razorpay. */
export function paymentOutcomeMessage(outcome: string): { done: boolean; message: string } {
  switch (outcome) {
    case "paid":
    case "already_paid":
      return { done: true, message: "Payment received. Your order is confirmed, and we've emailed you the details." };
    case "pending":
      return { done: true, message: "Your payment is being confirmed. We'll email you as soon as it is; there's no need to pay again." };
    case "failed":
      return { done: false, message: "The payment didn't go through and you have not been charged. You can try again." };
    case "review":
      return { done: true, message: "We received your payment but need to check it before confirming your order. We'll be in touch; please don't pay again." };
    default:
      return { done: false, message: "We couldn't confirm the payment yet. If money left your account, it will be confirmed or returned automatically." };
  }
}
