import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Linking,
  Animated,
  Alert,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  mentorshipApi,
  MyMentorshipBooking,
} from "../../api/mentorship.api";
import { startMentorshipPayment } from "../../utils/payment";

const PURPLE = "#7C3AED";
const DARK = "#0F172A";
const MUTED = "#64748B";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const BORDER = "#E2E8F0";
const GREEN = "#16A34A";
const ORANGE = "#F97316";
const RED = "#DC2626";

export default function MyBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<MyMentorshipBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const runAnimation = () => {
    fadeAnim.setValue(0.96);
    slideAnim.setValue(8);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadBookings = async () => {
    try {
      const data = await mentorshipApi.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
      runAnimation();
    } catch (error) {
      console.log("MY BOOKINGS ERROR", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadBookings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const openMeeting = async (link?: string) => {
    if (!link) return;

    try {
      await Linking.openURL(link);
    } catch {
      Alert.alert("Link Error", "Meeting link open nahi ho paaya.");
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return "-";

    const [h, m] = time.split(":");
    const d = new Date();
    d.setHours(Number(h), Number(m), 0, 0);

    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(12, 0, 0, 0);

    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status?: string) => {
    const s = String(status || "").toLowerCase();

    if (s === "hold") {
      return {
        bg: "#FFF7ED",
        border: "#FED7AA",
        color: ORANGE,
        icon: "hourglass-outline" as const,
        label: "Payment Pending",
      };
    }

    if (s === "booked" || s === "confirmed" || s === "paid") {
      return {
        bg: "#ECFDF5",
        border: "#BBF7D0",
        color: GREEN,
        icon: "checkmark-circle-outline" as const,
        label: "Booked",
      };
    }

    if (s === "expired") {
      return {
        bg: "#FEF2F2",
        border: "#FECACA",
        color: RED,
        icon: "time-outline" as const,
        label: "Expired",
      };
    }

    if (s === "cancelled") {
      return {
        bg: "#FEF2F2",
        border: "#FECACA",
        color: RED,
        icon: "close-circle-outline" as const,
        label: "Cancelled",
      };
    }

    return {
      bg: "#F1F5F9",
      border: "#E2E8F0",
      color: MUTED,
      icon: "information-circle-outline" as const,
      label: status || "Pending",
    };
  };

  const payHoldBooking = async (item: any) => {
    if (payingId) return;

    const planId = item?.plan_id || item?.plan?.id;
    const title = item?.plan?.title || item?.plan_title || "Mentorship Session";
    const bookingDate = item?.booking_date;
    const startTime = item?.start_time;

    if (!planId || !bookingDate || !startTime) {
      Alert.alert("Payment Failed", "Booking details missing hain.");
      return;
    }

    try {
      setPayingId(item.id);

      await startMentorshipPayment({
        planId,
        bookingDate,
        startTime,
        title,
        studentNote: item?.student_note ?? "",
        onSuccess: async () => {
          Alert.alert("Payment Successful", "Your mentorship booking is confirmed.");
          await loadBookings();
        },
        onSlotUnavailable: async () => {
          Alert.alert("Slot Unavailable", "Ye slot ab available nahi hai.");
          await loadBookings();
        },
      });
    } catch (error) {
      console.log("PAYMENT FAILED CLEAN", error);
      Alert.alert("Payment Failed", "Payment complete nahi ho paaya. Please try again.");
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <View style={styles.center}>
          <View style={styles.loaderCard}>
            <ActivityIndicator color={PURPLE} size="large" />
            <Text style={styles.loaderTitle}>Loading bookings...</Text>
            <Text style={styles.loaderSub}>Your mentorship sessions fetch ho rahe hain</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>Your mentorship sessions</Text>
        </View>

        <Pressable style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={PURPLE} />
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={44} color="#94A3B8" />
              </View>

              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>
                Book your first mentorship session from home screen.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const rawStatus = String(item.status || "").toLowerCase();
            const status = getStatusStyle(item.status);
            const isHold = rawStatus === "hold";
            const isExpired = rawStatus === "expired";
            const isPaying = payingId === item.id;

            return (
              <View style={styles.card}>
                <View style={styles.topRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="people-outline" size={25} color={PURPLE} />
                  </View>

                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTag}>MENTORSHIP</Text>
                    <Text style={styles.cardTitle}>
                      {(item as any)?.plan?.title ||
                        (item as any)?.plan_title ||
                        "Mentorship Session"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: status.bg,
                        borderColor: status.border,
                      },
                    ]}
                  >
                    <Ionicons name={status.icon} size={13} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsBox}>
                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="calendar-outline" size={16} color={PURPLE} />
                    </View>

                    <View>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(item.booking_date)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailItem}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="time-outline" size={16} color={PURPLE} />
                    </View>

                    <View>
                      <Text style={styles.detailLabel}>Time</Text>
                      <Text style={styles.detailValue}>
                        {formatTime(item.start_time)} - {formatTime(item.end_time)}
                      </Text>
                    </View>
                  </View>
                </View>

                {isHold ? (
                  <Pressable
                    disabled={isPaying}
                    style={[styles.payButton, isPaying && styles.disabledBtn]}
                    onPress={() => payHoldBooking(item)}
                  >
                    {isPaying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.payText}>Pay Now</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </>
                    )}
                  </Pressable>
                ) : isExpired ? (
                  <View style={styles.expiredBox}>
                    <Ionicons name="time-outline" size={16} color={RED} />
                    <Text style={styles.expiredText}>Meeting link expired</Text>
                  </View>
                ) : item.meeting_link ? (
                  <Pressable
                    style={styles.meetingButton}
                    onPress={() => openMeeting(item.meeting_link)}
                  >
                    <Ionicons name="videocam-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.meetingText}>Join Session</Text>
                  </Pressable>
                ) : (
                  <View style={styles.waitingBox}>
                    <Ionicons name="link-outline" size={16} color="#94A3B8" />
                    <Text style={styles.noLink}>Meeting link will be shared soon.</Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: DARK,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },
  center: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderCard: {
    width: "100%",
    backgroundColor: CARD,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 42,
    alignItems: "center",
  },
  loaderTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
  },
  loaderSub: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 34,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 28,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "rgba(15,23,42,0.14)",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    marginRight: 12,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: "900",
    color: PURPLE,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: DARK,
  },
  statusPill: {
    maxWidth: 122,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    marginLeft: 4,
    fontSize: 9.5,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailsBox: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 13,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },
  detailValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "900",
    color: DARK,
  },
  detailDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 12,
  },
  payButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 18,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  payText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  meetingButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 18,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  meetingText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  waitingBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  noLink: {
    marginLeft: 7,
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
  },
  expiredBox: {
    marginTop: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  expiredText: {
    marginLeft: 7,
    fontSize: 12,
    fontWeight: "900",
    color: RED,
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 90,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 30,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 19,
    fontWeight: "900",
    color: DARK,
  },
  emptyText: {
    marginTop: 7,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: MUTED,
  },
});