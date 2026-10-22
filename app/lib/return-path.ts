/* Only a path on this site is a safe place to send a shopper back to after signing in */
export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/account";
  /* Control characters and anything that could be read as a scheme or another host */
  if (/[\u0000-\u001f\u007f]/.test(value) || /^\/[^/?#]*:/.test(value)) return "/account";
  return value;
}
