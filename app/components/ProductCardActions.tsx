"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { formatPrice, getCategoryName, type Product } from "../lib/products";
import Modal from "./Modal";
import { useStore } from "./store/StoreProvider";

export default function ProductCardActions({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  /* API products may have no colours yet */
  const [color, setColor] = useState(product.colors.at(0));

  const saved = isWishlisted(product.slug);
  const soldOut = product.availability === "out-of-stock";
  const firstOption = product.option?.values.find((value) => value.available)?.label;

  const quickAdd = () =>
    addToCart(
      { slug: product.slug, color: color?.name ?? "", option: firstOption, quantity: 1 },
      product.name
    );

  return (
    <>
      <div className="product-card-actions">
        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut}
          aria-label={`Add ${product.name} to bag`}
          data-tooltip="Add to bag"
        >
          <ShoppingBag size={17} strokeWidth={1.8} />
        </button>

        <button
          type="button"
          onClick={() => toggleWishlist(product.slug, product.name)}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={saved}
          className={saved ? "active" : ""}
          data-tooltip={saved ? "Saved" : "Wishlist"}
        >
          <Heart size={17} strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
        </button>

        <button
          type="button"
          onClick={() => setQuickViewOpen(true)}
          aria-label={`Quick view ${product.name}`}
          data-tooltip="Quick view"
        >
          <Eye size={17} strokeWidth={1.8} />
        </button>
      </div>

      <Modal
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
        title={`Quick view: ${product.name}`}
        className="quick-view"
      >
        <div className="quick-view-layout">
          <div className="quick-view-media">
            <Image src={product.images[0].src} alt={product.images[0].alt} fill sizes="400px" />
          </div>

          <div className="quick-view-info">
            <p className="product-category">{product.categoryName ?? getCategoryName(product.category)}</p>
            <h2>{product.name}</h2>

            <div className="product-price-row">
              <span className="price-current">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <s className="price-original">{formatPrice(product.compareAtPrice)}</s>
              )}
            </div>

            <p className="quick-view-description">{product.shortDescription}</p>

            {color && (
              <>
                <p className="option-label">
                  Colour: <strong>{color.name}</strong>
                </p>
                <div className="swatch-row">
                  {product.colors.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      className={`swatch${option.name === color.name ? " selected" : ""}`}
                      style={{ background: option.hex }}
                      onClick={() => setColor(option)}
                      aria-label={option.name}
                      aria-pressed={option.name === color.name}
                    />
                  ))}
                </div>
              </>
            )}

            <button
              type="button"
              className="add-to-cart"
              onClick={() => {
                quickAdd();
                setQuickViewOpen(false);
              }}
              disabled={soldOut}
            >
              {soldOut ? "Sold out" : `Add to Bag – ${formatPrice(product.price)}`}
            </button>

            <Link href={`/products/${product.slug}`} className="text-link">
              View full details <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
