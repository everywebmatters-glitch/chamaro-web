"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Package, Truck } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { fetchMyOrders } from "../../lib/orders-api";
import {
  formatOrderDate,
  formatRupees,
  orderReference,
  orderStatusLabel,
  orderTone,
  ordersListState,
  shipmentStatusLabel,
  type Order,
} from "../../lib/order-view";
import "./orders.css";

/* The API's page-size ceiling; older orders beyond it are mentioned, not listed */
const LIMIT = 50;

type Result = { key: string; orders?: Order[]; total?: number; error?: unknown };

export function SignInAgain({ label = "Log in again" }: { label?: string }) {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <button
      type="button"
      className="add-to-cart orders-action"
      onClick={() => {
        logout();
        router.push("/account/login");
      }}
    >
      {label}
    </button>
  );
}

function OrderCard({ order }: { order: Order }) {
  const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const first = order.items[0]?.productName ?? "Item";
  const more = order.items.length > 1 ? ` + ${order.items.length - 1} more` : "";

  return (
    <li>
      <Link href={`/account/orders/${encodeURIComponent(order.id)}/`} className="order-card">
        <span className="order-card-main">
          <span className="order-card-ref">
            Order #{orderReference(order.id)}
            <span className="order-card-date">{formatOrderDate(order.createdAt)}</span>
          </span>
          <span className="order-card-items">
            {first}
            {more} · {items} {items === 1 ? "item" : "items"}
          </span>
          {order.shipment ? (
            <span className="order-card-tracking">
              <Truck size={15} aria-hidden="true" />
              {order.shipment.courier} · {shipmentStatusLabel(order.shipment.status)}
            </span>
          ) : null}
        </span>
        <span className="order-card-side">
          <span className={`order-pill order-pill-${orderTone(order)}`}>{orderStatusLabel(order)}</span>
          <span className="order-card-total">{formatRupees(order.total)}</span>
        </span>
        <ChevronRight className="order-card-chevron" size={18} aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function OrdersList({ showHeading = true }: { showHeading?: boolean }) {
  const { status, token } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  /* One request per signed-in token (and per retry); a late answer for an older key is ignored */
  const key = status === "authenticated" && token ? `${token}#${attempt}` : null;

  useEffect(() => {
    if (!key || !token) return;
    const controller = new AbortController();
    fetchMyOrders(token, 1, LIMIT, controller.signal)
      .then(({ data, meta }) => setResult({ key, orders: data, total: meta?.total ?? data.length }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error });
      });
    return () => controller.abort();
  }, [key, token]);

  const current = result?.key === key ? result : null;
  const view = ordersListState({ auth: status, loading: key !== null && !current, error: current?.error, orders: current?.orders ?? null });

  return (
    <div className="account-content" aria-busy={view.kind === "loading" || undefined}>
      {showHeading && <h2>Orders</h2>}

      {view.kind === "loading" && (
        <ul className="order-list" aria-label="Loading your orders">
          {[0, 1, 2].map((row) => (
            <li key={row} className="order-card order-card-skeleton" aria-hidden="true">
              <span />
              <span />
            </li>
          ))}
        </ul>
      )}

      {view.kind === "signed-out" && (
        <div className="account-empty">
          <p>Log in to see your orders and track their delivery.</p>
          <Link href="/account/login" className="wishlist-return">
            Log in
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

      {view.kind === "empty" && (
        <div className="account-empty">
          <Package size={28} aria-hidden="true" className="orders-empty-icon" />
          <p>You haven&apos;t placed any orders yet. Orders you place will appear here, with delivery tracking once they ship.</p>
          <Link href="/products" className="wishlist-return">
            Browse chairs
          </Link>
        </div>
      )}

      {view.kind === "ready" && (
        <>
          <ul className="order-list">
            {view.orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
          {(current?.total ?? 0) > view.orders.length && (
            <p className="orders-footnote">
              Showing your {view.orders.length} most recent orders. Contact us for anything older.
            </p>
          )}
        </>
      )}
    </div>
  );
}
