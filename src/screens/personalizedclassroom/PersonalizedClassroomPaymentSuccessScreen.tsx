import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function PersonalizedClassroomPaymentSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const status = route?.params?.status || "active";
  const expiresAt = route?.params?.expires_at;
  const graceUntil = route?.params?.grace_until;

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>✓</Text>
      </View>

      <Text style={styles.title}>Classroom Activated</Text>

      <Text style={styles.subtitle}>
        Your personalized classroom access has been activated successfully.
      </Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{status}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Valid Till</Text>
          <Text style={styles.value}>{formatDate(expiresAt)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Grace Until</Text>
          <Text style={styles.value}>{formatDate(graceUntil)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace("PersonalizedClassroomHome")}
      >
        <Text style={styles.buttonText}>Go To Classroom</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.secondaryText}>Back To Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  iconBox: {
    width: 95,
    height: 95,
    borderRadius: 60,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { color: "#fff", fontSize: 52, fontWeight: "900" },
  title: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    width: "100%",
    marginTop: 28,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: { color: "#6B7280", fontSize: 14 },
  value: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  button: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "900" },
  secondaryButton: {
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  secondaryText: { color: "#111827", fontSize: 15, fontWeight: "800" },
});