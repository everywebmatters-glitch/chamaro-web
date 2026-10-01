import type { Metadata } from "next";
import PolicyPage from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Shipping Policy | Chamaro",
  description: "Delivery timelines and shipping information for Chamaro orders.",
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Shipping Policy"
      sections={[
        {
          heading: "Fast & Reliable Delivery",
          intro:
            "At Chamaro, we ensure every order is carefully packed and delivered with the highest level of care.",
        },
        {
          heading: "Shipping Information",
          items: [
            <>
              Estimated delivery: <strong>8–10 business days</strong>
            </>,
            "Delivery timeline may vary depending on location and courier availability.",
            "Shipping confirmation and tracking details will be shared once your order is dispatched.",
            "Orders are processed only after successful payment confirmation.",
            "Deliveries are made during standard business hours.",
          ],
        },
        {
          heading: "Delivery Notes",
          items: [
            "Please ensure someone is available to receive the package at the delivery address.",
            "If delivery cannot be completed due to an incorrect address or customer unavailability, re-delivery charges may apply.",
          ],
        },
      ]}
    />
  );
}
