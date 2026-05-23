import React, { useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { mentorshipApi } from "../api/mentorship.api";

export default function RazorpayWebViewScreen({ route, navigation }: any) {
  const { bookingId, keyId, amount, providerOrderId, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [handled, setHandled] = useState(false);

  const html = useMemo(
    () => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: #ffffff;
            }
          </style>
        </head>

        <body>
          <script>
            function sendMessage(payload) {
              window.ReactNativeWebView.postMessage(JSON.stringify(payload));
            }

            var options = {
              key: "${keyId}",
              amount: ${amount},
              currency: "INR",
              name: "Rank Flys",
              description: "${title || "Mentorship Session"}",
              order_id: "${providerOrderId}",
              handler: function (response) {
                sendMessage({
                  type: "success",
                  data: response
                });
              },
              modal: {
                ondismiss: function () {
                  sendMessage({
                    type: "cancel"
                  });
                }
              },
              theme: {
                color: "#7C3AED"
              }
            };

            try {
              var rzp = new Razorpay(options);
              rzp.open();
            } catch (error) {
              sendMessage({
                type: "error",
                message: error?.message || "Unable to open payment"
              });
            }
          </script>
        </body>
      </html>
    `,
    [keyId, amount, providerOrderId, title]
  );

  const goToMyBookings = (paymentPending = false) => {
    navigation.replace("MyBookings", {
      paymentPending,
    });
  };

  const onMessage = async (event: any) => {
    if (handled) return;

    let msg: any;

    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      Alert.alert("Payment Failed", "Something went wrong.");
      navigation.goBack();
      return;
    }

    if (msg.type === "cancel") {
      setHandled(true);
      Alert.alert("Payment Cancelled", "Payment cancel ho gaya.");
      navigation.goBack();
      return;
    }

    if (msg.type === "error") {
      setHandled(true);
      Alert.alert("Payment Failed", "Payment start nahi ho paya.");
      navigation.goBack();
      return;
    }

    if (msg.type === "success") {
      setHandled(true);

      const res = msg.data;

      try {
        await mentorshipApi.verifyBookingPayment({
          booking_id: bookingId,
          provider_order_id: res.razorpay_order_id,
          provider_payment_id: res.razorpay_payment_id,
          provider_signature: res.razorpay_signature,
          meeting_link: "",
        });

        Alert.alert("Payment Successful", "Your mentorship session is booked.");
        goToMyBookings(false);
      } catch (e) {
        console.log("Verify failed, webhook will handle:", e);

        Alert.alert(
          "Payment Processing",
          "Payment successful hai. Booking thodi der mein update ho jayegi."
        );

        goToMyBookings(true);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#7C3AED" />
          </View>
        )}

        <WebView
          source={{ html }}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          startInLoadingState
          onLoadEnd={() => setLoading(false)}
          style={styles.webView}
          containerStyle={styles.webViewContainer}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
          scalesPageToFit={false}
          bounces={false}
          overScrollMode="never"
          mixedContentMode="always"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingBottom: Platform.OS === "android" ? 8 : 0,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
});