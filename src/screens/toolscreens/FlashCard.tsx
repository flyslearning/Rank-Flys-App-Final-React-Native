import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToolsStore } from "../../store/tools.store";

const ACCENT = "#059669";
const ACCENT_SOFT = "#ECFDF5";
const ACCENT_BORDER = "#BBF7D0";
const BG = "#F8FAFC";

type Difficulty = "easy" | "medium" | "hard";

function getDifficultyColor(difficulty: string) {
  if (difficulty === "easy") return "#16A34A";
  if (difficulty === "hard") return "#DC2626";
  return "#EA580C";
}

function getQualityLabel(q: number) {
  if (q <= 2) return "Again";
  if (q === 3) return "Okay";
  if (q === 4) return "Good";
  return "Perfect";
}

export default function FlashCard() {
  const { width } = useWindowDimensions();
  const isSmall = width < 370;

  const {
    flashcards = [],
    loading,
    flashcardsLoading,
    actionLoading,
    loadFlashcards,
    addFlashcard,
    reviewCard,
  }: any = useToolsStore();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({});

  const circleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFlashcards?.();
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

  const stats = useMemo(() => {
    return {
      total: flashcards.length,
      easy: flashcards.filter((c: any) => c.difficulty === "easy").length,
      medium: flashcards.filter((c: any) => c.difficulty === "medium").length,
      hard: flashcards.filter((c: any) => c.difficulty === "hard").length,
    };
  }, [flashcards]);

  async function handleCreate() {
    if (!question.trim() || !answer.trim()) {
      Alert.alert("Required", "Question aur answer dono likho");
      return;
    }

    try {
      setSubmitting(true);

      await addFlashcard({
        question: question.trim(),
        answer: answer.trim(),
        difficulty,
      });

      setQuestion("");
      setAnswer("");
      setDifficulty("medium");

      await loadFlashcards?.();
    } catch (err) {
      console.log("CREATE FLASHCARD ERROR:", err);
      Alert.alert("Error", "Flashcard create nahi ho paya");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(cardID: string, quality: number) {
    try {
      await reviewCard(cardID, quality);
    } catch (err) {
      console.log("REVIEW FLASHCARD ERROR:", err);
      Alert.alert("Error", "Flashcard review update nahi hua");
    }
  }

  function toggleReveal(cardID: string) {
    setRevealedCards((old) => ({
      ...old,
      [cardID]: !old[cardID],
    }));
  }

  function renderCard({ item }: { item: any }) {
    const isRevealed = !!revealedCards[item.id];
    const diffColor = getDifficultyColor(item.difficulty || "medium");

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardIcon}>
            <Ionicons name="albums-outline" size={22} color={ACCENT} />
          </View>

          <View style={{ flex: 1 }}>
            <Text numberOfLines={3} style={styles.question}>
              {item.question}
            </Text>

            <View style={styles.cardMetaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="cube-outline" size={13} color={ACCENT} />
                <Text style={styles.metaText}>Box {item.box ?? 1}</Text>
              </View>

              <View style={[styles.diffPill, { backgroundColor: `${diffColor}16` }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>
                  {item.difficulty ?? "medium"}
                </Text>
              </View>
            </View>

            <View style={styles.nextRow}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={styles.nextText}>
                Next: {item.next_review_date ?? "today"}
              </Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.answerBox} onPress={() => toggleReveal(item.id)}>
          <View style={styles.answerHeader}>
            <Text style={styles.answerLabel}>
              {isRevealed ? "Answer" : "Tap to reveal answer"}
            </Text>
            <Ionicons
              name={isRevealed ? "eye-outline" : "eye-off-outline"}
              size={18}
              color={ACCENT}
            />
          </View>

          {isRevealed ? (
            <Text style={styles.answer}>{item.answer}</Text>
          ) : (
            <Text style={styles.hiddenText}>••••••••••••••••••••••••</Text>
          )}
        </Pressable>

        <Text style={styles.reviewLabel}>How well did you remember?</Text>

        <View style={styles.qualityRow}>
          {[0, 1, 2, 3, 4, 5].map((q) => {
            const bad = q <= 2;
            const good = q >= 4;

            return (
              <Pressable
                key={q}
                onPress={() => handleReview(item.id, q)}
                style={({ pressed }) => [
                  styles.qualityBtn,
                  bad && styles.qualityBad,
                  good && styles.qualityGood,
                  pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
                ]}
              >
                <Text
                  style={[
                    styles.qualityNumber,
                    bad && { color: "#DC2626" },
                    good && { color: "#16A34A" },
                  ]}
                >
                  {q}
                </Text>
                <Text
                  style={[
                    styles.qualityLabel,
                    bad && { color: "#DC2626" },
                    good && { color: "#16A34A" },
                  ]}
                >
                  {getQualityLabel(q)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  const circleTranslate = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 20],
  });

  const circleOpacity = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  const header = (
    <>
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
          <Text style={styles.kicker}>FLASHCARDS</Text>
          <Text style={[styles.title, isSmall && { fontSize: 26 }]}>
            Smart Revision
          </Text>
          <Text style={styles.subtitle}>Spaced repetition daily cards</Text>
        </View>

        <Pressable onPress={loadFlashcards} style={styles.refreshBtn}>
          {loading || flashcardsLoading ? (
            <ActivityIndicator color={ACCENT} />
          ) : (
            <Ionicons name="refresh" size={21} color={ACCENT} />
          )}
        </Pressable>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Due Today</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.medium}</Text>
          <Text style={styles.statLabel}>Medium</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.hard}</Text>
          <Text style={styles.statLabel}>Hard</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Create Flashcard</Text>

        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Question"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="Answer"
          placeholderTextColor="#94A3B8"
          style={[styles.input, styles.textArea]}
          multiline
        />

        <Text style={styles.selectorLabel}>Difficulty</Text>

        <View style={styles.optionRow}>
          {["easy", "medium", "hard"].map((d) => {
            const active = difficulty === d;

            return (
              <Pressable
                key={d}
                onPress={() => setDifficulty(d as Difficulty)}
                style={[styles.optionChip, active && styles.optionChipActive]}
              >
                <Text
                  style={[styles.optionText, active && styles.optionTextActive]}
                >
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.button,
            (submitting || actionLoading) && { opacity: 0.7 },
          ]}
          onPress={handleCreate}
          disabled={submitting || actionLoading}
        >
          {submitting || actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Create Flashcard</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Due Flashcards</Text>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={flashcards}
        keyExtractor={(item: any) => item.id}
        renderItem={renderCard}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading || flashcardsLoading}
            onRefresh={loadFlashcards}
            colors={[ACCENT]}
            tintColor={ACCENT}
          />
        }
        ListEmptyComponent={
          !loading && !flashcardsLoading ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="albums-outline" size={42} color={ACCENT} />
              </View>
              <Text style={styles.emptyTitle}>No flashcards due today</Text>
              <Text style={styles.emptyText}>
                New flashcard create karo ya next review date par wapas aao.
              </Text>
            </View>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingBottom: 80 },

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
    backgroundColor: "#D1FAE5",
  },
  circleTwo: {
    position: "absolute",
    right: -18,
    top: 36,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#A7F3D0",
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
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  statsCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: ACCENT_SOFT,
    borderRadius: 18,
    padding: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: ACCENT,
  },
  statLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  form: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontWeight: "700",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  selectorLabel: {
    color: "#0F172A",
    fontWeight: "900",
    marginTop: 4,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  optionChip: {
    paddingHorizontal: 14,
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
    fontSize: 12,
    textTransform: "capitalize",
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
  button: {
    backgroundColor: ACCENT,
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
  },
  question: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 22,
  },
  cardMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
  },
  metaPill: {
    backgroundColor: ACCENT_SOFT,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
  },
  diffPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  diffText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  nextText: {
    color: "#64748B",
    fontWeight: "800",
    fontSize: 12,
  },

  answerBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  answerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  answerLabel: {
    color: ACCENT,
    fontWeight: "900",
    fontSize: 12,
  },
  answer: {
    color: "#475569",
    marginTop: 10,
    lineHeight: 21,
    fontWeight: "700",
  },
  hiddenText: {
    color: "#CBD5E1",
    marginTop: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  reviewLabel: {
    color: "#0F172A",
    fontWeight: "900",
    marginTop: 16,
    marginBottom: 10,
  },
  qualityRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  qualityBtn: {
    minWidth: 72,
    backgroundColor: ACCENT_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    alignItems: "center",
  },
  qualityGood: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  qualityBad: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  qualityNumber: {
    color: ACCENT,
    fontWeight: "900",
    fontSize: 15,
  },
  qualityLabel: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 2,
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },
});