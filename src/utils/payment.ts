import { Alert } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { PaymentAPI, ContentType } from "../api/payment.api";
import { mentorshipApi } from "../api/mentorship.api";

export const startPayment = async (params: {
  contentId: string;
  contentType: ContentType;
  title: string;
  onSuccess: () => void;
}) => {
  try {
    const order = await PaymentAPI.createOrder({
      content_id: params.contentId,
      content_type: params.contentType,
    });

    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "Your App Name",
      description: params.title,
      order_id: order.provider_order_id,
      theme: {
        color: "#2563eb",
      },
    };

    const result: any = await RazorpayCheckout.open(options);

    await PaymentAPI.verify({
      provider_order_id: result.razorpay_order_id,
      provider_payment_id: result.razorpay_payment_id,
      signature: result.razorpay_signature,
    });

    Alert.alert("Success", "Payment successful");
    params.onSuccess();
  } catch (error: any) {
    console.log("Payment error:", error?.response?.data || error?.message || error);
    Alert.alert("Payment Failed", "Payment cancel ya fail ho gaya");
  }
};
export const startMentorshipPayment = async (params: {
  planId: string;
  bookingDate: string;
  startTime: string;
  title: string;
  studentNote?: string;
  onSuccess: (data?: any) => void;
  onSlotUnavailable?: () => void;
}) => {
  try {
    const body = {
      plan_id: params.planId,
      booking_date: params.bookingDate,
      start_time: params.startTime,
      student_note: params.studentNote?.trim() || "",
    };

    console.log("CREATE BOOKING BODY", body);

    const orderData = await mentorshipApi.createBookingOrder(body);

    console.log("CREATE ORDER RESPONSE", JSON.stringify(orderData, null, 2));

    const bookingId = orderData?.booking?.id;
    const paymentOrder = orderData?.payment_order;

    const keyId =
      paymentOrder?.key_id ||
      paymentOrder?.razorpay_key_id ||
      paymentOrder?.provider_key_id;

    const providerOrderId =
      paymentOrder?.provider_order_id ||
      paymentOrder?.razorpay_order_id;

    const amount = Number(
      paymentOrder?.amount_paise ||
        paymentOrder?.amount ||
        0
    );

    if (!bookingId) {
      Alert.alert("Error", "Booking ID backend se nahi mila.");
      return;
    }

    if (!keyId) {
      Alert.alert("Error", "Razorpay key_id backend se nahi mila.");
      return;
    }

    if (!providerOrderId || !String(providerOrderId).startsWith("order_")) {
      Alert.alert("Error", "Valid Razorpay order id backend se nahi mila.");
      return;
    }

    if (!amount || amount <= 0) {
      Alert.alert("Error", "Payment amount invalid hai.");
      return;
    }

    const options = {
      key: String(keyId),
      amount: Number(amount),
      currency: "INR",
      name: "Rank Flys",
      description: params.title || "Mentorship Session",
      order_id: String(providerOrderId),
      retry: {
        enabled: false,
      },
      send_sms_hash: true,
      theme: {
        color: "#7C3AED",
      },
    };

    console.log("RAZORPAY OPTIONS", JSON.stringify(options, null, 2));

    const result: any = await RazorpayCheckout.open(options);

    console.log("RAZORPAY SUCCESS RESULT", result);

    const razorpayOrderId = result?.razorpay_order_id || providerOrderId;
    const razorpayPaymentId = result?.razorpay_payment_id;
    const razorpaySignature = result?.razorpay_signature;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      Alert.alert(
        "Payment Status Pending",
        "Payment complete hua ho sakta hai. Please My Bookings me check karo."
      );
      return;
    }

    const verifyResponse = await mentorshipApi.verifyBookingPayment({
      booking_id: bookingId,
      provider_order_id: razorpayOrderId,
      provider_payment_id: razorpayPaymentId,
      provider_signature: razorpaySignature,
      meeting_link: "",
    });

    Alert.alert("Success", "Mentorship booked successfully");

    params.onSuccess({
      bookingId,
      payment: result,
      booking: verifyResponse,
    });
  } catch (error: any) {
    console.log(
      "Mentorship payment error:",
      error?.response?.data || error?.description || error?.message || error
    );

    const backendError =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.description ||
      error?.message ||
      "Payment failed";

    const normalizedError = String(backendError).toLowerCase();

    if (
      normalizedError.includes("slot not available") ||
      normalizedError.includes("availability")
    ) {
      Alert.alert(
        "Slot Not Available",
        "Ye slot ab available nahi hai. Please dusra slot select karo."
      );

      params.onSlotUnavailable?.();
      return;
    }

    if (normalizedError.includes("post payment parsing error")) {
      Alert.alert(
        "Payment Status Pending",
        "Payment complete hua ho sakta hai. Please My Bookings me check karo."
      );
      return;
    }

    if (
      normalizedError.includes("payment cancelled") ||
      normalizedError.includes("cancelled")
    ) {
      Alert.alert("Payment Cancelled", "Payment cancel ho gaya.");
      return;
    }

    Alert.alert("Payment Failed", "Payment failed. Please try again.");
  }
};