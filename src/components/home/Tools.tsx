// src/components/home/Tools.tsx

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  navigation?: any;
};

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
    subtitle: "Create your daily study schedule",
    icon: "calendar-outline",
    color: "#2563EB",
    bg: "#EFF6FF",
    screen: "StudyPlanner",
    badge: "Plan",
  },
  {
    title: "Syllabus Tracker",
    subtitle: "Track chapters and topic progress",
    icon: "checkbox-outline",
    color: "#7C3AED",
    bg: "#F5F3FF",
    screen: "SyllabusTracker",
    badge: "Track",
  },
  {
    title: "Study Technique",
    subtitle: "Pomodoro, active recall and revision",
    icon: "bulb-outline",
    color: "#EA580C",
    bg: "#FFF7ED",
    screen: "StudyTechnique",
    badge: "Focus",
  },
  {
    title: "Flashcards",
    subtitle: "Revise faster with smart cards and improve score",
    icon: "albums-outline",
    color: "#059669",
    bg: "#ECFDF5",
    screen: "FlashCard",
    badge: "Revise",
  },
];

function ToolCard({
  tool,
  index,
  navigation,
}: {
  tool: ToolItem;
  index: number;
  navigation?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(22)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;
  const arrowMove = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 140,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloat, {
          toValue: -6,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(iconFloat, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowMove, {
          toValue: 4,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(arrowMove, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const goToScreen = () => {
    navigation?.navigate?.(tool.screen);
  };

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 30,
      bounciness: 7,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 7,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.animatedCard,
        {
          opacity: fade,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <Pressable
        onPress={goToScreen}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.card}
      >
        <View style={[styles.softCircleLarge, { backgroundColor: tool.bg }]} />
        <View style={[styles.softCircleSmall, { backgroundColor: tool.color }]} />

        <View style={styles.topRow}>
          <Animated.View
            style={[
              styles.iconBox,
              {
                backgroundColor: tool.bg,
                transform: [{ translateY: iconFloat }],
              },
            ]}
          >
            <Ionicons name={tool.icon} size={30} color={tool.color} />
          </Animated.View>

          <View style={[styles.badge, { backgroundColor: tool.bg }]}>
            <Text style={[styles.badgeText, { color: tool.color }]}>
              {tool.badge}
            </Text>
          </View>
        </View>

        <View style={styles.textArea}>
          <Text numberOfLines={1} style={styles.title}>
            {tool.title}
          </Text>

          <Text numberOfLines={3} style={styles.subtitle}>
            {tool.subtitle}
          </Text>
        </View>

        <Pressable
          onPress={goToScreen}
          style={({ pressed }) => [
            styles.openButton,
            {
              backgroundColor: tool.color,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={styles.openButtonText}>Open Tool</Text>

          <Animated.View
            style={[
              styles.openIconCircle,
              {
                transform: [{ translateX: arrowMove }],
              },
            ]}
          >
            <Ionicons name="arrow-forward" size={14} color={tool.color} />
          </Animated.View>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export default function Tools({ navigation }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>SMART LEARNING</Text>
          <Text style={styles.heading}>Study Tools</Text>
          <Text style={styles.subHeading}>Plan, track and revise smarter</Text>
        </View>

        <Pressable
          style={styles.viewAllBtn}
          onPress={() => navigation?.navigate?.("Study Tools")}
        >
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="arrow-forward" size={14} color="#2563EB" />
        </Pressable>
      </View>

      <View style={styles.scrollShell}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tools.map((tool, index) => (
            <ToolCard
              key={tool.title}
              tool={tool}
              index={index}
              navigation={navigation}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 18,
    marginBottom: 24,
  },

  headerRow: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2563EB",
    letterSpacing: 1,
    marginBottom: 4,
  },

  heading: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.6,
  },

  subHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 4,
  },

  viewAllBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  viewAllText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2563EB",
  },

  scrollShell: {
    borderRadius: 34,
    overflow: "visible",
  },

  scrollContent: {
    paddingRight: 20,
    paddingBottom: 8,
  },

  animatedCard: {
    marginRight: 16,
    borderRadius: 34,
  },

  card: {
    width: 220,
    minHeight: 258,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",

    shadowColor: "#0F172A",
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  softCircleLarge: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -60,
    right: -52,
    opacity: 0.95,
  },

  softCircleSmall: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    right: 26,
    bottom: 88,
    opacity: 0.08,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 14,
    fontWeight: "900",
  },

  textArea: {
    marginBottom: 26,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.35,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 10,
  },

  openButton: {
    height: 48,
    borderRadius: 18,
    marginTop: "auto",
    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  openButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  openIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});