import { apiRequest } from "./api";

export type B2BEnquiryInput = {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  productType: string;
  quantity: number;
  message: string;
};

export async function submitB2BEnquiry(input: B2BEnquiryInput) {
  const { data } = await apiRequest<{ id: string; status: string }>("/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data;
}
