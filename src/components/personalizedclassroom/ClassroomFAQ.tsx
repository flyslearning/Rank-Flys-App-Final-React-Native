import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Animated,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    q: "What is Personalized Classroom?",
    a: "A premium small-batch online classroom with live classes, assignments, tests, reports, and doubt support.",
  },
  {
    q: "How many students will be in one batch?",
    a: "Each batch is limited to only 20 students for better attention and personalized learning.",
  },
  {
    q: "Will I get tests and assignments?",
    a: "Yes. You will get daily practice questions, assignments, weekly tests, and performance reports.",
  },
  {
    q: "What happens after payment?",
    a: "After successful payment, your classroom access will be activated automatically.",
  },
  {
    q: "Can I renew after expiry?",
    a: "Yes. If your access expires or gets locked, you can renew from the same details page.",
  },
];

export default function ClassroomFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const rotateValues = useRef(FAQS.map(() => new Animated.Value(0))).current;

  const toggleFAQ = (index: number) => {
    const isOpen = openIndex === index;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    rotateValues.forEach((value, i) => {
      Animated.timing(value, {
        toValue: !isOpen && i === index ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });

    setOpenIndex(isOpen ? null : index);
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLine} />

        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="help-circle" size={22} color="#2563EB" />
          </View>

          <View style={styles.headerTextBox}>
            <Text style={styles.title}>FAQs</Text>
            <Text style={styles.subtitle}>Clear answers before you join</Text>
          </View>
        </View>
      </View>

      <View style={styles.list}>
        {FAQS.map((faq, index) => {
          const open = openIndex === index;

          const rotate = rotateValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "180deg"],
          });

          return (
            <View key={index} style={styles.rowWrap}>
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => toggleFAQ(index)}
                style={styles.questionButton}
              >
                <View style={[styles.dot, open && styles.activeDot]}>
                  <Text style={[styles.dotText, open && styles.activeDotText]}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.textArea}>
                  <Text style={[styles.question, open && styles.activeQuestion]}>
                    {faq.q}
                  </Text>

                  {open && (
                    <Text style={styles.answer}>
                      {faq.a}
                    </Text>
                  )}
                </View>

                <Animated.View
                  style={[
                    styles.chevronBox,
                    open && styles.activeChevronBox,
                    { transform: [{ rotate }] },
                  ]}
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={open ? "#FFFFFF" : "#2563EB"}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },

  header: {
    marginBottom: 14,
  },
  headerLine: {
    width: 42,
    height: 4,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextBox: {
    flex: 1,
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  list: {
    marginTop: 4,
  },
  rowWrap: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  questionButton: {
    minHeight: 72,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  activeDot: {
    backgroundColor: "#2563EB",
  },
  dotText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#64748B",
  },
  activeDotText: {
    color: "#FFFFFF",
  },

  textArea: {
    flex: 1,
    paddingRight: 10,
  },
  question: {
    fontSize: 15.5,
    lineHeight: 22,
    fontWeight: "900",
    color: "#111827",
  },
  activeQuestion: {
    color: "#1D4ED8",
  },
  answer: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    color: "#475569",
  },

  chevronBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  activeChevronBox: {
    backgroundColor: "#2563EB",
  },
});