import { ApiError, apiRequest } from "./api";

/* =========================================================
   CUSTOMER AUTH API
   Contract from backend src/modules/auth (auth.schema.ts):
   - register returns the new user only (no token)
   - login and the Google exchange return a Bearer JWT
     (8h, no refresh) + the user
   - /auth/me verifies a token for an active CUSTOMER
   - there is no logout endpoint
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

function postJson<T>(path: string, body: unknown) {
  return apiRequest<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* POST /api/v1/auth/register — { name, email, password (8–200 chars) } */
export async function registerCustomer(input: { name: string; email: string; password: string }) {
  const { data } = await postJson<CustomerProfile>("/api/v1/auth/register", input);
  return data;
}

/* POST /api/v1/auth/login — { email, password } */
export async function loginCustomer(input: { email: string; password: string }) {
  const { data } = await postJson<LoginResult>("/api/v1/auth/login", input);
  return data;
}

/* GET /api/v1/auth/me — 401 bad/expired token, 403 not an active customer */
export async function fetchCurrentCustomer(token: string) {
  const { data } = await apiRequest<CustomerProfile>("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

/* POST /api/v1/auth/google/exchange — one-time code from the callback + PKCE verifier */
export async function exchangeGoogleCode(input: { code: string; codeVerifier: string }) {
  const { data } = await postJson<GoogleExchangeResult>("/api/v1/auth/google/exchange", input);
  return data;
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
    "An account with this email already exists. Log in with your email and password instead.",
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
