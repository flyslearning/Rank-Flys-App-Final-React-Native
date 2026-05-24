import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
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
const PURPLE_DARK = "#5B21B6";
const DARK = "#0F172A";
const MUTED = "#64748B";
const GREEN = "#16A34A";
const BORDER = "#EDE9FE";

const CARD_WIDTH = width < 360 ? width * 0.82 : Math.min(width * 0.74, 310);
const CARD_SPACING = 15;
const SNAP_SIZE = CARD_WIDTH + CARD_SPACING;
const CARD_RADIUS = 32;

export default function MentorshipPlansSlider({ navigation }: any) {
  const [plans, setPlans] = useState<MentorshipPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

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
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 55,
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderBox}>
        <LinearGradient colors={["#FFFFFF", "#F5F3FF"]} style={styles.loaderCard}>
          <ActivityIndicator color={PURPLE} size="large" />
          <Text style={styles.loaderText}>Loading mentorship plans...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (plans.length === 0) return null;

  const arrowTranslate = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

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
        <View style={styles.headerLeft}>
          <View style={styles.tagRow}>
            <Ionicons name="sparkles" size={13} color={PURPLE} />
            <Text style={styles.tagText}>EXPERT GUIDANCE</Text>
          </View>

          <Text style={styles.title}>Book Mentorship</Text>
          <Text style={styles.subtitle}>
            Personal guidance from expert mentors
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.myBookingsBtn,
            pressed && styles.pressedSmall,
          ]}
          onPress={() => navigation.navigate("MyBookings")}
        >
          <Text style={styles.myBookings}>My Bookings</Text>
          <Ionicons name="chevron-forward" size={14} color={PURPLE} />
        </Pressable>
      </View>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slider}
        snapToInterval={SNAP_SIZE}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      >
        {plans.map((plan, index) => {
          const price = Math.round(Number(plan.price_paise || 0) / 100);
          const isPopular = index === 0;

          const inputRange = [
            (index - 1) * SNAP_SIZE,
            index * SNAP_SIZE,
            (index + 1) * SNAP_SIZE,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.94, 1, 0.94],
            extrapolate: "clamp",
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [12, 0, 12],
            extrapolate: "clamp",
          });

          const shadowOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.08, 0.22, 0.08],
            extrapolate: "clamp",
          });

          const borderOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.7, 1, 0.7],
            extrapolate: "clamp",
          });

          return (
            <Animated.View
              key={plan.id}
              style={[
                styles.cardOuter,
                {
                  transform: [{ scale }, { translateY }],
                },
              ]}
            >
              <Pressable
                style={({ pressed }) => [pressed && styles.pressedCard]}
                onPress={() =>
                  navigation.navigate("DateSelect", {
                    selectedPlan: plan,
                  })
                }
              >
                <Animated.View
                  style={[
                    styles.shadowLayer,
                    {
                      shadowOpacity,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={
                      isPopular
                        ? ["#FFFFFF", "#F5F3FF", "#FFFFFF"]
                        : ["#FFFFFF", "#EEF2FF", "#FFFFFF"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                  >
                    <View style={styles.glowOne} />
                    <View style={styles.glowTwo} />



                    <Animated.View
                      style={[
                        styles.badge,
                        isPopular && { transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      <LinearGradient
                        colors={
                          isPopular
                            ? ["#7C3AED", "#A78BFA"]
                            : ["#2563EB", "#60A5FA"]
                        }
                        style={styles.badgeGradient}
                      >
                        <Ionicons
                          name={isPopular ? "flash" : "radio"}
                          size={11}
                          color="#FFFFFF"
                        />
                        <Text style={styles.badgeText}>
                          {isPopular ? "POPULAR" : "LIVE"}
                        </Text>
                      </LinearGradient>
                    </Animated.View>

                    <View style={styles.topRow}>
                      <View style={styles.iconBox}>
                        <LinearGradient
                          colors={["#F5F3FF", "#EDE9FE"]}
                          style={styles.iconGradient}
                        >
                          <Ionicons
                            name="people-outline"
                            size={26}
                            color={PURPLE}
                          />
                        </LinearGradient>
                      </View>

                      <View style={styles.priceBox}>
                        <Text style={styles.price}>₹{price}</Text>
                      </View>
                    </View>

                    <Text style={styles.planTitle} numberOfLines={2}>
                      {plan.title}
                    </Text>

                    <Text style={styles.desc} numberOfLines={2}>
                      {plan.description ||
                        "Get personal guidance for your study journey."}
                    </Text>

                    <View style={styles.featuresRow}>
                      <View style={styles.featurePill}>
                        <Ionicons name="time-outline" size={13} color={PURPLE} />
                        <Text style={styles.featureText}>
                          {plan.duration_minutes} min
                        </Text>
                      </View>

                      <View style={styles.featurePillGreen}>
                        <Ionicons
                          name="videocam-outline"
                          size={13}
                          color={GREEN}
                        />
                        <Text style={styles.featureTextGreen}>1:1 Live</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.footerLabel}>Start booking</Text>
                        <Text style={styles.footerSub}>Choose date & slot</Text>
                      </View>

                      <LinearGradient
                        colors={[PURPLE, PURPLE_DARK]}
                        style={styles.arrowBox}
                      >
                        <Animated.View
                          style={{
                            transform: [{ translateX: arrowTranslate }],
                          }}
                        >
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#FFFFFF"
                          />
                        </Animated.View>
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 26,
  },

  headerRow: {
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },

  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  tagText: {
    marginLeft: 5,
    fontSize: 10.5,
    fontWeight: "900",
    color: PURPLE,
    letterSpacing: 1.1,
  },

  title: {
    fontSize: width < 360 ? 19 : 22,
    fontWeight: "900",
    color: DARK,
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 4,
    fontSize: width < 360 ? 11.5 : 12.5,
    fontWeight: "700",
    color: MUTED,
    lineHeight: 17,
  },

  myBookingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#DDD6FE",
    paddingHorizontal: width < 360 ? 9 : 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  myBookings: {
    fontSize: 11.5,
    fontWeight: "900",
    color: PURPLE,
    marginRight: 2,
  },

  pressedSmall: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  slider: {
    paddingLeft: 4,
    paddingRight: 42,
    paddingBottom: 22,
    paddingTop: 4,
  },

  cardOuter: {
    width: CARD_WIDTH,
    minWidth: CARD_WIDTH,
    maxWidth: CARD_WIDTH,
    marginRight: CARD_SPACING,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
  },

  pressedCard: {
    transform: [{ scale: 0.985 }],
  },

  shadowLayer: {
  borderRadius: CARD_RADIUS,
  backgroundColor: "#FFFFFF",

  // IMPORTANT
  overflow: "hidden",

  shadowColor: PURPLE,
  shadowOpacity: 0.22,
  shadowRadius: 22,
  shadowOffset: {
    width: 0,
    height: 12,
  },

  elevation: 8,
},

  card: {
    minHeight: 248,
    borderRadius: CARD_RADIUS,
    padding: 18,
    borderWidth: 1.4,
    borderColor: BORDER,
    overflow: "hidden",
  },

  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_RADIUS,
    borderWidth: 1.5,
    borderColor: "#C4B5FD",
  },

  glowOne: {
    position: "absolute",
    width: 155,
    height: 155,
    borderRadius: 80,
    backgroundColor: "rgba(124,58,237,0.10)",
    right: -52,
    top: -52,
  },

  glowTwo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(22,163,74,0.08)",
    left: -38,
    bottom: -34,
  },

  badge: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
  },

  badgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  badgeText: {
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
    width: 60,
    height: 60,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },

  iconGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  priceBox: {
    marginTop: 38,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },

  price: {
    fontSize: 17,
    fontWeight: "900",
    color: GREEN,
  },

  planTitle: {
    marginTop: 17,
    fontSize: width < 360 ? 17.5 : 19.5,
    lineHeight: 25,
    fontWeight: "900",
    color: DARK,
    letterSpacing: -0.25,
  },

  desc: {
    marginTop: 8,
    fontSize: 12.5,
    lineHeight: 18.5,
    fontWeight: "700",
    color: MUTED,
  },

  featuresRow: {
    marginTop: 16,
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
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },

  featurePillGreen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BBF7D0",
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
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EDE9FE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerLabel: {
    fontSize: 12.5,
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
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.36,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  loaderBox: {
    height: 155,
    justifyContent: "center",
    alignItems: "center",
  },

  loaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    paddingHorizontal: 26,
    paddingVertical: 23,
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  loaderText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },
});