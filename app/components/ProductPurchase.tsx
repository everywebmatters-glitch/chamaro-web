"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CircleHelp,
  Heart,
  Package,
  RotateCcw,
  Share2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatPrice, storePolicies, unitsLeft, type Product } from "../lib/products";
import Modal from "./Modal";
import QuantityStepper from "./QuantityStepper";
import PaymentBadges from "./PaymentBadges";
import { useStore } from "./store/StoreProvider";
import { useVariantSelection } from "./ProductVariantProvider";
import { selectVariant } from "../lib/product-variants";
import { contact } from "../lib/site";

/* Show "Only N left" at or below this many units */
const LOW_STOCK_NOTE = 5;

/* TODO: replace with the real support address */

export default function ProductPurchase({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted, notify } = useStore();

  /* Colour/option are shared with the gallery and price (they swap to the chosen variant's) */
  const { color, setColor, option, setOption, variant, price } = useVariantSelection();
  const [quantity, setQuantity] = useState(1);
  const [modal, setModal] = useState<"dimensions" | "question" | "delivery" | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const saved = isWishlisted(product.slug);
  /* The chosen colour's own stock counts as well as the product's */
  const left = unitsLeft(product, variant);
  const soldOut = product.availability === "out-of-stock" || left === 0;
  /* Only worth mentioning when stock is tracked and nearly gone */
  const lowStock = !soldOut && left !== undefined && left <= LOW_STOCK_NOTE;
  const verb = product.availability === "pre-order" ? "Pre-order" : "Add to Bag";
  const total = formatPrice(price * quantity);

  /* Show the sticky bar once the main button scrolls above the viewport */
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  const add = () =>
    addToCart(
      { slug: product.slug, color: color?.name ?? "", option, ...(variant ? { variantId: variant.id } : {}), quantity },
      product.name
    );

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify("Link copied to clipboard");
    } catch {
      /* share sheet dismissed */
    }
  };

  const variantLabel = [color?.name, option].filter(Boolean).join(" / ");

  /* The product's own return policy from Admin (first line as the summary), else the store-wide one */
  const returnsText = storePolicies.returns;

  return (
    <div className="product-purchase">
      {/* Colour */}

      {color && (
        <div className="purchase-field">
          <p className="option-label">
            {product.colorLabel ?? "Colour"}: <strong>{color.name}</strong>
          </p>
          <div className="swatch-row" role="group" aria-label={product.colorLabel ?? "Colour"}>
            {product.colors.map((item) => {
              /* Still selectable (to see its photos), but marked when that colour has no units */
              const itemSoldOut = selectVariant(product.variants, item.name, option)?.stock === 0;
              return (
                <button
                  key={item.name}
                  type="button"
                  className={`swatch${item.name === color.name ? " selected" : ""}${itemSoldOut ? " sold-out" : ""}`}
                  style={{ background: item.hex }}
                  onClick={() => setColor(item)}
                  aria-label={itemSoldOut ? `${item.name} (sold out)` : item.name}
                  aria-pressed={item.name === color.name}
                  title={itemSoldOut ? `${item.name} – sold out` : item.name}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Option (e.g. base finish) */}

      {product.option && (
        <div className="purchase-field">
          <div className="option-label-row">
            <p className="option-label">
              {product.option.name}: <strong>{option}</strong>
            </p>
            <button type="button" className="text-link" onClick={() => setModal("dimensions")}>
              Dimensions
            </button>
          </div>

          <div className="option-pills">
            {product.option.values.map((value) => (
              <button
                key={value.label}
                type="button"
                className={value.label === option ? "selected" : ""}
                onClick={() => setOption(value.label)}
                disabled={!value.available}
                aria-pressed={value.label === option}
                title={value.available ? undefined : "Currently unavailable"}
              >
                {value.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}

      <div className="purchase-field">
        <p className="option-label option-label-strong">Quantity</p>
        <QuantityStepper value={quantity} onChange={setQuantity} max={left} />
        {lowStock && <p className="stock-note">Only {left} left in stock</p>}
      </div>

      {/* Actions */}

      <div className="purchase-actions">
        <button
          ref={buttonRef}
          type="button"
          className="add-to-cart"
          onClick={add}
          disabled={soldOut}
        >
          {soldOut ? "Sold out" : `${verb} – ${total}`}
        </button>

        <button
          type="button"
          className={`square-button${saved ? " active" : ""}`}
          onClick={() => toggleWishlist(product.slug, product.name)}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={saved}
        >
          <Heart size={19} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Secondary actions */}

      <div className="purchase-links">
        <button type="button" onClick={() => setModal("question")}>
          <CircleHelp size={19} strokeWidth={1.7} aria-hidden="true" />
          Ask a question
        </button>
        <button type="button" onClick={() => setModal("delivery")}>
          <Truck size={19} strokeWidth={1.7} aria-hidden="true" />
          Delivery &amp; Return
        </button>
        <button type="button" onClick={share}>
          <Share2 size={19} strokeWidth={1.7} aria-hidden="true" />
          Share
        </button>
      </div>

      {/* Delivery + returns */}

      <div className="policy-boxes">
        <div>
          <Package size={30} strokeWidth={1.4} aria-hidden="true" />
          <p>{storePolicies.delivery}</p>
        </div>
        <div>
          <RotateCcw size={30} strokeWidth={1.4} aria-hidden="true" />
          <p>{returnsText}</p>
        </div>
      </div>

      <div className="safe-checkout">
        <p>
          <ShieldCheck size={22} strokeWidth={1.6} aria-hidden="true" />
          Guaranteed Safe Checkout
        </p>
        <PaymentBadges />
      </div>

      {/* Sticky add-to-bag bar */}

      <div
        className="sticky-buy-bar"
        data-visible={showSticky ? "true" : "false"}
        aria-hidden={!showSticky}
        inert={!showSticky}
      >
        <div className="sticky-buy-product">
          <span className="sticky-buy-thumb">
            <Image src={product.images[0].src} alt="" fill sizes="56px" />
          </span>
          <span className="sticky-buy-name">{product.name}</span>
        </div>

        <div className="sticky-buy-controls">
          <span className="sticky-buy-variant">
            {variantLabel} – {formatPrice(price)}
          </span>
          <QuantityStepper value={quantity} onChange={setQuantity} label="Quantity (sticky bar)" max={left} />
          <button type="button" className="add-to-cart" onClick={add} disabled={soldOut}>
            {soldOut ? "Sold out" : verb}
          </button>
        </div>
      </div>

      {/* Modals */}

      <Modal
        open={modal === "dimensions"}
        onClose={() => setModal(null)}
        title="Dimensions"
        className="info-modal"
      >
        <h2>Dimensions &amp; specifications</h2>
        <dl className="spec-list">
          {product.specs.map((spec) => (
            <div key={spec.label}>
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>
      </Modal>

      <Modal
        open={modal === "delivery"}
        onClose={() => setModal(null)}
        title="Delivery and returns"
        className="info-modal"
      >
        <h2>Delivery</h2>
        <p>{storePolicies.delivery}</p>
        <h2>Returns</h2>
        <p>{returnsText}</p>
      </Modal>

      <Modal
        open={modal === "question"}
        onClose={() => setModal(null)}
        title="Ask a question"
        className="info-modal"
      >
        <h2>Ask a question</h2>
        <p>
          Have a question about the {product.name}? Our team usually replies within one
          working day.
        </p>
        <a
          className="add-to-cart"
          href={`mailto:${contact.email}?subject=${encodeURIComponent(`Question about ${product.name}`)}`}
        >
          Email {contact.email}
        </a>
        <Link href="/b2b" className="text-link" onClick={() => setModal(null)}>
          Buying for an office? Ask about bulk pricing <span aria-hidden="true">↗</span>
        </Link>
      </Modal>
    </div>
  );
}
