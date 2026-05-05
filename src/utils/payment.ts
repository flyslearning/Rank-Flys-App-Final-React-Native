import { Alert } from "react-native";
import RazorpayCheckout from "react-native-razorpay";
import { PaymentAPI, ContentType } from "../api/payment.api";

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