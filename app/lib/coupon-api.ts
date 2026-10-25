import { apiRequest } from "./api";

export type CouponValidationInput = {
  code: string;
  items: { productId: string; variantId?: string; quantity: number }[];
};

export type CouponValidation = {
  code: "WELCOME10" | "WELCOME5";
  label: string;
  percentOff: number;
  discountTotal: string;
};

export async function validateCoupon(token: string, input: CouponValidationInput) {
  const { data } = await apiRequest<CouponValidation>("/coupons/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
  return data;
}
