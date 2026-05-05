import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { TestAPI } from "../../api/test.api";

type Props = NativeStackScreenProps<RootStackParamList, "Attempts">;

type AttemptItem = {
  id: string;
  test_id: string;
  attempt_no: number;
  total_questions: number;
  attempted: number;
  correct_count: number;
  wrong_count: number;
  accuracy: number;
  score: number;
  is_completed: boolean;
  started_at: string;
  submitted_at: string | null;
};

export default function AttemptsScreen({ route, navigation }: Props) {
  const { testId } = route.params;

  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const loadAttempts = async () => {
    try {
      setLoading(true);

      const res = await TestAPI.getAttemptsByTest(testId);
      console.log("Attempts response:", res.data);

      setAttempts(res.data?.data || []);
    } catch (error: any) {
      console.log("Attempts error:", error.response?.data || error.message);
      Alert.alert("Error", "Attempts load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttempts();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, [testId]);

  const stats = useMemo(() => {
    const completed = attempts.filter((item) => item.is_completed);
    const bestScore =
      completed.length > 0
        ? Math.max(...completed.map((item) => item.score))
        : 0;

    const bestAccuracy =
      completed.length > 0
        ? Math.max(...completed.map((item) => item.accuracy))
        : 0;

    return {
      total: attempts.length,
      completed: completed.length,
      bestScore,
      bestAccuracy,
    };
  }, [attempts]);

  const formatDateTime = (value: string | null) => {
    if (!value) return "Not submitted";

    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "#16a34a";
    if (accuracy >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const openResult = (item: AttemptItem) => {
    if (!item.is_completed) {
      Alert.alert("Pending", "This attempt hasn’t been submitted yet and cannot be submitted after the deadline.");
      return;
    }

    navigation.navigate("Result", {
      attemptId: item.id,
    });
  };

  const renderAttemptCard = ({
    item,
    index,
  }: {
    item: AttemptItem;
    index: number;
  }) => {
    const accuracyColor = getAccuracyColor(item.accuracy);
    const progress =
      item.total_questions > 0
        ? Math.min((item.attempted / item.total_questions) * 100, 100)
        : 0;

    return (
      <Animated.View
        style={[
          styles.animatedCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => openResult(item)}
        >
          <View style={styles.cardGlow} />

          <View style={styles.cardHeader}>
            <View style={styles.attemptBox}>
              <Text style={styles.attemptLabel}>Attempt</Text>
              <Text style={styles.attemptNo}>#{item.attempt_no}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                item.is_completed ? styles.completedBadge : styles.pendingBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.is_completed ? "#16a34a" : "#ef4444",
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: item.is_completed ? "#15803d" : "#b91c1c",
                  },
                ]}
              >
                {item.is_completed ? "COMPLETED" : "PENDING"}
              </Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text
                style={[
                  styles.scoreValue,
                  { color: item.score < 0 ? "#ef4444" : "#111827" },
                ]}
              >
                {item.score}
              </Text>
            </View>

            <View style={styles.accuracyCircle}>
              <Text style={[styles.accuracyValue, { color: accuracyColor }]}>
                {item.accuracy.toFixed(1)}%
              </Text>
              <Text style={styles.accuracyLabel}>Accuracy</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Questions Attempted</Text>
              <Text style={styles.progressCount}>
                {item.attempted}/{item.total_questions}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{item.total_questions}</Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.correctText]}>
                {item.correct_count}
              </Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.wrongText]}>
                {item.wrong_count}
              </Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
          </View>

          <View style={styles.timeBox}>
            <Text style={styles.timeText}>
              Started: {formatDateTime(item.started_at)}
            </Text>

            <Text
              style={[
                styles.timeText,
                !item.submitted_at && styles.notSubmittedText,
              ]}
            >
              Submitted: {formatDateTime(item.submitted_at)}
            </Text>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerHint}>
              {item.is_completed
                ? "Tap to view detailed result"
                : "Attempt is not submitted yet"}
            </Text>

            <View
              style={[
                styles.resultButton,
                !item.is_completed && styles.disabledButton,
              ]}
            >
              <Text
                style={[
                  styles.resultButtonText,
                  !item.is_completed && styles.disabledButtonText,
                ]}
              >
                View Result
              </Text>
              <Text
                style={[
                  styles.resultArrow,
                  !item.is_completed && styles.disabledButtonText,
                ]}
              >
                ›
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.center}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
          <Text style={styles.loadingText}>Loading attempts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.summaryCard}>
            <View>
              <Text style={styles.summaryTitle}>Performance History</Text>
              <Text style={styles.summarySubtitle}>
                Track your progress across attempts
              </Text>
            </View>

            <View style={styles.summaryIconBox}>
              <Text style={styles.summaryIcon}>↗</Text>
            </View>
          </View>

          <View style={styles.overviewRow}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{stats.total}</Text>
              <Text style={styles.overviewLabel}>Total</Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{stats.completed}</Text>
              <Text style={styles.overviewLabel}>Completed</Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{stats.bestScore}</Text>
              <Text style={styles.overviewLabel}>Best Score</Text>
            </View>

            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{stats.bestAccuracy}%</Text>
              <Text style={styles.overviewLabel}>Best Acc.</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={attempts}
          keyExtractor={(item) => item.id}
          renderItem={renderAttemptCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No attempts found</Text>
              <Text style={styles.emptyText}>
                Start a test first to see your attempt history.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  topSection: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 14 : 8,
    paddingBottom: 10,
  },

  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 8,
  },

  summaryTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
  },

  summarySubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#cbd5e1",
  },

  summaryIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryIcon: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
  },

  overviewRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  overviewCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
  },

  overviewValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },

  overviewLabel: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },

  animatedCard: {
    marginBottom: 18,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  cardGlow: {
    position: "absolute",
    top: -65,
    right: -50,
    width: 165,
    height: 165,
    borderRadius: 90,
    backgroundColor: "#dbeafe",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  attemptBox: {
    width: 76,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },

  attemptLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#c7d2fe",
  },

  attemptNo: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  completedBadge: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
  },

  pendingBadge: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  scoreLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94a3b8",
  },

  scoreValue: {
    marginTop: 4,
    fontSize: 38,
    fontWeight: "900",
  },

  accuracyCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },

  accuracyValue: {
    fontSize: 20,
    fontWeight: "900",
  },

  accuracyLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
  },

  progressSection: {
    marginBottom: 16,
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  progressLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },

  progressCount: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0f172a",
  },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#4f46e5",
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eef2f7",
  },

  statValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
  },

  correctText: {
    color: "#16a34a",
  },

  wrongText: {
    color: "#ef4444",
  },

  statLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
  },

  timeBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },

  timeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 5,
  },

  notSubmittedText: {
    color: "#ef4444",
    fontWeight: "900",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerHint: {
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    marginRight: 10,
  },

  resultButton: {
    height: 46,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 16,
    backgroundColor: "#111827",
    flexDirection: "row",
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#e2e8f0",
  },

  resultButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },

  disabledButtonText: {
    color: "#64748b",
  },

  resultArrow: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginLeft: 6,
    marginTop: -2,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  loaderBox: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 7,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#64748b",
    fontWeight: "800",
  },

  emptyBox: {
    marginTop: 70,
    padding: 28,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0f172a",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 21,
  },
});