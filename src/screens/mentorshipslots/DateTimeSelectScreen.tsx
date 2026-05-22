import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { mentorshipApi, MentorshipSlot } from "../../api/mentorship.api";

const { width } = Dimensions.get("window");

const PURPLE = "#7C3AED";
const BG = "#F8FAFC";
const CARD = "#FFFFFF";
const DARK = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const GREEN = "#16A34A";

export default function SlotSelectScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { selectedPlan } = route.params;

  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<MentorshipSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<MentorshipSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatApiDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseApiDate = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(12, 0, 0, 0);
    return d;
  };

  const dates = useMemo(() => {
    const result: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() + i);
      result.push(d);
    }

    return result;
  }, []);

  useEffect(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setSelectedDate(formatApiDate(today));
  }, []);

  useEffect(() => {
    if (selectedDate) loadSlots(selectedDate);
  }, [selectedDate]);

  const loadSlots = async (date: string) => {
    try {
      setLoading(true);
      setSelectedSlot(null);

      const response = await mentorshipApi.getSlots(date, selectedPlan.id);

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      const availableSlots = data.filter(
        (slot: MentorshipSlot) => slot.is_available === true
      );

      setSlots(availableSlots);
    } catch (error: any) {
      console.log("SLOTS ERROR", error?.response?.data || error?.message || error);

      Alert.alert(
        "Slots Error",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Slots load nahi ho paaye."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (!selectedDate) return;
    setRefreshing(true);
    loadSlots(selectedDate);
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

  const getDateTitle = () => {
    if (!selectedDate) return "";

    const today = formatApiDate(new Date());
    if (selectedDate === today) return "Today";

    return parseApiDate(selectedDate).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
  };

  const goToReview = () => {
    if (!selectedSlot) {
      Alert.alert("Select Slot", "Please ek available slot select karo.");
      return;
    }

    navigation.navigate("BookingReview", {
      selectedPlan,
      selectedDate,
      selectedSlot,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Select Slot</Text>
          <Text style={styles.headerSub}>{selectedPlan?.title || "Deep Mentorship"}</Text>
        </View>

        <View style={styles.secureIcon}>
          <Ionicons name="time-outline" size={20} color={PURPLE} />
        </View>
      </View>

      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateSlider}
        >
          {dates.map((d) => {
            const apiDate = formatApiDate(d);
            const active = selectedDate === apiDate;
            const isToday = apiDate === formatApiDate(new Date());

            return (
              <Pressable
                key={apiDate}
                style={[styles.dateCard, active && styles.activeDateCard]}
                onPress={() => setSelectedDate(apiDate)}
              >
                {isToday && (
                  <View style={[styles.todayBadge, active && styles.todayBadgeActive]}>
                    <Text style={[styles.todayText, active && styles.todayTextActive]}>
                      Today
                    </Text>
                  </View>
                )}

                <Text style={[styles.dateDay, active && styles.activeText]}>
                  {d.toLocaleDateString("en-IN", { weekday: "short" })}
                </Text>

                <Text style={[styles.dateNumber, active && styles.activeText]}>
                  {d.toLocaleDateString("en-IN", { day: "2-digit" })}
                </Text>

                <Text style={[styles.dateMonth, active && styles.activeText]}>
                  {d.toLocaleDateString("en-IN", { month: "short" })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.selectedDateBox}>
          <View>
            <Text style={styles.selectedLabel}>Selected Date</Text>
            <Text style={styles.selectedDateText}>{getDateTitle()}</Text>
          </View>

          <View style={styles.slotCountPill}>
            <Ionicons name="time-outline" size={15} color={PURPLE} />
            <Text style={styles.slotCountText}>{slots.length} Slots</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={PURPLE} size="large" />
            <Text style={styles.loadingText}>Loading available slots...</Text>
          </View>
        ) : (
          <FlatList
            data={slots}
            keyExtractor={(item) => `${item.date}-${item.start_time}`}
            numColumns={2}
            columnWrapperStyle={styles.columnGap}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: 175 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-clear-outline" size={50} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No slots available</Text>
                <Text style={styles.emptyText}>
                  Is date par koi available slot nahi hai. Upar se dusri date select karo.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const active =
                selectedSlot?.start_time === item.start_time &&
                selectedSlot?.date === item.date;

              return (
                <Pressable
                  style={[styles.slotCard, active && styles.activeSlotCard]}
                  onPress={() => setSelectedSlot(item)}
                >
                  <View style={styles.slotTop}>
                    <View style={[styles.iconCircle, active && styles.activeIconCircle]}>
                      <Ionicons
                        name={active ? "checkmark" : "time-outline"}
                        size={18}
                        color={active ? PURPLE : "#FFFFFF"}
                      />
                    </View>

                    <Text style={[styles.availableText, active && styles.activeText]}>
                      Available
                    </Text>
                  </View>

                  <Text style={[styles.slotMainTime, active && styles.activeText]}>
                    {formatTime(item.start_time)}
                  </Text>

                  <Text style={[styles.slotRange, active && styles.activeTextMuted]}>
                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomLabel}>Selected Slot</Text>

          <Text style={styles.bottomPrice}>
            {selectedSlot ? formatTime(selectedSlot.start_time) : "--:--"}
          </Text>

          <Text style={styles.bottomRange} numberOfLines={1}>
            {selectedSlot
              ? `${formatTime(selectedSlot.start_time)} - ${formatTime(
                  selectedSlot.end_time
                )}`
              : "Start time - End time"}
          </Text>
        </View>

        <Pressable
          disabled={!selectedSlot}
          style={[styles.reviewBtn, !selectedSlot && styles.disabledBtn]}
          onPress={goToReview}
        >
          <Text style={styles.reviewText}>Review</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const CARD_WIDTH = (width - 52) / 2;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
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
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: DARK,
  },
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
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateSlider: {
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  dateCard: {
    width: 82,
    height: 112,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDateCard: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  todayBadge: {
    position: "absolute",
    top: 8,
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  todayBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  todayText: {
    fontSize: 9,
    fontWeight: "900",
    color: PURPLE,
  },
  todayTextActive: {
    color: "#FFFFFF",
  },
  dateDay: {
    marginTop: 13,
    fontSize: 12,
    fontWeight: "900",
    color: MUTED,
  },
  dateNumber: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "900",
    color: DARK,
  },
  dateMonth: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },
  activeText: {
    color: "#FFFFFF",
  },
  activeTextMuted: {
    color: "rgba(255,255,255,0.8)",
  },
  selectedDateBox: {
    marginTop: 8,
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },
  selectedDateText: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
  },
  slotCountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  slotCountText: {
    fontSize: 12,
    fontWeight: "900",
    color: PURPLE,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 120,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "800",
    color: MUTED,
  },
  listContent: {
    paddingTop: 18,
  },
  columnGap: {
    gap: 12,
  },
  slotCard: {
    width: CARD_WIDTH,
    minHeight: 132,
    marginBottom: 12,
    padding: 14,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  activeSlotCard: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  slotTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconCircle: {
    backgroundColor: "#FFFFFF",
  },
  availableText: {
    fontSize: 11,
    fontWeight: "900",
    color: GREEN,
  },
  slotMainTime: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "900",
    color: DARK,
  },
  slotRange: {
    marginTop: 6,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "800",
    color: MUTED,
  },
  emptyBox: {
    alignItems: "center",
    marginTop: 70,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
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
  bottomBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 2,
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: DARK,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 14,
  },
  bottomInfo: {
    flex: 1,
    paddingRight: 10,
  },
  bottomLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
  },
  bottomPrice: {
    color: DARK,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 1,
  },
  bottomRange: {
    marginTop: 2,
    color: MUTED,
    fontSize: 11,
    fontWeight: "800",
  },
  reviewBtn: {
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
  disabledBtn: {
    backgroundColor: "#94A3B8",
  },
  reviewText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});