import test from "node:test";
import assert from "node:assert/strict";
import {
  formatEventTime,
  orderDetailState,
  orderStatusLabel,
  ordersListState,
  orderTone,
  safeTrackingUrl,
  trackingView,
  type Order,
  type OrderShipment,
} from "../app/lib/order-view.ts";

const shipment: OrderShipment = {
  courier: "Delhivery",
  trackingNumber: "9100000000000",
  trackingUrl: null,
  status: "IN_TRANSIT",
  courierStatus: "In Transit",
  courierStatusLocation: "Bengaluru_Hub (Karnataka)",
  courierStatusAt: "2026-10-20T13:00:00.000Z",
  pickedUpAt: "2026-10-20T13:00:00.000Z",
  deliveredAt: null,
  cancelledAt: null,
  lastCheckedAt: "2026-10-20T13:05:00.000Z",
  events: [
    { status: "Manifested", location: "Bengaluru_Hub (Karnataka)", instructions: "Manifest uploaded", occurredAt: "2026-10-20T04:30:00.000Z" },
    { status: "In Transit", location: "Bengaluru_Hub (Karnataka)", instructions: "Picked up", occurredAt: "2026-10-20T13:00:00.000Z" },
  ],
};

const order: Order = {
  id: "cmorder000000abcdefgh",
  status: "SHIPPED",
  paymentStatus: "PAID",
  subtotal: "12000.00",
  shippingTotal: "0.00",
  total: "12000.00",
  shippingMethod: "standard",
  carrier: "Delhivery",
  trackingNumber: "9100000000000",
  shippedAt: "2026-10-20T13:00:00.000Z",
  createdAt: "2026-10-19T10:00:00.000Z",
  shippingAddress: { name: "Asha Rao", addressLine1: "12 MG Road", city: "Bengaluru", state: "Karnataka", postalCode: "560001" },
  items: [{ id: "i1", productName: "Lounge Chair", variantName: null, quantity: 1, unitPrice: "12000.00", lineTotal: "12000.00" }],
  shipment,
};

/* ---- list states --------------------------------------------------------------------------- */

test("list: loading while auth or the request is pending", () => {
  assert.deepEqual(ordersListState({ auth: "loading", loading: false, error: null, orders: null }), { kind: "loading" });
  assert.deepEqual(ordersListState({ auth: "authenticated", loading: true, error: null, orders: null }), { kind: "loading" });
  assert.deepEqual(ordersListState({ auth: "authenticated", loading: false, error: null, orders: null }), { kind: "loading" });
});

test("list: signed-out shoppers are asked to log in; nothing is fetched for them", () => {
  assert.deepEqual(ordersListState({ auth: "unauthenticated", loading: false, error: null, orders: null }), { kind: "signed-out" });
});

test("list: empty and ready", () => {
  assert.deepEqual(ordersListState({ auth: "authenticated", loading: false, error: null, orders: [] }), { kind: "empty" });
  assert.deepEqual(ordersListState({ auth: "authenticated", loading: false, error: null, orders: [order] }), { kind: "ready", orders: [order] });
});

