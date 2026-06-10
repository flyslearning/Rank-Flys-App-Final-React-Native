import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

const PHONE_NUMBER = "+918527313375";

export default function ClassroomEnquiryCard() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(26)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

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
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

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
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.content}>
        <View style={styles.left}>
          <View style={styles.badge}>
            <Ionicons name="chatbubbles-outline" size={13} color="#3B82F6" />
            <Text style={styles.badgeText}>Quick Enquiry</Text>
          </View>

          <Text style={styles.title}>Need classroom help?</Text>

          <Text style={styles.subtitle}>Talk to our counsellor.</Text>
        </View>

        <Animated.View
          style={[styles.animationBox, { transform: [{ translateY: floatY }] }]}
        >
          <LottieView
            source={require("../../assets/animations/customercare.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.buttonWrapper, { transform: [{ scale: pulseScale }] }]}
      >
        <Pressable
          onPress={handleCall}
          style={({ pressed }) => [
            styles.callButton,
            pressed && styles.callButtonPressed,
          ]}
        >
          <Ionicons name="call" size={17} color="#FFFFFF" />
          <Text style={styles.callText}>Call Now</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 30,
    backgroundColor: "#F8FCFF",
    borderWidth: 1,
    borderColor: "#DCEEFF",
    shadowColor: "#93C5FD",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    overflow: "hidden",
  },

  glowOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#E0F2FE",
    top: -70,
    right: -60,
  },

  glowTwo: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#F0FDFA",
    bottom: -55,
    left: -45,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 150,
  },

  left: {
    flex: 1,
    paddingRight: 4,
    justifyContent: "center",
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },

  badgeText: {
    marginLeft: 5,
    color: "#3B82F6",
    fontSize: 11.5,
    fontWeight: "900",
  },

  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: "#1E3A8A",
    letterSpacing: -0.35,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: "#64748B",
  },

  animationBox: {
    width: 165,
    height: 165,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },

  lottie: {
    width: 180,
    height: 180,
  },

  buttonWrapper: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },

  callButton: {
    minWidth: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  callButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  callText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});