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
import { formatPrice, storePolicies, type Product } from "../lib/products";
import Modal from "./Modal";
import QuantityStepper from "./QuantityStepper";
import PaymentBadges from "./PaymentBadges";
import { useStore } from "./store/StoreProvider";
import { contact } from "../lib/site";

/* TODO: replace with the real support address */

export default function ProductPurchase({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted, notify } = useStore();

  const [color, setColor] = useState(product.colors[0]);
  const [option, setOption] = useState(
    product.option?.values.find((value) => value.available)?.label
  );
  const [quantity, setQuantity] = useState(1);
  const [modal, setModal] = useState<"dimensions" | "question" | "delivery" | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const saved = isWishlisted(product.slug);
  const soldOut = product.availability === "out-of-stock";
  const verb = product.availability === "pre-order" ? "Pre-order" : "Add to Bag";
  const total = formatPrice(product.price * quantity);

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
    addToCart({ slug: product.slug, color: color.name, option, quantity }, product.name);

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

  const variantLabel = [color.name, option].filter(Boolean).join(" / ");

  return (
    <div className="product-purchase">
      {/* Colour */}

      <div className="purchase-field">
        <p className="option-label">
          Colour: <strong>{color.name}</strong>
        </p>
        <div className="swatch-row">
          {product.colors.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`swatch${item.name === color.name ? " selected" : ""}`}
              style={{ background: item.hex }}
              onClick={() => setColor(item)}
              aria-label={item.name}
              aria-pressed={item.name === color.name}
            />
          ))}
        </div>
      </div>

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
        <QuantityStepper value={quantity} onChange={setQuantity} />
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
          <p>{storePolicies.returns}</p>
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
            {variantLabel} – {formatPrice(product.price)}
          </span>
          <QuantityStepper value={quantity} onChange={setQuantity} label="Quantity (sticky bar)" />
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
        <p>{storePolicies.returns}</p>
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
