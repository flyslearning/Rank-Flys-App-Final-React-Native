import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import LottieView from "lottie-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../../types";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import CustomAlert from "../extrascreens/CustomAlert";
import { AuthAPI } from "../../api/auth.api";
import { recordError } from "../../utils/crashlytics";

type Props = NativeStackScreenProps<RootStackParamList, "SendOtp">;

const getOtpErrorMessage = (error: any) => {
  const backendError =
    error?.response?.data?.error || error?.message || "";

  if (backendError === "invalid email") {
    return "Please enter a valid email address.";
  }

  if (backendError === "please wait 30 seconds before requesting another OTP") {
    return "You can request a new OTP after 30 seconds.";
  }

  if (backendError === "maximum 5 OTP emails allowed in 15 minutes") {
    return "You have reached the maximum OTP limit. Please try again after 15 minutes.";
  }

  if (backendError === "email service timeout, please try again") {
    return "Email service is currently busy. Please try again.";
  }

  if (backendError === "failed to send email") {
    return "Unable to send OTP right now. Please try again.";
  }

  if (error?.message === "Network Error") {
    return "No internet connection. Please check your network and try again.";
  }

  if (error?.message === "OTP request timeout") {
  return "OTP request timeout ho gaya. Internet slow hai, please retry karo.";
  }

  return "Something went wrong. Please try again.";
};
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("OTP request timeout")), ms)
    ),
  ]);
};

export default function SendOtpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const insets = useSafeAreaInsets();

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const sendOtp = async () => {
    if (loading) return;
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      await withTimeout(AuthAPI.sendOtp(cleanEmail), 20000);

      navigation.navigate("VerifyOtp", { email: cleanEmail });
    } catch (error: any) {
      const message = getOtpErrorMessage(error);

      recordError(error, "SendOtpScreen: send OTP failed");

      showAlert("OTP Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.topCircle} />
          <View style={styles.bottomCircle} />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inner}>
                <View style={styles.topSection}>
                  <LottieView
                    source={require("../../assets/animations/email.json")}
                    autoPlay
                    loop
                    style={styles.lottie}
                  />

                  <Text style={styles.welcome}>Welcome To</Text>
                  <Text style={styles.brand}>Rank Flys</Text>
                </View>

                <View
                  style={[
                    styles.bottomSection,
                    { marginBottom: insets.bottom + 20 },
                  ]}
                >
                  <AppInput
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <AppButton
                    title="Continue"
                    onPress={sendOtp}
                    loading={loading}
                    disabled={!email || loading}
                  />

                  <Text style={styles.footer}>
                    Secure login • No password required
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>

      <CustomAlert
        visible={alertVisible}
        type="info"
        title={alertTitle}
        message={alertMessage}
        confirmText="Got it"
        onClose={() => setAlertVisible(false)}
        onConfirm={() => setAlertVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  inner: {
    flex: 1,
    justifyContent: "space-between",
  },

  topCircle: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 140,
    backgroundColor: "#eef2ff",
  },

  bottomCircle: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#eef2ff",
  },

  topSection: {
    alignItems: "center",
    marginTop: 60,
  },

  lottie: {
    width: 340,
    height: 200,
  },

  welcome: {
    fontSize: 22,
    fontFamily: "Bungee",
    color: "#0f172a",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  brand: {
    fontSize: 47,
    fontFamily: "TitanOne",
    color: "#0f172a",
    letterSpacing: 2,
    marginTop: 4,
    textTransform: "uppercase",
  },

  bottomSection: {
    paddingHorizontal: 24,
    marginTop: 20,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Geologica",
    color: "#9ca3af",
    marginTop: 15,
  },
});