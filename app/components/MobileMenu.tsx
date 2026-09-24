"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Heart, Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { categories } from "../lib/products";
import { useStore } from "./store/StoreProvider";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { wishlist, cartCount, openCart } = useStore();

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal target exists only after mount
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close on navigation
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  /* Links to the current page don't change the pathname, so close on any link tap */
  const closeOnLink = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  };

  /* Rendered in <body> so the sticky header's slide transform can't trap the fixed panel */
  const drawer = (
    <>
      <div
        className="drawer-backdrop"
        data-open={open ? "true" : "false"}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-menu"
        className="mobile-menu"
        data-open={open ? "true" : "false"}
        aria-label="Menu"
        aria-hidden={!open}
        inert={!open}
        onClick={closeOnLink}
      >
        <div className="mobile-menu-header">
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={24} strokeWidth={1.8} />
          </button>
        </div>

        <nav className="mobile-menu-nav" aria-label="Main navigation">
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <button
                type="button"
                className="mobile-menu-toggle"
                aria-expanded={productsOpen}
                aria-controls="mobile-menu-products"
                onClick={() => setProductsOpen((value) => !value)}
              >
                Products
                <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
              </button>
              <ul id="mobile-menu-products" className="mobile-menu-sub" hidden={!productsOpen}>
                <li>
                  <Link href="/products">All Products</Link>
                </li>
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link href={`/products?category=${category.slug}`}>{category.name} Chairs</Link>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <Link href="/b2b">B2B</Link>
            </li>
            <li>
              <Link href="/contact">Contact Us</Link>
            </li>
          </ul>
        </nav>

        <div className="mobile-menu-shortcuts">
          <Link href="/wishlist">
            <Heart size={18} aria-hidden="true" />
            Wishlist ({wishlist.length})
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openCart();
            }}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            Bag ({cartCount})
          </button>
        </div>

        <div className="mobile-menu-footer">
          <Link href="/account/login" className="add-to-cart">
            <UserRound size={18} aria-hidden="true" />
            Log in
          </Link>
          <Link href="/account/register" className="mobile-menu-register">
            Create an account
          </Link>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        type="button"
        className="icon-button mobile-menu-button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <Menu size={24} strokeWidth={2} />
      </button>

      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
