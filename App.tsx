import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
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
import { logCrash, recordError } from "./src/utils/crashlytics";

const BOOT_TIMEOUT_MS = 5000;
const STORAGE_TIMEOUT_MS = 3000;
const MIN_SPLASH_MS = 1200;
const FORCE_UPDATE_DELAY_MS = 800;

export default function App() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [bootTimeoutDone, setBootTimeoutDone] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState("");

  const loadTokens = useAuthStore((s) => s.loadTokens);
  const authReady = useAuthStore((s) => s.isReady);

  const loadApp = useAppStore((s) => s.loadApp);
  const appReady = useAppStore((s) => s.isAppReady);

  const [fontsLoaded, fontError] = useFonts({
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
        minimumFetchIntervalMillis: __DEV__
          ? 0
          : 4 * 60 * 60 * 1000,
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
    recordError(error, "App.tsx: Force update check error");
    }
  };

  useEffect(() => {
    let isMounted = true;
    let minSplashTimer: ReturnType<typeof setTimeout> | null = null;
    let bootTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let forceUpdateTimer: ReturnType<typeof setTimeout> | null = null;

    bootTimeoutTimer = setTimeout(() => {
      if (!isMounted) return;

      useAuthStore.setState({ isReady: true });
      useAppStore.setState({ isAppReady: true });

      setBootTimeoutDone(true);
      setShowCustomSplash(false);
    }, BOOT_TIMEOUT_MS);

    async function initApp() {
     try {
    logCrash("App init started");
    await initDatabase();

        await Promise.race([
          Promise.all([
            loadTokens(),
            loadApp(),
          ]),
          new Promise((resolve) =>
            setTimeout(resolve, STORAGE_TIMEOUT_MS)
          ),
        ]);

        const { accessToken, refreshToken } = useAuthStore.getState();

        if (accessToken && refreshToken) {
          await setAuthToken(accessToken, refreshToken);
        } else if (accessToken) {
          await setAuthToken(accessToken);
        }

        forceUpdateTimer = setTimeout(() => {
          checkForceUpdate().catch((error) => {
              console.log("Force update timer error:", error);
              recordError(error, "App.tsx: Force update timer error");
            });
        }, FORCE_UPDATE_DELAY_MS);
         } catch (error) {
        console.log("App Init Error:", error);
        recordError(error, "App.tsx: App Init Error");
        }finally {
        if (!isMounted) return;

        useAuthStore.setState({ isReady: true });
        useAppStore.setState({ isAppReady: true });

        minSplashTimer = setTimeout(() => {
          if (!isMounted) return;

          setShowCustomSplash(false);
          setBootTimeoutDone(true);
        }, MIN_SPLASH_MS);
      }
    }

    initApp();

    return () => {
      isMounted = false;

      if (minSplashTimer) {
        clearTimeout(minSplashTimer);
      }

      if (bootTimeoutTimer) {
        clearTimeout(bootTimeoutTimer);
      }

      if (forceUpdateTimer) {
        clearTimeout(forceUpdateTimer);
      }
    };
  }, [loadTokens, loadApp]);

  if (
    !bootTimeoutDone &&
    ((!fontsLoaded && !fontError) || !authReady || !appReady)
  ) {
    return <SplashScreen />;
  }

  if (!bootTimeoutDone && showCustomSplash) {
    return <SplashScreen />;
  }

  if (forceUpdate) {
    return <ForceUpdateScreen updateUrl={updateUrl} />;
  }

  return <RootNavigator />;
}