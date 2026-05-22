
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Text,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import HomeHeader from "../components/home/HomeHeader";
import ContinueLearningCard from "../components/home/ContinueCard";
import QuickActionCard from "../components/home/QuickActionCard";
import SectionTitle from "../components/home/SectionTitle";
import Tools from "../components/home/Tools";
import MentorshipPlansSlider from "../components/mentorshipslots/MentorshipPlansSlider";

export default function HomeScreen({ navigation }: any) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.12,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ])
  ).start();
}, []);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.fixedHeader}>
        <HomeHeader
          navigation={navigation}
          placeholder="Search ebooks, tests..."
          onSearchChange={(text: string) => console.log(text)}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ContinueLearningCard />
        <View style={styles.quickSection}>
          <SectionTitle title="Quick Actions" subtitle="Start learning instantly" />

          <View style={styles.grid}>
            <QuickActionCard
              title="E-Books"
              subtitle="Read premium notes and PDFs"
              icon="book-outline"
              accentColor="#2563EB"
              softColor="#EFF6FF"
              onPress={() => navigation.navigate("EbookSeries")}
            />

            <QuickActionCard
              title="Test Series"
              subtitle="Attempt mock tests and quizzes"
              icon="document-text-outline"
              accentColor="#7C3AED"
              softColor="#F5F3FF"
              onPress={() => navigation.navigate("TestSeries")}
            />
          </View>
        </View>

        <Pressable
          style={styles.studyRoomCard}
          onPress={() => navigation.navigate("StudyRoom")}
        >
          <View style={styles.studyTop}>
            <View style={styles.studyIconBox}>
              <Ionicons name="radio-outline" size={27} color="#22C55E" />
            </View>

            <View style={styles.studyTextBox}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.studyTag}>LIVE FOCUS MODE</Text>
              </View>

              <Text style={styles.studyTitle}>Study Room</Text>

              <Text style={styles.studySubtitle}>
                Join live study room, start timer and stay focused with other students.
              </Text>
            </View>

            <View style={styles.studyArrowBox}>
              <Ionicons name="chevron-forward" size={21} color="#2563EB" />
            </View>
          </View>

          <View style={styles.studyBottom}>
            <View style={styles.studyMiniItem}>
              <Ionicons name="timer-outline" size={15} color="#2563EB" />
              <Text style={styles.studyMiniText}>Live Timer</Text>
            </View>

            <View style={styles.studyMiniItem}>
              <Ionicons name="people-outline" size={15} color="#22C55E" />
              <Text style={styles.studyMiniText}>Active Students</Text>
            </View>

            <View style={styles.studyMiniItem}>
              <Ionicons name="flame-outline" size={15} color="#F59E0B" />
              <Text style={styles.studyMiniText}>Focus Mode</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.toolsSoftWrap}>
          <Tools navigation={navigation} />
        </View>
         <MentorshipPlansSlider navigation={navigation} />
        <Pressable
          style={styles.studyMaterialCard}
          onPress={() => navigation.navigate("StudyMaterial")}
        >
          <LinearGradient
            colors={["#FFFFFF", "#F8FAFC", "#FFFFFF"]}
            style={styles.studyMaterialGradient}
          >
            <View style={styles.blurCircle1} />
            <View style={styles.blurCircle2} />

            <Animated.View
              style={[
                styles.freeBadge,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <LinearGradient
                colors={["#2563EB", "#60A5FA", "#2563EB"]}
                style={styles.freeGradient}
              >
                <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                <Text style={styles.freeText}>FREE</Text>
              </LinearGradient>
            </Animated.View>

            <View style={styles.materialIconBox}>
              <LinearGradient
                colors={["#DBEAFE", "#EFF6FF"]}
                style={styles.iconGradient}
              >
                <Ionicons name="library-outline" size={30} color="#2563EB" />
              </LinearGradient>
            </View>

            <View style={styles.materialTextBox}>
              <Text style={styles.materialTag}>STUDY RESOURCES</Text>
              <Text style={styles.materialTitle}>Study Material</Text>
              <Text style={styles.materialSubtitle}>
                Notes, PDFs, formulas, PYQs and revision material in one place.
              </Text>

              <View style={styles.bottomPills}>
                <View style={styles.pill}>
                  <Ionicons name="document-text-outline" size={11} color="#2563EB" />
                  <Text style={styles.pillText}>Notes</Text>
                </View>

                <View style={styles.pill}>
                  <Ionicons name="flash-outline" size={11} color="#2563EB" />
                  <Text style={styles.pillText}>Revision</Text>
                </View>
              </View>
            </View>

            <View style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={21} color="#2563EB" />
            </View>
          </LinearGradient>
        </Pressable>

        <SectionTitle title="Featured" subtitle="Recommended for you" />

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("Mentorship")}
        >
          <View style={[styles.featureIconBox, styles.mentorshipBox]}>
            <Ionicons name="people-outline" size={25} color="#7C3AED" />
          </View>

          <View style={styles.featureTextBox}>
            <Text style={[styles.featureTag, styles.mentorshipText]}>
              Expert Guidance
            </Text>
            <Text style={styles.featureTitle}>Mentorship Sessions</Text>
            <Text style={styles.featureSubtitle}>
              Get personal guidance from mentors for your study journey.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#7C3AED" />
        </Pressable>

        <Pressable
          style={styles.featureCard}
          onPress={() => navigation.navigate("Scholarship")}
        >
          <View style={[styles.featureIconBox, styles.scholarshipBox]}>
            <Ionicons name="trophy-outline" size={25} color="#2563EB" />
          </View>

          <View style={styles.featureTextBox}>
            <Text style={[styles.featureTag, styles.scholarshipText]}>
              Rewards & Contest
            </Text>
            <Text style={styles.featureTitle}>Scholarship Program</Text>
            <Text style={styles.featureSubtitle}>
              Join contests and unlock scholarship opportunities.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#2563EB" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  fixedHeader: {
    backgroundColor: "#F8FAFC",
    zIndex: 999,
    elevation: 6,
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 42,
  },

  quickSection: {
    marginTop: -10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  studyRoomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#DCEBFF",
    shadowColor: "#2563EB",
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  studyTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  studyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginRight: 14,
  },

  studyTextBox: {
    flex: 1,
  },

  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 7,
  },

  studyTag: {
    fontSize: 11,
    fontWeight: "900",
    color: "#22C55E",
    letterSpacing: 0.7,
  },

  studyTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },

  studySubtitle: {
    marginTop: 5,
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 18,
  },

  studyArrowBox: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  studyBottom: {
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  studyMiniItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  studyMiniText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },

  toolsSoftWrap: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },

  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },

  featureIconBox: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  mentorshipBox: {
    backgroundColor: "#F5F3FF",
  },

  scholarshipBox: {
    backgroundColor: "#EFF6FF",
  },

  featureTextBox: {
    flex: 1,
  },

  featureTag: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
  },

  mentorshipText: {
    color: "#7C3AED",
  },

  scholarshipText: {
    color: "#2563EB",
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  featureSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 5,
    lineHeight: 18,
  },
