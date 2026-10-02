"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cartSubtotal,
  discountAmount,
  findDiscount,
  resolveLines,
  SHIPPING_METHODS,
  shippingCost,
  variantLabel,
  type ShippingMethodId,
} from "../../lib/cart";
import { formatPrice } from "../../lib/products";
import QuantityStepper from "../QuantityStepper";
import { useStore } from "../store/StoreProvider";
import DiscountForm from "./DiscountForm";
import FreeShippingProgress from "./FreeShippingProgress";

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
    discountCode,
  } = useStore();
  const [shipping, setShipping] = useState<ShippingMethodId>("standard");

  const lines = resolveLines(cart, findProduct);
  const subtotal = cartSubtotal(lines);
  const discount = discountAmount(subtotal, findDiscount(discountCode));
  const shippingTotal = shippingCost(shipping, subtotal);
  const total = subtotal - discount + shippingTotal;

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
      <div className="cart-page-shipping-bar">
        <FreeShippingProgress subtotal={subtotal} />
      </div>

      <div className="cart-page-layout">
        {/* Items */}

        <div>
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
                  <td data-label="Quantity">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(value) => setQuantity(line.key, value)}
                      label={`Quantity for ${line.product.name}`}
                      size="small"
                    />
                  </td>
                  <td data-label="Price">
                    <div className="product-price-row">
                      {line.product.compareAtPrice && (
                        <s className="price-original">{formatPrice(line.product.compareAtPrice)}</s>
                      )}
                      <span className="price-current">{formatPrice(line.product.price)}</span>
                    </div>
                  </td>
                  <td data-label="Subtotal" className="cart-table-total">
                    {formatPrice(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-coupon">
            <h3>Have a coupon?</h3>
            <p>Add your code for an instant cart discount</p>
            <DiscountForm idPrefix="cart-discount" />
          </div>
        </div>

        {/* Summary */}

        <aside className="cart-summary" aria-label="Order summary">
          <div className="cart-summary-panel">
            <h3>Cart summary</h3>

            <div className="option-list">
              {SHIPPING_METHODS.map((method) => {
                const cost = shippingCost(method.id, subtotal);
                return (
                  <label key={method.id} className={shipping === method.id ? "selected" : ""}>
                    <input
                      type="radio"
                      name="cart-shipping"
                      value={method.id}
                      checked={shipping === method.id}
                      onChange={() => setShipping(method.id)}
                    />
                    <span>{method.label}</span>
                    <strong>{cost === 0 ? formatPrice(0) : `+${formatPrice(cost)}`}</strong>
                  </label>
                );
              })}
            </div>

            {discount > 0 && (
              <div className="cart-summary-row">
                <span>Discount</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}

            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal - discount)}</span>
            </div>

            <div className="cart-subtotal">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
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
