// src/screens/ScholarshipScreen.tsx

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isSmall = width < 380;

const BLUE = "#2563EB";
const BLUE_DARK = "#1D4ED8";
const BLUE_LIGHT = "#EFF6FF";
const BLUE_SOFT = "#DBEAFE";
const BG = "#F8FAFC";
const DARK = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const GREEN = "#16A34A";
const ORANGE = "#F97316";

export default function ScholarshipScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedItem delay={60}>
          <View style={styles.prizeCard}>
            <View style={styles.prizeLeft}>
              <View style={styles.badge}>
                <Ionicons name="sparkles-outline" size={13} color={BLUE} />
                <Text style={styles.badgeText}>TOP REWARD</Text>
              </View>

              <Text style={styles.prizeTitle}>Scholarship Benefits</Text>
              <Text style={styles.prizeText}>
                Based on rank, score and performance.
              </Text>
            </View>

            <View style={styles.prizeIcon}>
              <Ionicons name="gift-outline" size={31} color={BLUE} />
            </View>
          </View>
        </AnimatedItem>

        <View style={styles.statsGrid}>
          <AnimatedItem delay={100} style={styles.statWrap}>
            <Stat
              icon="medal-outline"
              label="Ranks"
              value="Top"
              color={BLUE}
              bg={BLUE_LIGHT}
            />
          </AnimatedItem>

          <AnimatedItem delay={140} style={styles.statWrap}>
            <Stat
              icon="gift-outline"
              label="Rewards"
              value="₹₹"
              color={GREEN}
              bg="#ECFDF5"
            />
          </AnimatedItem>

          <AnimatedItem delay={180} style={styles.statWrap}>
            <Stat
              icon="trending-up-outline"
              label="Growth"
              value="Score"
              color={ORANGE}
              bg="#FFF7ED"
            />
          </AnimatedItem>
        </View>

        <AnimatedItem delay={220}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardKicker}>SCHOLARSHIP PROGRAM</Text>
                <Text style={styles.cardTitle}>Program Benefits</Text>
              </View>

              <View style={styles.cardIcon}>
                <Ionicons name="ribbon-outline" size={22} color={BLUE} />
              </View>
            </View>

            <Feature
              icon="medal-outline"
              title="Rank Based Rewards"
              text="Top performers can unlock scholarship benefits."
              color={BLUE}
              bg={BLUE_LIGHT}
            />

            <Feature
              icon="document-text-outline"
              title="Scholarship Tests"
              text="Attempt special tests and contests regularly."
              color={GREEN}
              bg="#ECFDF5"
            />

            <Feature
              icon="gift-outline"
              title="Exclusive Benefits"
              text="Get rewards, discounts and premium access."
              color={BLUE_DARK}
              bg={BLUE_SOFT}
            />

            <Feature
              icon="trending-up-outline"
              title="Performance Growth"
              text="Improve your score with regular challenges."
              color={ORANGE}
              bg="#FFF7ED"
              last
            />
          </View>
        </AnimatedItem>

        <AnimatedItem delay={280}>
         <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={() => navigation.navigate("Explore Scholarships")}
        >
          <Text style={styles.primaryText}>Explore Scholarships</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </Pressable>
        </AnimatedItem>

        <AnimatedItem delay={320}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={BLUE} />
            <Text style={styles.secondaryText}>Back</Text>
          </Pressable>
        </AnimatedItem>
      </ScrollView>
    </SafeAreaView>
  );
}

function AnimatedItem({ children, delay = 0, style }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

function Stat({ icon, label, value, color, bg }: any) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Feature({ icon, title, text, color, bg, last }: any) {
  return (
    <View style={[styles.feature, last && styles.featureLast]}>
      <View style={[styles.featureIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={23} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 14 : 8,
    paddingBottom: 50,
  },

  prizeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BLUE_SOFT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prizeLeft: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: BLUE_LIGHT,
    borderWidth: 1,
    borderColor: BLUE_SOFT,
    marginBottom: 12,
  },
  badgeText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  prizeTitle: {
    fontSize: isSmall ? 22 : 24,
    fontWeight: "900",
    color: DARK,
    letterSpacing: -0.4,
  },
  prizeText: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
    marginTop: 6,
    lineHeight: 20,
  },
  prizeIcon: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: BLUE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
    borderWidth: 1,
    borderColor: BLUE_SOFT,
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statWrap: {
    flex: 1,
  },
  stat: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
    color: DARK,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
    marginTop: 3,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardKicker: {
    color: BLUE,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: DARK,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: BLUE_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BLUE_SOFT,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  featureLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  featureIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: DARK,
  },
  featureText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "700",
    marginTop: 4,
    lineHeight: 19,
  },

  primaryButton: {
    marginTop: 20,
    height: 60,
    borderRadius: 22,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 18,
    backgroundColor: BLUE_LIGHT,
    borderWidth: 1,
    borderColor: BLUE_SOFT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryText: {
    color: BLUE,
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.88,
  },
});