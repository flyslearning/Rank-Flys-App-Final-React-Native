import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const WHAT_YOU_GET = [
  "Live Online Classes with Offline Classroom Feel",
  "Small Batch of Only 20 Students",
  "Daily Practice Questions and Assignments",
  "Weekly Tests and Performance Reports",
  "Live Doubt Solving Sessions",
];

export default function WhatYouGet() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const rowAnims = useRef(
    WHAT_YOU_GET.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.stagger(
      130,
      rowAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.38],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View style={[styles.glowOne, { opacity: glowOpacity }]} />
      <Animated.View style={[styles.glowTwo, { opacity: glowOpacity }]} />

      <View style={styles.topBadge}>
        <Ionicons name="school-outline" size={14} color="#60A5FA" />
        <Text style={styles.badgeText}>Premium Learning Benefits</Text>
      </View>

      <View style={styles.header}>
        <Animated.View
          style={[styles.iconBox, { transform: [{ translateY: floatY }] }]}
        >
          <Ionicons name="sparkles-outline" size={25} color="#60A5FA" />
        </Animated.View>

        <View style={styles.headerText}>
          <Text style={styles.title}>What You Get</Text>
          <Text style={styles.subtitle}>Designed for focused learning</Text>
        </View>
      </View>

      <View style={styles.list}>
        {WHAT_YOU_GET.map((item, index) => {
          const anim = rowAnims[index];

          const translateX = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-18, 0],
          });

          const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.96, 1],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.row,
                index === WHAT_YOU_GET.length - 1 && styles.lastRow,
                {
                  opacity: anim,
                  transform: [{ translateX }, { scale }],
                },
              ]}
            >
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#60A5FA" />
              </View>

              <Text style={styles.text}>{item}</Text>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 18,
    backgroundColor: "#F7FBFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E0F2FE",
    shadowColor: "#93C5FD",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    overflow: "hidden",
  },

  glowOne: {
    position: "absolute",
    top: -55,
    right: -55,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#DBEAFE",
  },

  glowTwo: {
    position: "absolute",
    bottom: -45,
    left: -45,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#ECFEFF",
  },

  topBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  badgeText: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
    letterSpacing: 0.2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#BFDBFE",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1E3A8A",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13.5,
    fontWeight: "800",
    color: "#64748B",
  },

  list: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  checkCircle: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },

  text: {
    flex: 1,
    color: "#000000",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "800",
  },
});