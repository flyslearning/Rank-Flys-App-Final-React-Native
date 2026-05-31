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
  markRead(goalClassID: string, lastReadMessageID: string) {
  return chatClient.post(`/groups/${goalClassID}/read`, {
    last_read_message_id: lastReadMessageID,
    });
  },

  unreadCount(goalClassID: string) {
    return chatClient.get(`/groups/${goalClassID}/unread`);
  },

  createPoll(goalClassID: string, data: {
    question: string;
    options: string[];
    expires_at?: string;
  }) {
    return chatClient.post(`/groups/${goalClassID}/polls`, data);
  },

  listPolls(goalClassID: string) {
    return chatClient.get(`/groups/${goalClassID}/polls`);
  },

  votePoll(goalClassID: string, pollID: string, optionID: string) {
    return chatClient.post(`/groups/${goalClassID}/polls/${pollID}/vote`, {
      option_id: optionID,
    });
  },

  closePoll(goalClassID: string, pollID: string) {
    return chatClient.post(`/groups/${goalClassID}/polls/${pollID}/close`);
  },

  pinMessage(goalClassID: string, messageID: string) {
    return chatClient.post(`/groups/${goalClassID}/messages/${messageID}/pin`);
  },

  unpinMessage(goalClassID: string, messageID: string) {
    return chatClient.post(`/groups/${goalClassID}/messages/${messageID}/unpin`);
  },

  pinnedMessages(goalClassID: string) {
    return chatClient.get(`/groups/${goalClassID}/pinned`);
  },
  createSocket(token: string, goalClassID: string) {
    return new WebSocket(
      `${CHAT_WS}/ws/${goalClassID}?token=${encodeURIComponent(token)}`
    );
  },
};