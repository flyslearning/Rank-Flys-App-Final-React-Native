import { chatClient } from "./client";

const CHAT_WS =
  process.env.EXPO_PUBLIC_CHAT_WS ||
  "wss://api.flyslearning.com/chat-ws/api/v1/chat";

export const ChatAPI = {
  join(goalClassID: string) {
    return chatClient.post("/join", {
      goal_class_id: goalClassID,
    });
  },

  messages(goalClassID: string, before?: string) {
    return chatClient.get(`/groups/${goalClassID}/messages`, {
      params: before ? { before } : undefined,
    });
  },

  online(goalClassID: string) {
    return chatClient.get(`/groups/${goalClassID}/online`);
  },

  sendHTTP(goalClassID: string, text: string) {
    return chatClient.post(`/groups/${goalClassID}/messages`, {
      body: text,
      type: "text",
    });
  },

  createSocket(token: string, goalClassID: string) {
    return new WebSocket(
      `${CHAT_WS}/ws/${goalClassID}?token=${encodeURIComponent(token)}`
    );
  },
};