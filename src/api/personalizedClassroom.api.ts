import { toolClient } from "./client";

function apiPath(path: string) {
  const baseURL = toolClient.defaults.baseURL || "";

  if (baseURL.endsWith("/api/tools")) {
    return path.replace(/^\/tools/, "");
  }

  return path;
}

// ================= TYPES =================

export type PersonalizedClassroomProduct = {
  id: string;
  goal_class_id?: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  max_students_per_batch?: number;
  is_active?: boolean;
};

export type PersonalizedClassroomImage = {
  id: string;
  product_id?: string;
  image_url: string;
  sort_order?: number;
};

export type PersonalizedClassroomPlan = {
  id: string;
  product_id?: string;
  goal_class_id?: string;
  plan_type: "monthly" | "yearly";
  title: string;
  price_paise: number;
  original_price_paise?: number;
  duration_days?: number;
  grace_days?: number;
  is_active?: boolean;
};

export type PersonalizedClassroomDetailsData = {
  product: PersonalizedClassroomProduct | null;
  images: PersonalizedClassroomImage[];
  plans: PersonalizedClassroomPlan[];
  has_access: boolean;
  access_state?: "none" | "pending" | "active" | "grace" | "locked" | "cancelled" | string;
};

export type PersonalizedClassroomDetailsResponse = {
  success: boolean;
  message?: string;
  data: PersonalizedClassroomDetailsData;
};

export type CreatePersonalizedClassroomOrderResponse = {
  success: boolean;
  message?: string;
  data: {
    plan: PersonalizedClassroomPlan;
    payment_order: {
    order_id: string;
    provider_order_id: string;
    amount_paise: number;

    key_id?: string;
    razorpay_key_id?: string;
    provider_key_id?: string;
    razorpay_order_id?: string;
    amount?: number;
    currency?: string;
    };
    };
};

export type VerifyPersonalizedClassroomPaymentBody = {
  plan_id: string;
  payment_order_id: string;
  provider_order_id: string;
  provider_payment_id: string;
  provider_signature: string;
};

export type VerifyPersonalizedClassroomPaymentResponse = {
  success: boolean;
  message?: string;
  data: {
    status: "active" | "grace" | "locked" | "cancelled" | string;
    expires_at?: string;
    grace_until?: string;
  };
};

export type PersonalizedClassroomHomeData = {
  classroom: any;
  subjects: any[];
  enrollment: any;
};

export type PersonalizedClassroomHomeResponse = {
  success: boolean;
  locked?: boolean;
  message?: string;
  data?: PersonalizedClassroomHomeData;
};

// ================= API FUNCTIONS =================

export async function getPersonalizedClassroomDetails(): Promise<PersonalizedClassroomDetailsResponse> {
  const url = apiPath("/tools/personalized-classroom/details");
  console.log("HIT PC DETAILS API:", url);

  const res = await toolClient.get<PersonalizedClassroomDetailsResponse>(url);
  return res.data;
}

export async function getPersonalizedClassroomHome(): Promise<PersonalizedClassroomHomeResponse> {
  const url = apiPath("/tools/personalized-classroom/home");
  console.log("HIT PC HOME API:", url);

  const res = await toolClient.get<PersonalizedClassroomHomeResponse>(url);
  return res.data;
}

export async function createPersonalizedClassroomOrder(
  planID: string
): Promise<CreatePersonalizedClassroomOrderResponse> {
  const url = apiPath("/tools/personalized-classroom/create-order");
  console.log("HIT PC CREATE ORDER API:", url);

  const res = await toolClient.post<CreatePersonalizedClassroomOrderResponse>(
    url,
    {
      plan_id: planID,
    }
  );

  return res.data;
}

export async function verifyPersonalizedClassroomPayment(
  data: VerifyPersonalizedClassroomPaymentBody
): Promise<VerifyPersonalizedClassroomPaymentResponse> {
  const url = apiPath("/tools/personalized-classroom/verify");
  console.log("HIT PC VERIFY API:", url);

  const res = await toolClient.post<VerifyPersonalizedClassroomPaymentResponse>(
    url,
    data
  );

  return res.data;
}