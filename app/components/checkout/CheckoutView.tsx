"use client";

import Image from "next/image";
import Link from "next/link";
import { CircleHelp, Lock, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import {
  createCheckoutOrder,
  createCheckoutAddress,
  getCheckoutOrder,
  listCheckoutAddresses,
  openRazorpayPayment,
  replaceCheckoutCart,
  requestCheckoutOtp,
  verifyCheckoutOtp,
  verifyRazorpayPayment,
  type CheckoutAddressInput,
  type RazorpayPaymentCallback,
} from "../../lib/checkout-api";
import {
  cartSubtotal,
  isChairProduct,
  INDIAN_STATES,
  PIN_CODE_PATTERN,
  resolveLines,
  SHIPPING_METHODS,
  shippingCost,
  variantLabel,
  type ShippingMethodId,
} from "../../lib/cart";
import { formatPrice } from "../../lib/products";
import { useAuth } from "../auth/AuthProvider";
import DiscountForm from "../cart/DiscountForm";
import Modal from "../Modal";
import { useStore } from "../store/StoreProvider";
import { EMAIL_PATTERN, GSTIN_PATTERN, PHONE_PATTERN } from "../../lib/site";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  timeout: number;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: { orderId: string };
  retry: { enabled: boolean };
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void;
  modal: { ondismiss: () => void; confirm_close: boolean };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", listener: (response: RazorpayFailure) => void) => void;
};

type Form = {
  contact: string;
  marketing: boolean;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
  needGst: boolean;
  company: string;
  gstin: string;
  saveInfo: boolean;
};

const EMPTY: Form = {
  contact: "",
  marketing: false,
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  pin: "",
  phone: "",
  needGst: false,
  company: "",
  gstin: "",
  saveInfo: false,
};

const SAVED_KEY = "chamaro-checkout-info";
const ORDER_KEY_PREFIX = "chamaro-checkout-order:";
const PAID_ORDER_PREFIX = "chamaro-checkout-paid:";

type CheckoutAttempt = {
  userId: string;
  fingerprint: string;
  idempotencyKey: string;
  orderId?: string;
  total?: string;
};

type CheckoutConfirmation = { orderId: string; message: string };

