"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { getProduct, type Product } from "../lib/products";
import ProductCard from "./ProductCard";
import { useStore } from "./store/StoreProvider";

export default function WishlistView() {
  const { wishlist, hydrated } = useStore();

  /* Avoid flashing the empty state before saved items load */
  if (!hydrated) {
    return <div className="cart-page-loading" aria-busy="true" />;
  }

  const items = wishlist
    .map((slug) => getProduct(slug))
    .filter((product): product is Product => Boolean(product));

  if (items.length === 0) {
    return (
      <div className="wishlist-empty">
        <Heart size={52} strokeWidth={1.4} aria-hidden="true" />
        <h1>Wishlist is empty.</h1>
        <p>
          You don&apos;t have any products in the wishlist yet. You will find a lot of
          interesting chairs on our Products page.
        </p>
        <Link href="/products" className="wishlist-return">
          Return to shop
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="wishlist-heading">
        <h1>Wishlist</h1>
        <p>
          {items.length} saved {items.length === 1 ? "chair" : "chairs"}. Tap the heart on a
          product to remove it.
        </p>
      </div>

      <div className="catalog-grid" data-cols="4">
        {items.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
