// src/screens/MentorshipScreen.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isSmall = width < 380;

export default function MentorshipScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />

          <View style={styles.heroIcon}>
            <Ionicons name="people-outline" size={36} color="#FFFFFF" />
          </View>

          <Text style={styles.kicker}>PERSONAL GUIDANCE</Text>
          <Text style={styles.title}>Mentorship Sessions</Text>
          <Text style={styles.subtitle}>
            Get expert support, study planning, strategy calls and progress reviews from mentors.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Mentors" value="50+" />
          <Stat label="Support" value="1:1" />
          <Stat label="Plans" value="Weekly" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What You Get</Text>

          <Feature icon="calendar-outline" title="Weekly Study Plan" text="Personalized schedule to manage your preparation." />
          <Feature icon="chatbubble-ellipses-outline" title="Doubt Support" text="Ask doubts and get guided solutions faster." />
          <Feature icon="analytics-outline" title="Progress Review" text="Understand weak areas and improve performance." />
          <Feature icon="flag-outline" title="Exam Strategy" text="Learn smart revision and test-taking strategy." />
        </View>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryText}>Book Mentorship</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#2563EB" />
          <Text style={styles.secondaryText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Feature({ icon, title, text }: any) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={23} color="#2563EB" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  hero: {
    backgroundColor: "#2563EB",
    borderRadius: 36,
    padding: 26,
    overflow: "hidden",
    marginBottom: 16,
  },
  glowOne: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255,255,255,0.14)",
    right: -70,
    top: -75,
  },
  glowTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.09)",
    left: -45,
    bottom: -45,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    marginBottom: 20,
  },
  kicker: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: isSmall ? 28 : 32,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "#DBEAFE",
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2563EB",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  featureIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  featureText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 20,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#2563EB",
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
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "900",
  },
});