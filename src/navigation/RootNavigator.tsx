import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { RootStackParamList } from "../types";

import { useAuthStore } from "../store/auth.store";
import { useAppStore } from "../store/app.store";

import IntroSliderScreen from "../screens/extrascreens/IntroSliderScreen";
import SplashScreen from "../screens/extrascreens/SplashScreen";
import SendOtpScreen from "../screens/authscreens/SendOtpScreen";
import VerifyOtpScreen from "../screens/authscreens/VerifyOtpScreen";
import OnboardingScreen from "../screens/authscreens/OnboardingScreen";
import SyllabusTracker from "../screens/toolscreens/SyllabusTracker";
import StudyPlanner from "../screens/toolscreens/StudyPlanner";
import StudyTechnique from "../screens/toolscreens/StudyTechnique";
import FlashCard from "../screens/toolscreens/FlashCard";

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
import EbookPageViewer from "../screens/ebookscreens/EbookPageViewer";
import DoubtScreen from "../screens/DoubtScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ToolPage from "../screens/extrascreens/ToolPage"
import Scholarship from "../screens/scholarshipscreens/ScholarshipScreens"
import Mentorship from "../screens/mentorshipscreens/MentorshipScreens"
import MentorshipScreens from "../screens/mentorshipscreens/MentorshipSeries"
import ExploreScholarshipScreen from "../screens/scholarshipscreens/Explorescholarship"
import GroupChatScreen from "../screens/chatscreens/GroupChatScreen";
import MyMentor from "../screens/mentorshipscreens/MyMentor"
import CheckoutScreen from "../screens/checkout/CheckoutScreen";
import StudyRoomScreen from "../screens/toolscreens/StudyRoomScreen";
import StudyMaterialScreen from "../screens/ebookscreens/StudyMaterialScreen";
import DateSelectScreen from "../screens/mentorshipslots/DateTimeSelectScreen";
import BookingReviewScreen from "../screens/mentorshipslots/BookingReviewScreen";
import BookingSuccessScreen from "../screens/mentorshipslots/BookingSuccessScreen";
import MyBookingsScreen from "../screens/mentorshipslots/MyBookingsScreen";
import StudyStatsScreen from "../screens/toolscreens/StudyStatsScreen";
import Contact from "../screens/extrascreens/Contact"
import RazorpayWebViewScreen from "../screens/RazorpayWebViewScreen";

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
          if (route.name === "Connect") iconName = "people-outline";
          if (route.name === "Flys") iconName = "play-circle-outline";
          if (route.name === "Ebook") iconName = "book-outline";
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
      name="Connect"
      component={GroupChatScreen}
      options={{ headerShown: false, tabBarLabel: "Connect" }}
    />
      <Tab.Screen
        name="Flys"
        component={ReelScreen}
        options={{ headerShown: false }}
      />

      <Tab.Screen
        name="Ebook"
        component={EbookSeriesScreen}
        options={{ title: "Ebook Series", tabBarLabel: "Ebooks" }}
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
    const isReady = useAuthStore((s) => s.isReady);
    const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);

    if (!isReady) {
      return <SplashScreen />;
    }

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
              options={{ headerShown: true, title: "Ebook Series" }}
            />

            <Stack.Screen
              name="EbookNodes"
              component={EbookNodesScreen}
              options={{ headerShown: true, title: "Ebook Content" }}
            />

            <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
            <Stack.Screen
              name="EbookPageViewer"
              component={EbookPageViewer}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="StudyMaterial"
              component={StudyMaterialScreen}
              options={{ headerShown: true, title: "Study Material" }}
            />
         
            <Stack.Screen
            name="SyllabusTracker"
            component={SyllabusTracker}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="StudyPlanner"
            component={StudyPlanner}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="StudyTechnique"
            component={StudyTechnique}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="FlashCard"
            component={FlashCard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Study Tools"
            component={ToolPage}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="StudyRoom"
            component={StudyRoomScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Scholarship"
            component={Scholarship}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Explore Scholarships"
            component={ExploreScholarshipScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Mentorship"
            component={Mentorship}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Mentorship Plans"
            component={MentorshipScreens}
            options={{ headerShown: true }}
          />
           <Stack.Screen
            name="My Mentor"
            component={MyMentor}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="Contact Us"
            component={Contact}
            options={{ headerShown: true }}
          />
           <Stack.Screen
            name="CheckoutScreen"
            component={CheckoutScreen}
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen name="DateSelect" component={DateSelectScreen} />
          <Stack.Screen name="BookingReview" component={BookingReviewScreen} />
          <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
          <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
          <Stack.Screen
            name="RazorpayWebView"
            component={RazorpayWebViewScreen}
            options={{
              title: "Payment",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="StudyStats"
            component={StudyStatsScreen}
            options={{ title: "Study Statistics" }}
          />
           </>
          
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}