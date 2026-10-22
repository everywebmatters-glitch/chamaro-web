/* =========================================================
   PER-USER BROWSER STORAGE
   Nothing personal is kept under a shared key: the cart, wishlist and saved delivery details live under a key that
   carries the signed-in user's id ("guest" before sign-in), so a second person on the same browser never sees the first
   person's data. Saved delivery details (name, phone, address) are also removed at log out. Keys written by earlier
   versions were shared by everyone on the browser; they are deleted, never adopted by whoever signs in next.
========================================================= */

export const GUEST = "guest";
export const STORE_KEY = "chamaro-store-v2";
export const SAVED_INFO_KEY = "chamaro-checkout-info-v2";

const LEGACY_LOCAL_KEYS = ["chamaro-store-v1", "chamaro-checkout-info"];
const LEGACY_SESSION_KEYS = ["chamaro-auth"];

export const userKey = (base: string, userId: string | null) => `${base}:${userId ?? GUEST}`;

export function removeLegacyData() {
  try {
    for (const key of LEGACY_LOCAL_KEYS) window.localStorage.removeItem(key);
    for (const key of LEGACY_SESSION_KEYS) window.sessionStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/* Called when a shopper logs out on purpose: their saved delivery details go, so the next person can't read them */
export function clearPersonalData(userId: string | null) {
  try {
    window.localStorage.removeItem(userKey(SAVED_INFO_KEY, userId));
    removeLegacyData();
  } catch {
    /* storage unavailable */
  }
}
