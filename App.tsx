import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";

import RootNavigator from "./src/navigation/RootNavigator";
import SplashScreen from "./src/screens/extrascreens/SplashScreen";

import { useAuthStore } from "./src/store/auth.store";
import { useAppStore } from "./src/store/app.store";

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
    let timer: ReturnType<typeof setTimeout>;

    async function initApp() {
      try {
        await Promise.all([
          loadTokens(),
          loadApp(),
        ]);
      } catch (error) {
        console.log("App Init Error:", error);
      } finally {
        timer = setTimeout(() => {
          setShowCustomSplash(false);
        }, 1500);
      }
    }

    initApp();

    return () => {
      if (timer) clearTimeout(timer);
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