"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError } from "../../lib/api";
import { registerCustomer, requestSignupCode, signupCodeErrorMessage } from "../../lib/auth-api";
import { useAuth } from "../auth/AuthProvider";
import AuthField, { EMAIL_PATTERN, MAX_PASSWORD, MIN_PASSWORD } from "./AuthField";
import SocialSignIn from "./SocialSignIn";

type Form = { name: string; email: string; password: string; agree: boolean };
const EMPTY: Form = { name: "", email: "", password: "", agree: false };
/* Backend OTP_RESEND_COOLDOWN_SECONDS and OTP_EXPIRY_MINUTES */
const RESEND_SECONDS = 60;
const CODE_PATTERN = /^\d{6}$/;

/* Only a same-site path is safe to bounce back to */
function safeRedirect(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  if (!form.name.trim()) errors.name = "Enter your name.";
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address.";
  if (form.password.length < MIN_PASSWORD)
    errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  else if (form.password.length > MAX_PASSWORD)
    errors.password = `Use at most ${MAX_PASSWORD} characters.`;
  if (!form.agree) errors.agree = "Please agree to the Terms & Privacy to continue.";
  return errors;
}

export default function RegisterView() {
  const router = useRouter();
  const redirect = safeRedirect(useSearchParams().get("redirect"));
  const { status, login } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /* Step 2: the emailed code. The account is only created once the code is accepted. */
  const [step, setStep] = useState<"details" | "code">("details");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  /* Signed in (after registering, or already): go to the account page, or back where checkout sent us */
  useEffect(() => {
    if (status === "authenticated") router.replace(redirect);
  }, [status, router, redirect]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async () => {
    setSubmitting(true);
    setNotice("");
    try {
      await requestSignupCode(form.email.trim());
      setStep("code");
      setCode("");
      setCodeTouched(false);
      setResendIn(RESEND_SECONDS);
    } catch (error) {
      setNotice(signupCodeErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const codeError = codeTouched && !CODE_PATTERN.test(code) ? "Enter the 6-digit code from the email." : undefined;

  const errors = touched ? validate(form) : {};
  if (emailTaken) errors.email = "An account with this email already exists.";
  const update = (key: "name" | "email" | "password") => (value: string) => {
    if (key === "email") setEmailTaken(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  /* Step 1: check the details, then email a code */
  const submitDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(validate(form)).length > 0) {
      setNotice("");
      return;
    }
    await sendCode();
  };

  /* Step 2: create the account with the code, then sign in */
  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setCodeTouched(true);
    if (!CODE_PATTERN.test(code)) {
      setNotice("");
      return;
    }

    const email = form.email.trim();
    setSubmitting(true);
    setNotice("");
    try {
      await registerCustomer({
        name: form.name.trim(),
        email,
        password: form.password,
        otp: code,
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "DUPLICATE_RECORD") {
        setEmailTaken(true);
        setStep("details");
      }
      setNotice(signupCodeErrorMessage(error));
      setSubmitting(false);
      return;
    }

    /* Registration doesn't return a token, so sign in with the same details */
    try {
      await login(email, form.password);
    } catch {
      setNotice("Your account was created. Please log in to continue.");
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split">
      <aside className="auth-split-panel" aria-hidden="true">
        <p className="auth-split-eyebrow">Join Chamaro</p>
        <h2 className="auth-split-headline">
          Chairs engineered
          <br />
          to lead your day
        </h2>
        <p className="auth-split-copy">
          Create an account to track orders, save favorites and get early
          access to new collections.
        </p>
      </aside>

      {step === "code" ? (
        <section className="auth-split-form" aria-labelledby="register-code-title">
          <h2 id="register-code-title">Check your email</h2>
          <p className="auth-lead">
            We&apos;ve sent a 6-digit code to <strong>{form.email.trim()}</strong>. Enter it below to create your
            account. The code expires in 5 minutes.
          </p>

          <form className="auth-form" method="post" onSubmit={submitCode} noValidate>
            <AuthField
              id="register-code"
              label="Verification code *"
              value={code}
              onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
              error={codeError}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
            />
            <p className="auth-hint">
              Already have an account with this email? We&apos;ve emailed you a link to log in instead.
            </p>

            <button
              type="submit"
              className="add-to-cart auth-submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>

            {notice && (
              <p className="checkout-notice auth-notice" role="status">
                {notice}
              </p>
            )}

            <button
              type="button"
              className="auth-link-button"
              onClick={sendCode}
              disabled={submitting || resendIn > 0}
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>

            <button
              type="button"
              className="auth-link-button"
              onClick={() => {
                setStep("details");
                setNotice("");
              }}
              disabled={submitting}
            >
              Change email or details
            </button>
          </form>
        </section>
      ) : (
        <section className="auth-split-form" aria-labelledby="register-title">
          <h2 id="register-title">Get Started Now</h2>
          <p className="auth-lead">Please sign up to continue.</p>

          {/* method="post": a submit before hydration must not put credentials in the URL */}
          <form className="auth-form" method="post" onSubmit={submitDetails} noValidate>
            <AuthField
              id="register-name"
              label="Name *"
              value={form.name}
              onChange={update("name")}
              error={errors.name}
              autoComplete="name"
            />

            <AuthField
              id="register-email"
              label="Email address *"
              type="email"
              value={form.email}
              onChange={update("email")}
              error={errors.email}
              autoComplete="email"
            />

            <AuthField
              id="register-password"
              label="Password *"
              type="password"
              value={form.password}
              onChange={update("password")}
              error={errors.password}
              autoComplete="new-password"
            />
            {!errors.password && (
              <p className="auth-hint">At least {MIN_PASSWORD} characters.</p>
            )}

            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(event) =>
                  setForm((current) => ({ ...current, agree: event.target.checked }))
                }
              />
              <span>
                I agree to the <Link href="#">Terms &amp; Privacy</Link>
              </span>
            </label>
            {errors.agree && <p className="field-error">{errors.agree}</p>}

            <button
              type="submit"
              className="add-to-cart auth-submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
            >
              {submitting ? "Sending code…" : "Continue"}
            </button>

            {notice && (
              <p className="checkout-notice auth-notice" role="status">
                {notice}
              </p>
            )}

            <p className="auth-switch">
              Already have an account?{" "}
              <Link href={`/account/login?redirect=${encodeURIComponent(redirect)}`}>
                Log in here
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </p>

            <p className="social-divider">
              <span>Or</span>
            </p>

            <SocialSignIn action="Sign up" redirect={redirect} showDivider={false} />
          </form>
        </section>
      )}
    </div>
  );
}
