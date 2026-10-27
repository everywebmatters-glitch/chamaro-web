import type { Metadata } from "next";
import PolicyPage from "../components/PolicyPage";

export const metadata: Metadata = {
  title: "Warranty Information | Chamaro",
  description: "Chamaro's standard warranty coverage, eligibility and exclusions.",
};

export default function WarrantyInformationPage() {
  return (
    <PolicyPage
      title="Warranty"
      sections={[
        {
          heading: "Our Warranty",
          intro:
            "Chamaro products are built for dependable everyday use and are covered by our standard warranty against manufacturing defects.",
        },
        {
          heading: "1-Year Standard Warranty",
          intro:
            "The hydraulic gas lift, tilt mechanism, wheelbase, and handles (adjustable and non-adjustable) are covered against manufacturing defects under normal use.",
        },
        {
          heading: "10-Day Manufacturing Defect Warranty",
          intro:
            "Products found to have a manufacturing defect within 10 days of delivery are eligible for replacement or return, subject to inspection and approval.",
        },
        {
          heading: "Warranty Covers",
          items: [
            "Manufacturing defects",
            "Hydraulic gas lift defects",
            "Tilt mechanism defects",
            "Wheelbase defects",
            "Adjustable and non-adjustable handle defects",
          ],
        },
        {
          heading: "Warranty Does Not Cover",
          items: [
            "Normal wear and tear",
            "Fabric, leatherette, mesh, or upholstery wear",
            "Scratches, stains, cuts, or other cosmetic damage",
            "Damage caused by misuse, negligence, or improper handling",
            "Accidental, water, or fire damage",
            "Damage caused by overloading",
            "Unauthorized repairs or modifications",
            "Damage resulting from improper assembly",
          ],
        },
      ]}
      closing="All warranty claims are subject to inspection and approval by Chamaro."
    />
  );
}
