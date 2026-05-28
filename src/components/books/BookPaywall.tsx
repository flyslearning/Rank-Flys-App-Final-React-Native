import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function BookPaywall({
  onBuyBook,
  onBuyPass,
  price,
}: any) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={["#FFFFFF", "#EFF6FF"]}
        style={styles.card}
      >
        <View style={styles.lock}>
          <Ionicons name="lock-closed" size={34} color="#2563EB" />
        </View>

        <Text style={styles.title}>Unlock Full Book</Text>
        <Text style={styles.sub}>
          Continue reading by buying this book or getting library pass.
        </Text>

        <Pressable style={styles.buyBtn} onPress={onBuyBook}>
          <Text style={styles.buyText}>Buy Now ₹{price || 0}</Text>
        </Pressable>

        <Pressable style={styles.passBtn} onPress={onBuyPass}>
          <Text style={styles.passText}>Get Library Pass</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 20,
  },
  card: {
    borderRadius: 30,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  lock: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  sub: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: "#64748B",
  },
  buyBtn: {
    marginTop: 22,
    width: "100%",
    height: 52,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  buyText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  passBtn: {
    marginTop: 12,
    width: "100%",
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  passText: {
    color: "#2563EB",
    fontWeight: "900",
    fontSize: 15,
  },
});