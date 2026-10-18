"use client";

import { useStore } from "../store/StoreProvider";

/* Tells the shopper when their cart was changed to match live stock (items removed or quantities reduced) */
export default function CartNotices() {
  const { cartNotices, dismissCartNotices } = useStore();
  if (cartNotices.length === 0) return null;

  return (
    <div className="checkout-notice cart-notices" role="status">
      <ul>
        {cartNotices.map((notice, index) => (
          <li key={index}>{notice}</li>
        ))}
      </ul>
      <button type="button" className="auth-link-button" onClick={dismissCartNotices}>
        Dismiss
      </button>
    </div>
  );
}
