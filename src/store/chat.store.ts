import { create } from "zustand";
import { ChatAPI } from "../api/chat.api";
import { ChatDb } from "../db/chatDb";
import { useAuthStore } from "./auth.store";

type ChatState = {
  messages: any[];
  pinnedMessages: any[];
  socket: WebSocket | null;
  onlineCount: number;
  unreadCount: number;
  typingUser: string | null;
  loading: boolean;
  loadingOlder: boolean;
  isConnected: boolean;
  activeGoalClassID: string | null;
  isChatScreenOpen: boolean;
  setChatScreenOpen: (open: boolean) => void;

  openChat: (goalClassID: string) => Promise<void>;
  loadOlder: (goalClassID: string) => Promise<void>;
  sendMessage: (text: string, goalClassID: string) => Promise<void>;

  markRead: (goalClassID: string) => Promise<void>;
  votePoll: (
    goalClassID: string,
    pollID: string,
    optionID: string
  ) => Promise<void>;
  pinMessage: (goalClassID: string, messageID: string) => Promise<void>;
  unpinMessage: (goalClassID: string, messageID: string) => Promise<void>;
  closePoll: (goalClassID: string, pollID: string) => Promise<void>;

  sendTypingStart: () => void;
  sendTypingStop: () => void;
  closeChat: () => void;
};

function normalizeIncomingMessage(msg: any) {
  if (!msg) return msg;

  return {
    ...msg,
    type:
      msg.type === 2 || msg.type === "2"
        ? "poll"
        : msg.type === 1 || msg.type === "1"
        ? "text"
        : msg.type || "text",
    poll_id: msg.poll_id || msg.poll?.id || "",
    poll: msg.poll || null,
    is_pinned: Boolean(msg.is_pinned),
  };
}

