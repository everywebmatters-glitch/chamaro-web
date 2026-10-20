"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { availabilityLabels, discountPercent, formatPrice, priceFor, type Product, type ProductVariant } from "../lib/products";
import { FREE_SHIPPING_THRESHOLD } from "../lib/cart";
import { selectVariant } from "../lib/product-variants";
import ProductGallery from "./ProductGallery";

/* =========================================================
   SELECTED VARIANT
   The product page's gallery, price and purchase box share one
   colour/option choice, so picking a colour swaps that variant's
   photos and price in together.
========================================================= */

type VariantSelection = {
  color?: Product["colors"][number];
  setColor: (color: Product["colors"][number]) => void;
  option?: string;
  setOption: (option: string) => void;
  /* The variant matching the choice; undefined for products sold as one item */
  variant?: ProductVariant;
  price: number;
  compareAtPrice?: number;
};

const VariantContext = createContext<VariantSelection | null>(null);

export function useVariantSelection(): VariantSelection {
  const selection = useContext(VariantContext);
  if (!selection) throw new Error("useVariantSelection must be used inside <ProductVariantProvider>");
  return selection;
}

export function ProductVariantProvider({ product, children }: { product: Product; children: ReactNode }) {
  /* API products may have no colours yet */
  const [color, setColor] = useState(product.colors.at(0));
  const [option, setOption] = useState(product.option?.values.find((value) => value.available)?.label);
  const variant = selectVariant(product.variants, color?.name, option);
  const { price, compareAtPrice } = priceFor(product, variant);

  return (
    <VariantContext.Provider value={{ color, setColor, option, setOption, variant, price, compareAtPrice }}>
      {children}
    </VariantContext.Provider>
  );
}

/* The chosen variant's photos when it has its own, else the product's */
export function VariantGallery({ product }: { product: Product }) {
  const { variant, price } = useVariantSelection();
  const own = Boolean(variant?.images.length);
  return (
    <ProductGallery
      /* A new photo set starts from its first image */
      key={own ? variant!.id : product.slug}
      images={own ? variant!.images : product.images}
      badge={price >= FREE_SHIPPING_THRESHOLD ? "Free Delivery" : undefined}
    />
  );
}

/* "Out of stock" once the chosen colour (or the whole product) has no units left */
export function VariantStockBadge({ product }: { product: Product }) {
  const { variant } = useVariantSelection();
  const availability = variant?.stock === 0 ? "out-of-stock" : product.availability;
  return <span className={`stock-badge stock-${availability}`}>{availabilityLabels[availability]}</span>;
}

export function VariantPrice() {
  const { price, compareAtPrice } = useVariantSelection();
  const discount = discountPercent({ price, compareAtPrice });
  return (
    <div className="product-price-row product-price-large">
      {compareAtPrice && <s className="price-original">{formatPrice(compareAtPrice)}</s>}
      <span className="price-current">{formatPrice(price)}</span>
      {discount > 0 && <span className="price-save">{discount}% OFF</span>}
    </div>
  );
}
