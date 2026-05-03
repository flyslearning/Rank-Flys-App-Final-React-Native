// src/screens/ProfileScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { AuthAPI } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

type TabType = "profile" | "sessions" | "security" | "account";

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);

  const [activeTab, setActiveTab] = useState<TabType>("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  const [profile, setProfile] = useState<any>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [goalId, setGoalId] = useState("");
  const [classId, setClassId] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);

      const res = await AuthAPI.getProfile();
      const data = res.data?.data || res.data;

      setProfile(data);

      setFirstName(data?.first_name || "");
      setLastName(data?.last_name || "");
      setGender(data?.gender || "");
      setGoalId(data?.goal_id || "");
      setClassId(data?.class_id || "");
    } catch (error: any) {
      console.log("Profile error:", error?.response?.data || error.message);
      Alert.alert("Error", "Profile load failed");
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);

      const res = await AuthAPI.getSessions();
      const data = res.data?.data || res.data;

      setSessions(data?.sessions || []);
    } catch (error: any) {
      console.log("Sessions error:", error?.response?.data || error.message);
      Alert.alert("Error", "Sessions load failed");
    } finally {
      setSessionsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!firstName || !lastName || !gender || !goalId || !classId) {
      Alert.alert("Missing fields", "Please fill all profile details");
      return;
    }

    try {
      setSaving(true);

      await AuthAPI.completeProfile({
        first_name: firstName,
        last_name: lastName,
        gender,
        goal_id: goalId,
        class_id: classId,
      });

      Alert.alert("Success", "Profile updated successfully");
      loadProfile();
    } catch (error: any) {
      console.log("Update profile error:", error?.response?.data || error.message);
      Alert.alert("Error", "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => logout(),
      },
    ]);
  };

  const handleLogoutAll = () => {
    Alert.alert("Logout All Devices", "This will logout your account from all devices.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout All",
        style: "destructive",
        onPress: async () => {
          try {
            await AuthAPI.logoutAll();
            logout();
          } catch (error: any) {
            console.log("Logout all error:", error?.response?.data || error.message);
            Alert.alert("Error", "Logout all failed");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "sessions") {
      loadSessions();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {firstName?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>

        <Text style={styles.title}>
          {firstName || "User"} {lastName}
        </Text>

        <Text style={styles.email}>{profile?.email}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{profile?.role || "user"}</Text>
          </View>

          <View style={[styles.badge, profile?.is_verified && styles.successBadge]}>
            <Text style={styles.badgeText}>
              {profile?.is_verified ? "Verified" : "Not Verified"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TabButton title="Profile" value="profile" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton title="Sessions" value="sessions" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton title="Security" value="security" activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton title="Account" value="account" activeTab={activeTab} setActiveTab={setActiveTab} />
      </View>

      {activeTab === "profile" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>

          <Text style={styles.label}>First Name</Text>
          <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} />

          <Text style={styles.label}>Last Name</Text>
          <TextInput value={lastName} onChangeText={setLastName} style={styles.input} />

          <Text style={styles.label}>Gender</Text>
          <TextInput
            value={gender}
            onChangeText={setGender}
            style={styles.input}
            placeholder="male / female / other"
          />

          <Text style={styles.label}>Goal ID</Text>
          <TextInput value={goalId} onChangeText={setGoalId} style={styles.input} />

          <Text style={styles.label}>Class ID</Text>
          <TextInput value={classId} onChangeText={setClassId} style={styles.input} />

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "sessions" && (
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Active Sessions</Text>

            <TouchableOpacity onPress={loadSessions}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {sessionsLoading ? (
            <ActivityIndicator color="#2563eb" />
          ) : sessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions found</Text>
          ) : (
            sessions.map((item, index) => (
              <View key={item.id || index} style={styles.sessionCard}>
                <Text style={styles.sessionDevice}>{item.device || "Unknown Device"}</Text>
                <Text style={styles.sessionText}>IP: {item.ip || "N/A"}</Text>
                <Text style={styles.sessionText}>User Agent: {item.user_agent || "N/A"}</Text>
                <Text style={styles.sessionText}>Created: {formatDate(item.created_at)}</Text>
                <Text style={styles.sessionText}>Expires: {formatDate(item.expires_at)}</Text>

                <View style={[styles.statusBadge, item.revoked && styles.dangerBadge]}>
                  <Text style={styles.statusText}>
                    {item.revoked ? "Revoked" : "Active"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === "security" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security</Text>

          <InfoRow label="Email Verified" value={profile?.is_verified ? "Yes" : "No"} />
          <InfoRow label="Role" value={profile?.role || "user"} />
          <InfoRow
            label="Onboarding"
            value={profile?.onboarding_completed ? "Completed" : "Pending"}
          />

          <TouchableOpacity style={styles.dangerButton} onPress={handleLogoutAll}>
            <Text style={styles.buttonText}>Logout From All Devices</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "account" && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <InfoRow label="User ID" value={profile?.id || "N/A"} />
          <InfoRow label="Email" value={profile?.email || "N/A"} />
          <InfoRow label="Goal ID" value={profile?.goal_id || "N/A"} />
          <InfoRow label="Class ID" value={profile?.class_id || "N/A"} />
          <InfoRow label="Goal Class ID" value={profile?.goal_class_id || "N/A"} />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function TabButton({
  title,
  value,
  activeTab,
  setActiveTab,
}: {
  title: string;
  value: TabType;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}) {
  const active = activeTab === value;

  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.activeTabBtn]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={[styles.tabText, active && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatDate(date?: string) {
  if (!date || date.startsWith("0001")) return "N/A";

  try {
    return new Date(date).toLocaleString();
  } catch {
    return "N/A";
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 20,
    paddingBottom: 140,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 18,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#0f172a",
  },
  email: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  badge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  successBadge: {
    backgroundColor: "#dcfce7",
  },
  badgeText: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "capitalize",
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 16,
    padding: 5,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTabBtn: {
    backgroundColor: "#ffffff",
  },
  tabText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "800",
  },
  activeTabText: {
    color: "#2563eb",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontWeight: "600",
  },
  button: {
    marginTop: 24,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  dangerButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutBtn: {
    marginTop: 28,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refreshText: {
    color: "#2563eb",
    fontWeight: "900",
  },
  emptyText: {
    color: "#64748b",
    fontWeight: "700",
    marginTop: 10,
  },
  sessionCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 12,
  },
  sessionDevice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  sessionText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 3,
  },
  statusBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dangerBadge: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0f172a",
  },
  infoRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "800",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "800",
  },
});