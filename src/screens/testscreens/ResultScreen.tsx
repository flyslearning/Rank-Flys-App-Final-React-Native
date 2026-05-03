import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { TestAPI } from "../../api/test.api";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

type Attempt = {
  id: string;
  test_id: string;
  attempt_no: number;
  score: number;
  total_questions: number;
  attempted: number;
  correct_count: number;
  wrong_count: number;
  accuracy: number;
  submitted_at: string | null;
};

type ResultResponse = {
  question_id: string;
  selected_option: number | null;
  is_correct: boolean;
  time_spent_seconds: number;
  marks: number;
  section?: string;
};

type Question = {
  id: string;
  question_id?: string;
  question_text?: string;
  question?: string;
  options: string[];
  correct_option?: number;
  solution?: string;
  subject?: string;
  chapter?: string;
};

type ReviewItem = ResultResponse & {
  questionData?: Question;
};

export default function ResultScreen({ route }: Props) {
  const { attemptId } = route.params;

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const extractQuestionsArray = (data: any): Question[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.questions)) return data.questions;
    if (Array.isArray(data?.data?.questions)) return data.data.questions;
    return [];
  };

  const loadResult = async () => {
    try {
      setLoading(true);

      const resultRes = await TestAPI.getResult(attemptId);

      const resultData = resultRes.data?.data;
      const attemptData: Attempt = resultData?.attempt;
      const responses: ResultResponse[] = resultData?.responses || [];

      if (!attemptData?.test_id) {
        Alert.alert("Error", "Result me test_id nahi mila");
        return;
      }

      setAttempt(attemptData);

      const questionsRes = await TestAPI.getQuestions(attemptData.test_id);
      const questions = extractQuestionsArray(questionsRes.data);

      const questionMap: Record<string, Question> = {};

      questions.forEach((q) => {
        const key = q.id || q.question_id;
        if (key) questionMap[key] = q;
      });

      const merged: ReviewItem[] = responses.map((r) => ({
        ...r,
        questionData: questionMap[r.question_id],
      }));

      setReviewItems(merged);
    } catch (error: any) {
      console.log("Result load error:", error?.response?.data || error.message);
      Alert.alert("Error", "Result load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResult();
  }, [attemptId]);

  const optionName = (index: number | null | undefined) => {
    if (index === null || index === undefined) return "Not selected";
    return String.fromCharCode(65 + index);
  };

  const optionValue = (
    options: string[] | undefined,
    index: number | null | undefined
  ) => {
    if (!options || index === null || index === undefined) return "Not selected";
    return options[index] || "Not found";
  };

  const performanceLabel = useMemo(() => {
    if (!attempt) return "Result";
    if (attempt.accuracy >= 80) return "Excellent Performance";
    if (attempt.accuracy >= 50) return "Good Attempt";
    if (attempt.accuracy > 0) return "Needs Practice";
    return "Keep Practicing";
  }, [attempt]);

  const attemptedPercent = useMemo(() => {
    if (!attempt?.total_questions) return 0;
    return Math.round((attempt.attempted / attempt.total_questions) * 100);
  }, [attempt]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingTitle}>Preparing Result...</Text>
        <Text style={styles.loadingText}>Fetching score analysis</Text>
      </SafeAreaView>
    );
  }

  if (!attempt) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>No result found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroLabel}>TEST RESULT</Text>
            <Text style={styles.heroTitle}>{performanceLabel}</Text>
            <Text style={styles.heroSub}>Attempt #{attempt.attempt_no}</Text>
          </View>

          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{attempt.score}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="analytics-outline" size={22} color="#2563eb" />
            <Text style={styles.statValue}>{attempt.accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={22} color="#2563eb" />
            <Text style={styles.statValue}>{attempt.attempted}</Text>
            <Text style={styles.statLabel}>Attempted</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={22} color="#16a34a" />
            <Text style={[styles.statValue, styles.greenText]}>
              {attempt.correct_count}
            </Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="close-circle-outline" size={22} color="#dc2626" />
            <Text style={[styles.statValue, styles.redText]}>
              {attempt.wrong_count}
            </Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Completion</Text>
            <Text style={styles.progressPercent}>{attemptedPercent}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${attemptedPercent}%` }]} />
          </View>

          <Text style={styles.progressMeta}>
            {attempt.attempted} out of {attempt.total_questions} questions attempted
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Question Review</Text>
          <Text style={styles.sectionSubtitle}>
            Tap any question card to view full answer details
          </Text>
        </View>

        {reviewItems.map((item, index) => {
          const q = item.questionData;
          const isOpen = openId === item.question_id;
          const selectedAnswer = optionValue(q?.options, item.selected_option);
          const correctAnswer = optionValue(q?.options, q?.correct_option);

          return (
            <TouchableOpacity
              key={item.question_id}
              activeOpacity={0.9}
              style={[
                styles.reviewCard,
                item.is_correct ? styles.correctBorder : styles.wrongBorder,
              ]}
              onPress={() => setOpenId(isOpen ? null : item.question_id)}
            >
              <View style={styles.reviewTop}>
                <View style={styles.questionNoBox}>
                  <Text style={styles.questionNo}>Q{index + 1}</Text>
                </View>

                <View
                  style={[
                    styles.resultBadge,
                    item.is_correct ? styles.correctBadge : styles.wrongBadge,
                  ]}
                >
                  <Ionicons
                    name={item.is_correct ? "checkmark-circle" : "close-circle"}
                    size={14}
                    color={item.is_correct ? "#16a34a" : "#dc2626"}
                  />
                  <Text
                    style={[
                      styles.resultBadgeText,
                      item.is_correct ? styles.correctText : styles.wrongText,
                    ]}
                  >
                    {item.is_correct ? "Correct" : "Wrong"}
                  </Text>
                </View>
              </View>

              <Text style={styles.questionText}>
                {q?.question_text || q?.question || "Question not found"}
              </Text>

              <View style={styles.quickInfo}>
                <Text style={styles.quickChip}>
                  Your Answer: {optionName(item.selected_option)}
                </Text>
                <Text style={styles.quickChip}>Marks: {item.marks}</Text>
                <Text style={styles.quickChip}>
                  Time: {item.time_spent_seconds}s
                </Text>
              </View>

              {!q && (
                <Text style={styles.errorText}>
                  Question API me is ID ka question nahi mila: {item.question_id}
                </Text>
              )}

              {isOpen && q && (
                <View style={styles.expandedArea}>
                  <Text style={styles.optionsTitle}>Options</Text>

                  {q.options?.map((option, optionIndex) => {
                    const isMyAnswer = item.selected_option === optionIndex;
                    const isCorrectAnswer = q.correct_option === optionIndex;

                    return (
                      <View
                        key={optionIndex}
                        style={[
                          styles.optionCard,
                          isCorrectAnswer && styles.correctOptionCard,
                          isMyAnswer && !isCorrectAnswer && styles.myWrongOptionCard,
                          isMyAnswer && isCorrectAnswer && styles.myCorrectOptionCard,
                        ]}
                      >
                        <View style={styles.optionLeft}>
                          <View
                            style={[
                              styles.optionCircle,
                              isCorrectAnswer && styles.correctCircle,
                              isMyAnswer && !isCorrectAnswer && styles.wrongCircle,
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionCircleText,
                                (isCorrectAnswer || isMyAnswer) &&
                                  styles.optionCircleTextActive,
                              ]}
                            >
                              {String.fromCharCode(65 + optionIndex)}
                            </Text>
                          </View>

                          <Text style={styles.optionText}>{option}</Text>
                        </View>

                        <View>
                          {isMyAnswer && (
                            <Text
                              style={[
                                styles.tagText,
                                isCorrectAnswer ? styles.greenText : styles.redText,
                              ]}
                            >
                              Your Answer
                            </Text>
                          )}

                          {isCorrectAnswer && (
                            <Text style={[styles.tagText, styles.greenText]}>
                              Correct
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  <View style={styles.answerSummary}>
                    <Text style={styles.answerSummaryTitle}>Answer Summary</Text>

                    <Text style={styles.answerLine}>
                      Your Option: {optionName(item.selected_option)}
                    </Text>

                    <Text style={styles.answerLine}>
                      Correct Option: {optionName(q.correct_option)}
                    </Text>

                    <Text style={styles.answerLine}>
                      Time Spent: {item.time_spent_seconds} seconds
                    </Text>
                  </View>

                  {q.solution ? (
                    <View style={styles.solutionBox}>
                      <Text style={styles.solutionTitle}>Solution</Text>
                      <Text style={styles.solutionText}>{q.solution}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },

  container: {
    padding: 18,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  loadingTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },

  loadingText: {
    marginTop: 6,
    color: "#64748b",
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },

  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 20,
    minHeight: 150,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  heroLabel: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  heroTitle: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    maxWidth: 190,
  },

  heroSub: {
    marginTop: 8,
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "700",
  },

  scoreCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#60a5fa",
  },

  scoreValue: {
    color: "#ffffff",
    fontSize: 27,
    fontWeight: "900",
  },

  scoreLabel: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "800",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  statValue: {
    marginTop: 8,
    fontSize: 25,
    fontWeight: "900",
    color: "#2563eb",
  },

  statLabel: {
    marginTop: 4,
    color: "#64748b",
    fontWeight: "800",
  },

  greenText: { color: "#16a34a" },
  redText: { color: "#dc2626" },

  progressCard: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 22,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  progressTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },

  progressPercent: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2563eb",
  },

  progressTrack: {
    height: 11,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 999,
  },

  progressMeta: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "700",
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#0f172a",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: "#64748b",
    lineHeight: 20,
    fontWeight: "600",
  },

  reviewCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 22,
    borderWidth: 1.5,
    marginBottom: 14,
  },

  correctBorder: { borderColor: "#bbf7d0" },
  wrongBorder: { borderColor: "#fecaca" },

  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },

  questionNoBox: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  questionNo: {
    color: "#2563eb",
    fontWeight: "900",
  },

  resultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  correctBadge: { backgroundColor: "#dcfce7" },
  wrongBadge: { backgroundColor: "#fee2e2" },

  resultBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  correctText: { color: "#166534" },
  wrongText: { color: "#991b1b" },

  questionText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    lineHeight: 23,
    marginBottom: 12,
  },

  quickInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  quickChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },

  errorText: {
    marginTop: 10,
    color: "#dc2626",
    fontWeight: "800",
  },

  expandedArea: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
  },

  optionsTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
  },

  optionCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  optionLeft: {
    flexDirection: "row",
    flex: 1,
    gap: 10,
  },

  optionCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  correctCircle: { backgroundColor: "#16a34a" },
  wrongCircle: { backgroundColor: "#dc2626" },

  optionCircleText: {
    fontWeight: "900",
    color: "#334155",
  },

  optionCircleTextActive: {
    color: "#ffffff",
  },

  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 21,
  },

  correctOptionCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
  },

  myWrongOptionCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
  },

  myCorrectOptionCard: {
    backgroundColor: "#ecfdf5",
    borderColor: "#22c55e",
  },

  tagText: {
    fontSize: 11,
    fontWeight: "900",
    textAlign: "right",
  },

  answerSummary: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  answerSummaryTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },

  answerLine: {
    color: "#334155",
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 20,
  },

  solutionBox: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },

  solutionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#92400e",
    marginBottom: 6,
  },

  solutionText: {
    color: "#78350f",
    lineHeight: 22,
    fontWeight: "600",
  },
});