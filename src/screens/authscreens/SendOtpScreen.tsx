import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
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
import { AuthAPI } from "../../api/auth.api";

type Props = NativeStackScreenProps<RootStackParamList, "SendOtp">;

export default function SendOtpScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const sendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      Alert.alert("Enter valid email");
      return;
    }

    try {
      setLoading(true);
      await AuthAPI.sendOtp(cleanEmail);
      navigation.navigate("VerifyOtp", { email: cleanEmail });
    } catch {
      Alert.alert("OTP Failed", "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Background Decorative Circles */}
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
              
              {/* TOP SECTION: Stays at the top */}
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

              {/* BOTTOM SECTION: Pushed to bottom via flex-end */}
              <View style={[
                styles.bottomSection, 
                { marginBottom: insets.bottom + 20 }
              ]}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  inner: {
    flex: 1,
    justifyContent: "space-between", // This pushes topSection to top and bottomSection to bottom
  },
  /* Background */
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
  /* TOP */
  topSection: {
    alignItems: "center",
    marginTop: 60, // Gives some breathing room from the status bar
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
  /* BOTTOM */
  bottomSection: {
    paddingHorizontal: 24,
    marginTop: 20, // Ensures it doesn't touch the top section on small screens
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Geologica",
    color: "#9ca3af",
    marginTop: 15,
  },
});