import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
} from "react-native";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Logo */}
      <Animated.Image
        source={require("../../assets/images/logo.png")}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        resizeMode="contain"
      />

      {/* App Name */}
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Rank Flys
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
        Smart Learning. Better Results.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 180,   // 🔥 bigger logo
    height: 180,
  },

  title: {
    marginTop: 20,
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#090909",
    fontWeight: "600",
  },
});