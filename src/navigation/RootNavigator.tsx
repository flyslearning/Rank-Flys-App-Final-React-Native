import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../types";

import { useAuthStore } from "../store/auth.store";
import { useAppStore } from "../store/app.store";

import IntroSliderScreen from "../screens/extrascreens/IntroSliderScreen";
import SendOtpScreen from "../screens/authscreens/SendOtpScreen";
import VerifyOtpScreen from "../screens/authscreens/VerifyOtpScreen";
import OnboardingScreen from "../screens/authscreens/OnboardingScreen";

import HomeScreen from "../screens/HomeScreen";

import TestSeriesScreen from "../screens/testscreens/TestSeriesScreen";
import TestsScreen from "../screens/testscreens/TestsScreen";
import TestAttemptScreen from "../screens/testscreens/TestAttemptScreen";
import ResultScreen from "../screens/testscreens/ResultScreen";
import AttemptsScreen from "../screens/testscreens/PreviousAttemptsScreen";
import ReelScreen from "../screens/reelscreens/ReelScreen";

import EbookSeriesScreen from "../screens/ebookscreens/EbookSeriesScreen";
import EbookNodesScreen from "../screens/ebookscreens/EbookNodesScreen";
import PdfViewerScreen from "../screens/ebookscreens/PdfViewerScreen";
import DoubtScreen from "../screens/DoubtScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "center",

        // 🔥 TOP HEADER TEXT BOLD
        headerTitleStyle: {
          fontWeight: "800",
        },

        // 🔥 BOTTOM TAB TEXT BOLD
        tabBarLabelStyle: {
          fontWeight: "800",
        },

        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "Home") iconName = "home-outline";
          if (route.name === "Tests") iconName = "clipboard-outline";
          if (route.name === "Flys") iconName = "play-circle-outline";
          if (route.name === "Ebooks") iconName = "book-outline";
          if (route.name === "Doubt") iconName = "help-circle-outline";
          

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />

      <Tab.Screen
        name="Tests"
        component={TestSeriesScreen}
        options={{ title: "Test Series", tabBarLabel: "Tests" }}
      />
      <Tab.Screen
        name="Flys"
        component={ReelScreen}
        options={{ headerShown: false }}
      />

      <Tab.Screen
        name="Ebooks"
        component={EbookSeriesScreen}
        options={{ title: "Ebook Library", tabBarLabel: "Ebooks" }}
      />

      <Tab.Screen
        name="Doubt"
        component={DoubtScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);

  const isLoggedIn = !!accessToken;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenIntro ? (
          <Stack.Screen name="IntroSlider" component={IntroSliderScreen} />
        ) : !isLoggedIn ? (
          <>
            <Stack.Screen name="SendOtp" component={SendOtpScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={BottomTabs} />

            <Stack.Screen name="Onboarding" component={OnboardingScreen} />

            <Stack.Screen
              name="TestSeries"
              component={TestSeriesScreen}
              options={{ headerShown: true, title: "Test Series" }}
            />

            <Stack.Screen
              name="Tests"
              component={TestsScreen}
              options={{ headerShown: true, title: "Tests" }}
            />

            <Stack.Screen
              name="TestAttempt"
              component={TestAttemptScreen}
              options={{ headerShown: true, title: "Attempt Test" }}
            />

            <Stack.Screen
              name="Attempts"
              component={AttemptsScreen}
              options={{ headerShown: true, title: "Previous Attempts" }}
            />

            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ headerShown: true, title: "Result" }}
            />

            <Stack.Screen
              name="EbookSeries"
              component={EbookSeriesScreen}
              options={{ headerShown: true, title: "Ebook Library" }}
            />

            <Stack.Screen
              name="EbookNodes"
              component={EbookNodesScreen}
              options={{ headerShown: true, title: "Ebook Content" }}
            />

            <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}