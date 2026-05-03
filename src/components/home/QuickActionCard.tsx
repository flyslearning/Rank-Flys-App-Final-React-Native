import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  View,
} from "react-native";

type Props = {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
};

export default function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <Animated.View style={[styles.animated, { transform: [{ scale }] }]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={styles.topRow}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          <View style={styles.arrowBox}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <Text numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animated: {
    width: "48%",
    marginBottom: 14,
  },

  card: {
    minHeight: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,

    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 25,
  },

  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  arrow: {
    fontSize: 24,
    color: "#2563EB",
    fontWeight: "900",
    marginTop: -2,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 7,
    lineHeight: 18,
    fontWeight: "500",
  },
});