"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { googleErrorMessage } from "../../lib/auth-api";
import { takeGoogleVerifier } from "../../lib/google-auth";
import { useAuth } from "../auth/AuthProvider";

/* Finishes the backend Google flow: #code=... or #error=... in the URL fragment */
export default function GoogleCallbackView() {
  const router = useRouter();
  const { completeGoogleSignIn } = useAuth();
  const [error, setError] = useState("");
  /* The code and verifier are single-use: guard against effects running twice */
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    /* Drop the fragment so the code doesn't stay in the address bar or history */
    window.history.replaceState(null, "", window.location.pathname);

    const code = params.get("code");
    const verifier = takeGoogleVerifier();

    const fail = (reason: unknown) => setError(googleErrorMessage(reason));

    if (!code) {
      fail(params.get("error") ?? "GOOGLE_AUTH_FAILED");
      return;
    }
    if (!verifier) {
      fail("PKCE_VERIFIER_MISSING");
      return;
    }

    completeGoogleSignIn(code, verifier).then(() => router.replace("/account"), fail);
  }, [completeGoogleSignIn, router]);

  return (
    <section className="auth-panel auth-single" aria-labelledby="google-callback-title">
      {error ? (
        <>
          <h2 id="google-callback-title">Google sign-in didn&apos;t work</h2>
          <p className="checkout-notice auth-notice" role="alert">
            {error}
          </p>
          <Link href="/account/login" className="wishlist-return auth-secondary">
            Back to log in
          </Link>
        </>
      ) : (
        <>
          <h2 id="google-callback-title">Signing you in…</h2>
          <p className="auth-lead" role="status" aria-busy="true">
            Finishing Google sign-in. This only takes a moment.
          </p>
        </>
      )}
    </section>
  );
}
