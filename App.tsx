import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";

import RootNavigator from "./src/navigation/RootNavigator";
import SplashScreen from "./src/screens/extrascreens/SplashScreen";
import IntroSliderScreen from "./src/screens/extrascreens/IntroSliderScreen";

import { useAuthStore } from "./src/store/auth.store";
import { useAppStore } from "./src/store/app.store";

export default function App() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // 🔐 Auth
  const loadTokens = useAuthStore((s) => s.loadTokens);
  const authReady = useAuthStore((s) => s.isReady);

  // 📦 App State
  const loadApp = useAppStore((s) => s.loadApp);
  const appReady = useAppStore((s) => s.isAppReady);
  const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);

  // 🔤 Fonts Load
  const [fontsLoaded] = useFonts({
    Bungee: require("./src/assets/fonts/Bungee-Regular.ttf"),
    TitanOne: require("./src/assets/fonts/TitanOne.ttf"),
    Geologica: require("./src/assets/fonts/Geologica.ttf"),
  });

  // 🚀 Init App
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([loadTokens(), loadApp()]);
      } catch (e) {
        console.log("App Init Error:", e);
      } finally {
        // smooth splash delay
        setTimeout(() => {
          setShowCustomSplash(false);
        }, 1500);
      }
    };

    init();
  }, []);

  // 🔥 Loader Phase
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // 🔥 Splash Phase
  if (showCustomSplash || !authReady || !appReady) {
    return <SplashScreen />;
  }

  // 🔥 Intro Slider
  if (!hasSeenIntro) {
    return <IntroSliderScreen />;
  }

  // 🔥 Main App
  return <RootNavigator />;
}