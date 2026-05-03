import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { useAuthStore } from "../store/auth.store";

import SendOtpScreen from "../screens/authscreens/SendOtpScreen";
import VerifyOtpScreen from "../screens/authscreens/VerifyOtpScreen";
import OnboardingScreen from "../screens/authscreens/OnboardingScreen";
import HomeScreen from "../screens/HomeScreen";
import TestSeriesScreen from "../screens/testscreens/TestSeriesScreen";
import TestsScreen from "../screens/testscreens/TestsScreen";
import TestAttemptScreen from "../screens/testscreens/TestAttemptScreen";
import ResultScreen from "../screens/testscreens/ResultScreen";
import AttemptsScreen from "../screens/testscreens/PreviousAttemptsScreen";
import EbookSeriesScreen from "../screens/ebookscreens/EbookSeriesScreen";
import EbookNodesScreen from "../screens/ebookscreens/EbookNodesScreen";
import PdfViewerScreen from "../screens/ebookscreens/PdfViewerScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!accessToken ? (
          <>
            <Stack.Screen
              name="SendOtp"
              component={SendOtpScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="VerifyOtp"
              component={VerifyOtpScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="TestSeries"
              component={TestSeriesScreen}
              options={{ title: "Test Series" }}
            />

            <Stack.Screen
              name="Tests"
              component={TestsScreen}
              options={{ title: "Tests" }}
            />

            <Stack.Screen
              name="TestAttempt"
              component={TestAttemptScreen}
              options={{ title: "Attempt Test" }}
            />

            <Stack.Screen
              name="Attempts"
              component={AttemptsScreen}
              options={{ title: "Previous Attempts" }}
            />

            <Stack.Screen
              name="Result"
              component={ResultScreen}
              options={{ title: "Result" }}
            />
            <Stack.Screen
                    name="EbookSeries"
                    component={EbookSeriesScreen}
                    options={{ title: "Ebook Library" }}
                      />

                <Stack.Screen
                  name="EbookNodes"
                  component={EbookNodesScreen}
                  options={{ title: "Ebook Content" }}
                />
                  <Stack.Screen
                      name="PdfViewer"
                      component={PdfViewerScreen}
                      options={{ headerShown: false }}
                    />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}