import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { mentorshipApi, MentorshipPlan } from "../../api/mentorship.api";
import { mentorshipBookingDb } from "../../db/mentorshipBookingDb";

const { width } = Dimensions.get("window");

const PURPLE = "#7C3AED";
const DARK = "#0F172A";
const MUTED = "#64748B";
const GREEN = "#16A34A";
const BORDER = "#EDE9FE";

const CARD_WIDTH = Math.min(width * 0.72, 285);

export default function MentorshipPlansSlider({ navigation }: any) {
  const [plans, setPlans] = useState<MentorshipPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const loadPlans = async () => {
    const cached = mentorshipBookingDb.getPlans();
    if (cached.length > 0) setPlans(cached);

    try {
      setLoading(cached.length === 0);

      const data = await mentorshipApi.getBookingHome();
      const apiPlans = data?.plans ?? [];

      setPlans(apiPlans);
      mentorshipBookingDb.savePlans(apiPlans);
    } catch (e) {
      console.log("MENTORSHIP PLANS ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <View style={styles.loaderCard}>
          <ActivityIndicator color={PURPLE} size="large" />
          <Text style={styles.loaderText}>Loading mentorship plans...</Text>
        </View>
      </View>
    );
  }

  if (plans.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.tagRow}>
            <Ionicons name="sparkles" size={13} color={PURPLE} />
            <Text style={styles.tagText}>EXPERT GUIDANCE</Text>
          </View>

          <Text style={styles.title}>Book Mentorship</Text>
          <Text style={styles.subtitle}>Personal guidance from expert mentors</Text>
        </View>

        <Pressable
          style={styles.myBookingsBtn}
          onPress={() => navigation.navigate("MyBookings")}
        >
          <Text style={styles.myBookings}>My Bookings</Text>
          <Ionicons name="chevron-forward" size={14} color={PURPLE} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slider}
      >
        {plans.map((plan, index) => {
          const price = Math.round(Number(plan.price_paise || 0) / 100);

          return (
            <Pressable
              key={plan.id}
              style={({ pressed }) => [
                styles.cardOuter,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
              onPress={() =>
                navigation.navigate("DateSelect", {
                  selectedPlan: plan,
                })
              }
            >
              <LinearGradient
                colors={
                  index % 2 === 0
                    ? ["#FFFFFF", "#F5F3FF", "#FFFFFF"]
                    : ["#FFFFFF", "#EEF2FF", "#FFFFFF"]
                }
                style={styles.card}
              >
                <View style={styles.blurCircleOne} />
                <View style={styles.blurCircleTwo} />

                <Animated.View
                  style={[
                    styles.popularBadge,
                    index === 0 && { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <LinearGradient
                    colors={["#7C3AED", "#A78BFA"]}
                    style={styles.popularGradient}
                  >
                    <Ionicons name="flash" size={11} color="#FFFFFF" />
                    <Text style={styles.popularText}>
                      {index === 0 ? "POPULAR" : "LIVE"}
                    </Text>
                  </LinearGradient>
                </Animated.View>

                <View style={styles.topRow}>
                  <View style={styles.iconBox}>
                    <Ionicons name="people-outline" size={25} color={PURPLE} />
                  </View>

                  <View style={styles.priceBox}>
                    <Text style={styles.price}>₹{price}</Text>
                  </View>
                </View>

                <Text style={styles.planTitle} numberOfLines={2}>
                  {plan.title}
                </Text>

                <Text style={styles.desc} numberOfLines={2}>
                  {plan.description || "Get personal guidance for your study journey."}
                </Text>

                <View style={styles.featuresRow}>
                  <View style={styles.featurePill}>
                    <Ionicons name="time-outline" size={13} color={PURPLE} />
                    <Text style={styles.featureText}>{plan.duration_minutes} min</Text>
                  </View>

                  <View style={styles.featurePillGreen}>
                    <Ionicons name="videocam-outline" size={13} color={GREEN} />
                    <Text style={styles.featureTextGreen}>1:1 Live</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.footerLabel}>Start booking</Text>
                    <Text style={styles.footerSub}>Choose date & slot</Text>
                  </View>

                  <View style={styles.arrowBox}>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
  },

  headerRow: {
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  tagText: {
    marginLeft: 5,
    fontSize: 10.5,
    fontWeight: "900",
    color: PURPLE,
    letterSpacing: 1,
  },

  title: {
    fontSize: 21,
    fontWeight: "900",
    color: DARK,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: "700",
    color: MUTED,
  },

  myBookingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },

  myBookings: {
    fontSize: 11.5,
    fontWeight: "900",
    color: PURPLE,
    marginRight: 2,
  },

  slider: {
    paddingRight: 20,
    paddingBottom: 4,
  },

  cardOuter: {
    width: CARD_WIDTH,
    marginRight: 14,
    borderRadius: 32,
  },

  card: {
    minHeight: 238,
    borderRadius: 32,
    padding: 17,
    borderWidth: 1.4,
    borderColor: BORDER,
    overflow: "hidden",
    shadowColor: PURPLE,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  blurCircleOne: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(124,58,237,0.08)",
    right: -42,
    top: -42,
  },

  blurCircleTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(22,163,74,0.06)",
    left: -30,
    bottom: -25,
  },

  popularBadge: {
    position: "absolute",
    top: 13,
    right: 13,
    zIndex: 10,
  },

  popularGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  popularText: {
    marginLeft: 4,
    fontSize: 9.5,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.7,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },

  priceBox: {
    marginTop: 36,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  price: {
    fontSize: 17,
    fontWeight: "900",
    color: GREEN,
  },

  planTitle: {
    marginTop: 16,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    color: DARK,
  },

  desc: {
    marginTop: 7,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "700",
    color: MUTED,
  },

  featuresRow: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  featurePillGreen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  featureText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "900",
    color: PURPLE,
  },

  featureTextGreen: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "900",
    color: GREEN,
  },

  cardFooter: {
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#EDE9FE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: DARK,
  },

  footerSub: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },

  arrowBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },

  loaderBox: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
  },

  loaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    paddingHorizontal: 24,
    paddingVertical: 22,
    alignItems: "center",
  },

  loaderText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },
});