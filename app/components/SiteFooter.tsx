import Image from "next/image";
import { ArrowUpRight, ChevronUp } from "lucide-react";
import NewsletterForm from "./NewsletterForm";
import PaymentBadges from "./PaymentBadges";
import { contact } from "../lib/site";

/* =========================================================
   FOOTER CONTENT
   TODO: replace placeholder link targets
========================================================= */

const helpLinks = [
  "Privacy Policy",
  "Returns + Exchanges",
  "Shipping",
  "Terms & Conditions",
  "FAQs",
  "Compare",
  "My Wishlist",
];

const usefulLinks = [
  "Our Story",
  "Visit Our Store",
  "Contact Us",
  "About Us",
  "Account",
];

/* Pages that exist so far; the rest are TODO */
const footerHrefs: Record<string, string> = {
  "My Wishlist": "/wishlist",
  "Contact Us": "/contact",
  "Visit Our Store": "/contact",
  Account: "/account",
};

/* =========================================================
   SOCIAL ICONS (lucide-react no longer ships brand icons)
========================================================= */

const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: <path d="M14 8h2V5h-2.5C11 5 10 6.6 10 8.8V11H8v3h2v6h3v-6h2.4l.6-3h-3V9c0-.6.4-1 1-1z" fill="currentColor" />,
  },
  {
    label: "X",
    href: "https://x.com",
    icon: <path d="M6 5l12 14M18 5L6 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="5" width="14" height="14" rx="4" />
        <circle cx="12" cy="12" r="3.2" />
        <circle cx="16.3" cy="7.7" r="0.6" fill="currentColor" />
      </g>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: (
      <g fill="currentColor">
        <rect x="5" y="10" width="3" height="9" />
        <circle cx="6.5" cy="6.5" r="1.7" />
        <path d="M10 10h3v1.4c.6-1 1.7-1.6 3-1.6 2.2 0 3 1.4 3 3.8V19h-3v-5c0-1.2-.4-1.9-1.5-1.9S13 12.9 13 14v5h-3z" />
      </g>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <g>
        <rect x="4" y="7" width="16" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.5 9.8v4.4l3.8-2.2z" fill="currentColor" />
      </g>
    ),
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand + contact */}

          <div className="footer-brand">
            <Image
              src="/Carmaro Logo 1.svg"
              alt="Chamaro"
              width={160}
              height={36}
            />

            <address>
              <p>
                Address: {contact.address[0]}
                <br />
                {contact.address[1]}
              </p>
              <p>
                Email: <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </p>
              <p>
                Phone:{" "}
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                  {contact.phone}
                </a>
              </p>
            </address>

            <a
              className="footer-direction"
              href={contact.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Get direction
              <ArrowUpRight size={13} strokeWidth={2} aria-hidden="true" />
            </a>

            <ul className="footer-social" aria-label="Social media">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {social.icon}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}

          <nav className="footer-links" aria-labelledby="footer-help">
            <h2 id="footer-help">Help</h2>
            <ul>
              {helpLinks.map((link) => (
                <li key={link}>
                  <a href={footerHrefs[link] ?? "#"}>{link}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Useful links */}

          <nav className="footer-links" aria-labelledby="footer-useful">
            <h2 id="footer-useful">Useful Links</h2>
            <ul>
              {usefulLinks.map((link) => (
                <li key={link}>
                  <a href={footerHrefs[link] ?? "#"}>{link}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter */}

          <div className="footer-newsletter">
            <h2>Sign Up for Email</h2>
            <p>
              Sign up to get first dibs on new arrivals, sales, exclusive
              content, events and more!
            </p>

            <NewsletterForm />

            <div className="footer-locale">
              <label>
                <span className="sr-only">Currency</span>
                <select defaultValue="INR">
                  <option value="INR">₹ INR</option>
                </select>
              </label>

              <label>
                <span className="sr-only">Language</span>
                <select defaultValue="en">
                  <option value="en">English</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Bottom bar */}

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Chamaro. All rights reserved.</p>

          <PaymentBadges />
        </div>
      </div>

      <a className="back-to-top" href="#top" aria-label="Back to top">
        <ChevronUp size={20} strokeWidth={1.8} />
      </a>
    </footer>
  );
}
