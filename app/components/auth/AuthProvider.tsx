"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import {
  endSession,
  exchangeGoogleCode,
  fetchCurrentCustomer,
  isRejectedToken,
  loginCustomer,
  refreshSession,
  type AuthUser,
} from "../../lib/auth-api";
import { createSessionEpoch } from "../../lib/session-epoch";
import { clearPersonalData, removeLegacyData } from "../../lib/user-storage";

/* =========================================================
   CUSTOMER AUTH STATE
   Signing in gives the page a short (30 minute) access token, kept in memory only, and the API sets an HttpOnly
   session cookie that script can't read. That cookie is what keeps the shopper signed in: on every page load, and a
   couple of minutes before the access token ends, the page asks POST /auth/refresh for a new token (the cookie rotates
   each time). So a reload, a new tab or closing the browser doesn't sign anyone out, and no long-lived token ever sits
   in storage. Logging out revokes the session on the server and clears the shopper's saved delivery details from this
   browser. The user is never read from storage; it always comes from the API.
========================================================= */

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthState = { status: AuthStatus; user: AuthUser | null; token: string | null };

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<AuthUser>;
  completeGoogleSignIn: (code: string, codeVerifier: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SIGNED_OUT: AuthState = { status: "unauthenticated", user: null, token: null };
/* Renew this long before the access token ends */
const REFRESH_MARGIN_MS = 2 * 60_000;
const RETRY_MS = 30_000;
const CHANNEL = "chamaro-auth";

/* exp claim in ms, for scheduling the renewal only; the backend verifies the token */
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
  /* Token and user of the live session; late responses for an older token are ignored */
  const currentToken = useRef<string | null>(null);
  const currentUserId = useRef<string | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  /* Bumped by every sign-in and log out, so a slower session check can't undo them (see lib/session-epoch) */
  const epoch = useRef(createSessionEpoch());

  const show = useCallback((token: string, user: AuthUser) => {
    currentToken.current = token;
    currentUserId.current = user.id;
    setState({ status: "authenticated", user, token });
  }, []);

  const signedOut = useCallback(() => {
    currentToken.current = null;
    currentUserId.current = null;
    setState(SIGNED_OUT);
  }, []);

  /* Ask the API to renew from the session cookie. Returns whether the shopper is signed in afterwards. */
  const refresh = useCallback(async () => {
    const started = epoch.current.begin();
    try {
      const { token, user } = await refreshSession();
      /* The shopper signed in or out while this was on its way: that is newer than this answer */
      if (epoch.current.isStale(started)) return currentToken.current !== null;
      show(token, toAuthUser(user));
      return true;
    } catch (error) {
      if (epoch.current.isStale(started)) return currentToken.current !== null;
      if (isRejectedToken(error)) {
        signedOut();
        return false;
      }
      /* Network or server trouble: keep whoever is shown signed in and retry; on first load there is nobody to show */
      setState((current) => (current.status === "loading" ? SIGNED_OUT : current));
      return false;
    }
  }, [show, signedOut]);

  /* Explicit log out: end the session on the server, forget this shopper's saved details, tell the other tabs */
  const logout = useCallback(() => {
    epoch.current.bump();
    clearPersonalData(currentUserId.current);
    signedOut();
    void endSession().catch(() => undefined);
    channel.current?.postMessage("signed-out");
  }, [signedOut]);

  /* Confirm a freshly issued token with /me before trusting it */
  const verify = useCallback(
    async (token: string) => {
      try {
        const profile = await fetchCurrentCustomer(token);
        if (currentToken.current !== token) return;
        show(token, toAuthUser(profile));
      } catch (error) {
        if (currentToken.current !== token) return;
        if (isRejectedToken(error)) {
          signedOut();
          return;
        }
        setState(SIGNED_OUT);
      }
    },
    [show, signedOut]
  );

  const establish = useCallback(
    (token: string, user: AuthUser) => {
      epoch.current.bump();
      show(token, user);
      channel.current?.postMessage("signed-in");
      void verify(token);
    },
    [show, verify]
  );

  /* Page load: forget anything earlier versions kept in storage, then ask for the session */
  useEffect(() => {
    removeLegacyData();
    try {
      channel.current = new BroadcastChannel(CHANNEL);
      channel.current.onmessage = (event: MessageEvent) => {
        if (event.data === "signed-out") signedOut();
        if (event.data === "signed-in") void refresh();
      };
    } catch {
      /* BroadcastChannel unavailable: other tabs catch up at their next renewal */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of the session on page load
    void refresh();
    return () => channel.current?.close();
  }, [refresh, signedOut]);

  /* Renew before the access token ends */
  useEffect(() => {
    const expiresAt = state.token ? tokenExpiry(state.token) : null;
    if (!expiresAt) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (delay: number) => {
      timer = setTimeout(async () => {
        const ok = await refresh();
        if (!ok && currentToken.current) schedule(RETRY_MS);
      }, delay);
    };
    schedule(Math.max(5_000, expiresAt - Date.now() - REFRESH_MARGIN_MS));
    return () => clearTimeout(timer);
  }, [state.token, refresh]);

  /* A tab that sat in the background (timers are throttled) renews as soon as it is looked at again */
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== "visible") return;
      const token = currentToken.current;
      const expiresAt = token ? tokenExpiry(token) : null;
      if (expiresAt && expiresAt - Date.now() < REFRESH_MARGIN_MS) void refresh();
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, [refresh]);

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
