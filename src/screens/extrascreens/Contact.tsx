// src/screens/ContactUsScreen.tsx

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  Animated,
  Linking,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isSmall = width < 380;

export default function Contact({ navigation }: any) {
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(30)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;

  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.55)).current;

  const cardFade = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(heroY, {
        toValue: 0,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        damping: 15,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 700,
        delay: 220,
        useNativeDriver: true,
      }),
      Animated.spring(cardY, {
        toValue: 0,
        delay: 220,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -9,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const openMail = () => Linking.openURL("mailto:contact@rankflys.com");
  const openPhone = () => Linking.openURL("tel:+918527313375");
  const openMap = () =>
    Linking.openURL(
      "https://share.google/OEGK0TBScRar3vRri"
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroFade,
              transform: [{ translateY: heroY }, { scale: heroScale }],
            },
          ]}
        >
          <Animated.View style={[styles.glowOne, { opacity: pulse }]} />
          <View style={styles.glowTwo} />

          <Animated.View style={[styles.heroIcon, { transform: [{ translateY: float }] }]}>
            <Ionicons name="headset-outline" size={39} color="#FFFFFF" />
          </Animated.View>

          <Text style={styles.kicker}>RANK FLYS SUPPORT</Text>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.subtitle}>
            Need help with app, payments, account, tests or study material? Our team is ready to support you.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardFade,
              transform: [{ translateY: cardY }],
            },
          ]}
        >
          <ContactItem
            index={0}
            icon="mail-outline"
            title="Email Support"
            value="contact@rankflys.com"
            buttonText="Mail"
            onPress={openMail}
          />

          <ContactItem
            index={1}
            icon="call-outline"
            title="Phone Number"
            value="+91 8527313375"
            buttonText="Call"
            onPress={openPhone}
          />

          <ContactItem
            index={2}
            icon="location-outline"
            title="Office Address"
            value="Sector 63, Noida, Uttar Pradesh 201301"
            buttonText="Map"
            onPress={openMap}
            isLast
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.noteCard,
            {
              opacity: cardFade,
              transform: [{ translateY: cardY }],
            },
          ]}
        >
          <View style={styles.noteIcon}>
            <Ionicons name="time-outline" size={25} color="#2563EB" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle}>Support Hours</Text>
            <Text style={styles.noteText}>Monday to Saturday • 10:00 AM to 7:00 PM</Text>
          </View>
        </Animated.View>

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#2563EB" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactItem({
  icon,
  title,
  value,
  buttonText,
  onPress,
  isLast,
}: {
  index: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  buttonText: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloat, {
          toValue: -4,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(iconFloat, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={[styles.contactItem, isLast && styles.lastItem]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <Animated.View style={[styles.iconBox, { transform: [{ translateY: iconFloat }] }]}>
          <Ionicons name={icon} size={24} color="#2563EB" />
        </Animated.View>

        <View style={styles.contactTextBox}>
          <Text style={styles.contactTitle}>{title}</Text>
          <Text style={styles.contactValue}>{value}</Text>
        </View>

        <View style={styles.smallButton}>
          <Text style={styles.smallButtonText}>{buttonText}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingHorizontal: isSmall ? 14 : 20,
    paddingTop: Platform.OS === "android" ? 14 : 8,
    paddingBottom: 50,
  },

  hero: {
    backgroundColor: "#2563EB",
    borderRadius: 36,
    padding: isSmall ? 22 : 26,
    overflow: "hidden",
    marginBottom: 18,
    shadowColor: "#2563EB",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },

  glowOne: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255,255,255,0.18)",
    right: -80,
    top: -85,
  },

  glowTwo: {
    position: "absolute",
    width: 135,
    height: 135,
    borderRadius: 68,
    backgroundColor: "rgba(255,255,255,0.09)",
    left: -45,
    bottom: -45,
  },

  heroIcon: {
    width: 78,
    height: 78,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    marginBottom: 20,
  },

  kicker: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  title: {
    color: "#FFFFFF",
    fontSize: isSmall ? 30 : 35,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -1,
  },

  subtitle: {
    color: "#DBEAFE",
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#2563EB",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  contactItem: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#EFF6FF",
  },

  lastItem: {
    borderBottomWidth: 0,
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  contactTextBox: {
    flex: 1,
    paddingRight: 8,
  },

  contactTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  contactValue: {
    marginTop: 5,
    fontSize: isSmall ? 11 : 12,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 18,
  },

  smallButton: {
    height: 39,
    minWidth: 54,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  noteCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2,
  },

  noteIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  noteTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  noteText: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 19,
  },

  backButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  backText: {
    color: "#2563EB",
    fontSize: 15,
    fontWeight: "900",
  },
});