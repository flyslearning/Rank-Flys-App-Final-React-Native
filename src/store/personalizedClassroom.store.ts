import { create } from "zustand";
import {
  getPersonalizedClassroomDetails,
  getPersonalizedClassroomHome,
  createPersonalizedClassroomOrder,
  verifyPersonalizedClassroomPayment,
  PersonalizedClassroomProduct,
  PersonalizedClassroomImage,
  PersonalizedClassroomPlan,
  PersonalizedClassroomHomeData,
  CreatePersonalizedClassroomOrderResponse,
  VerifyPersonalizedClassroomPaymentBody,
} from "../api/personalizedClassroom.api";
import { PersonalizedClassroomDb } from "../db/personalizedClassroomDb";

type AccessState =
  | "none"
  | "pending"
  | "active"
  | "grace"
  | "locked"
  | "cancelled"
  | string;

type PersonalizedClassroomState = {
  product: PersonalizedClassroomProduct | null;
  images: PersonalizedClassroomImage[];
  plans: PersonalizedClassroomPlan[];

  hasAccess: boolean;
  accessState: AccessState | null;

  selectedPlan: PersonalizedClassroomPlan | null;

  classroomHome: PersonalizedClassroomHomeData | null;
  classroom: any | null;
  subjects: any[];
  enrollment: any | null;

  paymentOrder: CreatePersonalizedClassroomOrderResponse["data"]["payment_order"] | null;

  loading: boolean;
  detailsLoading: boolean;
  homeLoading: boolean;
  orderLoading: boolean;
  verifyLoading: boolean;

  locked: boolean;
  error: string | null;

  clearError: () => void;
  resetClassroom: () => void;

  setSelectedPlan: (plan: PersonalizedClassroomPlan | null) => void;

  loadDetails: () => Promise<void>;
  loadHome: () => Promise<void>;

  createOrder: (
    planID?: string
  ) => Promise<CreatePersonalizedClassroomOrderResponse["data"]>;

  verifyPayment: (
    data: VerifyPersonalizedClassroomPaymentBody
  ) => Promise<void>;
};

function normalizeArray<T = any>(data: any): T[] {
  return Array.isArray(data) ? data : [];
}

function getErrorMessage(err: any) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong"
  );
}

