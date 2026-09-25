"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import {
  exchangeGoogleCode,
  fetchCurrentCustomer,
  isRejectedToken,
  loginCustomer,
  type AuthUser,
} from "../../lib/auth-api";

/* =========================================================
   CUSTOMER AUTH STATE
   The backend issues a Bearer JWT (8h, no refresh, no logout
   endpoint). Only the token is kept, in sessionStorage: it
   survives reloads but ends with the tab. The user is never
   read from storage; it always comes from GET /api/v1/auth/me,
   which runs on load and after every sign-in. A 401/403 there
   ends the session.
========================================================= */

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = { status: AuthStatus; user: AuthUser | null; token: string | null };

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<AuthUser>;
  completeGoogleSignIn: (code: string, codeVerifier: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "chamaro-auth";
const SIGNED_OUT: AuthState = { status: "unauthenticated", user: null, token: null };

function readToken() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const token = raw ? (JSON.parse(raw) as { token?: unknown }).token : null;
    return typeof token === "string" && token ? token : null;
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token }));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: the session lasts until the page is closed */
  }
}

/* exp claim in ms, for the logout timer only; the backend verifies the token */
function tokenExpiry(token: string) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

const toAuthUser = ({ id, name, email }: { id: string; name: string; email: string }): AuthUser => ({
  id,
  name,
  email,
  role: "CUSTOMER",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, token: null });
  /* Token of the live session; late /me responses for an older token are ignored */
  const currentToken = useRef<string | null>(null);

  const logout = useCallback(() => {
    currentToken.current = null;
    writeToken(null);
    setState(SIGNED_OUT);
  }, []);

  const verify = useCallback(async (token: string) => {
    try {
      const profile = await fetchCurrentCustomer(token);
      if (currentToken.current !== token) return;
      setState({ status: "authenticated", user: toAuthUser(profile), token });
    } catch (error) {
      if (currentToken.current !== token) return;
      if (isRejectedToken(error)) {
        currentToken.current = null;
        writeToken(null);
      }
      /* Otherwise (network/server error) keep the token so a reload can retry,
         but don't show the shopper as signed in without the backend's word */
      setState(SIGNED_OUT);
    }
  }, []);

  /* Store a freshly issued token, show its user at once, then confirm via /me */
  const establish = useCallback(
    (token: string, user: AuthUser) => {
      currentToken.current = token;
      writeToken(token);
      setState({ status: "authenticated", user, token });
      void verify(token);
    },
    [verify]
  );

  useEffect(() => {
    const token = readToken();
    currentToken.current = token;
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from sessionStorage
      setState(SIGNED_OUT);
      return;
    }
    void verify(token);
  }, [verify]);

  /* End the session when the token expires */
  useEffect(() => {
    const expiresAt = state.token ? tokenExpiry(state.token) : null;
    if (!expiresAt) return;
    const timer = window.setTimeout(logout, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [state.token, logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user } = await loginCustomer({ email, password });
      const authUser = toAuthUser(user);
      establish(token, authUser);
      return authUser;
    },
    [establish]
  );

  const completeGoogleSignIn = useCallback(
    async (code: string, codeVerifier: string) => {
      const { token, user } = await exchangeGoogleCode({ code, codeVerifier });
      /* Google sign-in also authenticates administrators; /auth/me would reject them */
      if (user.role !== "CUSTOMER") {
        throw new ApiError(403, "ADMIN_ACCOUNT", "Administrator accounts can't sign in here", "");
      }
      const authUser = toAuthUser(user);
      establish(token, authUser);
      return authUser;
    },
    [establish]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, completeGoogleSignIn, logout }),
    [state, login, completeGoogleSignIn, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
