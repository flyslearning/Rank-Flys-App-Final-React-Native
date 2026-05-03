import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";

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
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>📖</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Continue Learning</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.progressText}>{progress}% completed</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  icon: {
    fontSize: 26,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#DBEAFE",
    fontWeight: "600",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  subtitle: {
    color: "#DBEAFE",
    fontSize: 13,
    marginTop: 4,
  },
  progressBg: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    marginTop: 18,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    alignSelf: "flex-end",
  },
});