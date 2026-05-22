import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BookingSuccessScreen({ navigation, route }: any) {
  const { selectedPlan, selectedDate, selectedSlot } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
      </View>

      <Text style={styles.title}>Booking Successful</Text>
      <Text style={styles.subtitle}>
        Your mentorship session has been booked successfully.
      </Text>

      <View style={styles.card}>
        <Text style={styles.plan}>{selectedPlan.title}</Text>
        <Text style={styles.detail}>Date: {selectedDate}</Text>
        <Text style={styles.detail}>
          Time: {selectedSlot.start_time} - {selectedSlot.end_time}
        </Text>
        <Text style={styles.status}>Status: Booked</Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => navigation.replace("MyBookings")}
      >
        <Text style={styles.buttonText}>View My Bookings</Text>
      </Pressable>

      <Pressable
        style={styles.homeButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.homeButtonText}>Go Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 20,
    justifyContent: "center",
  },
  iconBox: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#64748B",
  },
  card: {
    marginTop: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  plan: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },
  detail: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "900",
    color: "#16A34A",
  },
  button: {
    marginTop: 26,
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  homeButton: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  homeButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
});