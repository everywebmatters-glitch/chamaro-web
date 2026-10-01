/* =========================================================
   STORE CONTACT DETAILS
========================================================= */

export const contact = {
  address: [
    "No.8/390 & 8/391, Kaviyarasu",
    " Kannadhasan Nagar Kodungaiyur,", 
    "Chennai - 600118, Tamil Nadu.",
  ],
  email: "chamarochairs@gmail.com",
  phone: "+91 97414 18807 / +91 86670 53897",
  hours: "Mon – Sat, 10:00 am – 7:00 pm",
  mapUrl: "https://maps.google.com",
};

/* First number in `contact.phone`, digits only, for `tel:` links — the
   display string can list more than one number separated by " / ". */
export const primaryPhoneHref = `tel:${contact.phone.split("/")[0].trim().replace(/\s/g, "")}`;

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