studyMaterialCard: {
  marginBottom: 24,
  borderRadius: 34,
  shadowColor: "#2563EB",
  shadowOpacity: 0.13,
  shadowRadius: 22,
  shadowOffset: { width: 0, height: 12 },
  elevation: 8,
},

studyMaterialGradient: {
  borderRadius: 34,
  padding: 18,
  flexDirection: "row",
  alignItems: "center",
  overflow: "hidden",
  borderWidth: 1.5,
  borderColor: "#DBEAFE",
  backgroundColor: "#FFFFFF",
  position: "relative",
},

blurCircle1: {
  position: "absolute",
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: "rgba(37,99,235,0.06)",
  top: -45,
  right: -25,
},

blurCircle2: {
  position: "absolute",
  width: 90,
  height: 90,
  borderRadius: 45,
  backgroundColor: "rgba(59,130,246,0.07)",
  bottom: -30,
  left: -20,
},

freeBadge: {
  position: "absolute",
  top: 10,
  right: 12,
  zIndex: 20,
},

freeGradient: {
  paddingHorizontal: 13,
  paddingVertical: 6,
  borderRadius: 999,
  flexDirection: "row",
  alignItems: "center",
  shadowColor: "#2563EB",
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 5 },
  elevation: 8,
},

freeText: {
  marginLeft: 5,
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: "900",
  letterSpacing: 1.1,
},

materialIconBox: {
  marginRight: 14,
},

iconGradient: {
  width: 66,
  height: 66,
  borderRadius: 24,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#DBEAFE",
},

materialTextBox: {
  flex: 1,
  paddingRight: 6,
},

materialTag: {
  fontSize: 10.5,
  fontWeight: "900",
  color: "#2563EB",
  letterSpacing: 1,
  marginBottom: 5,
},

materialTitle: {
  fontSize: 20,
  fontWeight: "900",
  color: "#0F172A",
},

materialSubtitle: {
  marginTop: 5,
  fontSize: 12.5,
  lineHeight: 18,
  color: "#64748B",
  fontWeight: "700",
},

bottomPills: {
  flexDirection: "row",
  marginTop: 12,
},

pill: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F8FAFC",
  borderWidth: 1,
  borderColor: "#E2E8F0",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
  marginRight: 8,
},

pillText: {
  marginLeft: 4,
  fontSize: 10.5,
  fontWeight: "800",
  color: "#2563EB",
},

arrowButton: {
  width: 40,
  height: 40,
  borderRadius: 16,
  backgroundColor: "#F8FAFC",
  borderWidth: 1,
  borderColor: "#E2E8F0",
  alignItems: "center",
  justifyContent: "center",
  marginLeft: 10,
},

});