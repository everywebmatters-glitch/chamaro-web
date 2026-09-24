"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  cartSubtotal,
  discountAmount,
  findDiscount,
  resolveLines,
  variantLabel,
} from "../../lib/cart";
import { formatPrice } from "../../lib/products";
import QuantityStepper from "../QuantityStepper";
import { useStore } from "../store/StoreProvider";
import DiscountForm from "./DiscountForm";
import FreeShippingProgress from "./FreeShippingProgress";
import ShippingEstimator from "./ShippingEstimator";

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="cart-accordion">
      <summary>
        {title}
        <Plus size={20} strokeWidth={1.8} aria-hidden="true" />
      </summary>
      <div className="cart-accordion-body">{children}</div>
    </details>
  );
}

export default function CartPageView() {
  const router = useRouter();
  const { cart, hydrated, setQuantity, removeLine, orderNote, setOrderNote, discountCode } =
    useStore();
  const [agreed, setAgreed] = useState(false);

  const lines = resolveLines(cart);
  const subtotal = cartSubtotal(lines);
  const discount = discountAmount(subtotal, findDiscount(discountCode));

  /* Avoid flashing "empty" before the saved cart loads */
  if (!hydrated) {
    return <div className="cart-page-loading" aria-busy="true" />;
  }

  if (lines.length === 0) {
    return (
      <div className="cart-empty cart-empty-page">
        <h2>Your cart is empty</h2>
        <p>Browse the collection and add a chair you love.</p>
        <Link href="/products" className="add-to-cart">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page-layout">
      {/* Items */}

      <div>
        <table className="cart-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key}>
                <td>
                  <div className="cart-table-product">
                    <Link href={`/products/${line.slug}`} className="cart-line-thumb">
                      <Image src={line.product.images[0].src} alt="" fill sizes="100px" />
                    </Link>
                    <div>
                      <Link href={`/products/${line.slug}`} className="cart-table-name">
                        {line.product.name}
                      </Link>
                      <small>{variantLabel(line)}</small>
                      <button
                        type="button"
                        className="remove-link"
                        onClick={() => removeLine(line.key)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </td>
                <td data-label="Price">
                  <div className="product-price-row">
                    {line.product.compareAtPrice && (
                      <s className="price-original">{formatPrice(line.product.compareAtPrice)}</s>
                    )}
                    <span className="price-current">{formatPrice(line.product.price)}</span>
                  </div>
                </td>
                <td data-label="Quantity">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(value) => setQuantity(line.key, value)}
                    label={`Quantity for ${line.product.name}`}
                    size="small"
                  />
                </td>
                <td data-label="Total" className="cart-table-total">
                  {formatPrice(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="order-note">
          <label htmlFor="order-note">Add Order Note</label>
          <textarea
            id="order-note"
            value={orderNote}
            onChange={(event) => setOrderNote(event.target.value)}
            placeholder="How can we help you? Delivery instructions, floor number, GST details…"
            rows={5}
          />
        </div>
      </div>

      {/* Summary */}

      <aside className="cart-summary" aria-label="Order summary">
        <div className="cart-summary-progress">
          <FreeShippingProgress subtotal={subtotal} />
        </div>

        <div className="cart-summary-panel">
          <Accordion title="Estimate Shipping">
            <ShippingEstimator subtotal={subtotal} idPrefix="cart-estimate" />
          </Accordion>

          <Accordion title="Discount code">
            <DiscountForm idPrefix="cart-discount" />
          </Accordion>

          {discount > 0 && (
            <div className="cart-summary-row">
              <span>Discount</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}

          <div className="cart-subtotal">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal - discount)}</strong>
          </div>

          <p className="cart-tax-note">
            Prices include GST. Shipping calculated at checkout.
          </p>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span>
              I agree with the <Link href="#">terms and conditions</Link>
            </span>
          </label>

          <button
            type="button"
            className="add-to-cart"
            onClick={() => router.push("/checkout")}
            disabled={!agreed}
          >
            Check out
          </button>
          {!agreed && (
            <p className="cart-terms-hint">Accept the terms and conditions to continue.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
