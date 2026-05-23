import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  StatusBar,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { startMentorshipPayment } from "../../utils/payment";
import { mentorshipApi } from "../../api/mentorship.api";
import { useAuthStore } from "../../store/auth.store";

const PURPLE = "#7C3AED";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const DARK = "#0F172A";
const MUTED = "#64748B";
const GREEN = "#16A34A";
const BORDER = "#E2E8F0";
const ORANGE = "#F97316";

const rupees = (paise: number) => `₹${Math.round(Number(paise || 0) / 100)}`;

export default function BookingReviewScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { selectedPlan, selectedDate, selectedSlot } = route.params || {};

  const [studentNote, setStudentNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const user: any = useAuthStore((state: any) => state.user);

  const successScale = useRef(new Animated.Value(0.4)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const payablePaise = Number(selectedPlan?.price_paise || 0);

  const formatTime = (time?: string) => {
    if (!time) return "-";

    const [h, m] = time.split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m), 0);

    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBackendError = (error: any) => {
    return (
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.description ||
      error?.error?.description ||
      error?.message ||
      "Payment cancelled or failed."
    );
  };

  const showSuccessAnimation = () => {
    setSuccessVisible(true);

    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setSuccessVisible(false);
      navigation.replace("BookingSuccess", {
        selectedPlan,
        selectedDate,
        selectedSlot,
      });
    }, 1300);
  };

 const handlePayNow = async () => {
  if (payLoading) return;

  if (!selectedPlan?.id || !selectedDate || !selectedSlot?.start_time) {
    Alert.alert("Error", "Booking details missing.");
    return;
  }

  setPayLoading(true);

  await startMentorshipPayment({
  navigation,
  planId: selectedPlan.id,
  bookingDate: selectedDate,
  startTime: selectedSlot.start_time,
  title: selectedPlan.title,
  studentNote,
  onSlotUnavailable: () => {
    navigation.goBack();
  },
});

  setPayLoading(false);
};

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.headerTitle}>Booking Review</Text>
            <Text style={styles.headerSub}>Secure mentorship payment</Text>
          </View>

          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={20} color={GREEN} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 145 + insets.bottom },
          ]}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="people-outline" size={48} color={PURPLE} />
            </View>

            <View style={styles.heroTextBox}>
              <Text style={styles.heroTag}>EXPERT GUIDANCE</Text>

              <Text style={styles.heroTitle}>
                {selectedPlan?.title || "Mentorship Session"}
              </Text>

              <Text style={styles.heroDesc}>
                {selectedPlan?.description ||
                  "Personal mentorship session for doubts and guidance."}
              </Text>
            </View>

            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>{rupees(payablePaise)}</Text>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Session Details</Text>
                <Text style={styles.sectionSub}>Please check before payment</Text>
              </View>

              <View style={styles.summaryIcon}>
                <Ionicons name="calendar-outline" size={22} color={PURPLE} />
              </View>
            </View>

            <InfoRow label="Plan" value={selectedPlan?.title || "-"} />
            <InfoRow
              label="Duration"
              value={`${selectedPlan?.duration_minutes || 0} min`}
            />
            <InfoRow label="Date" value={selectedDate || "-"} />
            <InfoRow
              label="Time"
              value={`${formatTime(selectedSlot?.start_time)} - ${formatTime(
                selectedSlot?.end_time
              )}`}
            />
          </View>

          <View style={styles.noteCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Your Doubt</Text>
                <Text style={styles.sectionSub}>Optional note for mentor</Text>
              </View>

              <View style={styles.noteIcon}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={22}
                  color={ORANGE}
                />
              </View>
            </View>

            <TextInput
              value={studentNote}
              onChangeText={setStudentNote}
              placeholder="Example: Physics numericals doubt"
              placeholderTextColor="#94A3B8"
              multiline
              style={styles.noteInput}
            />
          </View>

          <View style={styles.priceCard}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Payment Summary</Text>
                <Text style={styles.sectionSub}>Final amount calculated securely</Text>
              </View>

              <View style={styles.receiptIcon}>
                <Ionicons name="receipt-outline" size={22} color={PURPLE} />
              </View>
            </View>

            <PriceRow label="Session Price" value={rupees(payablePaise)} />

            <View style={styles.divider} />

            <View style={styles.totalBox}>
              <View>
                <Text style={styles.totalLabel}>Final Payable</Text>
                <Text style={styles.totalSub}>Inclusive of all charges</Text>
              </View>

              <Text style={styles.totalValue}>{rupees(payablePaise)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>Payable Amount</Text>
            <Text style={styles.bottomPrice}>{rupees(payablePaise)}</Text>
          </View>

          <Pressable
            style={[styles.payBtn, payLoading && styles.disabledBtn]}
            onPress={handlePayNow}
            disabled={payLoading}
          >
            {payLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.payText}>Pay Now</Text>
                <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.successBackdrop}>
          <Animated.View
            style={[
              styles.successBox,
              {
                opacity: successOpacity,
                transform: [{ scale: successScale }],
              },
            ]}
          >
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={58} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Booking Successful!</Text>
            <Text style={styles.successText}>
              Your mentorship session has been booked.
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: { fontSize: 19, fontWeight: "900", color: DARK },
  headerSub: {
    marginTop: 1,
    fontSize: 11,
    color: MUTED,
    fontWeight: "700",
  },
  secureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  content: { paddingHorizontal: 16, paddingTop: 6 },
  heroCard: {
    backgroundColor: "#F5F3FF",
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    overflow: "hidden",
  },
  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTextBox: { paddingRight: 70 },
  heroTag: {
    fontSize: 11,
    fontWeight: "900",
    color: PURPLE,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "900",
    color: DARK,
  },
  heroDesc: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: MUTED,
  },
  priceBadge: {
    position: "absolute",
    right: 16,
    top: 18,
    backgroundColor: PURPLE,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  priceBadgeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  detailsCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 14,
  },
  noteCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 14,
  },
  priceCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 17, fontWeight: "900", color: DARK },
  sectionSub: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
    fontWeight: "600",
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  noteIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoLabel: { fontSize: 12, fontWeight: "800", color: MUTED },
  infoValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900",
    color: DARK,
  },
  noteInput: {
    minHeight: 112,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    textAlignVertical: "top",
    fontSize: 14,
    fontWeight: "700",
    color: DARK,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  priceLabel: { color: MUTED, fontSize: 14, fontWeight: "700" },
  priceValue: { color: DARK, fontSize: 14, fontWeight: "900" },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 7 },
  totalBox: {
    marginTop: 10,
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { color: DARK, fontSize: 16, fontWeight: "900" },
  totalSub: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  totalValue: { color: PURPLE, fontSize: 24, fontWeight: "900" },
  bottomBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 14,
  },
  bottomLabel: { color: MUTED, fontSize: 12, fontWeight: "800" },
  bottomPrice: { color: DARK, fontSize: 23, fontWeight: "900" },
  payBtn: {
    backgroundColor: PURPLE,
    paddingHorizontal: 22,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    minWidth: 135,
  },
  disabledBtn: { backgroundColor: "#94A3B8" },
  payText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  successBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 28,
    alignItems: "center",
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
  },
  successText: {
    marginTop: 7,
    fontSize: 14,
    color: MUTED,
    fontWeight: "700",
    textAlign: "center",
  },
});