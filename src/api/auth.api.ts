import { authClient } from "./client";

export const AuthAPI = {
  sendOtp(email: string) {
    return authClient.post("/auth/send-otp", { email });
  },

  verifyOtp(email: string, otp: string) {
    return authClient.post("/auth/verify-otp", { email, otp });
  },

  refresh(refresh_token: string) {
    return authClient.post("/auth/refresh", { refresh_token });
  },

  validate() {
    return authClient.get("/auth/validate");
  },

  getSessions() {
    return authClient.get("/auth/sessions");
  },

  logoutAll() {
    return authClient.post("/auth/logout-all");
  },

  getProfile() {
    return authClient.get("/profile");
  },

  completeProfile(data: {
    first_name: string;
    last_name: string;
    gender: string;
    goal_id: string;
    class_id: string;
  }) {
    return authClient.post("/profile", data);
  },
};