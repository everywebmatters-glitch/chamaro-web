import type { Metadata } from "next";
import PolicyPage from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Returns & Refunds | Chamaro",
  description: "Chamaro's replacement, return and refund policy.",
};

export default function ReturnsRefundsPage() {
  return (
    <PolicyPage
      title="Returns & Refunds"
      sections={[
        {
          heading: "Easy Replacement Policy",
          intro:
            "At Chamaro, customer satisfaction is our priority. If your product arrives with a manufacturing defect or transit damage, we'll work to resolve the issue promptly.",
        },
        {
          heading: "Replacement Eligibility",
          items: [
            "Replacement requests must be submitted within 10 days of purchase.",
            "All replacement requests are subject to inspection and approval by our quality assurance team.",
            "Approved replacements will be processed for the same product and same color as originally ordered.",
          ],
        },
        {
          heading: "Return & Replacement Conditions",
          intro: "To be eligible for a replacement, the product must:",
          items: [
            "Be unused and in its original condition.",
            "Be returned with the original packaging, accessories, and invoice.",
            "Show no signs of misuse, accidental damage, improper assembly, or unauthorized modifications.",
          ],
        },
        {
          heading: "Color Replacement Policy",
          items: [
            "Color replacements or exchanges are not available.",
            "Please review your selected color carefully before placing your order.",
            "Product images are professionally photographed; however, slight color variations may occur due to studio lighting, screen settings, and material batch differences.",
            "Such variations are considered normal and are not eligible for replacement, exchange, or return.",
          ],
        },
        {
          heading: "Refund Policy",
          intro:
            "Refunds are provided only when a replacement cannot be arranged or where required under applicable consumer protection laws. If approved, refunds will be processed through the original payment method within the applicable processing period.",
        },
      ]}
    />
  );
}
