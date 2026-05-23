import React, { useEffect, useRef } from "react";
import { Animated, Pressable, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
  accentColor?: string;
  softColor?: string;
};

export default function QuickActionCard({
  title,
  subtitle,
  icon,
  onPress,
  accentColor = "#2563EB",
  softColor = "#EFF6FF",
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const arrowMove = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 28,
        bounciness: 7,
      }),
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 28,
        bounciness: 7,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 6,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.animated, { transform: [{ scale }] }]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <View style={[styles.blurCircle, { backgroundColor: softColor }]} />

        <View style={styles.topRow}>
          <View style={[styles.iconBox, { backgroundColor: softColor }]}>
            <Ionicons name={icon} size={28} color={accentColor} />
          </View>

          <View style={styles.arrowBox}>
            <Ionicons name="chevron-forward" size={18} color={accentColor} />
          </View>
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <Text numberOfLines={2} style={styles.subtitle}>
          {subtitle}
        </Text>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            onPress={onPress}
            style={[styles.actionButton, { backgroundColor: accentColor }]}
          >
            <Text style={styles.actionText}>Explore</Text>

            <Animated.View
              style={[
                styles.actionIconBox,
                {
                  transform: [{ translateX: arrowMove }],
                },
              ]}
            >
              <Ionicons name="arrow-forward" size={14} color={accentColor} />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animated: {
    width: "48%",
    marginBottom: 16,
  },

  card: {
    minHeight: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",

    shadowColor: "#0F172A",
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },

  blurCircle: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    right: -42,
    top: -42,
    opacity: 0.8,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },

  title: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 7,
    lineHeight: 18,
    fontWeight: "600",
  },

  actionButton: {
    height: 40,
    borderRadius: 15,
    marginTop: 16,
    paddingLeft: 14,
    paddingRight: 7,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#0F172A",
    shadowOpacity: 0.13,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  actionText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  actionIconBox: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});