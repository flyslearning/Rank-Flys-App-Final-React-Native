import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import LottieView from "lottie-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../../types";
import AppButton from "../../components/AppButton";
import { AuthAPI } from "../../api/auth.api";
import { useAuthStore } from "../../store/auth.store";

type Props = NativeStackScreenProps<RootStackParamList, "VerifyOtp">;

export default function VerifyOtpScreen({ route, navigation }: Props) {
  const email = route?.params?.email || "";
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const setTokens = useAuthStore((s) => s.setTokens);

  const handleChange = (text: string, index: number) => {
    if (!/^[0-9]?$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleBackspace = (index: number) => {
    if (otp[index] === "" && index > 0) inputs.current[index - 1]?.focus();
  };

  const verifyOtp = async () => {
    const finalOtp = otp.join("");
    if (finalOtp.length < 6) {
      Alert.alert("Invalid OTP", "Enter complete 6 digit OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await AuthAPI.verifyOtp(email, finalOtp);

      const accessToken = res.data?.access_token || res.data?.accessToken;
      const refreshToken = res.data?.refresh_token || res.data?.refreshToken;

      if (!accessToken || !refreshToken) {
        Alert.alert("Verification Failed", "Token not received from server");
        return;
      }

      await setTokens(accessToken, refreshToken);

      navigation.replace(
        res.data?.next === "onboarding" ? "Onboarding" : "Home"
      );
    } catch (error) {
      Alert.alert("Verification Failed", "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    try {
      setResending(true);
      await AuthAPI.sendOtp(email);
    } catch (error) {
      Alert.alert("Failed", "Unable to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.topCircle} />
        <View style={styles.bottomCircle} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
            <View style={styles.inner}>

              {/* TOP SPACER: Pushes branding down */}
              <View style={{ height: insets.top + 50 }} />

              <View style={styles.topSection}>
                <LottieView
                  source={require("../../assets/animations/otp.json")}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
                <Text style={styles.title}>Verify OTP</Text>
                <Text style={styles.subtitle}>Code sent to</Text>
                <Text style={styles.email}>{email}</Text>
              </View>

              {/* MIDDLE AREA: Larger gap between top and inputs */}
              <View style={styles.middleSection}>
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputs.current[index] = ref)}
                      style={[styles.otpBox, digit && styles.otpFilled]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={digit}
                      onChangeText={(text) => handleChange(text, index)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === "Backspace") handleBackspace(index);
                      }}
                    />
                  ))}
                </View>
              </View>

              <View style={{ flex: 1 }} />

              <View style={[styles.bottomSection, { marginBottom: insets.bottom + 20 }]}>
                <AppButton
                  title="Verify & Continue"
                  onPress={verifyOtp}
                  loading={loading}
                  disabled={otp.join("").length < 6 || loading}
                />
                <TouchableOpacity onPress={resendOtp} disabled={resending}>
                  <Text style={styles.resend}>Resend OTP</Text>
                </TouchableOpacity>
                <Text style={styles.footer}>Secure login • Fast verification</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  inner: { flex: 1 },
  topCircle: { position: "absolute", top: -60, right: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: "#e0e7ff" },
  bottomCircle: { position: "absolute", bottom: -80, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: "#eef2ff" },
  topSection: { alignItems: "center" },
  lottie: { width: 200, height: 160 },
  title: { fontSize: 37, fontFamily: "Bungee", color: "#0f172a" },
  subtitle: { fontSize: 14, fontFamily: "Geologica", color: "#6b7280", marginTop: 8 },
  email: { fontSize: 14, fontWeight: "700", color: "#2563eb", fontFamily: "Geologica" },
  middleSection: { marginVertical: 30 },
  otpContainer: { flexDirection: "row", justifyContent: "space-evenly", paddingHorizontal: 20 },
  otpBox: { width: 46, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: "#e2e8f0", textAlign: "center", fontSize: 22, fontWeight: "800", color: "#111827", backgroundColor: "#f8fafc" },
  otpFilled: { borderColor: "#2563eb", backgroundColor: "#eef2ff" },
  bottomSection: { paddingHorizontal: 24, gap: 12 },
  resend: { textAlign: "center", fontFamily: "Geologica", color: "#2563eb", fontWeight: "700", paddingVertical: 5 },
  footer: { textAlign: "center", fontFamily: "Geologica", fontSize: 12, color: "#9ca3af" },
});