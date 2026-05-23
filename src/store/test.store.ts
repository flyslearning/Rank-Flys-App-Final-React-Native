import { create } from "zustand";
import { Question, ResponseItem } from "../types";
import { storage } from "../utils/storage";

type TestState = {
  attemptId: string | null;
  testId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  responsesMap: Record<string, ResponseItem>;
  

  startLocalAttempt: (
    attemptId: string,
    testId: string,
    questions: Question[]
  ) => Promise<void>;

  selectOption: (
    questionId: string,
    selectedOption: number | null,
    timeSpent: number
  ) => Promise<void>;

  setCurrentQuestionIndex: (index: number) => void;

  getResponsesArray: () => ResponseItem[];

  clearAttempt: () => Promise<void>;
};

export const useTestStore = create<TestState>((set, get) => ({
  attemptId: null,
  testId: null,
  questions: [],
  currentQuestionIndex: 0,
  responsesMap: {},

  startLocalAttempt: async (attemptId, testId, questions) => {
    const payload = {
      attemptId,
      testId,
      questions,
      currentQuestionIndex: 0,
      responsesMap: {},
    };

    await storage.set("active_attempt", payload);

    set(payload);
  },

  selectOption: async (questionId, selectedOption, timeSpent) => {
    const oldMap = get().responsesMap;

    const newMap = {
      ...oldMap,
      [questionId]: {
        question_id: questionId,
        selected_option: selectedOption,
        time_spent_seconds: timeSpent,
      },
    };

    set({ responsesMap: newMap });

    await storage.set("active_attempt", {
      attemptId: get().attemptId,
      testId: get().testId,
      questions: get().questions,
      currentQuestionIndex: get().currentQuestionIndex,
      responsesMap: newMap,
    });
  },

  setCurrentQuestionIndex: (index) => {
    set({ currentQuestionIndex: index });
  },

  getResponsesArray: () => {
    const { questions, responsesMap } = get();

    return questions.map((q) => {
      return (
        responsesMap[q.id] || {
          question_id: q.id,
          selected_option: null,
          time_spent_seconds: 0,
        }
      );
    });
  },

  clearAttempt: async () => {
    await storage.remove("active_attempt");

    set({
      attemptId: null,
      testId: null,
      questions: [],
      currentQuestionIndex: 0,
      responsesMap: {},
    });
  },
}));