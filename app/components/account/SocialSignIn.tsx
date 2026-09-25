"use client";

import { useState } from "react";
import { startGoogleSignIn } from "../../lib/google-auth";

/* Brand marks drawn inline — lucide-react no longer ships brand icons */
const providers = [
  {
    id: "google",
    name: "Google",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.7-4.9h-4v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.3 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.9 11.9 0 0 0 1.3 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
      </svg>
    ),
  },
  {
    id: "apple",
    name: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.4 12.7c0-2.6 2.1-3.8 2.2-3.9a4.8 4.8 0 0 0-3.8-2c-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9a5 5 0 0 0-4.2 2.6c-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4a10 10 0 0 0 1.4-2.8 4.3 4.3 0 0 1-2.1-4.2zM13.9 5.1a4.3 4.3 0 0 0 1-3.1 4.4 4.4 0 0 0-2.9 1.5 4.1 4.1 0 0 0-1 3 3.7 3.7 0 0 0 2.9-1.4z"
        />
      </svg>
    ),
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path fill="#ffffff" d="M15.1 15.5l.5-3.5h-3.3V9.8c0-1 .5-1.9 2-1.9h1.5v-3s-1.4-.2-2.7-.2c-2.8 0-4.6 1.7-4.6 4.7V12H5.4v3.5h3.1V24h3.8v-8.5h2.8z" />
      </svg>
    ),
  },
];

export default function SocialSignIn({ action }: { action: "Log in" | "Sign up" }) {
  const [notice, setNotice] = useState("");

  return (
    <div className="social-sign-in">
      <div className="social-buttons">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="social-button"
            onClick={() => {
              if (provider.id === "google") {
                setNotice("");
                startGoogleSignIn().catch(() =>
                  setNotice("Google sign-in couldn't start in this browser. Please log in with your email.")
                );
                return;
              }
              // TODO: Apple/Facebook have no backend OAuth flow yet
              setNotice(
                `${provider.name} sign-in isn't switched on yet. You can still shop and check out as a guest.`
              );
            }}
          >
            {provider.icon}
            <span>
              {action === "Log in" ? "Continue" : "Sign up"} with {provider.name}
            </span>
          </button>
        ))}
      </div>

      {notice && (
        <p className="checkout-notice auth-notice" role="status">
          {notice}
        </p>
      )}

      <p className="social-divider">
        <span>or {action === "Log in" ? "log in" : "sign up"} with email</span>
      </p>
    </div>
  );
}