let razorpayScript: Promise<void> | undefined;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScript) return razorpayScript;
  razorpayScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) resolve();
      else {
        razorpayScript = undefined;
        reject(new Error("The payment window could not be loaded. Please try again."));
      }
    };
    script.onerror = () => {
      razorpayScript = undefined;
      reject(new Error("The payment window could not be loaded. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return razorpayScript;
}

function newCheckoutKey() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function readCheckoutAttempt(storageKey: string): CheckoutAttempt | null {
  try {
    const value: unknown = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "null");
    if (
      typeof value === "object" &&
      value !== null &&
      "userId" in value &&
      "fingerprint" in value &&
      "idempotencyKey" in value &&
      typeof value.userId === "string" &&
      typeof value.fingerprint === "string" &&
      typeof value.idempotencyKey === "string"
    ) {
      return {
        userId: value.userId,
        fingerprint: value.fingerprint,
        idempotencyKey: value.idempotencyKey,
        ...("orderId" in value && typeof value.orderId === "string" ? { orderId: value.orderId } : {}),
        ...("total" in value && typeof value.total === "string" ? { total: value.total } : {}),
      };
    }
  } catch {
    /* storage unavailable or contains an older checkout key */
  }
  return null;
}

function writeCheckoutAttempt(storageKey: string, attempt: CheckoutAttempt | null) {
  try {
    if (attempt) window.sessionStorage.setItem(storageKey, JSON.stringify(attempt));
    else window.sessionStorage.removeItem(storageKey);
  } catch {
    /* the in-memory attempt still protects retries in this page */
  }
}

function readCheckoutConfirmation(storageKey: string): CheckoutConfirmation | null {
  try {
    const saved = window.sessionStorage.getItem(storageKey);
    if (!saved) return null;
    let value: unknown;
    try {
      value = JSON.parse(saved);
    } catch {
      return { orderId: saved, message: "Payment received. Your order is confirmed." };
    }
    if (
      typeof value === "object" &&
      value !== null &&
      "orderId" in value &&
      "message" in value &&
      typeof value.orderId === "string" &&
      typeof value.message === "string"
    ) {
      return { orderId: value.orderId, message: value.message };
    }
    return null;
  } catch {
    return null;
  }
}

function paymentOutcomeMessage(outcome: string) {
  switch (outcome) {
    case "paid":
    case "already_paid":
      return { done: true, message: "Payment received. Your order is confirmed, and we've emailed you the details." };
    case "pending":
      return { done: true, message: "Your payment is being confirmed. We'll email you as soon as it is; there's no need to pay again." };
    case "review":
      return { done: true, message: "We received your payment but need to check it before confirming your order. We'll be in touch; please don't pay again." };
    case "failed":
      return { done: false, message: "The payment didn't go through. You can try again." };
    case "refunded":
      return { done: true, message: "This payment was refunded. Contact us if you need help with your order." };
    default:
      return { done: false, message: "We couldn't confirm the payment yet. Please check your orders before trying again." };
  }
}

function checkoutErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      UNAUTHENTICATED: "Your session has ended. Please sign in again to pay.",
      INVALID_TOKEN: "Your session has ended. Please sign in again to pay.",
      CHECKOUT_NOT_VERIFIED: "Verify the code sent to your account email before paying.",
      OTP_INVALID: "That code isn't right. Check the email and try again.",
      OTP_EXPIRED: "That code has expired. Send a new one.",
      OTP_MAX_ATTEMPTS: "Too many incorrect attempts. Send a new code.",
      OTP_RESEND_COOLDOWN: "Please wait before asking for another code.",
      CART_EMPTY: "Your cart is empty.",
      ORDER_PAYMENT_EXPIRED: "The payment window expired. Check your orders before making another payment.",
      ORDER_NOT_PAYABLE: "This order can no longer be paid. Please check your orders.",
      PAYMENT_IN_PROGRESS: "A payment for this order is still being confirmed. Please don't try to pay again yet.",
      PAYMENTS_NOT_CONFIGURED: "Online payment isn't available right now. Please try again later or contact us.",
      PAYMENTS_LIVE_MODE_BLOCKED: "Online payment isn't available right now. Please contact us.",
      PAYMENT_PROVIDER_UNAVAILABLE: "The payment service is temporarily unavailable. Please try again.",
      PAYMENT_PROVIDER_ERROR: "The payment service couldn't start checkout. Please try again.",
      PAYMENT_GATEWAY_UNAVAILABLE: "The payment service couldn't be reached. Please check your orders before trying again.",
      PAYMENT_NOT_CAPTURED: "The payment is not complete yet. Please try again.",
      PAYMENT_SIGNATURE_INVALID: "We couldn't verify this payment. Check your orders before trying again; if money was taken, it will be confirmed or returned automatically.",
      PAYMENT_PROCESSING: "Your payment is still being confirmed. Refresh this page to check its status before retrying.",
      INSUFFICIENT_STOCK: "There isn't enough stock to complete this order.",
      ITEM_UNAVAILABLE: "A product in your cart is no longer available.",
      COUPON_NOT_APPLICABLE: "The coupon is no longer valid for this cart. Remove it and try again.",
    };
    return messages[error.code] ?? error.message.replace(/\s\(\d+ [A-Z_]+\) — .*$/, "");
  }
  return error instanceof Error ? error.message : "We couldn't complete checkout. Please try again.";
}

