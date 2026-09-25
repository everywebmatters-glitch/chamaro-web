import { apiBaseUrl } from "./api";

/* =========================================================
   GOOGLE SIGN-IN (PKCE)
   1. startGoogleSignIn(): make a random code_verifier, keep it
      in this tab's sessionStorage, and navigate (not fetch) to
      the backend with only its SHA-256 code_challenge.
   2. The backend sends the browser back to
      /account/google/callback/#code=... (or #error=...).
   3. The callback page redeems the code with the verifier via
      POST /api/v1/auth/google/exchange. The verifier is only
      ever sent to that endpoint, never to Google.
========================================================= */

const VERIFIER_KEY = "chamaro-google-pkce";

function base64url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* 32 random bytes → 43-char verifier; challenge = base64url(SHA-256(verifier)) */
export async function createPkcePair() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

export async function startGoogleSignIn() {
  const { verifier, challenge } = await createPkcePair();
  window.sessionStorage.setItem(VERIFIER_KEY, verifier);
  // Full-page navigation to the backend API origin (not an internal page): it sets the OAuth
  // state cookie and redirects to Google, which fetch() or the Next router can't do.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(
    `${apiBaseUrl()}/api/v1/auth/google?code_challenge=${encodeURIComponent(challenge)}`
  );
}

/* Read and remove the verifier in one step so it can only be used once */
export function takeGoogleVerifier() {
  try {
    const verifier = window.sessionStorage.getItem(VERIFIER_KEY);
    window.sessionStorage.removeItem(VERIFIER_KEY);
    return verifier;
  } catch {
    return null;
  }
}
