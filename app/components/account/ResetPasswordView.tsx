"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { passwordResetErrorMessage, resetPasswordWithToken } from "../../lib/auth-api";
import { readResetToken } from "../../lib/password-reset";
import AuthField, { MAX_PASSWORD, MIN_PASSWORD } from "./AuthField";

type Stage = "checking" | "form" | "invalid" | "done";

/* Sets a new password from the emailed link: /reset-password#token=... */
export default function ResetPasswordView() {
  const [stage, setStage] = useState<Stage>("checking");
  /* Kept in memory only: never in state that renders, storage, logs or the URL */
  const token = useRef<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  /* The fragment is removed on the first run: a second run (React Strict Mode in development) must not re-read it */
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    token.current = readResetToken(window.location.hash);
    /* Drop the fragment so the token doesn't stay in the address bar or history */
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    setStage(token.current ? "form" : "invalid");
  }, []);

  const passwordError = !touched
    ? undefined
    : password.length < MIN_PASSWORD
      ? `Use at least ${MIN_PASSWORD} characters.`
      : password.length > MAX_PASSWORD
        ? `Use at most ${MAX_PASSWORD} characters.`
        : undefined;
  const confirmError = touched && !passwordError && confirm !== password ? "The passwords don't match." : undefined;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD || confirm !== password) {
      setNotice("");
      return;
    }
    if (!token.current) {
      setStage("invalid");
      return;
    }

    setSubmitting(true);
    setNotice("");
    try {
      await resetPasswordWithToken({ token: token.current, newPassword: password });
      /* The link is single-use: forget it, and the password, once it has worked */
      token.current = null;
      setPassword("");
      setConfirm("");
      setStage("done");
    } catch (error) {
      setNotice(passwordResetErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "checking") {
    return (
      <section className="auth-panel auth-single" aria-labelledby="reset-title">
        <h2 id="reset-title">Reset your password</h2>
        <p className="auth-lead" role="status" aria-busy="true">
          Checking your reset link…
        </p>
      </section>
    );
  }

  if (stage === "invalid") {
    return (
      <section className="auth-panel auth-single" aria-labelledby="reset-title">
        <h2 id="reset-title">This link doesn&apos;t work</h2>
        <p className="checkout-notice auth-notice" role="alert">
          This password reset link is incomplete or invalid. Open the link from your most recent email, or request a new one.
        </p>
        <Link href="/account/login?reset=1" className="wishlist-return auth-secondary">
          Request a new link
        </Link>
      </section>
    );
  }

  if (stage === "done") {
    return (
      <section className="auth-panel auth-single" aria-labelledby="reset-title">
        <h2 id="reset-title">Password updated</h2>
        <p className="auth-lead" role="status">
          Your password has been reset. Log in with your new password.
        </p>
        <Link href="/account/login" className="add-to-cart auth-submit">
          Log in
        </Link>
      </section>
    );
  }

  return (
    <section className="auth-panel auth-single" aria-labelledby="reset-title">
      <h2 id="reset-title">Choose a new password</h2>
      <p className="auth-lead">Enter a new password for your Chamaro account.</p>

      {/* method="post": a submit before hydration must not put the password in the URL */}
      <form className="auth-form" method="post" onSubmit={submit} noValidate>
        <AuthField
          id="reset-password"
          label="New password *"
          type="password"
          value={password}
          onChange={setPassword}
          error={passwordError}
          autoComplete="new-password"
        />
        <AuthField
          id="reset-password-confirm"
          label="Confirm new password *"
          type="password"
          value={confirm}
          onChange={setConfirm}
          error={confirmError}
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="add-to-cart auth-submit"
          disabled={submitting}
          aria-busy={submitting || undefined}
        >
          {submitting ? "Saving…" : "Reset password"}
        </button>

        {notice && (
          <p className="checkout-notice auth-notice" role="alert">
            {notice}
          </p>
        )}

        <p className="auth-switch">
          Link expired? <Link href="/account/login?reset=1">Request a new one</Link>
        </p>
      </form>
    </section>
  );
}
