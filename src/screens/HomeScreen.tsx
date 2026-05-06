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
import FlashCard from "../components/home/FlashCard";

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
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroLabel}>Welcome back 👋</Text>
            <Text style={styles.heroTitle}>Ready to learn today?</Text>
            <Text style={styles.heroSubtitle}>
              Continue your preparation with smart tools and tests.
            </Text>
          </View>

          <View style={styles.heroIconBox}>
            <Ionicons name="school-outline" size={30} color="#FFFFFF" />
          </View>
        </View>

        <ContinueLearningCard
          title="Mathematics Ebook"
          subtitle="Chapter 2 • Algebra Basics"
          progress={45}
          onPress={() => navigation.navigate("EbookSeries")}
        />

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

        {/* Tools section: Study Planner, Syllabus Tracker, Study Technique, Flashcards */}
        <Tools navigation={navigation} />

        <FlashCard />

        <SectionTitle title="Featured" subtitle="Recommended for you" />

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("TestSeries")}
        >
          <View style={styles.featureIconBox}>
            <Ionicons name="analytics-outline" size={25} color="#2563EB" />
          </View>

          <View style={styles.featureTextBox}>
            <Text style={styles.featureTag}>New Practice</Text>
            <Text style={styles.featureTitle}>Weekly Practice Test</Text>
            <Text style={styles.featureSubtitle}>
              Chapter-wise tests with instant performance tracking.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#2563EB" />
        </Pressable>

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("EbookSeries")}
        >
          <View style={[styles.featureIconBox, styles.purpleBox]}>
            <Ionicons name="library-outline" size={25} color="#7C3AED" />
          </View>

          <View style={styles.featureTextBox}>
            <Text style={[styles.featureTag, styles.purpleText]}>
              Popular Material
            </Text>
            <Text style={styles.featureTitle}>Complete Study Notes</Text>
            <Text style={styles.featureSubtitle}>
              Access topic-wise PDFs, notes and revision material.
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
    elevation: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: "#0F172A",
    borderRadius: 30,
    padding: 22,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#93C5FD",
    marginBottom: 7,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#CBD5E1",
    marginTop: 8,
    lineHeight: 19,
    maxWidth: 235,
  },
  heroIconBox: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
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
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
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