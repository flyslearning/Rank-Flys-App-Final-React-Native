import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  subtitle: string;
  progress?: number;
  onPress: () => void;
};

export default function ContinueLearningCard({
  title,
  subtitle,
  progress = 45,
  onPress,
}: Props) {
  const safeProgress = Math.max(0, Math.min(progress, 100));

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.glowCircleOne} />
      <View style={styles.glowCircleTwo} />

      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Ionicons name="book-outline" size={26} color="#FFFFFF" />
        </View>

        <View style={styles.badge}>
          <Ionicons name="flash" size={13} color="#FACC15" />
          <Text style={styles.badgeText}>IN PROGRESS</Text>
        </View>
      </View>

      <Text style={styles.label}>Continue Learning</Text>

      <Text numberOfLines={2} style={styles.title}>{title}</Text>

      <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.bottomRow}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressNumber}>{safeProgress}%</Text>
          <Text style={styles.progressLabel}>completed</Text>
        </View>

        <View style={styles.playButton}>
          <Ionicons name="play" size={18} color="#2563EB" />
        </View>
      </View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${safeProgress}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#2563EB",
    borderRadius: 30,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  glowCircleOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.13)",
    right: -55,
    top: -60,
  },
  glowCircleTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    left: -45,
    bottom: -50,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  badge: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(15,23,42,0.22)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  label: {
    fontSize: 13,
    color: "#DBEAFE",
    fontWeight: "800",
    marginTop: 18,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: "#DBEAFE",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 7,
  },
  bottomRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  progressNumber: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },
  progressLabel: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    marginBottom: 5,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.24)",
    borderRadius: 20,
    marginTop: 14,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
  },
});