export const usePersonalizedClassroomStore =
  create<PersonalizedClassroomState>((set, get) => ({
    product: null,
    images: [],
    plans: [],

    hasAccess: false,
    accessState: null,

    selectedPlan: null,

    classroomHome: null,
    classroom: null,
    subjects: [],
    enrollment: null,

    paymentOrder: null,

    loading: false,
    detailsLoading: false,
    homeLoading: false,
    orderLoading: false,
    verifyLoading: false,

    locked: false,
    error: null,

    clearError: () => set({ error: null }),

    resetClassroom: () =>
      set({
        product: null,
        images: [],
        plans: [],
        hasAccess: false,
        accessState: null,
        selectedPlan: null,
        classroomHome: null,
        classroom: null,
        subjects: [],
        enrollment: null,
        paymentOrder: null,
        locked: false,
        error: null,
      }),

    setSelectedPlan: (plan) => {
      set({ selectedPlan: plan });
    },

    loadDetails: async () => {
  set({
    loading: true,
    detailsLoading: true,
    error: null,
  });

  try {
    const cached = await PersonalizedClassroomDb.getDetails();

    if (cached) {
      set({
        product: cached.product ?? null,
        images: normalizeArray(cached.images),
        plans: normalizeArray(cached.plans),
        hasAccess: Boolean(cached.has_access),
        accessState: cached.access_state ?? null,
        locked: cached.access_state === "locked",
        detailsLoading: false,
      });
    }

    const res = await getPersonalizedClassroomDetails();
    const data = res.data;

    await PersonalizedClassroomDb.saveDetails(data);

    set({
      product: data?.product ?? null,
      images: normalizeArray(data?.images),
      plans: normalizeArray(data?.plans),
      hasAccess: Boolean(data?.has_access),
      accessState: data?.access_state ?? null,
      locked: data?.access_state === "locked",
    });
  } catch (err) {
    console.log("LOAD PC DETAILS ERROR:", err);

    const cached = await PersonalizedClassroomDb.getDetails();

    if (cached) {
      set({
        product: cached.product ?? null,
        images: normalizeArray(cached.images),
        plans: normalizeArray(cached.plans),
        hasAccess: Boolean(cached.has_access),
        accessState: cached.access_state ?? null,
        locked: cached.access_state === "locked",
        error: null,
      });
    } else {
      set({
        product: null,
        images: [],
        plans: [],
        hasAccess: false,
        accessState: null,
        error: getErrorMessage(err),
      });
    }
  } finally {
    set({
      loading: false,
      detailsLoading: false,
    });
  }
},

    loadHome: async () => {
  set({
    loading: true,
    homeLoading: true,
    error: null,
  });

  try {
    const cached = await PersonalizedClassroomDb.getHome();

    if (cached) {
      set({
        classroomHome: cached,
        classroom: cached?.classroom ?? null,
        subjects: normalizeArray(cached?.subjects),
        enrollment: cached?.enrollment ?? null,
        hasAccess: true,
        accessState: cached?.enrollment?.status ?? "active",
        locked: false,
        homeLoading: false,
      });
    }

    const res = await getPersonalizedClassroomHome();

    if (res.locked) {
      set({
        locked: true,
        classroomHome: null,
        classroom: null,
        subjects: [],
        enrollment: null,
        hasAccess: false,
        accessState: "locked",
        error: res.message || "Your classroom access is locked. Please renew.",
      });

      return;
    }

    const data = res.data ?? null;

    if (data) {
      await PersonalizedClassroomDb.saveHome(data);
    }

    set({
      locked: false,
      classroomHome: data,
      classroom: data?.classroom ?? null,
      subjects: normalizeArray(data?.subjects),
      enrollment: data?.enrollment ?? null,
      hasAccess: true,
      accessState: data?.enrollment?.status ?? "active",
    });
  } catch (err) {
    console.log("LOAD PC HOME ERROR:", err);

    const cached = await PersonalizedClassroomDb.getHome();

    if (cached) {
      set({
        classroomHome: cached,
        classroom: cached?.classroom ?? null,
        subjects: normalizeArray(cached?.subjects),
        enrollment: cached?.enrollment ?? null,
        hasAccess: true,
        accessState: cached?.enrollment?.status ?? "active",
        locked: false,
        error: null,
      });
    } else {
      set({
        classroomHome: null,
        classroom: null,
        subjects: [],
        enrollment: null,
        error: getErrorMessage(err),
      });
    }
  } finally {
    set({
      loading: false,
      homeLoading: false,
    });
  }
},
    createOrder: async (planID?: string) => {
      const finalPlanID = planID || get().selectedPlan?.id;

      if (!finalPlanID) {
        const message = "Please select a plan first";
        set({ error: message });
        throw new Error(message);
      }

      set({
        loading: true,
        orderLoading: true,
        error: null,
      });

      try {
        const res = await createPersonalizedClassroomOrder(finalPlanID);

        set({
          paymentOrder: res.data.payment_order,
          selectedPlan: res.data.plan,
        });

        return res.data;
      } catch (err) {
        console.log("CREATE PC ORDER ERROR:", err);
        set({ error: getErrorMessage(err) });
        throw err;
      } finally {
        set({
          loading: false,
          orderLoading: false,
        });
      }
    },

    verifyPayment: async (data) => {
      set({
        loading: true,
        verifyLoading: true,
        error: null,
      });

      try {
        const res = await verifyPersonalizedClassroomPayment(data);

        set({
          hasAccess: res.data?.status === "active",
          accessState: res.data?.status ?? "active",
          locked: false,
          paymentOrder: null,
        });

        await get().loadHome();
      } catch (err) {
        console.log("VERIFY PC PAYMENT ERROR:", err);
        set({ error: getErrorMessage(err) });
        throw err;
      } finally {
        set({
          loading: false,
          verifyLoading: false,
        });
      }
    },
  }));