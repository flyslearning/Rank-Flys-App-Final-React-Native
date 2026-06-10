import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  Platform,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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
      Alert.alert("Message", error, [{ text: "OK", onPress: clearError }]);
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

  const status = enrollment?.status || "active";
  const currentStudents = classroom?.current_students || 0;
  const maxStudents = classroom?.max_students || 20;

  if (homeLoading && !classroom) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Opening your classroom...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.welcome}>Welcome back</Text>
              <Text style={styles.title}>
                {classroom?.title || "Personalized Classroom"}
              </Text>
            </View>

            <View style={styles.iconBox}>
              <Ionicons name="school" size={24} color="#2563EB" />
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{status}</Text>
            </View>

            <Text style={styles.batchText}>
              Batch #{classroom?.batch_no || "-"}
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{currentStudents}/{maxStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statValue}>{subjects.length}</Text>
              <Text style={styles.statLabel}>Subjects</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {enrollment?.plan_type || "-"}
              </Text>
              <Text style={styles.statLabel}>Plan</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Classroom Details</Text>
              <Text style={styles.cardSubtitle}>Your active learning plan</Text>
            </View>
            <Ionicons name="information-circle" size={24} color="#2563EB" />
          </View>

          <InfoRow label="Batch No" value={classroom?.batch_no || "-"} />
          <InfoRow label="Students" value={`${currentStudents}/${maxStudents}`} />
          <InfoRow label="Plan" value={enrollment?.plan_type || "-"} />
          <InfoRow label="Expires At" value={formatDate(enrollment?.expires_at)} />
          <InfoRow label="Grace Until" value={formatDate(enrollment?.grace_until)} last />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Your Subjects</Text>
              <Text style={styles.cardSubtitle}>Continue learning from your batch</Text>
            </View>
            <Ionicons name="book" size={23} color="#2563EB" />
          </View>

          {subjects.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="albums-outline" size={30} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No subjects assigned yet</Text>
              <Text style={styles.emptyText}>
                Your subjects will appear here once assigned.
              </Text>
            </View>
          ) : (
            subjects.map((item: any, index: number) => (
              <TouchableOpacity
                key={item.id || index}
                activeOpacity={0.85}
                style={styles.subjectCard}
                onPress={() => {
                  Alert.alert("Coming Soon", "Subject detail screen will open here.");
                }}
              >
                <View style={styles.subjectIcon}>
                  <Text style={styles.subjectIconText}>{index + 1}</Text>
                </View>

                <View style={styles.subjectContent}>
                  <Text style={styles.subjectTitle}>
                    {item.name || item.title || item.subject_name || "Subject"}
                  </Text>
                  <Text style={styles.subjectSub}>Tap to open classroom subject</Text>
                </View>

                <View style={styles.arrowBox}>
                  <Ionicons name="chevron-forward" size={18} color="#2563EB" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.renewButton}
          onPress={() => navigation.navigate("PersonalizedClassroomDetails")}
        >
          <Ionicons name="flash" size={20} color="#FFFFFF" />
          <Text style={styles.renewText}>Renew / Upgrade Plan</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string | number;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F172A",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },

  hero: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 26,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  welcome: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    marginTop: 7,
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
    maxWidth: 270,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.16)",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 8,
  },
  statusText: {
    color: "#BBF7D0",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  batchText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "800",
  },
  heroStats: {
    marginTop: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  statLabel: {
    marginTop: 5,
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
  },
  value: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "capitalize",
    maxWidth: "55%",
    textAlign: "right",
  },

  subjectCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  subjectIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  subjectIconText: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "900",
  },
  subjectContent: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  subjectSub: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  emptyTitle: {
    marginTop: 10,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
  },
  emptyText: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  renewButton: {
    marginHorizontal: 16,
    marginTop: 18,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#2563EB",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  renewText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  bottomSpace: {
    height: 28,
  },
});