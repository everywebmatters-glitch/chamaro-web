/* =========================================================
   PASSWORD RESET LINK
   The backend emails https://chamaro.com/reset-password#token=<token>.
   The token sits in the fragment, so it never reaches any server
   log or Referer header; the page reads it, then drops it from
   the address bar.
========================================================= */

/* Backend resetTokenPattern (schemas/otp.schema.ts): 32 random bytes, base64url */
export const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/* The token from a location.hash such as "#token=...", or null when it is missing or malformed */
export function readResetToken(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, "")).get("token");
  return token && RESET_TOKEN_PATTERN.test(token) ? token : null;
}
