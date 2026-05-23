// src/screens/ToolPage.tsx

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isSmall = width < 380;

type ToolItem = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  screen: string;
  badge: string;
};

const tools: ToolItem[] = [
  {
    title: "Study Planner",
    subtitle: "Create your daily study schedule and manage study time.",
    icon: "calendar-outline",
    color: "#2563EB",
    bg: "#EFF6FF",
    screen: "StudyPlanner",
    badge: "Plan",
  },
  {
    title: "Syllabus Tracker",
    subtitle: "Track chapters, topics and subject-wise completion.",
    icon: "checkbox-outline",
    color: "#7C3AED",
    bg: "#F5F3FF",
    screen: "SyllabusTracker",
    badge: "Track",
  },
  {
    title: "Study Technique",
    subtitle: "Use Pomodoro, active recall and revision techniques.",
    icon: "bulb-outline",
    color: "#EA580C",
    bg: "#FFF7ED",
    screen: "StudyTechnique",
    badge: "Focus",
  },
  {
    title: "Flashcards",
    subtitle: "Revise faster with smart cards and improve retention.",
    icon: "albums-outline",
    color: "#059669",
    bg: "#ECFDF5",
    screen: "FlashCard",
    badge: "Revise",
  },
];

export default function ToolPage({ navigation }: any) {
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>SMART LEARNING</Text>
          <Text style={styles.title}>All Study Tools</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {tools.map((tool) => (
          <Pressable
            key={tool.title}
            style={styles.card}
            onPress={() => navigation.navigate(tool.screen)}
          >
            <View style={[styles.bigCircle, { backgroundColor: tool.bg }]} />

            <View style={[styles.iconBox, { backgroundColor: tool.bg }]}>
              <Ionicons name={tool.icon} size={30} color={tool.color} />
            </View>

            <View style={styles.textBox}>
              <View style={styles.row}>
                <Text style={styles.cardTitle}>{tool.title}</Text>

                <View style={[styles.badge, { backgroundColor: tool.bg }]}>
                  <Text style={[styles.badgeText, { color: tool.color }]}>
                    {tool.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.subtitle}>{tool.subtitle}</Text>
            </View>

            <View style={[styles.arrowBox, { backgroundColor: tool.color }]}>
              <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
            </View>
          </Pressable>
        ))}

        <Animated.View
          style={[
            styles.bottomNote,
            {
              opacity: fade,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          <Text style={styles.bottomTitle}>More Tools Coming Soon </Text>
          <Text style={styles.bottomText}>
            Our team is working on more helpful tools that will make your study
            planning, revision and learning journey even smarter.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: 1,
    marginBottom: 3,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.6,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 40,
  },
  card: {
    minHeight: 128,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: isSmall ? 14 : 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },
  bigCircle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -58,
    top: -55,
    opacity: 0.9,
  },
  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  textBox: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 19,
  },
  arrowBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  bottomNote: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  bottomTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  bottomText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    lineHeight: 21,
    textAlign: "center",
  },
});