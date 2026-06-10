import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ClassroomHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.backButton}
        onPress={onBack}
      >
        <Ionicons name="chevron-back" size={24} color="#111827" />
      </TouchableOpacity>

      <View style={styles.titleBox}>
        <Text style={styles.subTitle}>Welcome to</Text>
        <Text style={styles.topTitle}>Personalized Study</Text>
      </View>

      <View style={styles.iconBadge}>
        <Ionicons name="school-outline" size={22} color="#2563EB" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FB",
  },

  backButton: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  titleBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },

  subTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  topTitle: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },

  iconBadge: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
});