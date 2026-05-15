import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import remoteConfig from "@react-native-firebase/remote-config";
import * as Application from "expo-application";
import ForceUpdateScreen from "./src/screens/extrascreens/ForceUpdateScreen";
import { isVersionLower } from "./src/utils/version";
import { useFonts } from "expo-font";

import RootNavigator from "./src/navigation/RootNavigator";
import SplashScreen from "./src/screens/extrascreens/SplashScreen";

import { useAuthStore } from "./src/store/auth.store";
import { useAppStore } from "./src/store/app.store";

import { initDatabase } from "./src/db/database";

export default function App() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState("");

  const loadTokens = useAuthStore((s) => s.loadTokens);
  const authReady = useAuthStore((s) => s.isReady);

  const loadApp = useAppStore((s) => s.loadApp);
  const appReady = useAppStore((s) => s.isAppReady);

  const [fontsLoaded] = useFonts({
    Bungee: require("./src/assets/fonts/Bungee-Regular.ttf"),
    TitanOne: require("./src/assets/fonts/TitanOne.ttf"),
    Geologica: require("./src/assets/fonts/Geologica.ttf"),
  });

  const checkForceUpdate = async () => {
    try {
      await remoteConfig().setDefaults({
        force_update: false,
        minimum_version: "1.0.0",
        android_update_url: "",
        ios_update_url: "",
      });

      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 0,
      });

      await remoteConfig().fetchAndActivate();

      const currentVersion = Application.nativeApplicationVersion || "1.0.0";

      const force = remoteConfig().getBoolean("force_update");
      const minimumVersion = remoteConfig().getString("minimum_version");

      const url =
        Platform.OS === "ios"
          ? remoteConfig().getString("ios_update_url")
          : remoteConfig().getString("android_update_url");

      if (force && isVersionLower(currentVersion, minimumVersion)) {
        setUpdateUrl(url);
        setForceUpdate(true);
      }
    } catch (error) {
      console.log("Force update check error:", error);
    } finally {
      setCheckingUpdate(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    async function initApp() {
      try {
        // Ye database.ts me ebook + test sab tables create kar raha hai
        initDatabase();

        await Promise.all([loadTokens(), loadApp()]);
        await checkForceUpdate();
      } catch (error) {
        console.log("App Init Error:", error);
        setCheckingUpdate(false);
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

  if (!fontsLoaded || !authReady || !appReady || checkingUpdate) {
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

  if (forceUpdate) {
    return <ForceUpdateScreen updateUrl={updateUrl} />;
  }

  return <RootNavigator />;
}