// src/screens/HomeScreen.tsx

import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Text,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import HomeHeader from "../components/home/HomeHeader";
import ContinueLearningCard from "../components/home/ContinueCard";
import QuickActionCard from "../components/home/QuickActionCard";
import SectionTitle from "../components/home/SectionTitle";
import Tools from "../components/home/Tools";

export default function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.fixedHeader}>
        <HomeHeader
          navigation={navigation}
          placeholder="Search ebooks, tests..."
          onSearchChange={(text: string) => console.log(text)}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ContinueLearningCard />

        <View style={styles.quickSection}>
          <SectionTitle title="Quick Actions" subtitle="Start learning instantly" />

          <View style={styles.grid}>
            <QuickActionCard
              title="E-Books"
              subtitle="Read premium notes and PDFs"
              icon="book-outline"
              accentColor="#2563EB"
              softColor="#EFF6FF"
              onPress={() => navigation.navigate("EbookSeries")}
            />

            <QuickActionCard
              title="Test Series"
              subtitle="Attempt mock tests and quizzes"
              icon="document-text-outline"
              accentColor="#7C3AED"
              softColor="#F5F3FF"
              onPress={() => navigation.navigate("TestSeries")}
            />
          </View>
        </View>

        <View style={styles.toolsSoftWrap}>
          <Tools navigation={navigation} />
        </View>

        <SectionTitle title="Featured" subtitle="Recommended for you" />

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("Mentorship")}
        >
          <View style={styles.featureIconBox}>
            <Ionicons name="people-outline" size={25} color="#2563EB" />
          </View>

          <View style={styles.featureTextBox}>
            <Text style={styles.featureTag}>Expert Guidance</Text>
            <Text style={styles.featureTitle}>Mentorship Sessions</Text>
            <Text style={styles.featureSubtitle}>
              Get personal guidance from mentors for your study journey.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#2563EB" />
        </Pressable>

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("Scholarship")}
        >
          <View style={[styles.featureIconBox, styles.purpleBox]}>
            <Ionicons name="trophy-outline" size={25} color="#7C3AED" />
          </View>

          <View style={styles.featureTextBox}>
            <Text style={[styles.featureTag, styles.purpleText]}>
              Rewards & Contest
            </Text>
            <Text style={styles.featureTitle}>Scholarship Program</Text>
            <Text style={styles.featureSubtitle}>
              Join contests and unlock scholarship opportunities.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#7C3AED" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  fixedHeader: {
    backgroundColor: "#F8FAFC",
    zIndex: 999,
    elevation: 6,
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },

  quickSection: {
    marginTop: -10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  toolsSoftWrap: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },

  featureIconBox: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  purpleBox: {
    backgroundColor: "#F5F3FF",
  },

  featureTextBox: {
    flex: 1,
  },

  featureTag: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
    marginBottom: 5,
  },

  purpleText: {
    color: "#7C3AED",
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  featureSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 5,
    lineHeight: 18,
  },
});