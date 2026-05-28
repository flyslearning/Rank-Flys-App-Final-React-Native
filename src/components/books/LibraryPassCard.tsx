import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function LibraryPassCard({ plan, onPress }: any) {
  const badge =
    plan.duration_days >= 365
      ? "BEST VALUE"
      : plan.duration_days >= 180
      ? "POPULAR"
      : "MONTHLY";

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <LinearGradient
        colors={["#2563EB", "#1D4ED8", "#0F172A"]}
        style={styles.card}
      >
        <View style={styles.top}>
          <View style={styles.icon}>
            <Ionicons name="library" size={28} color="#2563EB" />
          </View>
          <Text style={styles.badge}>{badge}</Text>
        </View>

        <Text style={styles.title}>{plan.title}</Text>
        <Text style={styles.sub}>
          Unlock full books library for {plan.duration_days} days
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{plan.price_rupees}</Text>

          {plan.original_price_paise > plan.price_paise && (
            <Text style={styles.old}>
              ₹{Math.floor(plan.original_price_paise / 100)}
            </Text>
          )}
        </View>

        <View style={styles.button}>
          <Text style={styles.buttonText}>Buy Library Pass</Text>
          <Ionicons name="arrow-forward" size={17} color="#2563EB" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 18,
  },
  card: {
    borderRadius: 30,
    padding: 22,
    shadowColor: "#2563EB",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    color: "#DBEAFE",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    marginTop: 22,
    fontSize: 23,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  sub: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: "#BFDBFE",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  price: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  old: {
    marginLeft: 10,
    color: "#CBD5E1",
    textDecorationLine: "line-through",
    fontSize: 16,
    fontWeight: "800",
  },
  button: {
    marginTop: 22,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "900",
    marginRight: 8,
  },
});