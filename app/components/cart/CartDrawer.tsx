"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  cartSubtotal,
  isChairProduct,
  resolveLines,
  variantLabel,
} from "../../lib/cart";
import { formatPrice, unitsLeft } from "../../lib/products";
import QuantityStepper from "../QuantityStepper";
import CartNotices from "./CartNotices";
import { useStore } from "../store/StoreProvider";
import FreeShippingProgress from "./FreeShippingProgress";
import { useAuth } from "../auth/AuthProvider";

export default function CartDrawer() {
  const router = useRouter();
  const {
    catalog,
    catalogFailed,
    findProduct,
    cart,
    cartOpen,
    closeCart,
    setQuantity,
    removeLine,
    discountCode,
    discountCustomerId,
    appliedDiscountTotal,
  } = useStore();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [slide, setSlide] = useState(0);

  const lines = resolveLines(cart, findProduct);
  /* Saved lines exist but live product data hasn't arrived (or couldn't) yet */
  const pending = cart.length > 0 && !catalog;
  const subtotal = cartSubtotal(lines);
  const chairCount = lines.reduce((count, line) => count + (isChairProduct(line.product) ? line.quantity : 0), 0);
  const discount = discountCustomerId === user?.id ? appliedDiscountTotal : 0;
  const suggestions = (catalog ?? []).filter(
    (product) => !cart.some((line) => line.slug === product.slug)
  );
  const current = suggestions[Math.min(slide, suggestions.length - 1)];

  /* Escape closes; lock page scroll while open */
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, closeCart]);

  const goTo = (href: string) => {
    closeCart();
    router.push(href);
  };

  return (
    <>
      <div
        className="drawer-backdrop"
        data-open={cartOpen ? "true" : "false"}
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className="cart-drawer"
        data-open={cartOpen ? "true" : "false"}
        aria-label="Shopping cart"
        aria-hidden={!cartOpen}
        inert={!cartOpen}
      >
        <div className="cart-drawer-header">
          <h2>Shopping cart</h2>
          <button type="button" onClick={closeCart} aria-label="Close cart">
            <X size={24} strokeWidth={1.6} />
          </button>
        </div>

        {pending ? (
          <div className="cart-empty" role={catalogFailed ? "alert" : "status"}>
            <p>
              {catalogFailed
                ? "We couldn't load your cart right now. Please try again in a moment."
                : "Loading your cart…"}
            </p>
          </div>
        ) : lines.length === 0 ? (
          <div className="cart-empty">
            <CartNotices />
            <p>Your cart is empty.</p>
            <button type="button" className="add-to-cart" onClick={() => goTo("/products")}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-progress">
              <FreeShippingProgress chairCount={chairCount} />
            </div>

            <div className="cart-drawer-scroll">
              <CartNotices />

              {/* Line items */}

              <ul className="cart-drawer-lines">
                {lines.map((line) => (
                  <li key={line.key}>
                    <Link
                      href={`/products/${line.slug}`}
                      className="cart-line-thumb"
                      onClick={closeCart}
                    >
                      <Image src={(line.variant?.images[0] ?? line.product.images[0]).src} alt="" fill sizes="96px" />
                    </Link>

                    <div className="cart-line-info">
                      <Link href={`/products/${line.slug}`} onClick={closeCart}>
                        {line.product.name}
                      </Link>
                      <small>{variantLabel(line)}</small>

                      <div className="product-price-row">
                        {line.compareAtPrice && (
                          <s className="price-original">
                            {formatPrice(line.compareAtPrice)}
                          </s>
                        )}
                        <span className="price-current">{formatPrice(line.unitPrice)}</span>
                      </div>

                      <div className="cart-line-controls">
                        <QuantityStepper
                          value={line.quantity}
                          onChange={(value) => setQuantity(line.key, value)}
                          max={unitsLeft(line.product, line.variant)}
                          label={`Quantity for ${line.product.name}`}
                          size="small"
                        />
                        <button
                          type="button"
                          className="remove-link"
                          onClick={() => removeLine(line.key)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* You may also like */}

              {current && (
                <section className="cart-suggestions" aria-labelledby="cart-suggestions-title">
                  <div className="cart-suggestions-header">
                    <h3 id="cart-suggestions-title">You may also like</h3>
                    {suggestions.length > 1 && (
                      <div className="carousel-controls" aria-label="Browse product suggestions">
                        <button
                          type="button"
                          onClick={() => setSlide((index) => (index + suggestions.length - 1) % suggestions.length)}
                          aria-label="Previous product suggestion"
                        >
                          <ChevronLeft size={16} aria-hidden="true" />
                        </button>
                        <span aria-live="polite">{Math.min(slide, suggestions.length - 1) + 1} / {suggestions.length}</span>
                        <button
                          type="button"
                          onClick={() => setSlide((index) => (index + 1) % suggestions.length)}
                          aria-label="Next product suggestion"
                        >
                          <ChevronRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="cart-suggestion">
                    <span className="cart-line-thumb">
                      <Image src={current.images[0].src} alt="" fill sizes="96px" />
                    </span>
                    <div>
                      <p>{current.name}</p>
                      <div className="product-price-row">
                        {current.compareAtPrice && (
                          <s className="price-original">{formatPrice(current.compareAtPrice)}</s>
                        )}
                        <span className="price-current">{formatPrice(current.price)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="round-icon-button"
                      onClick={() => goTo(`/products/${current.slug}`)}
                      aria-label={`View ${current.name}`}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Footer */}

            <div className="cart-drawer-footer">
              {discount > 0 && (
                <div className="cart-summary-row cart-discount-row">
                  <span>Discount ({discountCode})</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="cart-subtotal">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal - discount)}</strong>
              </div>
              <p className="cart-tax-note">
                Prices include GST. <Link href="/cart" onClick={closeCart}>Shipping</Link>{" "}
                calculated at checkout.
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

              <div className="cart-drawer-actions">
                <button type="button" className="outline-button" onClick={() => goTo("/cart")}>
                  View cart
                </button>
                <button
                  type="button"
                  className="add-to-cart"
                  onClick={() => goTo("/checkout")}
                  disabled={!agreed}
                  title={agreed ? undefined : "Please accept the terms and conditions"}
                >
                  Check out
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
