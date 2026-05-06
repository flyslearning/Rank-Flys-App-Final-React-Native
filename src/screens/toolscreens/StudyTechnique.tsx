import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  AppState,
  AppStateStatus,
  Animated,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToolsStore } from "../../store/tools.store";

const ACCENT = "#EA580C";
const SOFT = "#FFF7ED";
const SOFT_DARK = "#FFEDD5";
const BORDER = "#FED7AA";
const BG = "#F8FAFC";

const DEFAULT_STUDY_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DEFAULT_CYCLES = 4;

type TargetType = "daily_minutes" | "weekly_topics" | "exam_date" | "custom";
type TimerMode = "study" | "break";

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function todayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function prettyTargetType(type: string) {
  return String(type || "custom").replace(/_/g, " ");
}

export default function StudyTechnique() {
  const { width } = useWindowDimensions();
  const isSmall = width < 370;

  const {
    analytics,
    goals = [],
    pomodoroSession,
    loading,
    dashboardLoading,
    goalsLoading,
    actionLoading,
    loadDashboard,
    loadGoals,
    addGoal,
    startFocus,
    finishFocus,
  }: any = useToolsStore();

  const intervalRef = useRef<any>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const circleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [goalsVisible, setGoalsVisible] = useState(false);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalType, setGoalType] = useState<TargetType>("weekly_topics");
  const [goalValue, setGoalValue] = useState("15");
  const [goalDeadline, setGoalDeadline] = useState(todayPlusDays(30));
  const [submittingGoal, setSubmittingGoal] = useState(false);

  const [studyMinutes, setStudyMinutes] = useState(String(DEFAULT_STUDY_MINUTES));
  const [breakMinutes, setBreakMinutes] = useState(String(DEFAULT_BREAK_MINUTES));
  const [cyclesPlanned, setCyclesPlanned] = useState(String(DEFAULT_CYCLES));

  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_STUDY_MINUTES * 60);
  const [timerMode, setTimerMode] = useState<TimerMode>("study");
  const [localCycle, setLocalCycle] = useState(1);
  const [cyclesCompleted, setCyclesCompleted] = useState("0");

  useEffect(() => {
    loadDashboard?.();
    loadGoals?.();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(circleAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(circleAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appState.current = nextState;

      if (nextState === "active" && pomodoroSession && timerStartedAt) {
        updateTimerByTimestamp();
      }
    });

    return () => subscription.remove();
  }, [pomodoroSession, timerStartedAt, studyMinutes, breakMinutes, cyclesPlanned]);

  useEffect(() => {
    if (!pomodoroSession || !timerStartedAt) {
      clearTimer();
      return;
    }

    clearTimer();
    intervalRef.current = setInterval(updateTimerByTimestamp, 1000);

    return () => clearTimer();
  }, [pomodoroSession, timerStartedAt, studyMinutes, breakMinutes, cyclesPlanned]);

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function getTimerConfig() {
    return {
      studySec: Math.max(1, Number(studyMinutes) || DEFAULT_STUDY_MINUTES) * 60,
      breakSec: Math.max(1, Number(breakMinutes) || DEFAULT_BREAK_MINUTES) * 60,
      cycles: Math.max(1, Number(cyclesPlanned) || DEFAULT_CYCLES),
    };
  }

  function updateTimerByTimestamp() {
    if (!timerStartedAt) return;

    const { studySec, breakSec, cycles } = getTimerConfig();
    const oneCycleSec = studySec + breakSec;
    const elapsedSec = Math.floor((Date.now() - timerStartedAt) / 1000);

    const finishedCycles = Math.floor(elapsedSec / oneCycleSec);
    const currentCycle = Math.min(finishedCycles + 1, cycles);
    const cycleElapsed = elapsedSec % oneCycleSec;

    if (finishedCycles >= cycles) {
      setTimerMode("study");
      setLocalCycle(cycles);
      setCyclesCompleted(String(cycles));
      setSecondsLeft(0);
      clearTimer();
      return;
    }

    setLocalCycle(currentCycle);
    setCyclesCompleted(String(finishedCycles));

    if (cycleElapsed < studySec) {
      setTimerMode("study");
      setSecondsLeft(studySec - cycleElapsed);
    } else {
      setTimerMode("break");
      setSecondsLeft(breakSec - (cycleElapsed - studySec));
    }
  }

  const completion = Math.min(
    100,
    Math.max(0, Number(analytics?.completion_percent ?? 0))
  );

  const stats = useMemo(
    () => [
      {
        label: "Today",
        value: analytics?.today_minutes ?? 0,
        suffix: "min",
        icon: "today-outline",
      },
      {
        label: "Week",
        value: analytics?.week_minutes ?? 0,
        suffix: "min",
        icon: "calendar-outline",
      },
      {
        label: "Done Tasks",
        value: analytics?.completed_tasks ?? 0,
        suffix: "",
        icon: "checkmark-done-outline",
      },
      {
        label: "Pending",
        value: analytics?.pending_tasks ?? 0,
        suffix: "",
        icon: "hourglass-outline",
      },
    ],
    [analytics]
  );

  async function handleRefresh() {
    await Promise.all([loadDashboard?.(), loadGoals?.()]);
  }

  async function handleStartPomodoro() {
    try {
      const config = getTimerConfig();

      setSecondsLeft(config.studySec);
      setTimerMode("study");
      setLocalCycle(1);
      setCyclesCompleted("0");
      setTimerStartedAt(Date.now());

      await startFocus?.({
        study_minutes: Number(studyMinutes) || DEFAULT_STUDY_MINUTES,
        break_minutes: Number(breakMinutes) || DEFAULT_BREAK_MINUTES,
        cycles_planned: Number(cyclesPlanned) || DEFAULT_CYCLES,
      });
    } catch (err) {
      console.log("START POMODORO ERROR:", err);
      setTimerStartedAt(null);
      clearTimer();
      Alert.alert("Error", "Pomodoro start nahi ho paya");
    }
  }

  async function handleFinishPomodoro() {
    try {
      const completed = Math.max(1, Number(cyclesCompleted) || localCycle || 1);

      await finishFocus?.(completed, "completed");
      clearTimer();

      setTimerStartedAt(null);
      setSecondsLeft((Number(studyMinutes) || DEFAULT_STUDY_MINUTES) * 60);
      setTimerMode("study");
      setLocalCycle(1);
      setCyclesCompleted("0");
    } catch (err) {
      console.log("FINISH POMODORO ERROR:", err);
      Alert.alert("Error", "Pomodoro finish nahi ho paya");
    }
  }

  async function handleCancelPomodoro() {
    try {
      await finishFocus?.(Number(cyclesCompleted) || 0, "cancelled");
      clearTimer();

      setTimerStartedAt(null);
      setSecondsLeft((Number(studyMinutes) || DEFAULT_STUDY_MINUTES) * 60);
      setTimerMode("study");
      setLocalCycle(1);
      setCyclesCompleted("0");
    } catch (err) {
      console.log("CANCEL POMODORO ERROR:", err);
      Alert.alert("Error", "Pomodoro cancel nahi ho paya");
    }
  }

  async function handleCreateGoal() {
    if (!goalTitle.trim()) {
      Alert.alert("Required", "Goal title likho");
      return;
    }

    if (!goalDescription.trim()) {
      Alert.alert("Required", "Goal description likho");
      return;
    }

    if (!goalDeadline.trim()) {
      Alert.alert("Required", "Deadline YYYY-MM-DD format me likho");
      return;
    }

    try {
      setSubmittingGoal(true);

      await addGoal?.({
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        target_type: goalType,
        target_value: Number(goalValue) || 0,
        deadline: goalDeadline.trim(),
      });

      setGoalTitle("");
      setGoalDescription("");
      setGoalType("weekly_topics");
      setGoalValue("15");
      setGoalDeadline(todayPlusDays(30));
      setGoalsVisible(true);

      await loadGoals?.();
      await loadDashboard?.();
    } catch (err) {
      console.log("CREATE GOAL ERROR:", err);
      Alert.alert("Error", "Goal create nahi ho paya");
    } finally {
      setSubmittingGoal(false);
    }
  }

  const timerTotal =
    timerMode === "study"
      ? getTimerConfig().studySec
      : getTimerConfig().breakSec;

  const timerProgress = Math.min(
    100,
    Math.max(0, ((timerTotal - secondsLeft) / timerTotal) * 100)
  );

  const circleTranslate = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 20],
  });

  const circleOpacity = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={!!loading || !!dashboardLoading || !!goalsLoading}
            onRefresh={handleRefresh}
            colors={[ACCENT]}
            tintColor={ACCENT}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.circleOne,
              {
                opacity: circleOpacity,
                transform: [{ translateX: circleTranslate }, { scale: pulseAnim }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.circleTwo,
              {
                opacity: circleOpacity,
                transform: [{ translateX: circleTranslate }],
              },
            ]}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>STUDY TECHNIQUE</Text>
            <Text style={[styles.title, isSmall && { fontSize: 26 }]}>
              Focus Dashboard
            </Text>
            <Text style={styles.subtitle}>Pomodoro · Goals · Analytics</Text>
          </View>

          <Pressable onPress={handleRefresh} style={styles.refreshBtn}>
            {loading || dashboardLoading || goalsLoading ? (
              <ActivityIndicator color={ACCENT} />
            ) : (
              <Ionicons name="refresh" size={21} color={ACCENT} />
            )}
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Syllabus Completion</Text>
              <Text style={styles.heroValue}>{completion}%</Text>
            </View>

            <Animated.View
              style={[
                styles.heroIcon,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons name="flame-outline" size={28} color={ACCENT} />
            </Animated.View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${completion}%` }]} />
          </View>

          <Text style={styles.heroMeta}>
            {analytics?.completed_topics ?? 0}/{analytics?.total_topics ?? 0} topics completed
          </Text>
        </View>

        <View style={styles.grid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <View style={styles.statIcon}>
                <Ionicons name={s.icon as any} size={21} color={ACCENT} />
              </View>

              <Text style={styles.statValue}>
                {s.value}
                {s.suffix ? ` ${s.suffix}` : ""}
              </Text>

              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.pomodoro}>
          <View style={styles.timerCircle}>
            <View style={styles.timerInner}>
              <Text style={styles.clockText}>{formatTime(secondsLeft)}</Text>
              <Text style={styles.modeText}>
                {timerMode === "study" ? "Study" : "Break"}
              </Text>
            </View>
          </View>

          <View style={styles.timerProgressBar}>
            <View
              style={[
                styles.timerProgressFill,
                { width: `${timerProgress}%` },
              ]}
            />
          </View>

          <Text style={styles.pomoTitle}>
            {pomodoroSession
              ? timerMode === "study"
                ? "Focus Running"
                : "Break Time"
              : "Pomodoro Focus"}
          </Text>

          <Text style={styles.pomoText}>
            {pomodoroSession
              ? `Cycle ${localCycle}/${Number(cyclesPlanned) || DEFAULT_CYCLES} · ${
                  timerMode === "study" ? "Study time" : "Break time"
                }`
              : "Study, break aur cycles khud set karo."}
          </Text>

          {!pomodoroSession && (
            <View style={styles.pomoInputs}>
              <TextInput
                value={studyMinutes}
                onChangeText={setStudyMinutes}
                keyboardType="numeric"
                placeholder="Study minutes"
                placeholderTextColor="#94A3B8"
                style={styles.smallInput}
              />

              <TextInput
                value={breakMinutes}
                onChangeText={setBreakMinutes}
                keyboardType="numeric"
                placeholder="Break minutes"
                placeholderTextColor="#94A3B8"
                style={styles.smallInput}
              />

              <TextInput
                value={cyclesPlanned}
                onChangeText={setCyclesPlanned}
                keyboardType="numeric"
                placeholder="Cycles"
                placeholderTextColor="#94A3B8"
                style={styles.smallInput}
              />
            </View>
          )}

          {pomodoroSession && (
            <View style={styles.runningBox}>
              <Text style={styles.runningText}>
                Completed cycles: {cyclesCompleted}
              </Text>

              <TextInput
                value={cyclesCompleted}
                onChangeText={setCyclesCompleted}
                keyboardType="numeric"
                placeholder="Cycles completed"
                placeholderTextColor="#94A3B8"
                style={styles.cycleInput}
              />
            </View>
          )}

          {!pomodoroSession ? (
            <Pressable
              style={[styles.button, actionLoading && { opacity: 0.7 }]}
              onPress={handleStartPomodoro}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="play-circle-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Start Pomodoro</Text>
                </>
              )}
            </Pressable>
          ) : (
            <View style={styles.actionRow}>
              <Pressable style={styles.finishButton} onPress={handleFinishPomodoro}>
                <Text style={styles.buttonText}>Finish</Text>
              </Pressable>

              <Pressable style={styles.cancelButton} onPress={handleCancelPomodoro}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.goalForm}>
          <View style={styles.goalHeaderRow}>
            <Text style={styles.cardTitle}>Create Goal</Text>

            <Pressable
              style={styles.activeGoalBtn}
              onPress={() => setGoalsVisible(true)}
            >
              <Text style={styles.activeGoalText}>Active Goals</Text>
            </Pressable>
          </View>

          <TextInput
            value={goalTitle}
            onChangeText={setGoalTitle}
            placeholder="Title: Physics complete karna hai"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <TextInput
            value={goalDescription}
            onChangeText={setGoalDescription}
            placeholder="Description: Electrostatics se Modern Physics tak"
            placeholderTextColor="#94A3B8"
            style={[styles.input, styles.textArea]}
            multiline
          />

          <Text style={styles.selectorLabel}>Target Type</Text>

          <View style={styles.optionRow}>
            {(["daily_minutes", "weekly_topics", "exam_date", "custom"] as TargetType[]).map(
              (type) => {
                const active = goalType === type;

                return (
                  <Pressable
                    key={type}
                    onPress={() => setGoalType(type)}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {prettyTargetType(type)}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          <TextInput
            value={goalValue}
            onChangeText={setGoalValue}
            placeholder="Target value: 15"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.deadlineRow}>
            {[7, 15, 30].map((days) => (
              <Pressable
                key={days}
                style={styles.deadlineChip}
                onPress={() => setGoalDeadline(todayPlusDays(days))}
              >
                <Text style={styles.deadlineChipText}>{days} days</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={goalDeadline}
            onChangeText={setGoalDeadline}
            placeholder="Deadline: YYYY-MM-DD"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Pressable
            style={[styles.goalButton, submittingGoal && { opacity: 0.7 }]}
            onPress={handleCreateGoal}
            disabled={submittingGoal}
          >
            {submittingGoal ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="flag-outline" size={19} color="#fff" />
                <Text style={styles.buttonText}>Create Goal</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.cardTitle}>Best Techniques</Text>

          {[
            "Active Recall: khud se answer bolo.",
            "Spaced Revision: flashcards daily karo.",
            "Pomodoro: distraction-free study.",
            "Practice: topic ke baad questions solve.",
          ].map((tip, index) => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.tip}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={goalsVisible} transparent animationType="fade">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Active Goals</Text>

              <Pressable
                onPress={() => setGoalsVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={ACCENT} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {goals.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="flag-outline" size={42} color={ACCENT} />
                  <Text style={styles.emptyTitle}>No goals created yet</Text>
                  <Text style={styles.emptyText}>
                    Pehla study goal create karo.
                  </Text>
                </View>
              ) : (
                goals.map((goal: any) => (
                  <View key={goal.id} style={styles.goalCard}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>

                    {!!goal.description && (
                      <Text style={styles.goalDescription}>{goal.description}</Text>
                    )}

                    <Text style={styles.goalMeta}>
                      {prettyTargetType(goal.target_type)} ·{" "}
                      {goal.current_value ?? 0}/{goal.target_value ?? 0} ·{" "}
                      {goal.status}
                    </Text>

                    {!!goal.deadline && (
                      <Text style={styles.goalDate}>Deadline: {goal.deadline}</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 70 },

  header: {
    marginTop: 46,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  circleOne: {
    position: "absolute",
    right: 36,
    top: -20,
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: SOFT_DARK,
  },
  circleTwo: {
    position: "absolute",
    right: -18,
    top: 36,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BORDER,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: ACCENT,
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.7,
  },
  subtitle: {
    color: "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },
  refreshBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "#64748B",
    fontWeight: "800",
  },
  heroValue: {
    color: ACCENT,
    fontSize: 40,
    fontWeight: "900",
    marginTop: 2,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    height: 12,
    backgroundColor: SOFT_DARK,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: ACCENT,
  },
  heroMeta: {
    color: "#64748B",
    marginTop: 9,
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  stat: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: ACCENT,
    marginTop: 8,
  },
  statLabel: {
    color: "#64748B",
    marginTop: 4,
    fontWeight: "800",
  },

  pomodoro: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 22,
    marginTop: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  timerCircle: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 8,
    borderColor: BORDER,
  },
  timerInner: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  clockText: {
    fontSize: 38,
    fontWeight: "900",
    color: ACCENT,
    letterSpacing: 1,
  },
  modeText: {
    color: "#64748B",
    fontWeight: "900",
    marginTop: 4,
  },
  timerProgressBar: {
    height: 9,
    backgroundColor: SOFT_DARK,
    borderRadius: 999,
    overflow: "hidden",
    width: "100%",
    marginTop: 18,
  },
  timerProgressFill: {
    height: "100%",
    backgroundColor: ACCENT,
  },
  pomoTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 14,
  },
  pomoText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
    fontWeight: "600",
  },
  pomoInputs: {
    width: "100%",
    marginTop: 16,
    gap: 10,
  },
  smallInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#0F172A",
    fontWeight: "800",
    textAlign: "center",
  },
  runningBox: {
    width: "100%",
    marginTop: 16,
  },
  runningText: {
    color: "#64748B",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  cycleInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 13,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlign: "center",
    fontWeight: "800",
    color: "#0F172A",
  },
  button: {
    backgroundColor: ACCENT,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 18,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 18,
  },
  finishButton: {
    flex: 1,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: SOFT,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  cancelText: {
    color: ACCENT,
    fontWeight: "900",
  },

  goalForm: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  goalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeGoalBtn: {
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  activeGoalText: {
    color: ACCENT,
    fontWeight: "900",
    fontSize: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#0F172A",
    fontWeight: "700",
  },
  textArea: {
    height: 86,
    textAlignVertical: "top",
  },
  selectorLabel: {
    color: "#0F172A",
    fontWeight: "900",
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  optionText: {
    color: "#475569",
    fontWeight: "900",
    fontSize: 11,
    textTransform: "capitalize",
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
  deadlineRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  deadlineChip: {
    flex: 1,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: "center",
  },
  deadlineChipText: {
    color: ACCENT,
    fontWeight: "900",
    fontSize: 12,
  },
  goalButton: {
    backgroundColor: ACCENT,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "900",
  },

  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tipNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  tipNumberText: {
    color: ACCENT,
    fontWeight: "900",
    fontSize: 12,
  },
  tip: {
    flex: 1,
    color: "#475569",
    lineHeight: 20,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    maxHeight: "82%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  goalCard: {
    backgroundColor: SOFT,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  goalTitle: {
    color: "#0F172A",
    fontWeight: "900",
    fontSize: 15,
  },
  goalDescription: {
    color: "#475569",
    marginTop: 5,
    fontWeight: "600",
    lineHeight: 19,
  },
  goalMeta: {
    color: "#64748B",
    marginTop: 6,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  goalDate: {
    color: ACCENT,
    marginTop: 5,
    fontWeight: "900",
  },
  emptyBox: {
    backgroundColor: SOFT,
    borderRadius: 20,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },
});