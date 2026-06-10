import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const CARD_WIDTH = width * 0.78;
const CARD_HEIGHT = 340;
const CARD_GAP = 14;

function formatPrice(pricePaise?: number) {
  if (!pricePaise) return "₹0";
  return `₹${Math.round(pricePaise / 100).toLocaleString("en-IN")}`;
}

export default function ClassroomPlans({
  plans,
  selectedPlan,
  onSelectPlan,
}: {
  plans: any[];
  selectedPlan: any;
  onSelectPlan: (plan: any) => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const activeScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.012],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Subscription</Text>
          <Text style={styles.title}>Choose Your Plan</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="sparkles-outline" size={22} color="#2563EB" />
        </View>
      </View>

      {!plans.length ? (
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
          <Text style={styles.empty}>No plans available right now.</Text>
        </View>
      ) : (
        <>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.sliderContent}
            style={styles.slider}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {plans.map((plan, index) => {
              const active = selectedPlan?.id === plan.id;
              const isYearly = plan.plan_type === "yearly";

              const inputRange = [
                (index - 1) * (CARD_WIDTH + CARD_GAP),
                index * (CARD_WIDTH + CARD_GAP),
                (index + 1) * (CARD_WIDTH + CARD_GAP),
              ];

              const cardScale = scrollX.interpolate({
                inputRange,
                outputRange: [0.97, 1, 0.97],
                extrapolate: "clamp",
              });

              const cardOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.82, 1, 0.82],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={plan.id}
                  style={[
                    styles.animatedCard,
                    {
                      opacity: cardOpacity,
                      transform: [{ scale: active ? activeScale : cardScale }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => onSelectPlan(plan)}
                    style={[
                      styles.planCard,
                      isYearly ? styles.yearlyPlan : styles.monthlyPlan,
                      active && styles.activePlan,
                    ]}
                  >
                    <View style={styles.glowCircleOne} />
                    <View style={styles.glowCircleTwo} />

                    {isYearly && (
                      <View style={styles.bestBadge}>
                        <Ionicons name="star" size={10} color="#FFFFFF" />
                        <Text style={styles.bestBadgeText}>Best Value</Text>
                      </View>
                    )}

                    <View style={styles.planTop}>
                      <View style={styles.planIconBox}>
                        <Ionicons
                          name={isYearly ? "trophy-outline" : "calendar-outline"}
                          size={24}
                          color={isYearly ? "#F97316" : "#2563EB"}
                        />
                      </View>

                      <View
                        style={[
                          styles.radioOuter,
                          active && styles.radioActive,
                        ]}
                      >
                        {active && (
                          <Ionicons
                            name="checkmark"
                            size={15}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                    </View>

                    <Text numberOfLines={2} style={styles.planTitle}>
                      {plan.title}
                    </Text>

                    <Text style={styles.planType}>
                      {isYearly
                        ? "Yearly learning access"
                        : "Monthly learning access"}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.price}>
                        {formatPrice(plan.price_paise)}
                      </Text>

                      {!!plan.original_price_paise && (
                        <Text style={styles.oldPrice}>
                          {formatPrice(plan.original_price_paise)}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.priceSuffix}>
                      / {isYearly ? "year" : "month"}
                    </Text>

                    <View style={styles.spacer} />

                    <View style={styles.bottomArea}>
                      <View style={styles.divider} />

                      <View style={styles.featuresColumn}>
                        <View style={styles.featurePill}>
                          <Ionicons
                            name="time-outline"
                            size={15}
                            color="#2563EB"
                          />
                          <Text style={styles.featureText}>
                            {plan.duration_days || 30} days access
                          </Text>
                        </View>

                        <View style={styles.featurePill}>
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={15}
                            color="#16A34A"
                          />
                          <Text style={styles.featureText}>
                            {plan.grace_days || 5} days grace period
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>

          <View style={styles.dotsRow}>
            {plans.map((_, index) => {
              const inputRange = [
                (index - 1) * (CARD_WIDTH + CARD_GAP),
                index * (CARD_WIDTH + CARD_GAP),
                (index + 1) * (CARD_WIDTH + CARD_GAP),
              ];

              const dotScale = scrollX.interpolate({
                inputRange,
                outputRange: [1, 1.8, 1],
                extrapolate: "clamp",
              });

              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.28, 0.95, 0.28],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      opacity: dotOpacity,
                      transform: [{ scaleX: dotScale }],
                    },
                  ]}
                />
              );
            })}
          </View>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 18,
    paddingTop: 16,
    paddingBottom: 24,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    overflow: "visible",

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  title: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
  },

  headerIcon: {
    height: 42,
    width: 42,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    marginHorizontal: 16,
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  empty: {
    marginTop: 8,
    color: "#6B7280",
    fontWeight: "800",
  },

  slider: {
    overflow: "visible",
  },

  sliderContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 18,
  },

  animatedCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_GAP,
    overflow: "visible",
  },

  planCard: {
    width: "100%",
    height: CARD_HEIGHT,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 22,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: "hidden",
  },

  monthlyPlan: {
    backgroundColor: "#F2F8FF",
    borderColor: "#C7DDFF",
  },

  yearlyPlan: {
    backgroundColor: "#FFF6EC",
    borderColor: "#FFD2A3",
  },

  activePlan: {
    borderColor: "#2563EB",
    borderWidth: 2,
  },

  glowCircleOne: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.6)",
    top: -45,
    right: -45,
  },

  glowCircleTwo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.46)",
    bottom: -35,
    left: -35,
  },

  bestBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F97316",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    zIndex: 10,
  },

  bestBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  planTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  planIconBox: {
    height: 48,
    width: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  radioActive: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },

  planTitle: {
    minHeight: 52,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "900",
    color: "#111827",
    paddingRight: 4,
  },

  planType: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
  },

  price: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
  },

  oldPrice: {
    marginLeft: 10,
    marginBottom: 5,
    fontSize: 14,
    color: "#94A3B8",
    textDecorationLine: "line-through",
    fontWeight: "800",
  },

  priceSuffix: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
  },

  spacer: {
    flex: 1,
  },

  bottomArea: {
    paddingBottom: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.25)",
    marginBottom: 12,
  },

  featuresColumn: {
    gap: 9,
    paddingBottom: 2,
  },

  featurePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 34,
  },

  featureText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#475569",
  },

  dotsRow: {
    marginTop: 2,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },

  dot: {
    width: 9,
    height: 7,
    borderRadius: 99,
    backgroundColor: "#2563EB",
  },
});