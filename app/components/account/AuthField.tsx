"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Props = {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
};

export default function AuthField({ id, label, type = "text", value, onChange, error, autoComplete }: Props) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`field${error ? " has-error" : ""}${isPassword ? " field-password" : ""}`}>
      <input
        id={id}
        name={id}
        type={isPassword && visible ? "text" : type}
        value={value}
        placeholder=" "
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      <label htmlFor={id}>{label}</label>
      {isPassword && (
        <button
          type="button"
          className="field-toggle"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export { EMAIL_PATTERN } from "../../lib/site";
export const MIN_PASSWORD = 8;
export const AUTH_NOT_CONNECTED =
  "Customer accounts aren't switched on yet, so nothing was sent. You can still shop and check out as a guest.";
