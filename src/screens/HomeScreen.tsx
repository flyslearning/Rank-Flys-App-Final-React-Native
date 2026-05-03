import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, UserProfile } from "../types";
import { AuthAPI } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const logout = useAuthStore((s) => s.logout);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const res = await AuthAPI.getProfile();
      setProfile(res.data);

      if (!res.data?.onboarding_completed) {
        navigation.replace("Onboarding");
      }
    } catch (error: any) {
      console.log("Profile error:", error?.response?.data || error.message);
      Alert.alert("Error", "Profile load failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const fullName =
    `${profile?.first_name || "Student"} ${profile?.last_name || ""}`.trim();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroTextBox}>
            <Text style={styles.brand}>RANK FLYS</Text>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.name}>{fullName}</Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.first_name?.[0] || "S").toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.profileMeta}>
          <Text style={styles.metaText}>Role: {profile?.role || "user"}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            {profile?.is_verified ? "Verified Account" : "Not Verified"}
          </Text>
        </View>
      </View>

      <View style={styles.quickGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Tests Given</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>0%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Start Learning</Text>

      <TouchableOpacity
        style={styles.testCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("TestSeries")}
      >
        <View style={styles.cardIconBlue}>
          <Text style={styles.cardIconText}>📝</Text>
        </View>

        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Test Series</Text>
          <Text style={styles.featureSub}>
            Attempt mock tests, analyze result and improve your preparation.
          </Text>
        </View>

        <View style={styles.arrowCircleBlue}>
          <Text style={styles.arrowTextBlue}>→</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.ebookCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("EbookSeries")}
      >
        <View style={styles.cardIconDark}>
          <Text style={styles.cardIconText}>📚</Text>
        </View>

        <View style={styles.featureContent}>
          <Text style={styles.ebookTitle}>Ebook Library</Text>
          <Text style={styles.ebookSub}>
            Read chapters, PDF notes and study material.
          </Text>
        </View>

        <View style={styles.arrowCircleDark}>
          <Text style={styles.arrowTextDark}>→</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>More</Text>

      <View style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
          <View>
            <Text style={styles.menuTitle}>My Performance</Text>
            <Text style={styles.menuSub}>Track progress and score history</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
          <View>
            <Text style={styles.menuTitle}>Profile</Text>
            <Text style={styles.menuSub}>{profile?.email || "No email"}</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} activeOpacity={0.8}>
          <View>
            <Text style={styles.menuTitle}>Mentorship</Text>
            <Text style={styles.menuSub}>Coming soon</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.85}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },
  container: {
    padding: 18,
    paddingBottom: 42,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef2ff",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "800",
  },
  heroCard: {
    backgroundColor: "#0f172a",
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTextBox: {
    flex: 1,
    paddingRight: 12,
  },
  brand: {
    color: "#93c5fd",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  welcome: {
    color: "#cbd5e1",
    fontSize: 15,
    fontWeight: "700",
  },
  name: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#60a5fa",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  profileMeta: {
    marginTop: 18,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    color: "#e2e8f0",
    fontWeight: "800",
    fontSize: 13,
  },
  metaDot: {
    color: "#94a3b8",
    marginHorizontal: 8,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  statValue: {
    color: "#2563eb",
    fontSize: 26,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 4,
    color: "#64748b",
    fontWeight: "800",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
  },
  testCard: {
    backgroundColor: "#2563eb",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  ebookCard: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    padding: 16,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconBlue: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  cardIconDark: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  cardIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
    marginLeft: 13,
    paddingRight: 10,
  },
  featureTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 5,
  },
  featureSub: {
    color: "#dbeafe",
    fontWeight: "700",
    lineHeight: 19,
    fontSize: 13,
  },
  ebookTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 5,
  },
  ebookSub: {
    color: "#cbd5e1",
    fontWeight: "700",
    lineHeight: 19,
    fontSize: 13,
  },
  arrowCircleBlue: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowCircleDark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowTextBlue: {
    color: "#2563eb",
    fontSize: 23,
    fontWeight: "900",
  },
  arrowTextDark: {
    color: "#0f172a",
    fontSize: 23,
    fontWeight: "900",
  },
  menuCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#dbeafe",
    marginBottom: 18,
    overflow: "hidden",
  },
  menuItem: {
    padding: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  menuSub: {
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
    maxWidth: 260,
  },
  menuArrow: {
    color: "#94a3b8",
    fontSize: 30,
    fontWeight: "300",
  },
  logoutButton: {
    backgroundColor: "#fee2e2",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  logoutText: {
    color: "#dc2626",
    fontWeight: "900",
    fontSize: 16,
  },
});