"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, NotebookPen, TicketPercent, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  cartSubtotal,
  discountAmount,
  findDiscount,
  resolveLines,
  variantLabel,
} from "../../lib/cart";
import { formatPrice, products } from "../../lib/products";
import QuantityStepper from "../QuantityStepper";
import { useStore } from "../store/StoreProvider";
import DiscountForm from "./DiscountForm";
import FreeShippingProgress from "./FreeShippingProgress";
import ShippingEstimator from "./ShippingEstimator";

type Tool = "note" | "shipping" | "discount";

const tools: { id: Tool; label: string; icon: typeof Truck }[] = [
  { id: "note", label: "Add order note", icon: NotebookPen },
  { id: "shipping", label: "Estimate shipping", icon: Truck },
  { id: "discount", label: "Discount code", icon: TicketPercent },
];

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    cartOpen,
    closeCart,
    setQuantity,
    removeLine,
    orderNote,
    setOrderNote,
    discountCode,
  } = useStore();
  const [tool, setTool] = useState<Tool | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [slide, setSlide] = useState(0);

  const lines = resolveLines(cart);
  const subtotal = cartSubtotal(lines);
  const discount = discountAmount(subtotal, findDiscount(discountCode));
  const suggestions = products.filter(
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

        {lines.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <button type="button" className="add-to-cart" onClick={() => goTo("/products")}>
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-drawer-progress">
              <FreeShippingProgress subtotal={subtotal} />
            </div>

            <div className="cart-drawer-scroll">
              {/* Line items */}

              <ul className="cart-drawer-lines">
                {lines.map((line) => (
                  <li key={line.key}>
                    <Link
                      href={`/products/${line.slug}`}
                      className="cart-line-thumb"
                      onClick={closeCart}
                    >
                      <Image src={line.product.images[0].src} alt="" fill sizes="96px" />
                    </Link>

                    <div className="cart-line-info">
                      <Link href={`/products/${line.slug}`} onClick={closeCart}>
                        {line.product.name}
                      </Link>
                      <small>{variantLabel(line)}</small>

                      <div className="product-price-row">
                        {line.product.compareAtPrice && (
                          <s className="price-original">
                            {formatPrice(line.product.compareAtPrice)}
                          </s>
                        )}
                        <span className="price-current">{formatPrice(line.product.price)}</span>
                      </div>

                      <div className="cart-line-controls">
                        <QuantityStepper
                          value={line.quantity}
                          onChange={(value) => setQuantity(line.key, value)}
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
                      <div className="carousel-dots">
                        {suggestions.map((product, index) => (
                          <button
                            key={product.slug}
                            type="button"
                            className={index === slide ? "selected" : ""}
                            onClick={() => setSlide(index)}
                            aria-label={`Show ${product.name}`}
                            aria-pressed={index === slide}
                          />
                        ))}
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
                      <Eye size={18} />
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* Tools: note / shipping / discount */}

            <div className="cart-tools">
              {tools.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={tool === id ? "selected" : ""}
                  onClick={() => setTool(tool === id ? null : id)}
                  aria-label={label}
                  aria-expanded={tool === id}
                  title={label}
                >
                  <Icon size={20} strokeWidth={1.6} />
                </button>
              ))}
            </div>

            {tool && (
              <div className="cart-tool-panel">
                <div className="cart-tool-panel-header">
                  <h3>{tools.find((item) => item.id === tool)?.label}</h3>
                  <button type="button" onClick={() => setTool(null)} aria-label="Close panel">
                    <X size={18} />
                  </button>
                </div>

                {tool === "note" && (
                  <>
                    <label className="sr-only" htmlFor="drawer-note">
                      Order note
                    </label>
                    <textarea
                      id="drawer-note"
                      value={orderNote}
                      onChange={(event) => setOrderNote(event.target.value)}
                      placeholder="Delivery instructions, floor number, GST details…"
                      rows={4}
                    />
                  </>
                )}
                {tool === "shipping" && <ShippingEstimator subtotal={subtotal} idPrefix="drawer" />}
                {tool === "discount" && <DiscountForm idPrefix="drawer-discount" />}
              </div>
            )}

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