function validate(form: Form) {
  const errors: Partial<Record<keyof Form, string>> = {};
  const contact = form.contact.trim();
  if (!contact) errors.contact = "Enter an email or mobile number.";
  else if (!EMAIL_PATTERN.test(contact) && !PHONE_PATTERN.test(contact.replace(/\s/g, "")))
    errors.contact = "Enter a valid email or 10-digit mobile number.";
  if (!form.lastName.trim()) errors.lastName = "Enter a last name.";
  if (!form.address.trim()) errors.address = "Enter an address.";
  if (!form.city.trim()) errors.city = "Enter a city.";
  if (!form.state) errors.state = "Select a state.";
  if (!PIN_CODE_PATTERN.test(form.pin)) errors.pin = "Enter a valid 6-digit PIN code.";
  if (!PHONE_PATTERN.test(form.phone.replace(/\s/g, "")))
    errors.phone = "Enter a 10-digit mobile number for delivery updates.";
  if (form.needGst) {
    if (!form.company.trim()) errors.company = "Enter the registered business name.";
    if (!GSTIN_PATTERN.test(form.gstin.trim().toUpperCase())) errors.gstin = "Enter a valid 15-character GSTIN.";
  }
  return errors;
}

function Field({
  id,
  label,
  error,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`field ${className}${error ? " has-error" : ""}`}>
      {children}
      <label htmlFor={id}>{label}</label>
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutView() {
  const {
    catalog,
    catalogFailed,
    findProduct,
    cart,
    hydrated,
    discountCode,
    discountCustomerId,
    appliedDiscountTotal,
    orderNote,
    clearCart,
  } = useStore();
  const { status: authStatus, user, token } = useAuth();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [shipping, setShipping] = useState<ShippingMethodId>("standard");
  const [notice, setNotice] = useState("");
  const [authGateDismissed, setAuthGateDismissed] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);
  const [paidOrderId, setPaidOrderId] = useState("");
  const [paidOrderMessage, setPaidOrderMessage] = useState("");
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const checkoutAttemptRef = useRef<CheckoutAttempt | null>(null);
  const paymentCallbackStarted = useRef(false);
  const paymentFailureMessage = useRef("");

  const clearCheckoutAttempt = useCallback((userId: string) => {
    if (checkoutAttemptRef.current?.userId === userId) checkoutAttemptRef.current = null;
    writeCheckoutAttempt(`${ORDER_KEY_PREFIX}${userId}`, null);
  }, []);

  function getCheckoutAttempt(userId: string, fingerprint: string) {
    const storageKey = `${ORDER_KEY_PREFIX}${userId}`;
    const existing = checkoutAttemptRef.current ?? readCheckoutAttempt(storageKey);
    if (existing?.userId === userId && existing.fingerprint === fingerprint) {
      checkoutAttemptRef.current = existing;
      return existing;
    }
    const attempt: CheckoutAttempt = { userId, fingerprint, idempotencyKey: newCheckoutKey() };
    checkoutAttemptRef.current = attempt;
    writeCheckoutAttempt(storageKey, attempt);
    return attempt;
  }

  const showPaymentConfirmation = useCallback((orderId: string, message: string, userId: string) => {
    const confirmation = { orderId, message };
    clearCart();
    clearCheckoutAttempt(userId);
    try {
      window.sessionStorage.setItem(`${PAID_ORDER_PREFIX}${userId}`, JSON.stringify(confirmation));
    } catch {
      /* the confirmation remains visible for this page */
    }
    setPaidOrderId(orderId);
    setPaidOrderMessage(message);
  }, [clearCart, clearCheckoutAttempt]);

  /* Restore saved delivery details */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from localStorage
      if (saved) setForm({ ...EMPTY, ...JSON.parse(saved), saveInfo: true });
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    if (!user || !token) return;
    let cancelled = false;
    try {
      const savedOrder = readCheckoutConfirmation(`${PAID_ORDER_PREFIX}${user.id}`);
      if (savedOrder) {
        queueMicrotask(() => {
          if (cancelled) return;
          clearCart();
          clearCheckoutAttempt(user.id);
          setPaidOrderId(savedOrder.orderId);
          setPaidOrderMessage(savedOrder.message);
        });
        void getCheckoutOrder(token, savedOrder.orderId)
          .then((order) => {
            if (!cancelled && order.paymentStatus === "PAID") {
              setPaidOrderMessage("Payment received. Your order is confirmed, and we've emailed you the details.");
            }
          })
          .catch((error: unknown) => {
            if (!cancelled) setNotice(checkoutErrorMessage(error));
          });
        return () => { cancelled = true; };
      }
      const attempt = readCheckoutAttempt(`${ORDER_KEY_PREFIX}${user.id}`);
      if (attempt?.orderId) {
        void getCheckoutOrder(token, attempt.orderId)
          .then((order) => {
            if (cancelled || order.paymentStatus !== "PAID") return;
            showPaymentConfirmation(order.id, "Payment received. Your order is confirmed, and we've emailed you the details.", user.id);
          })
          .catch((error: unknown) => {
            if (!cancelled) setNotice(checkoutErrorMessage(error));
          });
      }
    } catch {
      queueMicrotask(() => {
        if (!cancelled) setNotice("We couldn't restore your payment status. Check your order before trying another payment.");
      });
    }
    return () => { cancelled = true; };
  }, [user, token, clearCart, clearCheckoutAttempt, showPaymentConfirmation]);

  const lines = resolveLines(cart, findProduct);
  const subtotal = cartSubtotal(lines);
  const chairCount = lines.reduce((count, line) => count + (isChairProduct(line.product) ? line.quantity : 0), 0);
  const discount = discountCustomerId === user?.id ? appliedDiscountTotal : 0;
  const errors = validate(form);
  const addressReady =
    form.address.trim() && form.city.trim() && form.state && PIN_CODE_PATTERN.test(form.pin);
  const shippingPrice = addressReady ? shippingCost(shipping, chairCount) : undefined;
  const total = subtotal - discount + (shippingPrice ?? 0);
  const displayTotal = serverTotal ?? total;
  const itemCount = lines.reduce((count, line) => count + line.quantity, 0);
  const showAuthGate = authStatus === "unauthenticated" && !authGateDismissed;

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setServerTotal(null);
    setNotice("");
  };

  const errorFor = (key: keyof Form) => (touched ? errors[key] : undefined);

  const inputProps = (key: keyof Form) => ({
    id: `checkout-${key}`,
    name: key,
    value: form[key] as string,
    placeholder: " ",
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => update(key, event.target.value as never),
    "aria-invalid": errorFor(key) ? true : undefined,
    "aria-describedby": errorFor(key) ? `checkout-${key}-error` : undefined,
  });

  async function sendCheckoutCode() {
    if (!token || !user) {
      setNotice("Sign in to verify your account before paying.");
      return;
    }
    setSendingOtp(true);
    setNotice("");
    setOtpVerified(false);
    try {
      await requestCheckoutOtp(token);
      setOtpSent(true);
      setOtpCode("");
      setNotice(`A verification code was sent to ${user.email}.`);
    } catch (error) {
      setNotice(checkoutErrorMessage(error));
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyCheckoutCode() {
    if (!token) {
      setNotice("Sign in to verify your account before paying.");
      return;
    }
    if (!/^\d{6}$/.test(otpCode)) {
      setNotice("Enter the six-digit code from your email.");
      return;
    }
    setVerifyingOtp(true);
    setNotice("");
    try {
      await verifyCheckoutOtp(token, otpCode);
      setOtpVerified(true);
      setNotice("Your email is verified for this payment. Complete checkout before the code expires.");
    } catch (error) {
      setOtpVerified(false);
      setNotice(checkoutErrorMessage(error));
    } finally {
      setVerifyingOtp(false);
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);

    if (authStatus !== "authenticated" || !token || !user) {
      setNotice("Sign in or create an account to pay securely.");
      return;
    }
    if (Object.keys(errors).length > 0) {
      setNotice("");
      /* Move focus to the first invalid field */
      const first = Object.keys(errors)[0];
      document.getElementById(`checkout-${first}`)?.focus();
      return;
    }
    if (!otpVerified) {
      setNotice(`Verify the code sent to ${user.email} before paying.`);
      return;
    }

    try {
      if (form.saveInfo) {
        const { contact, firstName, lastName, address, apartment, city, state, pin, phone } = form;
        window.localStorage.setItem(
          SAVED_KEY,
          JSON.stringify({ contact, firstName, lastName, address, apartment, city, state, pin, phone })
        );
      } else {
        window.localStorage.removeItem(SAVED_KEY);
      }
    } catch {
      /* storage unavailable */
    }

    setStartingPayment(true);
    setNotice("");
    setOtpVerified(false);
    paymentCallbackStarted.current = false;
    paymentFailureMessage.current = "";

    try {
      const addressInput: CheckoutAddressInput = {
        name: [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" "),
        phone: form.phone.trim(),
        addressLine1: form.address.trim(),
        addressLine2: form.apartment.trim(),
        city: form.city.trim(),
        state: form.state,
        postalCode: form.pin,
        country: "IN",
        type: "SHIPPING",
      };
      const items = lines.map((line) => {
        if (!line.product.apiId) throw new Error("A product in your cart is missing its server ID. Refresh the cart and try again.");
        return {
          productId: line.product.apiId,
          ...(line.variant?.id ? { variantId: line.variant.id } : {}),
          quantity: line.quantity,
        };
      });
      const invoiceNote = form.needGst
        ? `GST invoice: ${form.company.trim()}, GSTIN ${form.gstin.trim().toUpperCase()}`
        : "";
      const note = [orderNote.trim(), invoiceNote].filter(Boolean).join("\n").slice(0, 500);
      const couponCode = discountCustomerId === user.id ? discountCode : "";
      const fingerprint = JSON.stringify({ items, address: addressInput, shipping, note, couponCode });
      let attempt = getCheckoutAttempt(user.id, fingerprint);

      if (!attempt.orderId) {
        await replaceCheckoutCart(token, items);
        const addresses = await listCheckoutAddresses(token);
        const address = addresses.find((saved) =>
          saved.name === addressInput.name &&
          saved.phone === addressInput.phone &&
          saved.addressLine1 === addressInput.addressLine1 &&
          (saved.addressLine2 ?? "") === (addressInput.addressLine2 ?? "") &&
          saved.city === addressInput.city &&
          saved.state === addressInput.state &&
          saved.postalCode === addressInput.postalCode &&
          saved.country === addressInput.country &&
          saved.type === "SHIPPING"
        ) ?? await createCheckoutAddress(token, addressInput);
        const order = await createCheckoutOrder(token, attempt.idempotencyKey, {
          addressId: address.id,
          shippingMethod: shipping,
          ...(note ? { note } : {}),
          ...(couponCode ? { couponCode } : {}),
        });
        attempt = { ...attempt, orderId: order.id, total: order.total };
        checkoutAttemptRef.current = attempt;
        writeCheckoutAttempt(`${ORDER_KEY_PREFIX}${user.id}`, attempt);
      }

      if (!attempt.orderId) throw new Error("We couldn't create your order. Please try again.");
      const orderId = attempt.orderId;
      setServerTotal(attempt.total ? Number(attempt.total) : null);
      let paymentSession: Awaited<ReturnType<typeof openRazorpayPayment>>;
      try {
        paymentSession = await openRazorpayPayment(token, orderId);
      } catch (error) {
        if (error instanceof ApiError && (error.code === "ORDER_PAYMENT_EXPIRED" || error.code === "ORDER_NOT_PAYABLE")) {
          try {
            const order = await getCheckoutOrder(token, orderId);
            if (order.paymentStatus === "PAID") {
              showPaymentConfirmation(order.id, "Payment received. Your order is confirmed, and we've emailed you the details.", user.id);
              return;
            }
            if (order.status === "CANCELLED") clearCheckoutAttempt(user.id);
          } catch {
            /* keep the stored attempt if its payment status couldn't be checked */
          }
        }
        throw error;
      }

      await loadRazorpay();
      if (!window.Razorpay) throw new Error("The payment window could not be loaded. Please try again.");

      const instance = new window.Razorpay({
        key: paymentSession.keyId,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        timeout: paymentSession.timeoutSeconds,
        name: "Chamaro",
        description: `Order ${orderId}`,
        order_id: paymentSession.razorpayOrderId,
        prefill: {
          name: addressInput.name,
          email: user.email,
          contact: `+91${form.phone.replace(/\D/g, "").slice(-10)}`,
        },
        notes: { orderId },
        retry: { enabled: true },
        theme: { color: "#62574c" },
        handler: (response) => {
          paymentCallbackStarted.current = true;
          void (async () => {
            setStartingPayment(true);
            try {
              const callback: RazorpayPaymentCallback = {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              };
              const result = await verifyRazorpayPayment(token, orderId, callback);
              const outcome = paymentOutcomeMessage(result.outcome);
              if (!outcome.done) {
                setNotice(outcome.message);
                return;
              }
              showPaymentConfirmation(orderId, outcome.message, user.id);
              setNotice("");
            } catch (error) {
              if (error instanceof ApiError && (error.status === 0 || error.status >= 500)) {
                showPaymentConfirmation(
                  orderId,
                  "Your payment is being confirmed. We'll email you as soon as it is; please don't pay again.",
                  user.id,
                );
                setNotice("");
              } else {
                setNotice(checkoutErrorMessage(error));
              }
            } finally {
              setStartingPayment(false);
              setOtpSent(false);
              setOtpCode("");
            }
          })();
        },
        modal: {
          ondismiss: () => {
            if (!paymentCallbackStarted.current) {
              setNotice(paymentFailureMessage.current
                ? "The payment didn't go through. You can try again."
                : "Payment window closed. If you completed payment, refresh this page to check its status before trying again.");
            }
            setOtpVerified(false);
            setOtpSent(false);
            setOtpCode("");
            setStartingPayment(false);
          },
          confirm_close: true,
        },
      });
      instance.on("payment.failed", (response) => {
        paymentFailureMessage.current = response.error?.description ?? response.error?.reason ?? "payment_failed";
      });
      instance.open();
      setStartingPayment(false);
    } catch (error) {
      setNotice(checkoutErrorMessage(error));
      setStartingPayment(false);
      setOtpSent(false);
      setOtpCode("");
    }
  };

  if (!hydrated || (cart.length > 0 && !catalog && !catalogFailed)) {
    return <div className="cart-page-loading" aria-busy="true" />;
  }

  if (cart.length > 0 && !catalog) {
    return (
      <div className="cart-empty cart-empty-page" role="alert">
        <h1>We couldn&apos;t load your cart</h1>
        <p>Please check your connection and try again in a moment.</p>
        <button type="button" className="add-to-cart" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (paidOrderId) {
    return (
      <div className="cart-empty cart-empty-page">
        <h1>Thank you for your order</h1>
        <p>{paidOrderMessage}</p>
        <p>Order reference: {paidOrderId}</p>
        <Link
          href="/products"
          className="add-to-cart"
          onClick={() => {
            if (user) {
              try {
                window.sessionStorage.removeItem(`${PAID_ORDER_PREFIX}${user.id}`);
              } catch {
                /* session storage unavailable */
              }
            }
            setPaidOrderId("");
            setPaidOrderMessage("");
          }}
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="cart-empty cart-empty-page">
        <h1>Your cart is empty</h1>
        <p>Add a chair to your cart before checking out.</p>
        <Link href="/products" className="add-to-cart">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <Modal
        open={showAuthGate}
        onClose={() => setAuthGateDismissed(true)}
        title="Sign in to check out"
        className="auth-gate-modal info-modal"
      >
        <h2>Sign in to pay</h2>
        <p>Secure online checkout requires a Chamaro customer account so your order and payment can be verified.</p>

        <div className="auth-gate-actions">
          <Link href="/account/login?redirect=/checkout" className="add-to-cart">
            Log in
          </Link>
          <Link href="/account/register?redirect=/checkout" className="outline-button">
            Create account
          </Link>
        </div>
      </Modal>

      <div className="checkout-layout">
      {/* ================= FORM ================= */}

      <form className="checkout-form" onSubmit={submit} noValidate>
        <h1 className="sr-only">Checkout</h1>

        {/* Contact */}

        <section aria-labelledby="contact-title">
          <div className="checkout-section-header">
            <h2 id="contact-title">Contact</h2>
          </div>

          <Field id="checkout-contact" label="Email or mobile phone number" error={errorFor("contact")}>
            <input {...inputProps("contact")} autoComplete="email" />
            <span
              className="field-help"
              title="Checkout verification and order updates are sent to your signed-in account email."
            >
              <CircleHelp size={18} aria-hidden="true" />
            </span>
          </Field>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.marketing}
              onChange={(event) => update("marketing", event.target.checked)}
            />
            <span>Email me with news and offers</span>
          </label>
        </section>

        {/* Delivery */}

        <section aria-labelledby="delivery-title">
          <h2 id="delivery-title">Delivery</h2>

          <div className="field field-select">
            <select id="checkout-country" value="India" disabled>
              <option>India</option>
            </select>
            <label htmlFor="checkout-country">Country/Region</label>
          </div>

          <div className="field-row">
            <Field id="checkout-firstName" label="First name (optional)">
              <input {...inputProps("firstName")} autoComplete="given-name" />
            </Field>
            <Field id="checkout-lastName" label="Last name" error={errorFor("lastName")}>
              <input {...inputProps("lastName")} autoComplete="family-name" />
            </Field>
          </div>

          <Field id="checkout-address" label="Address" error={errorFor("address")}>
            <input {...inputProps("address")} autoComplete="address-line1" />
          </Field>

          <Field id="checkout-apartment" label="Apartment, suite, floor, etc. (optional)">
            <input {...inputProps("apartment")} autoComplete="address-line2" />
          </Field>

          <div className="field-row field-row-3">
            <Field id="checkout-city" label="City" error={errorFor("city")}>
              <input {...inputProps("city")} autoComplete="address-level2" />
            </Field>

            <Field id="checkout-state" label="State" error={errorFor("state")} className="field-select">
              <select
                id="checkout-state"
                value={form.state}
                onChange={(event) => update("state", event.target.value)}
                autoComplete="address-level1"
                aria-invalid={errorFor("state") ? true : undefined}
                data-empty={form.state ? "false" : "true"}
              >
                <option value="" disabled hidden />
                {INDIAN_STATES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>

            <Field id="checkout-pin" label="PIN code" error={errorFor("pin")}>
              <input
                {...inputProps("pin")}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                onChange={(event) => update("pin", event.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>

          <Field id="checkout-phone" label="Phone (for delivery updates)" error={errorFor("phone")}>
            <input {...inputProps("phone")} type="tel" autoComplete="tel" />
          </Field>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.needGst}
              onChange={(event) => update("needGst", event.target.checked)}
            />
            <span>I need a GST invoice for my business</span>
          </label>

          {form.needGst && (
            <div className="field-row">
              <Field id="checkout-company" label="Registered business name" error={errorFor("company")}>
                <input {...inputProps("company")} autoComplete="organization" />
              </Field>
              <Field id="checkout-gstin" label="GSTIN" error={errorFor("gstin")}>
                <input
                  {...inputProps("gstin")}
                  maxLength={15}
                  onChange={(event) => update("gstin", event.target.value.toUpperCase())}
                />
              </Field>
            </div>
          )}

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.saveInfo}
              onChange={(event) => update("saveInfo", event.target.checked)}
            />
            <span>Save this information for next time</span>
          </label>
        </section>

        {/* Shipping method */}

        <section aria-labelledby="shipping-title">
          <h3 id="shipping-title">Shipping method</h3>

          {addressReady ? (
            <div className="option-list">
              {SHIPPING_METHODS.map((method) => {
                const cost = shippingCost(method.id, chairCount);
                return (
                  <label key={method.id} className={shipping === method.id ? "selected" : ""}>
                    <input
                      type="radio"
                      name="shipping"
                      value={method.id}
                      checked={shipping === method.id}
                      onChange={() => {
                        setShipping(method.id);
                        setServerTotal(null);
                      }}
                    />
                    <span>
                      {method.label}
                      <small>{method.eta}</small>
                    </span>
                    <strong>{cost === 0 ? "FREE" : formatPrice(cost)}</strong>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="checkout-placeholder">
              Enter your shipping address to view available shipping methods.
            </p>
          )}
        </section>

        {/* Payment */}

        <section aria-labelledby="payment-title">
          <h2 id="payment-title">Payment</h2>
          <p className="checkout-subtext">
            <Lock size={14} aria-hidden="true" /> All transactions are secure and encrypted.
          </p>

          <p className="checkout-placeholder">
            Pay securely by UPI, card, net banking or other methods using Razorpay. We&apos;ll send a one-time verification code to your account email before opening payment.
          </p>

          {!otpVerified && (
            <button
              type="button"
              className="auth-link-button"
              onClick={() => void sendCheckoutCode()}
              disabled={sendingOtp || verifyingOtp || authStatus !== "authenticated"}
            >
              {sendingOtp ? "Sending code..." : otpSent ? "Send a new code" : "Send verification code"}
            </button>
          )}

          {otpSent && !otpVerified && (
            <div className="field-row">
              <Field id="checkout-otp" label="Six-digit email code">
                <input
                  id="checkout-otp"
                  name="checkout-otp"
                  value={otpCode}
                  placeholder=" "
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <button
                type="button"
                className="outline-button"
                onClick={() => void verifyCheckoutCode()}
                disabled={verifyingOtp || otpCode.length !== 6}
              >
                {verifyingOtp ? "Verifying..." : "Verify code"}
              </button>
            </div>
          )}

          {otpVerified && <p className="checkout-placeholder">Email verified. Your code authorizes one payment attempt.</p>}
        </section>

        <button type="submit" className="add-to-cart checkout-submit" disabled={startingPayment || authStatus === "loading"}>
          {startingPayment ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Opening secure payment...</> : `Pay now – ${formatPrice(displayTotal)}`}
        </button>

        {touched && Object.keys(errors).length > 0 && (
          <p className="field-error" role="alert">
            Please fix the highlighted fields.
          </p>
        )}

        {notice && (
          <p className="checkout-notice" role="alert">
            {notice}
          </p>
        )}

        <nav className="checkout-footer-links" aria-label="Policies">
          <Link href="/cart">Return to cart</Link>
          <Link href="#">Refund policy</Link>
          <Link href="#">Privacy policy</Link>
          <Link href="#">Terms of service</Link>
        </nav>
      </form>

      {/* ================= SUMMARY ================= */}

      <aside className="checkout-summary" aria-label="Order summary">
        <div className="checkout-summary-inner">
          <ul className="checkout-lines">
            {lines.map((line) => (
              <li key={line.key}>
                <span className="checkout-thumb">
                  <Image src={(line.variant?.images[0] ?? line.product.images[0]).src} alt="" fill sizes="64px" />
                  <span className="checkout-qty" aria-label={`Quantity ${line.quantity}`}>
                    {line.quantity}
                  </span>
                </span>
                <span className="checkout-line-name">
                  {line.product.name}
                  <small>{variantLabel(line)}</small>
                </span>
                <span>{formatPrice(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="cart-coupon checkout-coupon">
            <h3>Have a coupon?</h3>
            <p>Add your code for an instant discount</p>
            <DiscountForm idPrefix="checkout-discount" />
          </div>

          <dl className="checkout-totals">
            <div>
              <dt>Subtotal · {itemCount} {itemCount === 1 ? "item" : "items"}</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div>
                <dt>Discount</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            )}
            <div>
              <dt>Shipping</dt>
              <dd className={shippingPrice === undefined ? "muted" : ""}>
                {shippingPrice === undefined
                  ? "Enter shipping address"
                  : shippingPrice === 0
                    ? "FREE"
                    : formatPrice(shippingPrice)}
              </dd>
            </div>
            <div className="checkout-total">
              <dt>Total</dt>
              <dd>
                <small>INR</small> {formatPrice(displayTotal)}
              </dd>
            </div>
          </dl>
          <p className="cart-tax-note">Including GST.</p>
        </div>
      </aside>
      </div>
    </>
  );
}
