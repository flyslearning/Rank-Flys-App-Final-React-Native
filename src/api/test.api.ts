import { testClient } from "./client";
import { ResponseItem } from "../types";

export const TestAPI = {
  // Health check
  ping() {
    return testClient.get("/ping");
  },

  // Test Series
  getTestSeries() {
    return testClient.get("/test-series");
  },

  // Tests under a series
  getTestsBySeries(seriesId: string) {
    return testClient.get(`/test-series/${seriesId}/tests`);
  },

  // Start attempt
  startAttempt(testId: string) {
    return testClient.post("/attempts/start", {
      test_id: testId,
    });
  },

  // Get questions of a test
  getQuestions(testId: string) {
    return testClient.get(`/tests/${testId}/questions`);
  },

  // Submit attempt
  submitAttempt(attemptId: string, responses: ResponseItem[]) {
    return testClient.post("/attempts/submit", {
      attempt_id: attemptId,
      responses,
    });
  },

  // Get result
  getResult(attemptId: string) {
    return testClient.get(`/attempts/${attemptId}/result`);
  },

  // ✅ NEW: Get previous attempts of a test
  getAttemptsByTest(testId: string) {
    return testClient.get(`/tests/${testId}/attempts`);
  },
};