import { paymentClient } from "./client";

export type ContentType = "test_series" | "ebook_series";

export const PaymentAPI = {
  createOrder: async (payload: {
    content_id: string;
    content_type: ContentType;
  }) => {
    const res = await paymentClient.post("/payments/orders", payload);
    return res.data;
  },

  verify: async (payload: {
    provider_order_id: string;
    provider_payment_id: string;
    signature: string;
  }) => {
    const res = await paymentClient.post("/payments/verify", payload);
    return res.data;
  },
};

export const checkAccess = async (params: {
  content_id: string;
  content_type: ContentType;
}) => {
  const res = await paymentClient.get("/payments/access", { params });
  return res.data;
};


export type PurchaseItem = {
  order_id: string;
  content_id: string;
  content_type: "ebook_series" | "test_series";
  title: string;
  description: string;
  image_url: string;
  amount_paise: number;
  amount_rupees: number;
  currency: string;
  status: string;
  provider: string;
  provider_order_id: string;
  provider_payment_id: string;
  purchased_at: string;
  invoice_url: string;
};

export const getMyPurchases = async (): Promise<PurchaseItem[]> => {
  const res = await paymentClient.get("/payments/my-purchases");
  return res.data?.data || [];
};