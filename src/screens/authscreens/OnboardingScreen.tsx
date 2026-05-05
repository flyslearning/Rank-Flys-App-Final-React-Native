import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  FlatList,
} from "react-native";
import LottieView from "lottie-react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RootStackParamList, Goal, ClassItem } from "../../types";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import { MetaAPI } from "../../api/meta.api";
import { AuthAPI } from "../../api/auth.api";

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("male");

  const [goals, setGoals] = useState<Goal[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [goalId, setGoalId] = useState("");
  const [classId, setClassId] = useState("");

  const [selectedGoalName, setSelectedGoalName] = useState("");
  const [selectedClassName, setSelectedClassName] = useState("");

  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [saving, setSaving] = useState(false);

  const [classModal, setClassModal] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

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

  const loadGoals = async () => {
    try {
      setLoadingGoals(true);
      const res = await MetaAPI.getGoals();
      setGoals(Array.isArray(res.data) ? res.data : []);
    } catch {
      Alert.alert("Error", "Goals load failed");
    } finally {
      setLoadingGoals(false);
    }
  };

  const loadClasses = async (id: string, name: string) => {
    try {
      setGoalId(id);
      setSelectedGoalName(name);
      setClassId("");
      setSelectedClassName("");

      setLoadingClasses(true);

      const res = await MetaAPI.getClassesByGoal(id);
      setClasses(Array.isArray(res.data) ? res.data : []);

      setClassModal(true);
    } catch {
      Alert.alert("Error", "Classes load failed");
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleNext = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Enter name properly");
      return;
    }
    setStep(2);
  };

  const submit = async () => {
    if (!goalId || !classId) {
      Alert.alert("Select goal & class");
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

      navigation.replace("MainTabs");
    } catch {
      Alert.alert("Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        {/* TOP */}
        <View style={{ marginTop: insets.top + 20 }}>
          <LottieView
            source={require("../../assets/animations/profile.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.title}>
            {step === 1 ? "Your Basic Details" : "Select Goal & Class"}
          </Text>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>

          {step === 1 && (
            <>
              <AppInput
                placeholder="First name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <AppInput
                placeholder="Last name"
                value={lastName}
                onChangeText={setLastName}
              />

              <View style={styles.genderRow}>
                {["male", "female", "other"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderChip,
                      gender === g && styles.activeChip,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === g && styles.activeText,
                      ]}
                    >
                      {g.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              {/* 🔥 SELECTED GOAL */}
              {selectedGoalName ? (
                <View style={styles.selectedBox}>
                  <Text style={styles.selectedLabel}>Selected Goal</Text>
                  <Text style={styles.selectedValue}>{selectedGoalName}</Text>
                </View>
              ) : null}

              {/* 🔥 SELECTED CLASS */}
              {selectedClassName ? (
                <View style={styles.selectedBox}>
                  <Text style={styles.selectedLabel}>Selected Class</Text>
                  <Text style={styles.selectedValue}>{selectedClassName}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Select Goal</Text>

              {loadingGoals ? (
                <ActivityIndicator />
              ) : (
                <FlatList
                  data={uniqueGoals}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.item,
                        goalId === item.id && styles.selectedItem,
                      ]}
                      onPress={() => loadClasses(item.id, item.name)}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          goalId === item.id && styles.selectedItemText,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}
        </View>

        {/* BUTTON */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]}>
          <AppButton
            title={step === 1 ? "Next" : "Complete Profile"}
            onPress={step === 1 ? handleNext : submit}
            loading={saving}
          />
        </View>

        {/* MODAL */}
        <Modal visible={classModal} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Class</Text>

              {loadingClasses ? (
                <ActivityIndicator />
              ) : (
                uniqueClasses.map((cls) => (
                  <TouchableOpacity
                    key={cls.id}
                    style={styles.modalItem}
                    onPress={() => {
                      setClassId(cls.id);
                      setSelectedClassName(cls.name);
                      setClassModal(false);
                    }}
                  >
                    <Text style={styles.itemText}>{cls.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </Modal>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },

  lottie: { width: 200, height: 140, alignSelf: "center" },
  title: { textAlign: "center", fontSize: 24, fontFamily: "TitanOne" },

  content: { flex: 1, marginTop: 20 },

  genderRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  genderChip: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  activeChip: { backgroundColor: "#2563eb" },
  genderText: { fontWeight: "700" },
  activeText: { color: "#fff" },

  label: { marginTop: 10, marginBottom: 10 , fontFamily: "Geologica"},

  item: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedItem: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  itemText: { fontWeight: "700", color: "#0f172a" },
  selectedItemText: { color: "#fff" },

  /* 🔥 SELECTED BOX */
  selectedBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    marginBottom: 10,
  },
  selectedLabel: {
    fontSize: 12,
    color: "#6366f1",
    fontFamily: "Geologica",
    marginBottom: 4,
  },
  selectedValue: {
    fontWeight: "800",
    color: "#1e3a8a",
    fontFamily: "Geologica",
  },

  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },

  modalBg: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "900", marginBottom: 10, fontFamily: "Geologica"},
  modalItem: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    marginBottom: 8,
  },
});