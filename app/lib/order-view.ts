/* =========================================================
   ORDER VIEW MODEL
   Pure helpers for My Orders and order tracking: what each
   state looks like, status labels, dates. No fetching and no
   runtime imports, so it can be tested on its own.
   Contract: backend GET /api/v1/orders and /orders/:id
   (customer view; `shipment` is null until Delhivery has
   accepted the parcel and assigned a real AWB).
========================================================= */

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type ShipmentStatus = "MANIFESTED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "RETURN_IN_TRANSIT" | "RETURNED" | "CANCELLED";

export type ShipmentEvent = {
  status: string;
  location: string | null;
  instructions: string | null;
  occurredAt: string;
};

export type OrderShipment = {
  courier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  status: ShipmentStatus;
  courierStatus: string | null;
  courierStatusLocation: string | null;
  courierStatusAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  lastCheckedAt: string | null;
  events: ShipmentEvent[];
};

export type OrderItem = {
  id: string;
  productName: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type OrderAddress = {
  name?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
};

export type Order = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  shippingTotal: string;
  total: string;
  shippingMethod: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  createdAt: string;
  shippingAddress: OrderAddress | null;
  items: OrderItem[];
  shipment: OrderShipment | null;
};

/* ---- labels -------------------------------------------------------------------------------- */

export function orderStatusLabel(order: Pick<Order, "status" | "paymentStatus">) {
  if (order.status === "CANCELLED") return "Cancelled";
  if (order.paymentStatus === "REFUNDED") return "Refunded";
  if (order.paymentStatus !== "PAID" && (order.status === "PENDING" || order.status === "CONFIRMED")) return "Awaiting payment";
  switch (order.status) {
    case "PENDING":
    case "CONFIRMED":
      return "Confirmed";
    case "PROCESSING":
      return "Preparing for dispatch";
    case "SHIPPED":
      return "Shipped";
    case "COMPLETED":
      return "Completed";
  }
}

const SHIPMENT_LABELS: Record<ShipmentStatus, string> = {
  MANIFESTED: "Packed, awaiting courier pickup",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  RETURN_IN_TRANSIT: "Returning to sender",
  RETURNED: "Returned to sender",
  CANCELLED: "Shipment cancelled",
};

export function shipmentStatusLabel(status: ShipmentStatus) {
  return SHIPMENT_LABELS[status] ?? "Status unavailable";
}

/* Tone for the status pill: neutral, progress, done, problem */
export function orderTone(order: Pick<Order, "status" | "paymentStatus"> & { shipment?: Pick<OrderShipment, "status"> | null }) {
  const shipment = order.shipment?.status;
  if (order.status === "CANCELLED" || shipment === "RETURNED" || shipment === "RETURN_IN_TRANSIT" || shipment === "CANCELLED") return "problem";
  if (shipment === "DELIVERED" || order.status === "COMPLETED") return "done";
  if (order.paymentStatus === "PAID") return "progress";
  return "neutral";
}

/* ---- dates and money ----------------------------------------------------------------------- */

const IST_DATE = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
const IST_DATE_TIME = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

function validDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatOrderDate(value: string | null | undefined) {
  const date = validDate(value);
  return date ? IST_DATE.format(date) : "";
}

export function formatEventTime(value: string | null | undefined) {
  const date = validDate(value);
  return date ? IST_DATE_TIME.format(date) : "";
}

