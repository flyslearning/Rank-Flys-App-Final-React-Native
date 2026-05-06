import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const flashcards = [
  {
    question: "What is Active Recall?",
    answer: "Testing your memory before checking notes.",
  },
  {
    question: "What is Pomodoro?",
    answer: "Study 25 minutes, then take a 5-minute break.",
  },
  {
    question: "What is Spaced Repetition?",
    answer: "Reviewing topics at increasing time intervals.",
  },
];

export default function FlashCard() {
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const card = flashcards[index];

  const progress = useMemo(() => {
    return Math.round(((index + 1) / flashcards.length) * 100);
  }, [index]);

  const nextCard = () => {
    setShowAnswer(false);
    setIndex((prev) => (prev + 1) % flashcards.length);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Flashcards</Text>
          <Text style={styles.subHeading}>Quick daily revision</Text>
        </View>

        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      </View>

      <Pressable style={styles.card} onPress={() => setShowAnswer(!showAnswer)}>
        <View style={styles.cardTop}>
          <View style={styles.iconBox}>
            <Ionicons
              name={showAnswer ? "bulb-outline" : "help-circle-outline"}
              size={25}
              color="#2563EB"
            />
          </View>

          <Text style={styles.counter}>
            {index + 1}/{flashcards.length}
          </Text>
        </View>

        <Text style={styles.label}>{showAnswer ? "Answer" : "Question"}</Text>

        <Text style={styles.mainText}>
          {showAnswer ? card.answer : card.question}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.hint}>Tap to flip</Text>

          <Pressable style={styles.nextBtn} onPress={nextCard}>
            <Text style={styles.nextText}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerRow: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  subHeading: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 4,
  },
  progressBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  progressText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "900",
  },
  card: {
    minHeight: 230,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    fontSize: 13,
    fontWeight: "900",
    color: "#64748B",
  },
  label: {
    marginTop: 24,
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  mainText: {
    fontSize: 21,
    lineHeight: 30,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 10,
  },
  footer: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hint: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },
  nextBtn: {
    height: 38,
    borderRadius: 15,
    paddingHorizontal: 14,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
  },
  nextText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});