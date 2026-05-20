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

        <Pressable
          style={styles.studyRoomCard}
          onPress={() => navigation.navigate("StudyRoom")}
        >
          <View style={styles.studyTop}>
            <View style={styles.studyIconBox}>
              <Ionicons name="radio-outline" size={27} color="#22C55E" />
            </View>

            <View style={styles.studyTextBox}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.studyTag}>LIVE FOCUS MODE</Text>
              </View>

              <Text style={styles.studyTitle}>Study Room</Text>

              <Text style={styles.studySubtitle}>
                Join live study room, start timer and stay focused with other students.
              </Text>
            </View>

            <View style={styles.studyArrowBox}>
              <Ionicons name="chevron-forward" size={21} color="#2563EB" />
            </View>
          </View>

          <View style={styles.studyBottom}>
            <View style={styles.studyMiniItem}>
              <Ionicons name="timer-outline" size={15} color="#2563EB" />
              <Text style={styles.studyMiniText}>Live Timer</Text>
            </View>

            <View style={styles.studyMiniItem}>
              <Ionicons name="people-outline" size={15} color="#22C55E" />
              <Text style={styles.studyMiniText}>Active Students</Text>
            </View>

            <View style={styles.studyMiniItem}>
              <Ionicons name="flame-outline" size={15} color="#F59E0B" />
              <Text style={styles.studyMiniText}>Focus Mode</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.toolsSoftWrap}>
          <Tools navigation={navigation} />
        </View>

        <SectionTitle title="Featured" subtitle="Recommended for you" />

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("Mentorship")}
        >
          <View style={[styles.featureIconBox, styles.mentorshipBox]}>
            <Ionicons name="people-outline" size={25} color="#7C3AED" />
          </View>

          <View style={styles.featureTextBox}>
            <Text style={[styles.featureTag, styles.mentorshipText]}>
              Expert Guidance
            </Text>
            <Text style={styles.featureTitle}>Mentorship Sessions</Text>
            <Text style={styles.featureSubtitle}>
              Get personal guidance from mentors for your study journey.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#7C3AED" />
        </Pressable>

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("Scholarship")}
        >
          <View style={[styles.featureIconBox, styles.scholarshipBox]}>
            <Ionicons name="trophy-outline" size={25} color="#2563EB" />
          </View>

          <View style={styles.featureTextBox}>
            <Text style={[styles.featureTag, styles.scholarshipText]}>
              Rewards & Contest
            </Text>
            <Text style={styles.featureTitle}>Scholarship Program</Text>
            <Text style={styles.featureSubtitle}>
              Join contests and unlock scholarship opportunities.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#2563EB" />
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
    paddingBottom: 42,
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

  studyRoomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#DCEBFF",
    shadowColor: "#2563EB",
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  studyTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  studyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginRight: 14,
  },

  studyTextBox: {
    flex: 1,
  },

  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 7,
  },

  studyTag: {
    fontSize: 11,
    fontWeight: "900",
    color: "#22C55E",
    letterSpacing: 0.7,
  },

  studyTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },

  studySubtitle: {
    marginTop: 5,
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 18,
  },

  studyArrowBox: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  studyBottom: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  studyMiniItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  studyMiniText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  mentorshipBox: {
    backgroundColor: "#F5F3FF",
  },

  scholarshipBox: {
    backgroundColor: "#EFF6FF",
  },

  featureTextBox: {
    flex: 1,
  },

  featureTag: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },

  mentorshipText: {
    color: "#7C3AED",
  },

  scholarshipText: {
    color: "#2563EB",
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