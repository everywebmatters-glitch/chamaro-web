import type { Metadata } from "next";
import PolicyPage from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Chamaro",
  description: "How Chamaro collects, uses and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      sections={[
        {
          heading: "Your Privacy at Chamaro",
          intro:
            "At Chamaro, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect information when you visit our website or place an order.",
        },
        {
          heading: "Information We Collect",
          intro: "When you use our website or place an order, we may collect information such as:",
          items: [
            "Name",
            "Phone number",
            "Email address",
            "Billing and shipping address",
            "Order and purchase details",
            "Payment-related information",
            "Information you provide when contacting our support team",
          ],
        },
        {
          heading: "How We Use Your Information",
          intro: "We may use your information to:",
          items: [
            "Process and deliver your orders",
            "Provide customer support",
            "Process returns, replacements, and warranty requests",
            "Send order and delivery updates",
            "Respond to enquiries",
            "Improve our products, services, and website",
            "Prevent fraudulent or unauthorized activities",
          ],
        },
        {
          heading: "Payment Information",
          intro:
            "Payments may be processed through secure third-party payment providers. Chamaro does not intentionally store your complete card, banking, or other sensitive payment credentials on its own systems.",
        },
        {
          heading: "Sharing of Information",
          intro:
            "We do not sell or rent your personal information. Your information may be shared with trusted service providers when necessary to provide our services, such as payment processors, delivery partners, logistics providers, website services, or customer-support services.",
        },
        {
          heading: "Cookies",
          intro:
            "Our website may use cookies and similar technologies to improve website functionality, understand website usage, remember preferences, and provide a better browsing experience. You can manage or disable cookies through your browser settings, although some website features may not function properly as a result.",
        },
        {
          heading: "Data Security",
          intro:
            "We take reasonable measures to protect your personal information from unauthorized access, misuse, alteration, or disclosure. However, no method of online transmission or electronic storage can be guaranteed to be completely secure.",
        },
        {
          heading: "Third-Party Services",
          intro:
            "Our website may contain links to or use services provided by third parties. Their privacy practices are governed by their own privacy policies, and Chamaro is not responsible for their privacy practices.",
        },
        {
          heading: "Your Information",
          intro:
            "You may contact us to request information about the personal data we hold about you or to request correction of inaccurate information, subject to applicable laws and requirements.",
        },
        {
          heading: "Policy Updates",
          intro:
            "Chamaro may update this Privacy Policy from time to time to reflect changes in our services, website, or applicable requirements. Any updated version will be published on this page.",
        },
        {
          heading: "Contact Us",
          intro:
            "If you have questions about this Privacy Policy or how your information is handled, please contact the Chamaro support team.",
        },
      ]}
      closing="By using the Chamaro website, you acknowledge that you have read and understood this Privacy Policy."
    />
  );
}
