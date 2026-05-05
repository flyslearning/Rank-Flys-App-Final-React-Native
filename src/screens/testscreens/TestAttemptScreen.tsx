import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  StatusBar,
  SafeAreaView,
  BackHandler,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Question } from "../../types";
import { TestAPI } from "../../api/test.api";
import { useTestStore } from "../../store/test.store";

type Props = NativeStackScreenProps<RootStackParamList, "TestAttempt">;

type QuestionStatus =
  | "answered"
  | "notAnswered"
  | "marked"
  | "answeredMarked"
  | "notVisited";

type Stats = {
  answered: number;
  marked: number;
  notAnswered: number;
  notVisited: number;
  total: number;
};

export default function TestAttemptScreen({ route, navigation }: Props) {
  const { testId, seriesId } = route.params;
  const { width } = useWindowDimensions();
  const isSmall = width < 370;

  const {
    attemptId,
    questions,
    currentQuestionIndex,
    responsesMap,
    startLocalAttempt,
    selectOption,
    setCurrentQuestionIndex,
    getResponsesArray,
    clearAttempt,
  } = useTestStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [markedMap, setMarkedMap] = useState<Record<string, boolean>>({});
  const [visitedMap, setVisitedMap] = useState<Record<string, boolean>>({});
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [allowExit, setAllowExit] = useState(false);

  const questionStartTime = useRef(Date.now());
  const hasStartedRef = useRef(false);

  const currentQuestion: Question | undefined = questions[currentQuestionIndex];

  const startTest = useCallback(async () => {
    if (hasStartedRef.current) return;

    try {
      hasStartedRef.current = true;
      setLoading(true);

      await clearAttempt();
      setCurrentQuestionIndex(0);
      setMarkedMap({});
      setVisitedMap({});
      setElapsedSeconds(0);

      const attemptRes = await TestAPI.startAttempt(testId, seriesId);
      const newAttemptId =
        attemptRes.data?.data?.attempt_id ||
        attemptRes.data?.data?.id ||
        attemptRes.data?.attempt_id ||
        attemptRes.data?.id;

      if (!newAttemptId) {
        throw new Error("Attempt ID not found");
      }

      const questionRes = await TestAPI.getQuestions(testId);
      const questionList = questionRes.data?.data || questionRes.data || [];

      await startLocalAttempt(newAttemptId, testId, questionList);

      if (questionList[0]?.id) {
        setVisitedMap({ [questionList[0].id]: true });
      }

      questionStartTime.current = Date.now();
    } catch (error: any) {
      hasStartedRef.current = false;

      console.log("START ERROR:", error?.response?.data || error.message);

      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error.message ||
          "Test start failed"
      );
    } finally {
      setLoading(false);
    }
  }, [
    testId,
    seriesId,
    clearAttempt,
    setCurrentQuestionIndex,
    startLocalAttempt,
  ]);

  useEffect(() => {
    startTest();
  }, [startTest]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentQuestion?.id) {
      setVisitedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: true,
      }));
    }
  }, [currentQuestionIndex, currentQuestion?.id]);

  const getOptions = (q?: any): string[] => {
    if (!q) return [];
    return q.options || [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const saveCurrentTime = useCallback(async () => {
    if (!currentQuestion) return;

    const oldResponse = responsesMap[currentQuestion.id];
    const seconds = Math.floor((Date.now() - questionStartTime.current) / 1000);

    if (oldResponse) {
      await selectOption(
        currentQuestion.id,
        oldResponse.selected_option,
        (oldResponse.time_spent_seconds || 0) + seconds
      );
    }

    questionStartTime.current = Date.now();
  }, [currentQuestion, responsesMap, selectOption]);

  const chooseOption = async (optionIndex: number) => {
    if (!currentQuestion) return;

    const seconds = Math.floor((Date.now() - questionStartTime.current) / 1000);
    await selectOption(currentQuestion.id, optionIndex, seconds);
  };

  const clearResponse = async () => {
    if (!currentQuestion) return;

    const seconds = Math.floor((Date.now() - questionStartTime.current) / 1000);
    await selectOption(currentQuestion.id, null, seconds);
  };

  const goToQuestion = async (index: number) => {
    await saveCurrentTime();

    setCurrentQuestionIndex(index);
    questionStartTime.current = Date.now();
    setPaletteVisible(false);
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      await goToQuestion(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = async () => {
    if (currentQuestionIndex > 0) {
      await goToQuestion(currentQuestionIndex - 1);
    }
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;

    setMarkedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const stats = useMemo(() => {
    let answered = 0;
    let marked = 0;
    let notAnswered = 0;
    let notVisited = 0;

    questions.forEach((q) => {
      const selected = responsesMap[q.id]?.selected_option;
      const isAnswered = selected !== null && selected !== undefined;
      const isVisited = !!visitedMap[q.id];
      const isMarked = !!markedMap[q.id];

      if (isAnswered) answered++;
      if (isMarked) marked++;
      if (isVisited && !isAnswered) notAnswered++;
      if (!isVisited) notVisited++;
    });

    return {
      answered,
      marked,
      notAnswered,
      notVisited,
      total: questions.length,
    };
  }, [questions, responsesMap, markedMap, visitedMap]);

  const getQuestionStatus = (q: Question): QuestionStatus => {
    const selected = responsesMap[q.id]?.selected_option;
    const isAnswered = selected !== null && selected !== undefined;
    const isVisited = !!visitedMap[q.id];
    const isMarked = !!markedMap[q.id];

    if (isAnswered && isMarked) return "answeredMarked";
    if (isMarked) return "marked";
    if (isAnswered) return "answered";
    if (isVisited) return "notAnswered";
    return "notVisited";
  };

  const submit = useCallback(async () => {
    if (!attemptId) {
      Alert.alert("Error", "Attempt ID missing");
      return;
    }

    Alert.alert(
      "Submit Test?",
      `Answered: ${stats.answered}/${stats.total}\nMarked: ${stats.marked}\nNot Answered: ${stats.notAnswered}\n\nSubmit karna hai?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);

              await saveCurrentTime();

              const responses = getResponsesArray();
              await TestAPI.submitAttempt(attemptId, responses);

              const id = attemptId;

              setAllowExit(true);
              await clearAttempt();

              navigation.replace("Result", {
                attemptId: id,
              });
            } catch (error: any) {
              console.log("SUBMIT ERROR:", error?.response?.data || error.message);

              Alert.alert(
                "Error",
                error?.response?.data?.message ||
                  error?.response?.data?.error ||
                  "Submit failed"
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [
    attemptId,
    stats,
    saveCurrentTime,
    getResponsesArray,
    clearAttempt,
    navigation,
  ]);

  const confirmBackAction = useCallback(() => {
    if (allowExit || submitting) return false;

    Alert.alert(
      "Leave Test?",
      "Aapka test abhi submit nahi hua hai. Kya aap test submit karna chahte ho?",
      [
        { text: "Stay", style: "cancel" },
        { text: "Submit Test", style: "destructive", onPress: submit },
      ]
    );

    return true;
  }, [allowExit, submitting, submit]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      confirmBackAction
    );

    return () => backHandler.remove();
  }, [confirmBackAction]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (allowExit || loading || submitting) return;

      e.preventDefault();

      Alert.alert(
        "Leave Test?",
        "Back jaane se pehle test submit karna hoga. Kya aap submit karna chahte ho?",
        [
          { text: "Stay", style: "cancel" },
          { text: "Submit Test", style: "destructive", onPress: submit },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, allowExit, loading, submitting, submit]);

  if (loading) {
    return <LoadingState />;
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>No questions found</Text>
      </SafeAreaView>
    );
  }

  const selected = responsesMap[currentQuestion.id]?.selected_option;
  const options = getOptions(currentQuestion);
  const isMarked = !!markedMap[currentQuestion.id];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <TestHeader
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        elapsedSeconds={elapsedSeconds}
        formatTime={formatTime}
      />

      <TestStatusBar
        stats={stats}
        isSmall={isSmall}
        onOpenPanel={() => setPaletteVisible(true)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <QuestionCard currentQuestion={currentQuestion} isMarked={isMarked} />

        <OptionsList
          options={options}
          selected={selected}
          onChooseOption={chooseOption}
        />

        <QuestionActions
          isMarked={isMarked}
          onClear={clearResponse}
          onMarkReview={toggleMarkForReview}
        />
      </ScrollView>

      <BottomNavigation
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        submitting={submitting}
        onPrevious={previousQuestion}
        onNext={nextQuestion}
        onSubmit={submit}
      />

      <QuestionPaletteModal
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
        questions={questions}
        currentIndex={currentQuestionIndex}
        getStatus={getQuestionStatus}
        onJump={goToQuestion}
        onSubmit={() => {
          setPaletteVisible(false);
          submit();
        }}
        stats={stats}
      />
    </SafeAreaView>
  );
}

function LoadingState() {
  return (
    <SafeAreaView style={styles.loadingScreen}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingTitle}>Test loading...</Text>
      <Text style={styles.loadingSubtitle}>Please wait</Text>
    </SafeAreaView>
  );
}

function TestHeader({
  currentQuestionIndex,
  totalQuestions,
  elapsedSeconds,
  formatTime,
}: {
  currentQuestionIndex: number;
  totalQuestions: number;
  elapsedSeconds: number;
  formatTime: (seconds: number) => string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerSmall}>Rank Flys Test</Text>
        <Text style={styles.headerTitle}>
          Question {currentQuestionIndex + 1}
          <Text style={styles.headerTotal}> / {totalQuestions}</Text>
        </Text>
      </View>

      <View style={styles.timeCard}>
        <Ionicons name="time-outline" size={17} color="#2563eb" />
        <Text style={styles.timeValue}>{formatTime(elapsedSeconds)}</Text>
      </View>
    </View>
  );
}

function TestStatusBar({
  stats,
  isSmall,
  onOpenPanel,
}: {
  stats: Stats;
  isSmall: boolean;
  onOpenPanel: () => void;
}) {
  return (
    <View style={styles.statusBar}>
      <StatusChip label="Done" value={stats.answered} color="#16a34a" />
      <StatusChip label="Review" value={stats.marked} color="#7c3aed" />
      <StatusChip label="Left" value={stats.notVisited} color="#64748b" />

      <TouchableOpacity activeOpacity={0.9} style={styles.gridButton} onPress={onOpenPanel}>
        <Ionicons name="grid-outline" size={17} color="#ffffff" />
        {!isSmall && <Text style={styles.gridButtonText}>Panel</Text>}
      </TouchableOpacity>
    </View>
  );
}

function QuestionCard({
  currentQuestion,
  isMarked,
}: {
  currentQuestion: Question;
  isMarked: boolean;
}) {
  return (
    <View style={styles.questionCard}>
      <View style={styles.questionTop}>
        <Text style={styles.questionTag}>
          {currentQuestion.subject || currentQuestion.section || "General"}
        </Text>

        {isMarked ? (
          <Text style={styles.markedPill}>Marked</Text>
        ) : (
          <Text style={styles.normalPill}>Single Choice</Text>
        )}
      </View>

      <Text style={styles.questionText}>
        {currentQuestion.question_text || currentQuestion.question}
      </Text>
    </View>
  );
}

function OptionsList({
  options,
  selected,
  onChooseOption,
}: {
  options: string[];
  selected: number | null | undefined;
  onChooseOption: (index: number) => void;
}) {
  return (
    <View style={styles.optionsList}>
      {options.map((option: string, index: number) => {
        const active = selected === index;

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.9}
            style={[styles.optionCard, active && styles.optionCardActive]}
            onPress={() => onChooseOption(index)}
          >
            <View style={[styles.optionLetter, active && styles.optionLetterActive]}>
              <Text
                style={[
                  styles.optionLetterText,
                  active && styles.optionLetterTextActive,
                ]}
              >
                {String.fromCharCode(65 + index)}
              </Text>
            </View>

            <Text style={[styles.optionText, active && styles.optionTextActive]}>
              {option}
            </Text>

            {active && <Ionicons name="checkmark-circle" size={22} color="#2563eb" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function QuestionActions({
  isMarked,
  onClear,
  onMarkReview,
}: {
  isMarked: boolean;
  onClear: () => void;
  onMarkReview: () => void;
}) {
  return (
    <View style={styles.midActions}>
      <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
        <Ionicons name="refresh-outline" size={17} color="#334155" />
        <Text style={styles.clearBtnText}>Clear</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.reviewBtn, isMarked && styles.reviewBtnActive]}
        onPress={onMarkReview}
      >
        <Ionicons
          name={isMarked ? "bookmark" : "bookmark-outline"}
          size={17}
          color={isMarked ? "#ffffff" : "#7c3aed"}
        />
        <Text style={[styles.reviewBtnText, isMarked && styles.reviewBtnTextActive]}>
          {isMarked ? "Marked" : "Mark Review"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function BottomNavigation({
  currentQuestionIndex,
  totalQuestions,
  submitting,
  onPrevious,
  onNext,
  onSubmit,
}: {
  currentQuestionIndex: number;
  totalQuestions: number;
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const isLast = currentQuestionIndex === totalQuestions - 1;

  return (
    <View style={styles.bottomNavWrapper}>
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.previousBtn, currentQuestionIndex === 0 && styles.disabledBtn]}
          disabled={currentQuestionIndex === 0}
          onPress={onPrevious}
        >
          <Ionicons name="chevron-back" size={18} color="#334155" />
          <Text style={styles.previousBtnText}>Previous</Text>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Submit</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextBtnText}>Save & Next</Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function StatusChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statusChip}>
      <Text style={[styles.statusValue, { color }]}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

function QuestionPaletteModal({
  visible,
  onClose,
  questions,
  currentIndex,
  getStatus,
  onJump,
  onSubmit,
  stats,
}: {
  visible: boolean;
  onClose: () => void;
  questions: Question[];
  currentIndex: number;
  getStatus: (q: Question) => QuestionStatus;
  onJump: (index: number) => void;
  onSubmit: () => void;
  stats: Stats;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.paletteSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.paletteHeader}>
            <View>
              <Text style={styles.paletteTitle}>Question Panel</Text>
              <Text style={styles.paletteSub}>Jump to any question quickly</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#334155" />
            </TouchableOpacity>
          </View>

          <View style={styles.paletteSummary}>
            <StatusChip label="Done" value={stats.answered} color="#16a34a" />
            <StatusChip label="Review" value={stats.marked} color="#7c3aed" />
            <StatusChip label="Left" value={stats.notVisited} color="#64748b" />
          </View>

          <View style={styles.legendBox}>
            <Legend color="#16a34a" label="Answered" />
            <Legend color="#dc2626" label="Not Answered" />
            <Legend color="#7c3aed" label="Review" />
            <Legend color="#2563eb" label="Answered + Review" />
            <Legend color="#e5e7eb" label="Not Visited" />
          </View>

          <FlatList
            data={questions}
            keyExtractor={(item) => item.id}
            numColumns={5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridList}
            renderItem={({ item, index }) => {
              const status = getStatus(item);
              const active = index === currentIndex;

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.questionBox,
                    status === "answered" && styles.boxAnswered,
                    status === "notAnswered" && styles.boxNotAnswered,
                    status === "marked" && styles.boxMarked,
                    status === "answeredMarked" && styles.boxAnsweredMarked,
                    status === "notVisited" && styles.boxNotVisited,
                    active && styles.boxActive,
                  ]}
                  onPress={() => onJump(index)}
                >
                  <Text
                    style={[
                      styles.questionBoxText,
                      status !== "notVisited" && styles.questionBoxTextLight,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.finalSubmitBtn} onPress={onSubmit}>
            <Text style={styles.finalSubmitText}>Submit Test</Text>
            <Ionicons name="checkmark-circle-outline" size={19} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  loadingSubtitle: {
    marginTop: 4,
    color: "#64748b",
    fontWeight: "700",
  },

  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  headerSmall: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
  headerTotal: {
    color: "#94a3b8",
    fontSize: 16,
  },
  timeCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 98,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  timeValue: {
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: "900",
  },

  statusBar: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  statusChip: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "900",
  },
  statusLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },
  gridButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gridButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 12,
  },

  content: {
    padding: 14,
    paddingBottom: 190,
  },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  questionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
    gap: 10,
  },
  questionTag: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "900",
  },
  normalPill: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "900",
  },
  markedPill: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "900",
  },
  questionText: {
    fontSize: 18,
    lineHeight: 28,
    color: "#0f172a",
    fontWeight: "900",
  },

  optionsList: {
    gap: 11,
  },
  optionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  optionCardActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionLetterActive: {
    backgroundColor: "#2563eb",
  },
  optionLetterText: {
    fontWeight: "900",
    color: "#334155",
  },
  optionLetterTextActive: {
    color: "#ffffff",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    color: "#111827",
    fontWeight: "700",
  },
  optionTextActive: {
    color: "#1d4ed8",
  },

  midActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    flexDirection: "row",
    gap: 6,
  },
  clearBtnText: {
    color: "#334155",
    fontWeight: "900",
  },
  reviewBtn: {
    flex: 1,
    backgroundColor: "#f5f3ff",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c4b5fd",
    flexDirection: "row",
    gap: 6,
  },
  reviewBtnActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  reviewBtnText: {
    color: "#6d28d9",
    fontWeight: "900",
  },
  reviewBtnTextActive: {
    color: "#ffffff",
  },

  bottomNavWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 50,
    paddingHorizontal: 12,
  },
  bottomNav: {
    backgroundColor: "#ffffff",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  previousBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previousBtnText: {
    color: "#334155",
    fontWeight: "900",
  },
  nextBtn: {
    flex: 1.5,
    backgroundColor: "#2563eb",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  nextBtnText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: "#dc2626",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  submitBtnText: {
    color: "#ffffff",
    fontWeight: "900",
  },
  disabledBtn: {
    opacity: 0.45,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "flex-end",
  },
  paletteSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
    maxHeight: "88%",
  },
  sheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: "#cbd5e1",
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 14,
  },
  paletteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paletteTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0f172a",
  },
  paletteSub: {
    color: "#64748b",
    marginTop: 3,
    fontWeight: "700",
  },
  closeBtn: {
    backgroundColor: "#f1f5f9",
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  paletteSummary: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  legendBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  gridList: {
    paddingTop: 14,
    paddingBottom: 14,
  },
  questionBox: {
    width: "18%",
    aspectRatio: 1,
    margin: "1%",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  boxAnswered: {
    backgroundColor: "#16a34a",
  },
  boxNotAnswered: {
    backgroundColor: "#dc2626",
  },
  boxMarked: {
    backgroundColor: "#7c3aed",
  },
  boxAnsweredMarked: {
    backgroundColor: "#2563eb",
  },
  boxNotVisited: {
    backgroundColor: "#e5e7eb",
  },
  boxActive: {
    borderWidth: 3,
    borderColor: "#0f172a",
  },
  questionBoxText: {
    fontWeight: "900",
    color: "#334155",
  },
  questionBoxTextLight: {
    color: "#ffffff",
  },
  finalSubmitBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  finalSubmitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
});