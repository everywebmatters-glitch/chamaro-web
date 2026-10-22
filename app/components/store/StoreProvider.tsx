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
import { STORE_KEY, userKey } from "../../lib/user-storage";
import { useAuth } from "../auth/AuthProvider";
import type { Product } from "../../lib/products";

export type { CartLine } from "../../lib/cart";

/* =========================================================
   CART + WISHLIST STORE
   Client-only, persisted to localStorage under a key that carries the signed-in user's id ("guest" before sign-in), so
   one person's cart and wishlist are never shown to the next person on the same browser. A cart built as a guest is
   merged into the account's cart at sign-in. Only slugs are saved; names, prices and images come from the live API.
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
  applyDiscount: (code: string) => boolean;
  removeDiscount: () => void;
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  notify: (message: string) => void;
  toast: string;
};

const StoreContext = createContext<StoreContextValue | null>(null);

/* owner: a user id, or null for a guest */
type Owner = string | null;

type Saved = {
  cart: CartLine[];
  wishlist: string[];
  orderNote: string;
  discountCode: string;
};

function readStorage(owner: Owner): Saved {
  const empty: Saved = { cart: [], wishlist: [], orderNote: "", discountCode: "" };
  try {
    const raw = window.localStorage.getItem(userKey(STORE_KEY, owner));
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      orderNote: typeof parsed.orderNote === "string" ? parsed.orderNote : "",
      discountCode: typeof parsed.discountCode === "string" ? parsed.discountCode : "",
    };
  } catch {
    return empty;
  }
}

/* A guest's lines join the account's cart; a line both have keeps the larger quantity */
function mergeCarts(account: CartLine[], guest: CartLine[]): CartLine[] {
  const merged = new Map(account.map((line) => [lineKey(line), line]));
  for (const line of guest) {
    const existing = merged.get(lineKey(line));
    if (!existing) merged.set(lineKey(line), line);
    else if (line.quantity > existing.quantity) merged.set(lineKey(line), { ...existing, quantity: line.quantity });
  }
  return [...merged.values()];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  /* undefined while the sign-in state is still being worked out */
  const owner: Owner | undefined = status === "loading" ? undefined : (user?.id ?? null);
  const previousOwner = useRef<Owner | undefined>(undefined);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  /* Whose saved data the state below currently holds */
  const [loadedOwner, setLoadedOwner] = useState<Owner | undefined>(undefined);
  const hydrated = owner !== undefined && loadedOwner === owner;
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

  useEffect(() => {
    loadCatalog();
    loadCategories();
  }, [loadCatalog, loadCategories]);

  /* Load the saved state of whoever is signed in (or the guest) after mount, so server and client HTML match. When the
     signed-in user changes (sign-in, log out) the previous person's data is replaced, never carried over. */
  useEffect(() => {
    if (owner === undefined) return;
    const before = previousOwner.current;
    previousOwner.current = owner;
    let saved = readStorage(owner);
    if (owner !== null && before === null) {
      const guest = readStorage(null);
      if (guest.cart.length > 0) saved = { ...saved, cart: mergeCarts(saved.cart, guest.cart) };
      try {
        window.localStorage.removeItem(userKey(STORE_KEY, null));
      } catch {
        /* storage unavailable */
      }
    }
    setCart(saved.cart);
    setWishlist(saved.wishlist);
    setOrderNote(saved.orderNote);
    setDiscountCode(saved.discountCode);
    setLoadedOwner(owner);
  }, [owner]);

  /* Save only once the state holds this owner's data, and only under this owner's key */
  useEffect(() => {
    if (!hydrated || owner === undefined) return;
    try {
      window.localStorage.setItem(
        userKey(STORE_KEY, owner),
        JSON.stringify({ cart, wishlist, orderNote, discountCode })
      );
    } catch {
      /* storage unavailable (private mode) — keep in memory only */
    }
  }, [cart, wishlist, orderNote, discountCode, hydrated, owner]);

  /* Once the live catalog is known, drop cart lines whose product is gone or out of stock and trim
     quantities to the units left, telling the shopper instead of failing at checkout */
  useEffect(() => {
    if (!hydrated || !catalog) return;
    const { cart: next, notices } = reconcileCart(cart, catalog);
    if (!notices.length) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reconcile the saved cart with the live catalog
    setCart(next);
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
    setCart((current) =>
      current.map((line) =>
        lineKey(line) === key
          ? { ...line, quantity: Math.min(99, Math.max(1, quantity)) }
          : line
      )
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((current) => current.filter((line) => lineKey(line) !== key));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

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

  const applyDiscount = useCallback((code: string) => {
    const discount = findDiscount(code);
    if (!discount) return false;
    setDiscountCode(discount.code);
    return true;
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
      applyDiscount,
      removeDiscount: () => setDiscountCode(""),
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
      applyDiscount,
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
