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

export type { CartLine } from "../../lib/cart";

/* =========================================================
   CART + WISHLIST STORE
   Client-only, persisted to localStorage.
   TODO: sync with a server cart once checkout exists
========================================================= */

type StoreContextValue = {
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

const STORAGE_KEY = "chamaro-store-v1";

type Saved = {
  cart: CartLine[];
  wishlist: string[];
  orderNote: string;
  discountCode: string;
};

function readStorage(): Saved {
  const empty: Saved = { cart: [], wishlist: [], orderNote: "", discountCode: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Load saved state after mount so server and client HTML match */
  useEffect(() => {
    const saved = readStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setCart(saved.cart);
    setWishlist(saved.wishlist);
    setOrderNote(saved.orderNote);
    setDiscountCode(saved.discountCode);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cart, wishlist, orderNote, discountCode })
      );
    } catch {
      /* storage unavailable (private mode) — keep in memory only */
    }
  }, [cart, wishlist, orderNote, discountCode, hydrated]);

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
  }, []);

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

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      wishlist,
      cartCount: cart.reduce((total, line) => total + line.quantity, 0),
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
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      notify: showToast,
      toast,
    }),
    [
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
