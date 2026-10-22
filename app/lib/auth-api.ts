import { ApiError, apiRequest } from "./api";

/* =========================================================
   CUSTOMER AUTH API
   Contract from backend src/modules/auth (auth.schema.ts):
   - register returns the new user only (no token)
   - login and the Google exchange return a 30-minute Bearer JWT
     + the user, and set an HttpOnly session cookie
   - /auth/refresh renews the JWT from that cookie; /auth/logout ends it
   - /auth/me verifies a token for an active CUSTOMER
========================================================= */

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER";
};

export type CustomerProfile = AuthUser & {
  isActive: boolean;
  createdAt: string;
};

export type LoginResult = {
  token: string;
  user: AuthUser;
};

/* Google sign-in also authenticates administrators; the storefront rejects those */
export type GoogleExchangeResult = {
  token: string;
  user: Omit<AuthUser, "role"> & { role: "CUSTOMER" | "ADMIN" };
};

/* credentials: "include" lets the browser store and send the HttpOnly session cookie the API sets at sign-in */
function postJson<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* POST /api/v1/auth/refresh — no body; the persistent session cookie is the credential. Returns a fresh
   30-minute access token and the user, or 401 SESSION_INVALID when there is no live session. */
export async function refreshSession() {
  const { data } = await apiRequest<LoginResult>("/auth/refresh", { method: "POST", credentials: "include" });
  return data;
}

/* POST /api/v1/auth/logout — ends the session on the server and clears its cookie */
export async function endSession() {
  await apiRequest<{ loggedOut: boolean }>("/auth/logout", { method: "POST", credentials: "include" });
}

/* POST /api/v1/auth/register/send-otp — { email }. Emails a 6-digit sign-up code. Same answer whether or
   not the email is registered: a registered email is sent sign-in help instead of a code. */
export async function requestSignupCode(email: string) {
  await postJson<{ message: string }>("/auth/register/send-otp", { email });
}

/* POST /api/v1/auth/register — { name, email, password (8–200 chars), otp (the emailed code) } */
export async function registerCustomer(input: { name: string; email: string; password: string; otp: string }) {
  const { data } = await postJson<CustomerProfile>("/auth/register", input);
  return data;
}

/* Shopper-facing message for a failed sign-up code request or check */
export function signupCodeErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "OTP_INVALID":
        return "That code isn't right. Check the latest email from us and try again.";
      case "OTP_EXPIRED":
        return "That code has expired. Request a new one.";
      case "OTP_MAX_ATTEMPTS":
        return "Too many incorrect tries. Request a new code.";
      case "OTP_RESEND_COOLDOWN":
        return "We've just sent a code. Please wait a minute before asking for another.";
      case "EMAIL_SEND_FAILED":
        return "We couldn't send the email just now. Please try again in a few minutes.";
    }
  }
  return authErrorMessage(error);
}

/* POST /api/v1/auth/login — { email, password } */
export async function loginCustomer(input: { email: string; password: string }) {
  const { data } = await postJson<LoginResult>("/auth/login", input);
  return data;
}

/* GET /api/v1/auth/me — 401 bad/expired token, 403 not an active customer */
export async function fetchCurrentCustomer(token: string) {
  const { data } = await apiRequest<CustomerProfile>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

/* POST /api/v1/auth/google/exchange — one-time code from the callback + PKCE verifier */
export async function exchangeGoogleCode(input: { code: string; codeVerifier: string }) {
  const { data } = await postJson<GoogleExchangeResult>("/auth/google/exchange", input);
  return data;
}

/* POST /api/v1/auth/forgot-password/request-link — { email }. Always the same generic answer,
   whether or not an account exists; only an active customer account is actually emailed. */
export async function requestPasswordResetLink(email: string) {
  await postJson<{ message: string }>("/auth/forgot-password/request-link", { email });
}

/* POST /api/v1/auth/reset-password — { token (from the emailed link), newPassword (8–200 chars) }.
   400 RESET_TOKEN_INVALID: unknown, expired, already used or superseded link */
export async function resetPasswordWithToken(input: { token: string; newPassword: string }) {
  await postJson<{ message: string }>("/auth/reset-password", input);
}

/* Shopper-facing message for a failed reset request (either step) */
export function passwordResetErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "RESET_TOKEN_INVALID")
      return "This reset link is invalid or has expired. Request a new one from the log in page.";
    /* The API in use doesn't offer reset by email yet */
    if (error.status === 404)
      return "Password reset by email isn't available right now. Please try again later or contact us.";
  }
  return authErrorMessage(error);
}

/* The token is no longer usable: drop the session */
export function isRejectedToken(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

/* Shopper-facing message for a failed auth request */
export function authErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";

  switch (true) {
    case error.code === "INVALID_CREDENTIALS":
      return "Incorrect email or password.";
    case error.code === "DUPLICATE_RECORD":
      return "An account with this email already exists. Log in instead.";
    case error.code === "VALIDATION_ERROR":
      return "Please check your details and try again.";
    case error.status === 429:
      return "Too many attempts. Please wait a minute and try again.";
    case error.status === 0:
      return "We couldn't reach the server. Check your connection and try again.";
    default:
      return "Something went wrong on our side. Please try again.";
  }
}

/* Messages for the #error=CODE values the backend Google callback can send, plus exchange errors */
const googleErrors: Record<string, string> = {
  OAUTH_STATE_INVALID:
    "Your Google sign-in expired or was started in another browser. Please try again.",
  GOOGLE_AUTH_DENIED: "Google sign-in was cancelled.",
  GOOGLE_EMAIL_UNVERIFIED: "Your Google account's email address isn't verified with Google.",
  GOOGLE_ACCOUNT_NOT_LINKED:
    "This account can't be signed in with Google here. Log in with your email and password, or contact us for help.",
  GOOGLE_ACCOUNT_ADMIN:
    "This email belongs to a Chamaro administrator account, which can't be used to shop. Please sign in with a different Google account, or create a customer account with another email.",
  GOOGLE_EMAIL_NEEDS_VERIFICATION:
    "For your security, please confirm this email address first: on the log in page choose \"Forgot password\", open the link we email you, then try Google again. Your orders and details stay as they are.",
  GOOGLE_ACCOUNT_CONFLICT:
    "This Google account is already linked to a different Chamaro account. Sign in with that account, or contact us for help.",
  ACCOUNT_INACTIVE: "This account is inactive. Please contact us for help.",
  OAUTH_CODE_INVALID: "Your Google sign-in link expired. Please try again.",
  PKCE_VERIFIER_MISSING:
    "We couldn't finish signing you in in this tab. Please start Google sign-in again.",
  ADMIN_ACCOUNT: "This Google account belongs to an administrator and can't be used on the store.",
};

export function googleErrorMessage(codeOrError: unknown) {
  const code = codeOrError instanceof ApiError ? codeOrError.code : codeOrError;
  if (typeof code === "string" && googleErrors[code]) return googleErrors[code];
  if (codeOrError instanceof ApiError) return authErrorMessage(codeOrError);
  return "Google sign-in didn't work. Please try again or log in with your email.";
}