export function formatRupees(amount: string) {
  const value = Number(amount);
  return Number.isFinite(value) ? `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "";
}

/* Short reference shown to shoppers; the full id is what support needs, so it stays visible on the detail page */
export function orderReference(id: string) {
  return id.slice(-8).toUpperCase();
}

/* ---- tracking -------------------------------------------------------------------------------- */

/* Only an https link from the API is ever rendered; nothing is built from the AWB here */
export function safeTrackingUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export type TrackingView =
  | { kind: "none"; message: string }
  | { kind: "manual"; carrier: string; trackingNumber: string; shippedAt: string | null }
  | {
      kind: "courier";
      courier: string;
      trackingNumber: string;
      statusLabel: string;
      courierStatus: string | null;
      trackingUrl: string | null;
      events: ShipmentEvent[];
      note: string | null;
    };

export function trackingView(order: Pick<Order, "status" | "paymentStatus" | "carrier" | "trackingNumber" | "shippedAt" | "shipment">): TrackingView {
  const shipment = order.shipment;
  if (shipment) {
    const note =
      shipment.events.length > 0
        ? null
        : shipment.lastCheckedAt
          ? "Delhivery hasn't recorded any scans for this parcel yet."
          : "Tracking updates from Delhivery haven't arrived yet. Check back soon.";
    return {
      kind: "courier",
      courier: shipment.courier,
      trackingNumber: shipment.trackingNumber,
      statusLabel: shipmentStatusLabel(shipment.status),
      courierStatus: shipment.courierStatus,
      trackingUrl: safeTrackingUrl(shipment.trackingUrl),
      events: [...shipment.events].sort((a, b) => (validDate(b.occurredAt)?.getTime() ?? 0) - (validDate(a.occurredAt)?.getTime() ?? 0)),
      note,
    };
  }
  if (order.carrier && order.trackingNumber) {
    return { kind: "manual", carrier: order.carrier, trackingNumber: order.trackingNumber, shippedAt: order.shippedAt };
  }
  if (order.status === "CANCELLED") return { kind: "none", message: "This order was cancelled, so it won't be shipped." };
  if (order.paymentStatus !== "PAID") return { kind: "none", message: "Tracking will be available once payment is confirmed and your order ships." };
  return { kind: "none", message: "Tracking will appear here once your order is handed to our courier." };
}

/* ---- page states --------------------------------------------------------------------------- */

export type AuthState = "loading" | "authenticated" | "unauthenticated";
type FailureLike = { status?: number; code?: string } | null | undefined;

export function ordersErrorMessage(error: unknown) {
  const failure = error as FailureLike;
  if (failure?.status === 401 || failure?.status === 403) return "Your session has ended. Please log in again to see your orders.";
  if (failure?.code === "NETWORK_ERROR") return "We couldn't reach Chamaro just now. Check your connection and try again.";
  return "We couldn't load your orders just now. Please try again.";
}

export type ListState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "error"; message: string; signIn: boolean }
  | { kind: "empty" }
  | { kind: "ready"; orders: Order[] };

export function ordersListState(input: { auth: AuthState; loading: boolean; error: unknown; orders: Order[] | null }): ListState {
  if (input.auth === "loading") return { kind: "loading" };
  if (input.auth === "unauthenticated") return { kind: "signed-out" };
  if (input.error) {
    const status = (input.error as FailureLike)?.status;
    return { kind: "error", message: ordersErrorMessage(input.error), signIn: status === 401 || status === 403 };
  }
  if (input.loading || input.orders === null) return { kind: "loading" };
  return input.orders.length === 0 ? { kind: "empty" } : { kind: "ready", orders: input.orders };
}

export type DetailState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "not-found" }
  | { kind: "error"; message: string; signIn: boolean }
  | { kind: "ready"; order: Order };

export function orderDetailState(input: { auth: AuthState; loading: boolean; error: unknown; order: Order | null }): DetailState {
  if (input.auth === "loading") return { kind: "loading" };
  if (input.auth === "unauthenticated") return { kind: "signed-out" };
  if (input.error) {
    const status = (input.error as FailureLike)?.status;
    /* Someone else's order is reported as not found by the API, exactly like a missing one */
    if (status === 404) return { kind: "not-found" };
    return { kind: "error", message: ordersErrorMessage(input.error).replace("your orders", "this order"), signIn: status === 401 || status === 403 };
  }
  if (input.loading || !input.order) return { kind: "loading" };
  return { kind: "ready", order: input.order };
}
