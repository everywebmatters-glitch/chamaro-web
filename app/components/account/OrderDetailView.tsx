"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, MapPin, Truck } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { fetchMyOrder } from "../../lib/orders-api";
import {
  formatEventTime,
  formatOrderDate,
  formatRupees,
  orderDetailState,
  orderReference,
  orderStatusLabel,
  orderTone,
  trackingView,
  type Order,
} from "../../lib/order-view";
import { SignInAgain } from "./OrdersList";
import "./orders.css";

type Result = { key: string; order?: Order; error?: unknown };

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className="tracking-copy"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => setCopied(true),
          () => undefined
        );
      }}
      aria-label={copied ? "Tracking number copied" : "Copy tracking number"}
    >
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function Tracking({ order }: { order: Order }) {
  const view = trackingView(order);

  return (
    <section className="order-panel" aria-labelledby="tracking-title">
      <h3 id="tracking-title">
        <Truck size={18} aria-hidden="true" /> Delivery tracking
      </h3>

      {view.kind === "none" && <p className="tracking-unavailable">{view.message}</p>}

      {view.kind === "manual" && (
        <dl className="tracking-facts">
          <div>
            <dt>Courier</dt>
            <dd>{view.carrier}</dd>
          </div>
          <div>
            <dt>Tracking number</dt>
            <dd className="tracking-awb">
              <span>{view.trackingNumber}</span>
              <CopyButton value={view.trackingNumber} />
            </dd>
          </div>
          {view.shippedAt && (
            <div>
              <dt>Shipped</dt>
              <dd>{formatEventTime(view.shippedAt)}</dd>
            </div>
          )}
        </dl>
      )}

      {view.kind === "courier" && (
        <>
          <p className="tracking-status">
            <span className={`order-pill order-pill-${orderTone(order)}`}>{view.statusLabel}</span>
            {view.courierStatus && view.courierStatus !== view.statusLabel && (
              <span className="tracking-courier-status">
                {view.courier}: {view.courierStatus}
              </span>
            )}
          </p>
          <dl className="tracking-facts">
            <div>
              <dt>Courier</dt>
              <dd>{view.courier}</dd>
            </div>
            <div>
              <dt>Tracking number (AWB)</dt>
              <dd className="tracking-awb">
                <span>{view.trackingNumber}</span>
                <CopyButton value={view.trackingNumber} />
              </dd>
            </div>
          </dl>
          {view.trackingUrl && (
            <a href={view.trackingUrl} target="_blank" rel="noopener noreferrer" className="tracking-link">
              Track on {view.courier} <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}

          {view.note ? (
            <p className="tracking-unavailable">{view.note}</p>
          ) : (
            <ol className="tracking-timeline" aria-label="Shipment updates, newest first">
              {view.events.map((event, index) => (
                <li key={`${event.occurredAt}-${index}`} className={index === 0 ? "current" : undefined}>
                  <span className="timeline-dot" aria-hidden="true" />
                  <div>
                    <p className="timeline-status">{event.status}</p>
                    {event.instructions && event.instructions !== event.status && <p className="timeline-note">{event.instructions}</p>}
                    <p className="timeline-meta">
                      <time dateTime={event.occurredAt}>{formatEventTime(event.occurredAt)}</time>
                      {event.location && (
                        <>
                          {" · "}
                          <MapPin size={12} aria-hidden="true" /> {event.location}
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}

function OrderBody({ order }: { order: Order }) {
  const address = order.shippingAddress;
  const addressLines = address
    ? [address.name, address.addressLine1, address.addressLine2, [address.city, address.state, address.postalCode].filter(Boolean).join(", "), address.phone].filter(Boolean)
    : [];

  return (
    <>
      <header className="order-detail-head">
        <div>
          <h2>Order #{orderReference(order.id)}</h2>
          <p>
            Placed {formatOrderDate(order.createdAt)} · Reference <span className="order-full-ref">{order.id}</span>
          </p>
        </div>
        <span className={`order-pill order-pill-${orderTone(order)}`}>{orderStatusLabel(order)}</span>
      </header>

      <div className="order-detail-grid">
        <Tracking order={order} />

        <section className="order-panel" aria-labelledby="items-title">
          <h3 id="items-title">Items</h3>
          <ul className="order-items">
            {order.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.productName ?? "Item"}
                  {item.variantName && <span className="order-item-variant"> · {item.variantName}</span>}
                  <span className="order-item-qty"> × {item.quantity}</span>
                </span>
                <span>{formatRupees(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="order-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatRupees(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping{order.shippingMethod ? ` (${order.shippingMethod})` : ""}</dt>
              <dd>{formatRupees(order.shippingTotal)}</dd>
            </div>
            <div className="order-total-row">
              <dt>Total</dt>
              <dd>{formatRupees(order.total)}</dd>
            </div>
          </dl>
        </section>

        {addressLines.length > 0 && (
          <section className="order-panel" aria-labelledby="address-title">
            <h3 id="address-title">Delivering to</h3>
            <address className="order-address">
              {addressLines.map((line, index) => (
                <span key={index}>{line}</span>
              ))}
            </address>
          </section>
        )}
      </div>
    </>
  );
}

export default function OrderDetailView({ orderId }: { orderId: string }) {
  const { status, token } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = status === "authenticated" && token ? `${token}#${orderId}#${attempt}` : null;

  useEffect(() => {
    if (!key || !token) return;
    const controller = new AbortController();
    fetchMyOrder(token, orderId, controller.signal)
      .then((order) => setResult({ key, order }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error });
      });
    return () => controller.abort();
  }, [key, token, orderId]);

  const current = result?.key === key ? result : null;
  const view = orderDetailState({ auth: status, loading: key !== null && !current, error: current?.error, order: current?.order ?? null });

  return (
    <div className="order-detail" aria-busy={view.kind === "loading" || undefined}>
      <Link href="/account/orders/" className="order-back">
        <ArrowLeft size={16} aria-hidden="true" /> All orders
      </Link>

      {view.kind === "loading" && (
        <div className="order-panel order-detail-skeleton" aria-label="Loading your order">
          <span />
          <span />
          <span />
        </div>
      )}

      {view.kind === "signed-out" && (
        <div className="account-empty">
          <p>Log in to see this order and track its delivery.</p>
          <Link href="/account/login" className="wishlist-return">
            Log in
          </Link>
        </div>
      )}

      {view.kind === "not-found" && (
        <div className="account-empty">
          <p>We couldn&apos;t find that order in your account.</p>
          <Link href="/account/orders/" className="wishlist-return">
            View your orders
          </Link>
        </div>
      )}

      {view.kind === "error" && (
        <div className="orders-error" role="alert">
          <p>{view.message}</p>
          {view.signIn ? (
            <SignInAgain />
          ) : (
            <button type="button" className="add-to-cart orders-action" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </button>
          )}
        </div>
      )}

      {view.kind === "ready" && <OrderBody order={view.order} />}
    </div>
  );
}
