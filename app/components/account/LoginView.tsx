"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authErrorMessage } from "../../lib/auth-api";
import { useAuth } from "../auth/AuthProvider";
import AuthField, { AUTH_NOT_CONNECTED, EMAIL_PATTERN } from "./AuthField";
import SocialSignIn from "./SocialSignIn";

export default function LoginView() {
  const router = useRouter();
  const { status, login } = useAuth();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Already signed in (or just signed in): go to the account page */
  useEffect(() => {
    if (status === "authenticated") router.replace("/account");
  }, [status, router]);

  const emailError = touched && !EMAIL_PATTERN.test(email.trim()) ? "Enter a valid email address." : undefined;
  const passwordError = touched && mode === "login" && !password ? "Enter your password." : undefined;

  const switchMode = (next: "login" | "reset") => {
    setMode(next);
    setTouched(false);
    setNotice("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!EMAIL_PATTERN.test(email.trim()) || (mode === "login" && !password)) {
      setNotice("");
      return;
    }
    if (mode === "reset") {
      // TODO: the backend has no password-reset endpoint yet
      setNotice(AUTH_NOT_CONNECTED);
      return;
    }

    setSubmitting(true);
    setNotice("");
    try {
      await login(email.trim(), password);
    } catch (error) {
      setNotice(authErrorMessage(error));
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split">
      <aside className="auth-split-panel" aria-hidden="true">
        <p className="auth-split-eyebrow">You can easily</p>
        <h2 className="auth-split-headline">
          Sign in to track your
          <br />
          orders and saved chairs
        </h2>
        <p className="auth-split-copy">
          Pick up right where you left off — orders, saved addresses and your
          wishlist, all in one place.
        </p>
      </aside>

      <section className="auth-split-form" aria-labelledby="auth-form-title">
        {mode === "login" ? (
          <>
            <h2 id="auth-form-title">Log in</h2>
            <p className="auth-lead">Welcome back. Sign in to see your orders and saved details.</p>
          </>
        ) : (
          <>
            <h2 id="auth-form-title">Reset your password</h2>
            <p className="auth-lead">We&apos;ll email you a link to reset your password.</p>
          </>
        )}

        {/* method="post": a submit before hydration must not put credentials in the URL */}
        <form className="auth-form" method="post" onSubmit={submit} noValidate>
          <AuthField
            id="login-email"
            label="Email *"
            type="email"
            value={email}
            onChange={setEmail}
            error={emailError}
            autoComplete="email"
          />

          {mode === "login" && (
            <AuthField
              id="login-password"
              label="Password *"
              type="password"
              value={password}
              onChange={setPassword}
              error={passwordError}
              autoComplete="current-password"
            />
          )}

          <button
            type="button"
            className="auth-link-button"
            onClick={() => switchMode(mode === "login" ? "reset" : "login")}
          >
            {mode === "login" ? "Forgot your password?" : "Cancel"}
          </button>

          <button
            type="submit"
            className="add-to-cart auth-submit"
            disabled={submitting}
            aria-busy={submitting || undefined}
          >
            {mode === "login" ? (submitting ? "Logging in…" : "Log in") : "Reset password"}
          </button>

          {notice && (
            <p className="checkout-notice auth-notice" role="status">
              {notice}
            </p>
          )}

          <p className="auth-switch">
            Don&apos;t have an account? <Link href="/account/register">Sign up</Link>
          </p>

          {mode === "login" && (
            <SocialSignIn
              action="Log in"
              include={["google", "apple"]}
              compact
              dividerLabel="or continue with"
            />
          )}
        </form>
      </section>
    </div>
  );
}