function mergeMessages(oldMessages: any[], newMessages: any[]) {
  const map = new Map<string, any>();

  [...oldMessages, ...newMessages].forEach((msg) => {
    if (!msg) return;

    const id = String(
      msg.id || msg.message_id || msg.temp_id || `${Date.now()}_${Math.random()}`
    );

    map.set(id, {
      ...(map.get(id) || {}),
      ...normalizeIncomingMessage(msg),
      id,
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return ta - tb;
  });
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  pinnedMessages: [],
  socket: null,
  onlineCount: 0,
  unreadCount: 0,
  typingUser: null,
  loading: false,
  loadingOlder: false,
  isConnected: false,
  activeGoalClassID: null,
  isChatScreenOpen: false,

  openChat: async (goalClassID) => {
    const token = useAuthStore.getState().accessToken;
    if (!token || !goalClassID) return;
    set({ activeGoalClassID: goalClassID });

    get().closeChat();

    try {
      set({ loading: true });

      const cached = ChatDb.getMessages(goalClassID).map(normalizeIncomingMessage);
      const cachedPinned =
        ChatDb.getPinnedMessages?.(goalClassID)?.map(normalizeIncomingMessage) ||
        [];

      if (cached.length || cachedPinned.length) {
        set({
          messages: cached,
          pinnedMessages: cachedPinned,
        });
      }

      await ChatAPI.join(goalClassID);

      const historyRes = await ChatAPI.messages(goalClassID);
      const history = (historyRes.data?.messages || []).map(
        normalizeIncomingMessage
      );

      ChatDb.saveMessages(goalClassID, history);

      const pinnedRes = await ChatAPI.pinnedMessages(goalClassID);
      const pinnedMessages = (
        pinnedRes.data?.pinned_messages ||
        pinnedRes.data?.messages ||
        []
      ).map(normalizeIncomingMessage);

      ChatDb.savePinnedMessages(goalClassID, pinnedMessages);

      const unreadRes = await ChatAPI.unreadCount(goalClassID);
      const unreadCount = unreadRes.data?.unread_count || 0;

      set((state) => ({
        messages: mergeMessages(state.messages, history),
        pinnedMessages,
        unreadCount,
      }));

      const onlineRes = await ChatAPI.online(goalClassID);

      set({
        onlineCount: onlineRes.data?.online_count || 0,
      });

      const ws = ChatAPI.createSocket(token, goalClassID);

      ws.onopen = () => {
        set({ isConnected: true });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event === "message.created") {

            
            const msg = normalizeIncomingMessage(data.message);
            if (!msg) return;

            ChatDb.saveMessages(goalClassID, [msg]);

            set((state) => {
              const incomingID = String(msg.id || msg.message_id || "");

              const alreadyExists = state.messages.some(
                (m) => String(m.id || m.message_id) === incomingID
              );

              if (incomingID && alreadyExists) {
                return state;
              }
              const withoutPending = state.messages.filter(
                (m) =>
                  !(
                    m.pending &&
                    m.body === msg.body &&
                    String(m.user_id) === String(msg.user_id)
                  )
              );

              const currentUser: any = useAuthStore.getState().user;
            const myID = String(currentUser?.id || currentUser?.user_id || "");
            const senderID = String(msg.user_id || msg.sender_id || "");

            const isMine = myID && senderID && myID === senderID;

            return {
              messages: mergeMessages(withoutPending, [msg]),
              unreadCount:
                isMine || state.isChatScreenOpen
                  ? state.unreadCount
                  : state.unreadCount + 1,
            };
            });
          }

          if (data.event === "poll.updated") {
            const poll = data.poll;
            if (!poll?.id) return;

            ChatDb.updatePoll(goalClassID, poll);

            set((state) => ({
              messages: state.messages.map((msg) =>
                String(msg.poll_id) === String(poll.id)
                  ? {
                      ...msg,
                      poll,
                    }
                  : msg
              ),
            }));
          }

          if (data.event === "poll.closed") {
            const poll = data.poll;
            if (!poll?.id) return;

            ChatDb.closePoll(goalClassID, poll.id);

            set((state) => ({
              messages: state.messages.map((msg) =>
                String(msg.poll_id) === String(poll.id)
                  ? {
                      ...msg,
                      poll: {
                        ...(msg.poll || {}),
                        ...poll,
                        is_active: false,
                      },
                    }
                  : msg
              ),
            }));
          }

          if (data.event === "pinned.updated") {
            const pinnedMessages = (
              data.pinned_messages ||
              data.messages ||
              []
            ).map(normalizeIncomingMessage);

            ChatDb.savePinnedMessages(goalClassID, pinnedMessages);

            set({
              pinnedMessages,
            });
          }

          if (data.event === "message.read") {
            set({ unreadCount: 0 });
          }

          if (data.event === "typing.start") {
            set({ typingUser: data.user_name || "Someone" });
          }

          if (data.event === "typing.stop") {
            set({ typingUser: null });
          }

          if (data.event === "presence.updated") {
            set({ onlineCount: data.online_count || 0 });
          }
        } catch (e) {
          console.log("WS message parse error:", e);
        }
      };

      ws.onerror = (e) => {
        console.log("Chat socket error:", e);
      };

      ws.onclose = () => {
        set({
          socket: null,
          isConnected: false,
          typingUser: null,
        });
      };

      set({
        socket: ws,
        loading: false,
      });
    } catch (e) {
      console.log("Open chat error:", e);
      set({ loading: false });
    }
  },

  loadOlder: async (goalClassID) => {
    const { messages, loadingOlder } = get();

    if (loadingOlder || !messages.length || !goalClassID) return;

    try {
      set({ loadingOlder: true });

      const oldest = messages[0];
      const before = oldest?.created_at;

      if (!before) {
        set({ loadingOlder: false });
        return;
      }

      const res = await ChatAPI.messages(goalClassID, before);
      const older = (res.data?.messages || []).map(normalizeIncomingMessage);

      if (older.length) {
        ChatDb.saveMessages(goalClassID, older);

        set((state) => ({
          messages: mergeMessages(older, state.messages),
        }));
      }
    } catch (e) {
      console.log("Load older error:", e);
    } finally {
      set({ loadingOlder: false });
    }
  },

  sendMessage: async (text, goalClassID) => {
    const clean = text.trim();
    if (!clean || !goalClassID) return;

    const user: any = useAuthStore.getState().user;
    const tempID = `temp_${Date.now()}`;

    const tempMsg = {
      id: tempID,
      temp_id: tempID,
      goal_class_id: goalClassID,
      user_id: user?.id || user?.user_id || "",
      user_name:
        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
        user?.name ||
        "You",
      body: clean,
      type: "text",
      created_at: new Date().toISOString(),
      pending: true,
      is_mine: true,
    };

    set((state) => ({
      messages: mergeMessages(state.messages, [tempMsg]),
    }));

    const ws = get().socket;

    try {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            event: "message.send",
            body: clean,
            type: "text",
          })
        );

        return;
      }

      const res = await ChatAPI.sendHTTP(goalClassID, clean);
      const msg = normalizeIncomingMessage(res.data?.message);

      if (msg) {
        ChatDb.saveMessages(goalClassID, [msg]);

        set((state) => ({
          messages: mergeMessages(
            state.messages.filter((m) => m.id !== tempMsg.id),
            [msg]
          ),
        }));
      }
    } catch (e) {
      console.log("Send message error:", e);

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempMsg.id
            ? { ...m, failed: true, pending: false }
            : m
        ),
      }));
    }
  },

  markRead: async (goalClassID) => {
  set({ unreadCount: 0 });

  const { messages } = get();
  const lastMessage = messages[messages.length - 1];

  if (!goalClassID || !lastMessage?.id || String(lastMessage.id).startsWith("temp_")) {
    return;
  }

  try {
    await ChatAPI.markRead(goalClassID, lastMessage.id);
    set({ unreadCount: 0 });
  } catch (e) {
    console.log("Mark read error:", e);
  }
},

  votePoll: async (goalClassID, pollID, optionID) => {
    if (!goalClassID || !pollID || !optionID) return;

    try {
      const res = await ChatAPI.votePoll(goalClassID, pollID, optionID);
      const poll = res.data?.poll;

      if (!poll?.id) return;

      ChatDb.updatePoll(goalClassID, poll);

      set((state) => ({
        messages: state.messages.map((msg) =>
          String(msg.poll_id) === String(poll.id)
            ? {
                ...msg,
                poll,
              }
            : msg
        ),
      }));
    } catch (e) {
      console.log("Vote poll error:", e);
    }
  },

  pinMessage: async (goalClassID, messageID) => {
    if (!goalClassID || !messageID) return;

    try {
      await ChatAPI.pinMessage(goalClassID, messageID);

      ChatDb.setPinned(goalClassID, messageID, true);

      set((state) => {
        const updatedMessages = state.messages.map((msg) =>
          String(msg.id) === String(messageID)
            ? {
                ...msg,
                is_pinned: true,
                pinned_at: new Date().toISOString(),
              }
            : msg
        );

        return {
          messages: updatedMessages,
          pinnedMessages: updatedMessages.filter((msg) => msg.is_pinned),
        };
      });
    } catch (e) {
      console.log("Pin message error:", e);
    }
  },

  unpinMessage: async (goalClassID, messageID) => {
    if (!goalClassID || !messageID) return;

    try {
      await ChatAPI.unpinMessage(goalClassID, messageID);

      ChatDb.setPinned(goalClassID, messageID, false);

      set((state) => ({
        messages: state.messages.map((msg) =>
          String(msg.id) === String(messageID)
            ? {
                ...msg,
                is_pinned: false,
                pinned_at: "",
              }
            : msg
        ),
        pinnedMessages: state.pinnedMessages.filter(
          (msg) => String(msg.id) !== String(messageID)
        ),
      }));
    } catch (e) {
      console.log("Unpin message error:", e);
    }
  },

  closePoll: async (goalClassID, pollID) => {
    if (!goalClassID || !pollID) return;

    try {
      await ChatAPI.closePoll(goalClassID, pollID);

      ChatDb.closePoll(goalClassID, pollID);

      set((state) => ({
        messages: state.messages.map((msg) =>
          String(msg.poll_id) === String(pollID)
            ? {
                ...msg,
                poll: {
                  ...(msg.poll || {}),
                  is_active: false,
                },
              }
            : msg
        ),
      }));
    } catch (e) {
      console.log("Close poll error:", e);
    }
  },

  sendTypingStart: () => {
    const ws = get().socket;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: "typing.start" }));
    }
  },

  sendTypingStop: () => {
    const ws = get().socket;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: "typing.stop" }));
    }
  },
setChatScreenOpen: (open) => {
  set({ isChatScreenOpen: open });
},
  closeChat: () => {
    const ws = get().socket;

    if (ws) {
      ws.close();
    }

    set({
  socket: null,
  isConnected: false,
  typingUser: null,
  activeGoalClassID: null,
});
  },
}));