// src/screens/MentorshipScreen.tsx

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

const PURPLE = "#7c3aed";
const LAVENDER = "#f5f3ff";
const BG = "#f8fafc";
const DARK = "#0f172a";
const MUTED = "#64748b";
const GREEN = "#16a34a";
const ORANGE = "#f97316";
const BLUE = "#2563eb";

export default function MentorshipScreen({ navigation }: any) {
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(move, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.07],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbf7ff" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.hero, { opacity: fade, transform: [{ translateY: move }] }]}>
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />

          <Text style={styles.kicker}>PERSONAL GUIDANCE</Text>
          <Text style={styles.title}>Mentorship Sessions</Text>
          <Text style={styles.subtitle}>
            Study planning, mentor support, strategy sessions and progress reviews in one place.
          </Text>

          <View style={styles.heroChips}>
            <Chip icon="book-outline" text="Ebooks" />
            <Chip icon="document-text-outline" text="Tests" />
            <Chip icon="videocam-outline" text="Live" />
          </View>
        </Animated.View>

        <View style={styles.statsGrid}>
          <AnimatedItem delay={80}>
            <Stat icon="people-outline" label="Mentors" value="50+" color={PURPLE} bg={LAVENDER} />
          </AnimatedItem>

          <AnimatedItem delay={120}>
            <Stat icon="chatbubble-ellipses-outline" label="Support" value="1:1" color={GREEN} bg="#ecfdf5" />
          </AnimatedItem>

          <AnimatedItem delay={160}>
            <Stat icon="calendar-outline" label="Plans" value="Weekly" color={ORANGE} bg="#fff7ed" />
          </AnimatedItem>
        </View>

        <AnimatedItem delay={210}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardKicker}>BENEFITS</Text>
                <Text style={styles.cardTitle}>What You Get</Text>
              </View>

              <View style={styles.cardIcon}>
                <Ionicons name="rocket-outline" size={22} color={PURPLE} />
              </View>
            </View>

            <Feature
              icon="calendar-outline"
              title="Weekly Study Plan"
              text="A clear weekly roadmap for your preparation."
              color={PURPLE}
              bg={LAVENDER}
            />
            <Feature
              icon="chatbubble-ellipses-outline"
              title="Mentor Support"
              text="Get help with doubts, planning and discipline."
              color={GREEN}
              bg="#ecfdf5"
            />
            <Feature
              icon="analytics-outline"
              title="Progress Review"
              text="Track weak areas and improve your performance."
              color={BLUE}
              bg="#eff6ff"
            />
            <Feature
              icon="flag-outline"
              title="Exam Strategy"
              text="Learn revision, test analysis and scoring strategy."
              color={ORANGE}
              bg="#fff7ed"
              last
            />
          </View>
        </AnimatedItem>

        <AnimatedItem delay={260}>
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color={PURPLE} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Professional mentorship experience</Text>
              <Text style={styles.infoText}>
                Explore plans, unlock content and continue learning from your mentorship dashboard.
              </Text>
            </View>
          </View>
        </AnimatedItem>

        <AnimatedItem delay={310}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate("Mentorship Plans")}
          >
            <Text style={styles.primaryText}>Explore Mentorships</Text>
            <Ionicons name="arrow-forward-circle" size={20} color="#fff" />
          </Pressable>
        </AnimatedItem>

        <AnimatedItem delay={350}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color={PURPLE} />
            <Text style={styles.secondaryText}>Back</Text>
          </Pressable>
        </AnimatedItem>
      </ScrollView>
    </SafeAreaView>
  );
}

function AnimatedItem({ children, delay = 0 }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 280, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: y }] }}>
      {children}
    </Animated.View>
  );
}

function Chip({ icon, text }: any) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color="#fff" />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Stat({ label, value, icon, color, bg }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Feature({ icon, title, text, color, bg, last }: any) {
  return (
    <View style={[styles.feature, last && { borderBottomWidth: 0 }]}>
      <View style={[styles.featureIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

const CARD_GAP = 10;
const CARD_WIDTH = (width - 36 - CARD_GAP * 2) / 3;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 10 : 10,
    paddingBottom: 46,
  },

  hero: {
    backgroundColor: PURPLE,
    borderRadius: 34,
    padding: isSmall ? 20 : 24,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#a78bfa",
  },
  glowOne: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255,255,255,0.15)",
    right: -80,
    top: -80,
  },
  glowTwo: {
    position: "absolute",
    width: 145,
    height: 145,
    borderRadius: 72,
    backgroundColor: "rgba(255,255,255,0.10)",
    left: -50,
    bottom: -50,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.17)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  kicker: {
    color: "#ede9fe",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#fff",
    fontSize: isSmall ? 28 : 32,
    lineHeight: isSmall ? 34 : 38,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#ede9fe",
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 10,
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  statsGrid: {
    flexDirection: "row",
    gap: CARD_GAP,
    marginBottom: 14,
  },
  statCard: {
    width: CARD_WIDTH,
    minHeight: 104,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: isSmall ? 4 : 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  statValue: {
    fontSize: isSmall ? 17 : 19,
    fontWeight: "900",
    color: DARK,
    textAlign: "center",
  },
  statLabel: {
    fontSize: isSmall ? 10 : 11,
    fontWeight: "800",
    color: MUTED,
    marginTop: 3,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  cardKicker: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: DARK,
    marginTop: 2,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: LAVENDER,
    alignItems: "center",
    justifyContent: "center",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: DARK,
  },
  featureText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 19,
  },

  infoCard: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: LAVENDER,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: "900",
  },
  infoText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    marginTop: 3,
  },

  primaryButton: {
    marginTop: 16,
    minHeight: 58,
    borderRadius: 21,
    backgroundColor: PURPLE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: LAVENDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#ede9fe",
    paddingHorizontal: 16,
  },
  secondaryText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
});