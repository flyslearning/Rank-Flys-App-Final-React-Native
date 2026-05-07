// src/screens/ScholarshipScreen.tsx

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

export default function ScholarshipScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />

          <View style={styles.heroIcon}>
            <Ionicons name="trophy-outline" size={38} color="#FFFFFF" />
          </View>

          <Text style={styles.kicker}>REWARDS & CONTESTS</Text>
          <Text style={styles.title}>Scholarship Program</Text>
          <Text style={styles.subtitle}>
            Attempt contests, earn ranks and unlock scholarship opportunities with rewards.
          </Text>
        </View>

        <View style={styles.prizeCard}>
          <View>
            <Text style={styles.prizeLabel}>Top Reward</Text>
            <Text style={styles.prizeTitle}>Scholarship Benefits</Text>
            <Text style={styles.prizeText}>Based on rank, score and performance.</Text>
          </View>

          <View style={styles.prizeIcon}>
            <Ionicons name="gift-outline" size={32} color="#7C3AED" />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Program Benefits</Text>

          <Feature icon="medal-outline" title="Rank Based Rewards" text="Top performers can unlock scholarship benefits." />
          <Feature icon="document-text-outline" title="Scholarship Tests" text="Attempt special tests and contests regularly." />
          <Feature icon="gift-outline" title="Exclusive Benefits" text="Get rewards, discounts and premium access." />
          <Feature icon="trending-up-outline" title="Performance Growth" text="Improve your score with regular challenges." />
        </View>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryText}>Explore Scholarships</Text>
          <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#7C3AED" />
          <Text style={styles.secondaryText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ icon, title, text }: any) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={23} color="#7C3AED" />
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
    backgroundColor: "#7C3AED",
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
    color: "#EDE9FE",
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
    color: "#EDE9FE",
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 10,
  },
  prizeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prizeLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#7C3AED",
    marginBottom: 5,
  },
  prizeTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  prizeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 5,
  },
  prizeIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#F5F3FF",
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
    backgroundColor: "#7C3AED",
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
    backgroundColor: "#F5F3FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryText: {
    color: "#7C3AED",
    fontSize: 15,
    fontWeight: "900",
  },
});