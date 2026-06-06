import React, { useEffect, useState } from "react";
import { Platform, AppState } from "react-native";
import remoteConfig from "@react-native-firebase/remote-config";
import * as Application from "expo-application";
import ForceUpdateScreen from "./src/screens/extrascreens/ForceUpdateScreen";
import { isVersionLower } from "./src/utils/version";
import { useFonts } from "expo-font";
import RootNavigator from "./src/navigation/RootNavigator";
import SplashScreen from "./src/screens/extrascreens/SplashScreen";
import { useAuthStore } from "./src/store/auth.store";
import { useAppStore } from "./src/store/app.store";
import { setAuthToken } from "./src/api/client";
import { initDatabase } from "./src/db/database";


export default function App() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState("");

  const loadTokens = useAuthStore((s) => s.loadTokens);
  const refreshAccessToken = useAuthStore((s) => s.refreshAccessToken);
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

        await Promise.race([
          Promise.all([loadTokens(), loadApp()]),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
        const { accessToken, refreshToken } = useAuthStore.getState();

        if (accessToken && refreshToken) {
            await setAuthToken(accessToken, refreshToken);
          } else if (accessToken) {
            await setAuthToken(accessToken);
          }

        if (accessToken && refreshToken) {
          try {
            await refreshAccessToken();
          } catch (error) {
            console.log("Initial token refresh failed:", error);
          }
        }

        await Promise.race([
          checkForceUpdate(),
          new Promise((resolve) => setTimeout(resolve, 5000)),
        ]);
           } catch (error) {
            console.log("App Init Error:", error);
            setCheckingUpdate(false);
            useAuthStore.setState({ isReady: true });
            useAppStore.setState({ isAppReady: true });
          } finally {
        useAuthStore.setState({ isReady: true });
        useAppStore.setState({ isAppReady: true });
        setCheckingUpdate(false);

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
  }, [loadTokens, loadApp, refreshAccessToken]);

  useEffect(() => {
  let lastRefreshTime = 0;

  const sub = AppState.addEventListener("change", async (state) => {
    if (state !== "active") return;

    const now = Date.now();

    // 5 minutes ke andar dobara refresh mat karo
    if (now - lastRefreshTime < 5 * 60 * 1000) return;

    lastRefreshTime = now;

    const { accessToken, refreshToken, refreshAccessToken } =
      useAuthStore.getState();

    if (accessToken && refreshToken) {
      await refreshAccessToken();
    }
  });

  return () => sub.remove();
}, []);

  if (!fontsLoaded || !authReady || !appReady || checkingUpdate) {
  return <SplashScreen />;
  }

  if (showCustomSplash) {
    return <SplashScreen />;
  }

  if (forceUpdate) {
    return <ForceUpdateScreen updateUrl={updateUrl} />;
  }

  return <RootNavigator />;
}