test("list: errors say what to do; an expired session asks for sign-in instead of a retry", () => {
  const network = ordersListState({ auth: "authenticated", loading: false, error: { status: 0, code: "NETWORK_ERROR" }, orders: null });
  assert.equal(network.kind, "error");
  assert.match((network as { message: string }).message, /couldn't reach/);
  assert.equal((network as { signIn: boolean }).signIn, false);

  const server = ordersListState({ auth: "authenticated", loading: false, error: { status: 500, code: "INTERNAL_ERROR" }, orders: null });
  assert.deepEqual(server, { kind: "error", message: "We couldn't load your orders just now. Please try again.", signIn: false });

  for (const status of [401, 403]) {
    const expired = ordersListState({ auth: "authenticated", loading: false, error: { status, code: "UNAUTHENTICATED" }, orders: null });
    assert.equal((expired as { signIn: boolean }).signIn, true);
  }
});

/* ---- detail states ------------------------------------------------------------------------- */

test("detail: 404 (missing or someone else's order) is 'not found', never an error with details", () => {
  assert.deepEqual(orderDetailState({ auth: "authenticated", loading: false, error: { status: 404, code: "NOT_FOUND" }, order: null }), { kind: "not-found" });
  assert.deepEqual(orderDetailState({ auth: "authenticated", loading: false, error: null, order }), { kind: "ready", order });
  assert.deepEqual(orderDetailState({ auth: "unauthenticated", loading: false, error: null, order: null }), { kind: "signed-out" });
  const failed = orderDetailState({ auth: "authenticated", loading: false, error: { status: 502 }, order: null });
  assert.deepEqual(failed, { kind: "error", message: "We couldn't load this order just now. Please try again.", signIn: false });
});

/* ---- tracking -------------------------------------------------------------------------------- */

test("tracking: courier shipment shows the real AWB and events newest first", () => {
  const view = trackingView(order);
  assert.equal(view.kind, "courier");
  if (view.kind !== "courier") return;
  assert.deepEqual([view.courier, view.trackingNumber, view.statusLabel, view.trackingUrl, view.note], ["Delhivery", "9100000000000", "In transit", null, null]);
  assert.deepEqual(view.events.map((event) => event.status), ["In Transit", "Manifested"]);
});

test("tracking: no scans yet is stated plainly, never invented", () => {
  const waiting = trackingView({ ...order, shipment: { ...shipment, status: "MANIFESTED", events: [], lastCheckedAt: null } });
  assert.equal(waiting.kind === "courier" && waiting.note, "Tracking updates from Delhivery haven't arrived yet. Check back soon.");
  const quiet = trackingView({ ...order, shipment: { ...shipment, status: "MANIFESTED", events: [] } });
  assert.equal(quiet.kind === "courier" && quiet.note, "Delhivery hasn't recorded any scans for this parcel yet.");
});

test("tracking: unavailable states for unpaid, cancelled and not-yet-shipped orders", () => {
  const none = (over: Partial<Order>) => trackingView({ ...order, carrier: null, trackingNumber: null, shippedAt: null, shipment: null, ...over });
  assert.deepEqual(none({ status: "PENDING", paymentStatus: "UNPAID" }), { kind: "none", message: "Tracking will be available once payment is confirmed and your order ships." });
  assert.deepEqual(none({ status: "CANCELLED", paymentStatus: "UNPAID" }), { kind: "none", message: "This order was cancelled, so it won't be shipped." });
  assert.deepEqual(none({ status: "PROCESSING" }), { kind: "none", message: "Tracking will appear here once your order is handed to our courier." });
});

test("tracking: a hand-entered carrier and tracking number is shown without a timeline", () => {
  assert.deepEqual(trackingView({ ...order, shipment: null, carrier: "Blue Dart", trackingNumber: "BD-1" }), { kind: "manual", carrier: "Blue Dart", trackingNumber: "BD-1", shippedAt: order.shippedAt });
});

test("tracking links: only https URLs from the API are rendered", () => {
  assert.equal(safeTrackingUrl("https://www.delhivery.com/track/package/9100000000000"), "https://www.delhivery.com/track/package/9100000000000");
  for (const bad of [null, undefined, "", "http://example.com", "javascript:alert(1)", "data:text/html,x", "not a url"]) assert.equal(safeTrackingUrl(bad), null, String(bad));
  const view = trackingView({ ...order, shipment: { ...shipment, trackingUrl: "javascript:alert(1)" } });
  assert.equal(view.kind === "courier" && view.trackingUrl, null);
});

/* ---- labels -------------------------------------------------------------------------------- */

test("labels and tones", () => {
  assert.equal(orderStatusLabel({ status: "PENDING", paymentStatus: "UNPAID" }), "Awaiting payment");
  assert.equal(orderStatusLabel({ status: "PROCESSING", paymentStatus: "PAID" }), "Preparing for dispatch");
  assert.equal(orderStatusLabel({ status: "SHIPPED", paymentStatus: "PAID" }), "Shipped");
  assert.equal(orderStatusLabel({ status: "CANCELLED", paymentStatus: "UNPAID" }), "Cancelled");
  assert.equal(orderTone(order), "progress");
  assert.equal(orderTone({ ...order, status: "COMPLETED", shipment: { status: "DELIVERED" } }), "done");
  assert.equal(orderTone({ ...order, shipment: { status: "RETURNED" } }), "problem");
  assert.equal(formatEventTime("2026-10-20T13:00:00.000Z"), "20 Oct 2026, 6:30 pm");
  assert.equal(formatEventTime("garbage"), "");
});
