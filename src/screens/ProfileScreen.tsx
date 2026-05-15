// src/screens/ProfileScreen.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { AuthAPI, setAuthToken } from "../api/auth.api";
import { MetaAPI } from "../api/meta.api";

const { width } = Dimensions.get("window");
const isSmall = width < 380;

type Goal = { id: string; name: string };
type ClassItem = { id: string; name: string };

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [goalModal, setGoalModal] = useState(false);
  const [classModal, setClassModal] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("male");

  const [goalId, setGoalId] = useState("");
  const [classId, setClassId] = useState("");

  const [goalName, setGoalName] = useState("");
  const [className, setClassName] = useState("");

  const uniqueGoals = useMemo(() => {
    const map = new Map<string, Goal>();
    goals.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [goals]);

  const uniqueClasses = useMemo(() => {
    const map = new Map<string, ClassItem>();
    classes.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }, [classes]);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);

      const [profileRes, goalsRes] = await Promise.all([
        AuthAPI.getProfile(),
        MetaAPI.getGoals(),
      ]);

      const profileData =
        profileRes.data?.profile ||
        profileRes.data?.data?.profile ||
        profileRes.data?.data ||
        {};

      const goalsData = Array.isArray(goalsRes.data)
        ? goalsRes.data
        : goalsRes.data?.data || [];

      setProfile(profileData);
      setGoals(goalsData);

      setFirstName(profileData?.first_name || "");
      setLastName(profileData?.last_name || "");
      setGender(profileData?.gender || "male");

      const currentGoalId = profileData?.goal_id || "";
      const currentClassId = profileData?.class_id || "";

      setGoalId(currentGoalId);
      setClassId(currentClassId);

      setGoalName("");
      setClassName("");
      setClasses([]);

      const selectedGoal = goalsData.find(
        (item: Goal) => item.id === currentGoalId
      );

      if (selectedGoal) {
        setGoalName(selectedGoal.name);

        const classRes = await MetaAPI.getClassesByGoal(selectedGoal.id);

        const classData = Array.isArray(classRes.data)
          ? classRes.data
          : classRes.data?.data || [];

        setClasses(classData);

        const selectedClass = classData.find(
          (item: ClassItem) => item.id === currentClassId
        );

        if (selectedClass) {
          setClassName(selectedClass.name);
        }
      }
    } catch (error: any) {
      console.log("Profile load error:", error?.response?.data || error.message);
      Alert.alert("Error", "Profile load failed");
    } finally {
      setLoading(false);
    }
  };

  const selectGoal = async (goal: Goal) => {
    try {
      setGoalId(goal.id);
      setGoalName(goal.name);
      setClassId("");
      setClassName("");
      setGoalModal(false);

      const res = await MetaAPI.getClassesByGoal(goal.id);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setClasses(data);
      setClassModal(true);
    } catch (error: any) {
      console.log("Class load error:", error?.response?.data || error.message);
      Alert.alert("Error", "Classes load failed");
    }
  };

  const selectClass = (item: ClassItem) => {
    setClassId(item.id);
    setClassName(item.name);
    setClassModal(false);
  };

  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !gender || !goalId || !classId) {
      Alert.alert("Missing Fields", "Please fill all profile details");
      return;
    }

    try {
      setSaving(true);

      await AuthAPI.completeProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender,
        goal_id: goalId,
        class_id: classId,
      });

      const oldRefreshToken = await AsyncStorage.getItem("refresh_token");

      if (oldRefreshToken) {
        const refreshRes = await AuthAPI.refresh(oldRefreshToken);

        const newAccessToken =
          refreshRes.data?.access_token ||
          refreshRes.data?.accessToken ||
          refreshRes.data?.data?.access_token ||
          refreshRes.data?.data?.accessToken;

        const newRefreshToken =
          refreshRes.data?.refresh_token ||
          refreshRes.data?.refreshToken ||
          refreshRes.data?.data?.refresh_token ||
          refreshRes.data?.data?.refreshToken ||
          oldRefreshToken;

        if (newAccessToken) {
          await AsyncStorage.setItem("access_token", newAccessToken);
          await AsyncStorage.setItem("refresh_token", newRefreshToken);

          setAuthToken(newAccessToken, newRefreshToken);
        }
      }

      setProfile((prev: any) => ({
        ...prev,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender,
        goal_id: goalId,
        class_id: classId,
        onboarding_completed: true,
      }));

      Alert.alert("Success", "Profile updated successfully");
      setEditMode(false);

      await init();
    } catch (error: any) {
      console.log("Profile update error:", error?.response?.data || error.message);
      Alert.alert("Error", "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom + 18, 34) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <View style={styles.headerCard}>
          <View style={styles.logoGlow}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.activeBadge} />
            </View>
          </View>

          <Text style={styles.name}>
            {firstName || "User"} {lastName}
          </Text>

          <Text style={styles.email}>{profile?.email || "No email"}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="person-outline" size={14} color="#1D4ED8" />
              <Text style={styles.roleText}>{profile?.role || "user"}</Text>
            </View>

            <View style={styles.verifyBadge}>
              <Ionicons
                name={profile?.is_verified ? "checkmark-circle" : "alert-circle"}
                size={15}
                color={profile?.is_verified ? "#2563EB" : "#F59E0B"}
              />
              <Text style={styles.verifyText}>
                {profile?.is_verified ? "Verified" : "Not Verified"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.editButton}
            onPress={() => setEditMode(!editMode)}
          >
            <Ionicons
              name={editMode ? "close-outline" : "create-outline"}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.editText}>
              {editMode ? "Close Edit" : "Edit Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        {!editMode ? (
          <>
            <View style={styles.summaryGrid}>
              <MiniCard icon="school-outline" label="Goal" value={goalName || "Not selected"} />
              <MiniCard icon="library-outline" label="Class" value={className || "Not selected"} />
              <MiniCard
                icon="shield-checkmark-outline"
                label="Status"
                value={profile?.onboarding_completed ? "Completed" : "Pending"}
              />
              <MiniCard icon="male-female-outline" label="Gender" value={gender || "N/A"} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Profile Details</Text>

              <InfoRow label="Email" value={profile?.email || "N/A"} />
              <InfoRow label="Role" value={profile?.role || "user"} />
              <InfoRow label="First Name" value={profile?.first_name || "N/A"} />
              <InfoRow label="Last Name" value={profile?.last_name || "N/A"} />
              <InfoRow label="Gender" value={profile?.gender || "N/A"} />
              <InfoRow label="Goal" value={goalName || "N/A"} />
              <InfoRow label="Class" value={className || "N/A"} />
              <InfoRow label="Verified" value={profile?.is_verified ? "Yes" : "No"} />
              <InfoRow
                label="Onboarding"
                value={profile?.onboarding_completed ? "Completed" : "Pending"}
              />
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edit Details</Text>

            <InputLabel title="First Name" />
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              placeholder="Enter first name"
              placeholderTextColor="#9CA3AF"
            />

            <InputLabel title="Last Name" />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              placeholder="Enter last name"
              placeholderTextColor="#9CA3AF"
            />

            <InputLabel title="Gender" />
            <View style={styles.genderRow}>
              {["male", "female", "other"].map((item) => (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.85}
                  style={[
                    styles.genderChip,
                    gender === item && styles.activeGenderChip,
                  ]}
                  onPress={() => setGender(item)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === item && styles.activeGenderText,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <InputLabel title="Goal" />
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.dropdown}
              onPress={() => setGoalModal(true)}
            >
              <Text style={[styles.dropdownText, !goalName && styles.placeholder]}>
                {goalName || "Select Goal"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            <InputLabel title="Class" />
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.dropdown}
              onPress={() => {
                if (!goalId) {
                  Alert.alert("Select Goal", "Please select goal first");
                  return;
                }
                setClassModal(true);
              }}
            >
              <Text style={[styles.dropdownText, !className && styles.placeholder]}>
                {className || "Select Class"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
                  <Text style={styles.saveText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <SelectModal
        visible={goalModal}
        title="Select Goal"
        onClose={() => setGoalModal(false)}
        insetsBottom={insets.bottom}
      >
        {uniqueGoals.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={[
              styles.modalItem,
              goalId === item.id && styles.selectedModalItem,
            ]}
            onPress={() => selectGoal(item)}
          >
            <Text
              style={[
                styles.modalItemText,
                goalId === item.id && styles.selectedModalText,
              ]}
            >
              {item.name}
            </Text>
            {goalId === item.id && (
              <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
            )}
          </TouchableOpacity>
        ))}
      </SelectModal>

      <SelectModal
        visible={classModal}
        title="Select Class"
        onClose={() => setClassModal(false)}
        insetsBottom={insets.bottom}
      >
        {uniqueClasses.length === 0 ? (
          <Text style={styles.emptyText}>No classes found</Text>
        ) : (
          uniqueClasses.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={[
                styles.modalItem,
                classId === item.id && styles.selectedModalItem,
              ]}
              onPress={() => selectClass(item)}
            >
              <Text
                style={[
                  styles.modalItemText,
                  classId === item.id && styles.selectedModalText,
                ]}
              >
                {item.name}
              </Text>
              {classId === item.id && (
                <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
              )}
            </TouchableOpacity>
          ))
        )}
      </SelectModal>
    </SafeAreaView>
  );
}

