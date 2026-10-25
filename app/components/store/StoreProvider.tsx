"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { findDiscount, lineKey, type CartLine } from "../../lib/cart";
import { fetchAllProducts, fetchCategories, toProduct } from "../../lib/catalog-api";
import type { NavCategory } from "../../lib/catalog-nav";
import { reconcileCart } from "../../lib/cart-reconcile";
import type { Product } from "../../lib/products";

export type { CartLine } from "../../lib/cart";

/* =========================================================
   CART + WISHLIST STORE
   Client-only, persisted to localStorage. Only slugs are saved;
   names, prices and images come from the live API catalog.
   TODO: sync with a server cart once checkout exists
========================================================= */

type StoreContextValue = {
  /* Products currently on sale (GET /api/v1/products); null until loaded */
  catalog: Product[] | null;
  catalogFailed: boolean;
  /* Live categories (GET /api/v1/categories); empty until loaded */
  categories: NavCategory[];
  /* Messages about cart lines the store changed because stock or availability changed */
  cartNotices: string[];
  dismissCartNotices: () => void;
  findProduct: (slug: string) => Product | undefined;
  cart: CartLine[];
  wishlist: string[];
  cartCount: number;
  hydrated: boolean;
  addToCart: (line: CartLine, productName: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string, productName: string) => void;
  isWishlisted: (slug: string) => boolean;
  orderNote: string;
  setOrderNote: (note: string) => void;
  discountCode: string;
  discountCustomerId: string;
  appliedDiscountTotal: number;
  applyDiscount: (code: string, customerId: string, discountTotal: string) => boolean;
  removeDiscount: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  notify: (message: string) => void;
  toast: string;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const STORAGE_KEY = "chamaro-store-v1";

type Saved = {
  cart: CartLine[];
  wishlist: string[];
  orderNote: string;
};

function readStorage(): Saved {
  const empty: Saved = { cart: [], wishlist: [], orderNote: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      orderNote: typeof parsed.orderNote === "string" ? parsed.orderNote : "",
    };
  } catch {
    return empty;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountCustomerId, setDiscountCustomerId] = useState("");
  const [appliedDiscountTotal, setAppliedDiscountTotal] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [categories, setCategories] = useState<NavCategory[]>([]);
  const [cartNotices, setCartNotices] = useState<string[]>([]);

  /* Fresh product data for the cart, checkout and wishlist */
  const loadCatalog = useCallback(() => {
    fetchAllProducts()
      .then((rows) => {
        setCatalog(rows.map(toProduct));
        setCatalogFailed(false);
      })
      .catch(() => setCatalogFailed(true));
  }, []);
  /* Categories only feed menus and search shortcuts, so a failure just leaves them empty */
  const loadCategories = useCallback(() => {
    fetchCategories()
      .then((rows) => setCategories(rows.map(({ slug, name, icon }) => ({ slug, name, icon }))))
      .catch(() => setCategories([]));
  }, []);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Load saved state after mount so server and client HTML match */
  useEffect(() => {
    const saved = readStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setCart(saved.cart);
    setWishlist(saved.wishlist);
    setOrderNote(saved.orderNote);
    setHydrated(true);
    loadCatalog();
    loadCategories();
  }, [loadCatalog, loadCategories]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cart, wishlist, orderNote })
      );
    } catch {
      /* storage unavailable (private mode) — keep in memory only */
    }
  }, [cart, wishlist, orderNote, hydrated]);

  /* Once the live catalog is known, drop cart lines whose product is gone or out of stock and trim
     quantities to the units left, telling the shopper instead of failing at checkout */
  useEffect(() => {
    if (!hydrated || !catalog) return;
    const { cart: next, notices } = reconcileCart(cart, catalog);
    if (!notices.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reconcile the saved cart with the live catalog
    setCart(next);
    setDiscountCode("");
    setDiscountCustomerId("");
    setAppliedDiscountTotal(0);
    setCartNotices((current) => [...current, ...notices]);
  }, [catalog, cart, hydrated]);

  /* Likewise drop wishlist entries for products that are gone, so the counts match what the page lists */
  useEffect(() => {
    if (!hydrated || !catalog) return;
    const onSale = new Set(catalog.map((product) => product.slug));
    if (wishlist.every((slug) => onSale.has(slug))) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reconcile the saved wishlist with the live catalog
    setWishlist((current) => current.filter((slug) => onSale.has(slug)));
  }, [catalog, wishlist, hydrated]);

  const dismissCartNotices =useCallback(() => setCartNotices([]), []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }, []);

  const addToCart = useCallback((line: CartLine) => {
    setDiscountCode("");
    setDiscountCustomerId("");
    setAppliedDiscountTotal(0);
    setCart((current) => {
      const key = lineKey(line);
      const index = current.findIndex((item) => lineKey(item) === key);

      if (index === -1) return [...current, line];

      const next = [...current];
      next[index] = {
        ...next[index],
        quantity: Math.min(99, next[index].quantity + line.quantity),
      };
      return next;
    });

    /* Show the drawer so the shopper sees what was added */
    setCartOpen(true);
    loadCatalog();
  }, [loadCatalog]);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setDiscountCode("");
    setDiscountCustomerId("");
    setAppliedDiscountTotal(0);
    setCart((current) =>
      current.map((line) =>
        lineKey(line) === key
          ? { ...line, quantity: Math.min(99, Math.max(1, quantity)) }
          : line
      )
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setDiscountCode("");
    setDiscountCustomerId("");
    setAppliedDiscountTotal(0);
    setCart((current) => current.filter((line) => lineKey(line) !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountCode("");
    setDiscountCustomerId("");
    setAppliedDiscountTotal(0);
  }, []);

  const toggleWishlist = useCallback(
    (slug: string, productName: string) => {
      const removing = wishlist.includes(slug);
      setWishlist((current) =>
        current.includes(slug)
          ? current.filter((item) => item !== slug)
          : [...current, slug]
      );
      showToast(
        removing
          ? `Removed ${productName} from your wishlist`
          : `Saved ${productName} to your wishlist`
      );
    },
    [wishlist, showToast]
  );

  const applyDiscount = useCallback((code: string, customerId: string, discountTotal: string) => {
    const discount = findDiscount(code);
    const total = Number(discountTotal);
    if (!discount || !customerId || !Number.isFinite(total) || total <= 0) return false;
    setDiscountCode(discount.code);
    setDiscountCustomerId(customerId);
    setAppliedDiscountTotal(total);
    return true;
  }, []);

  const removeDiscount = useCallback(() => {
    setDiscountCode("");
    setDiscountCustomerId("");
    setAppliedDiscountTotal(0);
  }, []);

  const findProduct = useCallback(
    (slug: string) => catalog?.find((product) => product.slug === slug),
    [catalog]
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      catalog,
      catalogFailed,
      categories,
      cartNotices,
      dismissCartNotices,
      findProduct,
      cart,
      wishlist,
      /* Once live data is in, don't count lines for products that are no longer on sale */
      cartCount: cart
        .filter((line) => !catalog || findProduct(line.slug))
        .reduce((total, line) => total + line.quantity, 0),
      hydrated,
      addToCart,
      setQuantity,
      removeLine,
      clearCart,
      toggleWishlist,
      isWishlisted: (slug) => wishlist.includes(slug),
      orderNote,
      setOrderNote,
      discountCode,
      discountCustomerId,
      appliedDiscountTotal,
      applyDiscount,
      removeDiscount,
      cartOpen,
      openCart: () => {
        setCartOpen(true);
        loadCatalog();
      },
      closeCart: () => setCartOpen(false),
      notify: showToast,
      toast,
    }),
    [
      catalog,
      catalogFailed,
      categories,
      cartNotices,
      dismissCartNotices,
      findProduct,
      loadCatalog,
      cart,
      wishlist,
      hydrated,
      addToCart,
      setQuantity,
      removeLine,
      clearCart,
      toggleWishlist,
      orderNote,
      discountCode,
      discountCustomerId,
      appliedDiscountTotal,
      applyDiscount,
      removeDiscount,
      cartOpen,
      showToast,
      toast,
    ]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}

      <div
        className="store-toast"
        role="status"
        aria-live="polite"
        data-visible={toast ? "true" : "false"}
      >
        {toast}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside <StoreProvider>");
  }
  return context;
}
