import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ReelScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, floatAnim]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={16} color="#FF4D6D" />
          <Text style={styles.badgeText}>New Feature</Text>
        </View>

        <Animated.View
          style={[
            styles.iconWrap,
            {
              transform: [
                { translateY: floatAnim },
                { scale: pulseAnim },
                { rotate: "-5deg" },
              ],
            },
          ]}
        >
          <View style={styles.iconBox}>
            <MaterialCommunityIcons
              name="movie-open-play-outline"
              size={84}
              color="#FFFFFF"
            />

            <View style={styles.playCircle}>
              <Ionicons name="play" size={22} color="#FFFFFF" />
            </View>
          </View>
        </Animated.View>

        <Text style={styles.title}>Flys</Text>
        <Text style={styles.subtitle}>Short Learning Reels</Text>

        <Text style={styles.desc}>
          Powerful bite-sized videos, smart tips, motivational clips and quick
          lessons are coming soon for your growth.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardIcon}>
            <Ionicons name="rocket-outline" size={28} color="#FF4D6D" />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Coming Soon</Text>
            <Text style={styles.cardText}>
              We are preparing an amazing reels experience for Rank Flys users.
            </Text>
          </View>
        </View>

        <View style={styles.features}>
          <Feature icon="flash-outline" title="Quick" text="Concepts" />
          <Feature icon="school-outline" title="Smart" text="Learning" />
          <Feature icon="trending-up-outline" title="Daily" text="Growth" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={21} color="#FF4D6D" />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 14, // ✅ bottom gap removed
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF1F3",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#FFE1E7",
  },

  badgeText: {
    color: "#FF4D6D",
    fontSize: 13,
    fontWeight: "900",
  },

  iconWrap: {
    marginBottom: 26,
  },

  iconBox: {
    width: 162,
    height: 162,
    borderRadius: 42,
    backgroundColor: "#FF4D6D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF4D6D",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 12,
  },

  playCircle: {
    position: "absolute",
    right: -5,
    bottom: 10,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },

  title: {
    fontSize: 50,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: 0.5,
  },

  subtitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#FF4D6D",
    marginTop: 4,
    marginBottom: 12,
  },

  desc: {
    width: width - 52,
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 17,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F2F4",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 5,
  },

  cardIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFF1F3",
    alignItems: "center",
    justifyContent: "center",
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },

  cardText: {
    color: "#6B7280",
    fontSize: 13.5,
    lineHeight: 19,
  },

  features: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },

  feature: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F1F2F4",
  },

  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFF1F3",
    alignItems: "center",
    justifyContent: "center",
  },

  featureTitle: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
  },

  featureText: {
    color: "#6B7280",
    fontSize: 11.5,
    fontWeight: "700",
    marginTop: 2,
  },
});