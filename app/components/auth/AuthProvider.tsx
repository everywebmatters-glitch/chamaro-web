"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import {
  exchangeGoogleCode,
  fetchCurrentCustomer,
  isRejectedToken,
  logoutCustomerSession,
  loginCustomer,
  refreshCustomerSession,
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
  logout: () => Promise<void>;
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
  const sessionVersion = useRef(0);

  const logout = useCallback(async () => {
    sessionVersion.current += 1;
    currentToken.current = null;
    writeToken(null);
    setState(SIGNED_OUT);
    await logoutCustomerSession();
  }, []);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const version = sessionVersion.current;
    const { token, user } = await refreshCustomerSession(signal);
    if (signal?.aborted || version !== sessionVersion.current) return;
    const authUser = toAuthUser(user);
    currentToken.current = token;
    writeToken(token);
    setState({ status: "authenticated", user: authUser, token });
  }, []);

  const verify = useCallback(async (token: string, signal?: AbortSignal) => {
    try {
      const profile = await fetchCurrentCustomer(token);
      if (signal?.aborted || currentToken.current !== token) return;
      setState({ status: "authenticated", user: toAuthUser(profile), token });
    } catch (error) {
      if (signal?.aborted || currentToken.current !== token) return;
      if (!isRejectedToken(error)) {
        setState(SIGNED_OUT);
        return;
      }
      try {
        await refresh(signal);
      } catch (refreshError) {
        if (signal?.aborted || currentToken.current !== token) return;
        if (isRejectedToken(refreshError)) {
          currentToken.current = null;
          writeToken(null);
        }
        setState(SIGNED_OUT);
      }
    }
  }, [refresh]);

  /* Store a freshly issued token, show its user at once, then confirm via /me */
  const establish = useCallback(
    (token: string, user: AuthUser) => {
      sessionVersion.current += 1;
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
    const controller = new AbortController();
    if (!token) {
      void refresh(controller.signal).catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (isRejectedToken(error)) {
          currentToken.current = null;
          writeToken(null);
        }
        setState(SIGNED_OUT);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the persisted customer session
      void verify(token, controller.signal);
    }
    return () => controller.abort();
  }, [refresh, verify]);

  /* Renew the short-lived access token shortly before it expires. */
  useEffect(() => {
    const expiresAt = state.token ? tokenExpiry(state.token) : null;
    if (!expiresAt) return;
    const timer = window.setTimeout(() => {
      const token = state.token;
      void refresh().catch((error: unknown) => {
        if (currentToken.current !== token) return;
        if (isRejectedToken(error)) void logout().catch(() => setState(SIGNED_OUT));
        else setState(SIGNED_OUT);
      });
    }, Math.max(0, expiresAt - Date.now() - 60_000));
    return () => window.clearTimeout(timer);
  }, [state.token, refresh, logout]);

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
