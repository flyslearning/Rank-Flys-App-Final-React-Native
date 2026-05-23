import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Animated,
  Easing,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import LottieView from "lottie-react-native";

type Props = {
  updateUrl: string;
};

export default function ForceUpdateScreen({ updateUrl }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleUpdate = async () => {
    try {
      const supported = await Linking.canOpenURL(updateUrl);

      if (supported) {
        await Linking.openURL(updateUrl);
      } else {
        Alert.alert(
          "Unable to open update link",
          "Please update the app manually from the Play Store or App Store."
        );
      }
    } catch {
      Alert.alert(
        "Something went wrong",
        "Please clear app data and try again."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f4f8ff"
      />

      <View style={styles.container}>
        <View style={styles.bgCircleTop} />
        <View style={styles.bgCircleBottom} />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.lottieContainer}>
            <LottieView
              source={require("../../assets/animations/update.json")}
              autoPlay
              loop
              resizeMode="contain"
              renderMode="SOFTWARE"
              hardwareAccelerationAndroid={false}
              style={styles.lottie}
            />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>COMPULSORY UPDATE</Text>
          </View>

          <Text style={styles.title}>Update Required</Text>

          <Text style={styles.description}>
            A new mandatory update is available. Please update the app to continue using all features securely and smoothly.
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.button}
            onPress={handleUpdate}
          >
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>
              Still facing issues?
            </Text>

            <Text style={styles.infoText}>
              Clear app data, restart the app, and try again after updating.
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f8ff",
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
    backgroundColor: "#f4f8ff",
    overflow: "hidden",
  },

  bgCircleTop: {
    position: "absolute",
    top: -120,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#dbeafe",
    opacity: 0.5,
  },

  bgCircleBottom: {
    position: "absolute",
    bottom: -130,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#c7d2fe",
    opacity: 0.4,
  },

  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",

    // very soft stable shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,

    elevation: 2,
  },

  lottieContainer: {
    width: 190,
    height: 190,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    backgroundColor: "transparent",
  },

  lottie: {
    width: 180,
    height: 180,
    backgroundColor: "transparent",
  },

  badge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    marginBottom: 14,
  },

  badgeText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    color: "#64748b",
    marginBottom: 28,
  },

  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 17,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",

    // removed problematic shadows
    elevation: 0,

    ...(Platform.OS === "ios"
      ? {
          shadowOpacity: 0,
        }
      : {}),
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  infoBox: {
    width: "100%",
    marginTop: 22,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    color: "#64748b",
  },
});