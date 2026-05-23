import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  StatusBar,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#7C3AED";
const GREEN = "#22C55E";
const DARK = "#0F172A";
const MUTED = "#64748B";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const BORDER = "#E2E8F0";

export default function BookingSuccessScreen({ navigation, route }: any) {
  const { selectedPlan, selectedDate, selectedSlot } = route.params || {};

  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(35)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const [year, month, day] = String(date).split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(12, 0, 0, 0);

    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return "-";

    const [h, m] = String(time).split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m), 0, 0);

    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <Animated.View
        style={[
          styles.bgCircleOne,
          {
            transform: [{ rotate }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.bgCircleTwo,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.successGlow,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.iconBox,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={86} color={GREEN} />
          </Animated.View>
        </Animated.View>

        <Text style={styles.badge}>PAYMENT CONFIRMED</Text>

        <Text style={styles.title}>Booking Successful</Text>

        <Text style={styles.subtitle}>
          Your mentorship session has been booked successfully. Meeting link will
          be shared soon.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Ionicons name="people-outline" size={22} color={PURPLE} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTag}>MENTORSHIP SESSION</Text>
              <Text style={styles.plan}>
                {selectedPlan?.title || "Mentorship Session"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={17} color={PURPLE} />
            </View>

            <View>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(selectedDate)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={17} color={PURPLE} />
            </View>

            <View>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {formatTime(selectedSlot?.start_time)} -{" "}
                {formatTime(selectedSlot?.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.successStatus}>
            <Ionicons name="shield-checkmark-outline" size={17} color={GREEN} />
            <Text style={styles.status}>Status: Booked</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
          onPress={() => navigation.replace("MyBookings")}
        >
          <Ionicons name="calendar-outline" size={19} color="#FFFFFF" />
          <Text style={styles.buttonText}>View My Bookings</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.homeButton,
            pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
          ]}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={18} color={DARK} />
          <Text style={styles.homeButtonText}>Go Home</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    padding: 20,
    justifyContent: "center",
    overflow: "hidden",
  },
  bgCircleOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#EDE9FE",
    top: -90,
    right: -100,
    opacity: 0.9,
  },
  bgCircleTwo: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#DCFCE7",
    bottom: -70,
    left: -80,
    opacity: 0.8,
  },
  content: {
    width: "100%",
  },
  successGlow: {
    alignSelf: "center",
    width: 138,
    height: 138,
    borderRadius: 69,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  iconBox: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    shadowColor: GREEN,
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  badge: {
    alignSelf: "center",
    backgroundColor: "#ECFDF5",
    color: GREEN,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  title: {
    textAlign: "center",
    fontSize: 31,
    fontWeight: "900",
    color: DARK,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: MUTED,
    paddingHorizontal: 10,
  },
  card: {
    marginTop: 28,
    backgroundColor: CARD,
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    shadowColor: "rgba(15,23,42,0.18)",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  cardTag: {
    fontSize: 10,
    fontWeight: "900",
    color: PURPLE,
    letterSpacing: 1,
    marginBottom: 4,
  },
  plan: {
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },
  detailValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "900",
    color: DARK,
  },
  successStatus: {
    marginTop: 2,
    backgroundColor: "#ECFDF5",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  status: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "900",
    color: GREEN,
  },
  button: {
    marginTop: 26,
    height: 56,
    backgroundColor: PURPLE,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: PURPLE,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  homeButton: {
    marginTop: 12,
    height: 54,
    backgroundColor: CARD,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    gap: 8,
  },
  homeButtonText: {
    color: DARK,
    fontSize: 15,
    fontWeight: "900",
  },
});