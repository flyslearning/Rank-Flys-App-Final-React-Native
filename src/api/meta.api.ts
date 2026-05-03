import { authClient } from "./client";

export const MetaAPI = {
  getGoals() {
    return authClient.get("/meta/goals");
  },

  getClassesByGoal(goalId: string) {
    return authClient.get(`/meta/goals/${goalId}/classes`);
  },
};