/* =========================================================
   STORE CONTACT DETAILS
   TODO: replace placeholders with the real showroom details
========================================================= */

export const contact = {
  address: ["Chamaro Showroom, Street Address,", "City, State PIN"],
  email: "hello@chamaro.com",
  phone: "+91 00000 00000",
  hours: "Mon – Sat, 10:00 am – 7:00 pm",
  mapUrl: "https://maps.google.com",
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^(\+91[\s-]?)?[6-9]\d{9}$/;
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/* No backend for enquiries yet, so forms hand the message to the visitor's email app */
export function mailtoHref(subject: string, lines: [label: string, value: string][]) {
  const body = lines
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`)
    .join("\n");
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
