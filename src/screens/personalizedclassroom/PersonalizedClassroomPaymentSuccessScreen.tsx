import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successCircle}>
          <View style={styles.innerCircle}>
            <Ionicons name="checkmark" size={58} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>Classroom Activated</Text>

        <Text style={styles.subtitle}>
          Your personalized classroom access has been activated successfully.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Activation Summary</Text>
              <Text style={styles.cardSub}>Your plan is now ready to use</Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{status}</Text>
            </View>
          </View>

          <InfoRow
            icon="shield-checkmark"
            label="Status"
            value={status}
          />

          <InfoRow
            icon="calendar"
            label="Valid Till"
            value={formatDate(expiresAt)}
          />

          <InfoRow
            icon="time"
            label="Grace Until"
            value={formatDate(graceUntil)}
            last
          />
        </View>

        <View style={styles.messageBox}>
          <Ionicons name="sparkles" size={20} color="#2563EB" />
          <Text style={styles.messageText}>
            Start learning with live classes, assignments, tests and reports.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.button}
          onPress={() => navigation.replace("PersonalizedClassroomHome")}
        >
          <Text style={styles.buttonText}>Go To Classroom</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.secondaryText}>Back To Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: any;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <View style={styles.rowLeft}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={18} color="#2563EB" />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 30,
    justifyContent: "center",
  },

  successCircle: {
    alignSelf: "center",
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  title: {
    marginTop: 26,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: 6,
  },

  card: {
    width: "100%",
    marginTop: 30,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardSub: {
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
  },
  badgeText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  label: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  value: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize",
    maxWidth: "45%",
    textAlign: "right",
  },

  messageBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
  },
  messageText: {
    flex: 1,
    marginLeft: 10,
    color: "#1E3A8A",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "800",
  },

  button: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
    flexDirection: "row",
    shadowColor: "#2563EB",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginRight: 8,
  },

  secondaryButton: {
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  secondaryText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
});