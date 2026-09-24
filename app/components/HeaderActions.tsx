"use client";

import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SearchOverlay from "./SearchOverlay";
import { useStore } from "./store/StoreProvider";

export default function HeaderActions() {
  const { cartCount, wishlist, openCart } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="header-actions">
      <button
        className="icon-button"
        type="button"
        aria-label="Search"
        onClick={() => setSearchOpen(true)}
      >
        <Search size={23} strokeWidth={2} />
      </button>

      <Link className="icon-button header-account" href="/account" aria-label="Account">
        <UserRound size={23} strokeWidth={2} />
      </Link>

      <Link
        className="icon-button bag-button"
        href="/wishlist"
        aria-label={`Wishlist, ${wishlist.length} items`}
      >
        <Heart size={23} strokeWidth={2} />
        <b>{wishlist.length}</b>
      </Link>

      <button
        className="icon-button bag-button"
        type="button"
        aria-label={`Shopping bag, ${cartCount} items`}
        onClick={openCart}
      >
        <ShoppingBag size={23} strokeWidth={2} />
        <b>{cartCount}</b>
      </button>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
