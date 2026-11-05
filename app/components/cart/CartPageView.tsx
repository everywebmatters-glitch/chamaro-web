"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cartSubtotal,
  resolveLines,
  variantLabel,
} from "../../lib/cart";
import { formatPrice, unitsLeft } from "../../lib/products";
import QuantityStepper from "../QuantityStepper";
import CartNotices from "./CartNotices";
import { useStore } from "../store/StoreProvider";
import { useAuth } from "../auth/AuthProvider";
import DiscountForm from "./DiscountForm";

export default function CartPageView() {
  const router = useRouter();
  const {
    catalog,
    catalogFailed,
    findProduct,
    cart,
    hydrated,
    setQuantity,
    removeLine,
    discountCustomerId,
    appliedDiscountTotal,
  } = useStore();
  const { user } = useAuth();

  const lines = resolveLines(cart, findProduct);
  const subtotal = cartSubtotal(lines);
  const discount = discountCustomerId === user?.id ? appliedDiscountTotal : 0;
  const total = subtotal - discount;

  /* Avoid flashing "empty" before the saved cart loads */
  if (!hydrated || (cart.length > 0 && !catalog && !catalogFailed)) {
    return <div className="cart-page-loading" aria-busy="true" />;
  }

  if (cart.length > 0 && !catalog) {
    return (
      <div className="cart-empty cart-empty-page" role="alert">
        <h2>We couldn&apos;t load your cart</h2>
        <p>Please check your connection and try again in a moment.</p>
        <button type="button" className="add-to-cart" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="cart-empty cart-empty-page">
        <CartNotices />
        <h2>Your cart is empty</h2>
        <p>Browse the collection and add a chair you love.</p>
        <Link href="/products" className="add-to-cart">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <CartNotices />

      <table className="cart-table">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Quantity</th>
            <th scope="col">Price</th>
            <th scope="col">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.key}>
              <td>
                <div className="cart-table-product">
                  <Link href={`/products/${line.slug}`} className="cart-line-thumb">
                    <Image src={(line.variant?.images[0] ?? line.product.images[0]).src} alt="" fill sizes="100px" />
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
              <td data-label="Quantity">
                <QuantityStepper
                  value={line.quantity}
                  onChange={(value) => setQuantity(line.key, value)}
                  label={`Quantity for ${line.product.name}`}
                  size="small"
                  max={unitsLeft(line.product, line.variant)}
                />
              </td>
              <td data-label="Price">
                <div className="product-price-row">
                  {line.compareAtPrice && (
                    <s className="price-original">{formatPrice(line.compareAtPrice)}</s>
                  )}
                  <span className="price-current">{formatPrice(line.unitPrice)}</span>
                </div>
              </td>
              <td data-label="Subtotal" className="cart-table-total">
                <span className="price-numeric">{formatPrice(line.lineTotal)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cart-page-layout">
        {/* Coupon */}

        <div className="cart-coupon">
          <h3>Have a coupon?</h3>
          <p>Add your code for an instant cart discount</p>
          <DiscountForm idPrefix="cart-discount" />
        </div>

        {/* Summary */}

        <aside className="cart-summary" aria-label="Order summary">
          <div className="cart-summary-panel">
            <h3>Cart summary</h3>

            {discount > 0 && (
              <div className="cart-summary-row">
                <span>Discount</span>
                <span className="price-numeric">−{formatPrice(discount)}</span>
              </div>
            )}

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span className="price-numeric">{formatPrice(subtotal - discount)}</span>
            </div>

            <div className="cart-subtotal">
              <span>Total</span>
              <strong className="price-numeric">{formatPrice(total)}</strong>
            </div>

            <button
              type="button"
              className="add-to-cart"
              onClick={() => router.push("/checkout")}
            >
              Checkout
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
