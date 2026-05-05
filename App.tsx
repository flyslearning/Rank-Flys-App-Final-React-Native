import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";

import RootNavigator from "./src/navigation/RootNavigator";
import SplashScreen from "./src/screens/extrascreens/SplashScreen";

import { useAuthStore } from "./src/store/auth.store";
import { useAppStore } from "./src/store/app.store";

import { initDatabase } from "./src/db/database";

export default function App() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  const loadTokens = useAuthStore((s) => s.loadTokens);
  const authReady = useAuthStore((s) => s.isReady);

  const loadApp = useAppStore((s) => s.loadApp);
  const appReady = useAppStore((s) => s.isAppReady);

  const [fontsLoaded] = useFonts({
    Bungee: require("./src/assets/fonts/Bungee-Regular.ttf"),
    TitanOne: require("./src/assets/fonts/TitanOne.ttf"),
    Geologica: require("./src/assets/fonts/Geologica.ttf"),
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    async function initApp() {
      try {
        // Ye database.ts me ebook + test sab tables create kar raha hai
        initDatabase();

        await Promise.all([loadTokens(), loadApp()]);
      } catch (error) {
        console.log("App Init Error:", error);
      } finally {
        timer = setTimeout(() => {
          if (isMounted) {
            setShowCustomSplash(false);
          }
        }, 1500);
      }
    }

    initApp();

    return () => {
      isMounted = false;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loadTokens, loadApp]);

  if (!fontsLoaded || !authReady || !appReady) {
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

  if (showCustomSplash) {
    return <SplashScreen />;
  }

  return <RootNavigator />;
}