function SelectModal({
  visible,
  title,
  onClose,
  children,
  insetsBottom,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  insetsBottom: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            { paddingBottom: Math.max(insetsBottom + 12, 22) },
          ]}
        >
          <ModalHeader title={title} onClose={onClose} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            contentContainerStyle={styles.modalContent}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MiniCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.miniCard}>
      <View style={styles.miniIconBox}>
        <Ionicons name={icon} size={21} color="#2563EB" />
      </View>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.miniValue}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function InputLabel({ title }: { title: string }) {
  return <Text style={styles.inputLabel}>{title}</Text>;
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.modalTitle}>{title}</Text>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close" size={20} color="#111827" />
      </TouchableOpacity>
    </View>
  );
}

// styles same as your current file
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    paddingHorizontal: isSmall ? 14 : 18,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    flexGrow: 0,
  },
  loader: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#6B7280",
    fontWeight: "700",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  logoGlow: {
    width: 122,
    height: 122,
    borderRadius: 61,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  logoImage: { width: 66, height: 66 },
  activeBadge: {
    position: "absolute",
    right: 7,
    bottom: 8,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#2563EB",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  name: {
    marginTop: 14,
    fontSize: isSmall ? 24 : 28,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  email: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 18,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  roleText: {
    color: "#1D4ED8",
    fontWeight: "900",
    textTransform: "capitalize",
  },
  verifyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  verifyText: { color: "#111827", fontWeight: "900" },
  editButton: {
    marginTop: 22,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 19,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  summaryGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  miniCard: {
    width: (width - (isSmall ? 40 : 48)) / 2,
    minHeight: 132,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  miniIconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  miniLabel: {
    color: "#6B7280",
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 5,
  },
  miniValue: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 15,
    textTransform: "capitalize",
  },
  card: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  infoRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "800",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "900",
  },
  inputLabel: {
    marginTop: 15,
    marginBottom: 8,
    color: "#111827",
    fontWeight: "900",
    fontSize: 14,
  },
  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    color: "#111827",
    fontWeight: "800",
    fontSize: 15,
  },
  genderRow: { flexDirection: "row", gap: 10 },
  genderChip: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  activeGenderChip: {
    backgroundColor: "#F0FDF4",
    borderColor: "#2563EB",
  },
  genderText: {
    color: "#4B5563",
    fontWeight: "900",
    fontSize: 12,
  },
  activeGenderText: { color: "#1D4ED8" },
  dropdown: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 15,
    flex: 1,
    marginRight: 10,
  },
  placeholder: { color: "#9CA3AF" },
  saveButton: {
    marginTop: 26,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  disabledButton: { opacity: 0.7 },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.42)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: "75%",
  },
  modalContent: { paddingBottom: 6 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalItem: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedModalItem: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  modalItemText: {
    color: "#111827",
    fontWeight: "900",
    flex: 1,
    marginRight: 10,
  },
  selectedModalText: { color: "#1D4ED8" },
  emptyText: {
    color: "#6B7280",
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 20,
  },
});