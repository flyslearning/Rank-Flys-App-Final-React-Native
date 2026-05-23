import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BLUE = "#2563EB";
const BLUE_DARK = "#1D4ED8";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_SOFT = "#DBEAFE";
const BG = "#F8FAFC";
const DARK = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

export default function ExploreScholarshipScreen({ navigation }: any) {
  const fade = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(move, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>SCHOLARSHIP</Text>
            <Text style={styles.headerTitle}>Explore Scholarships</Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="school-outline" size={24} color={BLUE} />
          </View>
        </View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fade,
              transform: [{ translateY: move }, { scale }],
            },
          ]}
        >
          <View style={styles.decorCircleOne} />
          <View style={styles.decorCircleTwo} />

          <View style={styles.iconBox}>
            <Ionicons name="sparkles-outline" size={42} color={BLUE} />
          </View>

          <Text style={styles.title}>No Scholarship Available</Text>

          <Text style={styles.subtitle}>
            Scholarship programs are not available right now. We will update you
            soon with new opportunities.
          </Text>

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <Ionicons name="notifications-outline" size={18} color={BLUE} />
            </View>
            <Text style={styles.infoText}>Stay tuned for upcoming updates.</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryText}>Back to Scholarships</Text>
            <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 14 : 8,
    paddingBottom: 28,
  },

  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    color: BLUE,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },
  headerTitle: {
    color: DARK,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: BLUE_LIGHT,
    borderWidth: 1,
    borderColor: BLUE_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: BLUE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    overflow: "hidden",
  },
  decorCircleOne: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(37,99,235,0.07)",
    right: -70,
    top: -65,
  },
  decorCircleTwo: {
    position: "absolute",
    width: 135,
    height: 135,
    borderRadius: 68,
    backgroundColor: "rgba(37,99,235,0.05)",
    left: -45,
    bottom: -45,
  },
  iconBox: {
    width: 104,
    height: 104,
    borderRadius: 36,
    backgroundColor: BLUE_LIGHT,
    borderWidth: 1,
    borderColor: BLUE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
  },
  infoBox: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BLUE_LIGHT,
    borderWidth: 1,
    borderColor: BLUE_SOFT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: BLUE_DARK,
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
  },
  primaryButton: {
    marginTop: 30,
    height: 58,
    borderRadius: 22,
    backgroundColor: BLUE,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    width: "100%",
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.88,
  },
});