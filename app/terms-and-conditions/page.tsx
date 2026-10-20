import type { Metadata } from "next";
import PolicyPage from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | Chamaro",
  description: "The terms that apply to using the Chamaro website and buying our products.",
};

export default function TermsAndConditionsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      sections={[
        {
          heading: "Welcome to Chamaro",
          intro:
            "By accessing or using our website and purchasing our products, you agree to the following Terms & Conditions.",
        },
        {
          heading: "Products & Information",
          intro:
            "We make every effort to ensure that product descriptions, images, specifications, dimensions, and colours are accurate. However, slight variations may occur due to lighting, screen settings, materials, or manufacturing processes.",
        },
        {
          heading: "Orders & Payments",
          intro:
            "Orders are confirmed only after successful payment. Chamaro reserves the right to cancel or refuse an order in cases of incorrect pricing, product unavailability, payment issues, or suspected fraudulent activity.",
        },
        {
          heading: "Pricing",
          intro:
            "All product prices displayed on the website are subject to change without prior notice. Applicable taxes, shipping charges, or other costs will be communicated where applicable.",
        },
        {
          heading: "Delivery",
          intro:
            "Estimated delivery time is 8–10 days. Delivery times may vary depending on location, product availability, logistics, and circumstances beyond our control.",
        },
        {
          heading: "Replacement & Returns",
          intro:
            "Replacement and return requests are subject to Chamaro's Returns & Replacement Policy. Products must meet the applicable eligibility conditions before a replacement or return is approved.",
        },
        {
          heading: "Warranty",
          intro:
            "Eligible products are covered under the Chamaro Warranty Policy. Warranty coverage applies only to manufacturing defects and does not cover normal wear and tear, accidental damage, misuse, or unauthorized modifications.",
        },
        {
          heading: "Warranty Shipping Charges",
          intro:
            "After the 10-day replacement period, approved warranty claims may be subject to shipping and transportation charges, which will be borne by the customer.",
        },
        {
          heading: "Product Usage",
          intro:
            "Customers are responsible for using products according to their intended purpose and following applicable assembly, care, and usage instructions.",
        },
        {
          heading: "Intellectual Property",
          intro:
            "All website content, including the Chamaro name, logo, product images, text, graphics, and designs, is the property of Chamaro and may not be copied, reproduced, or used without prior written permission.",
        },
        {
          heading: "Changes to Terms",
          intro:
            "Chamaro reserves the right to update or modify these Terms & Conditions at any time. Updated terms will be published on this page.",
        },
        {
          heading: "Contact Us",
          intro:
            "For questions regarding these Terms & Conditions, orders, products, warranty, or other services, please contact the Chamaro support team.",
        },
      ]}
      closing="By using the Chamaro website and placing an order, you acknowledge that you have read and agreed to these Terms & Conditions."
    />
  );
}
