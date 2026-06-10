import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { usePersonalizedClassroomStore } from "../../store/personalizedClassroom.store";

export default function PersonalizedClassroomHomeScreen() {
  const navigation = useNavigation<any>();

  const {
    classroom,
    subjects,
    enrollment,
    homeLoading,
    locked,
    error,
    loadHome,
    clearError,
  } = usePersonalizedClassroomStore();

  useEffect(() => {
    loadHome();
  }, []);

  useEffect(() => {
    if (locked) {
      navigation.replace("PersonalizedClassroomDetails");
    }
  }, [locked]);

  useEffect(() => {
    if (error) {
      Alert.alert("Message", error, [
        {
          text: "OK",
          onPress: clearError,
        },
      ]);
    }
  }, [error]);

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (homeLoading && !classroom) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Opening classroom...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.smallText}>Welcome to</Text>
        <Text style={styles.title}>
          {classroom?.title || "Personalized Classroom"}
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {enrollment?.status || "active"}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Classroom Details</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Batch No</Text>
          <Text style={styles.value}>{classroom?.batch_no || "-"}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Students</Text>
          <Text style={styles.value}>
            {classroom?.current_students || 0}/{classroom?.max_students || 20}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>
            {enrollment?.plan_type || "-"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Expires At</Text>
          <Text style={styles.value}>
            {formatDate(enrollment?.expires_at)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Grace Until</Text>
          <Text style={styles.value}>
            {formatDate(enrollment?.grace_until)}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subjects</Text>

        {subjects.length === 0 ? (
          <Text style={styles.emptyText}>No subjects assigned yet.</Text>
        ) : (
          subjects.map((item: any, index: number) => (
            <TouchableOpacity
              key={item.id || index}
              style={styles.subjectCard}
              onPress={() => {
                Alert.alert(
                  "Coming Soon",
                  "Subject detail screen will open here."
                );
              }}
            >
              <View>
                <Text style={styles.subjectTitle}>
                  {item.name || item.title || item.subject_name || "Subject"}
                </Text>
                <Text style={styles.subjectSub}>
                  Tap to open classroom subject
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.renewButton}
        onPress={() => navigation.navigate("PersonalizedClassroomDetails")}
      >
        <Text style={styles.renewText}>Renew / Upgrade Plan</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#555" },

  header: {
    padding: 22,
    paddingTop: 35,
    backgroundColor: "#111827",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  smallText: { color: "#D1D5DB", fontSize: 14 },
  title: {
    marginTop: 6,
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
  },
  badge: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 30,
    backgroundColor: "#22C55E",
  },
  badgeText: { color: "#fff", fontWeight: "900", textTransform: "uppercase" },

  card: {
    margin: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: { color: "#6B7280", fontSize: 14 },
  value: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  subjectCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subjectTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  subjectSub: { marginTop: 4, color: "#6B7280", fontSize: 12 },
  arrow: { fontSize: 32, color: "#9CA3AF" },
  emptyText: { color: "#6B7280", fontSize: 14 },

  renewButton: {
    marginHorizontal: 16,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  renewText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});