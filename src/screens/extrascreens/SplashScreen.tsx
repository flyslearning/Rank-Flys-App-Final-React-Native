import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from "react-native";

import { useAppStore } from "../../store/app.store";
import { useAuthStore } from "../../store/auth.store";
import { checkAndMigrateAppData } from "../../utils/version";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
  const initSplash = async () => {
    try {
    await Promise.race([
    checkAndMigrateAppData(),
    new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    } catch (error) {
      console.log("Migration error:", error);
    }

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

    console.log("Intro seen:", hasSeenIntro);
    console.log("Token:", accessToken);
  };

    initSplash();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

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

      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Rank Flys
      </Animated.Text>

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
    width: 180,
    height: 180,
  },
  title: {
    marginTop: 20,
    fontSize: 32,
    fontWeight: "100",
    fontFamily: "TitanOne",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#090909",
    fontWeight: "600",
  },
});