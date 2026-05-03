import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native";

import HomeHeader from "../components/home/HomeHeader";
import QuickActionCard from "../components/home/QuickActionCard";
import ContinueLearningCard from "../components/home/ContinueCard";
import SectionTitle from "../components/home/SectionTitle";

export default function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader name="Student" />

        <ContinueLearningCard
          title="Mathematics Ebook"
          subtitle="Chapter 2 • Algebra Basics"
          progress={45}
          onPress={() => navigation.navigate("EbookSeries")}
        />

        <SectionTitle title="Quick Actions" />

        <View style={styles.grid}>
          <QuickActionCard
            title="Ebooks"
            subtitle="Read notes and PDFs"
            icon="📚"
            onPress={() => navigation.navigate("EbookSeries")}
          />
           <QuickActionCard
            title="Ebooks"
            subtitle="Read notes and PDFs"
            icon="📚"
            onPress={() => navigation.navigate("EbookSeries")}
          />
           <QuickActionCard
            title="Ebooks"
            subtitle="Read notes and PDFs"
            icon="📚"
            onPress={() => navigation.navigate("EbookSeries")}
          />

          <QuickActionCard
            title="Tests"
            subtitle="Attempt mock tests"
            icon="📝"
            onPress={() => navigation.navigate("TestSeries")}
          />

        
        </View>

        <SectionTitle title="Featured" rightText="View all" />

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("TestSeries")}
        >
          <View>
            <Text style={styles.featureTag}>New Test Series</Text>
            <Text style={styles.featureTitle}>Weekly Practice Test</Text>
            <Text style={styles.featureSubtitle}>
              Improve your preparation with chapter-wise tests.
            </Text>
          </View>

          <Text style={styles.arrow}>→</Text>
        </Pressable>

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("EbookSeries")}
        >
          <View>
            <Text style={styles.featureTag}>Popular Ebook</Text>
            <Text style={styles.featureTitle}>Complete Study Material</Text>
            <Text style={styles.featureSubtitle}>
              Access important PDFs and topic-wise notes.
            </Text>
          </View>

          <Text style={styles.arrow}>→</Text>
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  featureTag: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "700",
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 17,
    color: "#0F172A",
    fontWeight: "800",
  },
  featureSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 26,
    color: "#2563EB",
    fontWeight: "800",
  },
});