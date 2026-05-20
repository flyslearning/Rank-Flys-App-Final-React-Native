import { create } from "zustand";
import { ChatAPI } from "../api/chat.api";
import { ChatDb } from "../db/chatDb";
import { useAuthStore } from "./auth.store";

type ChatState = {
  messages: any[];
  socket: WebSocket | null;
  onlineCount: number;
  typingUser: string | null;
  loading: boolean;
  loadingOlder: boolean;
  isConnected: boolean;

  openChat: (goalClassID: string) => Promise<void>;
  loadOlder: (goalClassID: string) => Promise<void>;
  sendMessage: (text: string, goalClassID: string) => Promise<void>;
  sendTypingStart: () => void;
  sendTypingStop: () => void;
  closeChat: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  socket: null,
  onlineCount: 0,
  typingUser: null,
  loading: false,
  loadingOlder: false,
  isConnected: false,

  openChat: async (goalClassID) => {
    const token = useAuthStore.getState().accessToken;
    if (!token || !goalClassID) return;

    get().closeChat();

    try {
      set({ loading: true });

      const cached = ChatDb.getMessages(goalClassID);
      if (cached.length) {
        set({ messages: cached });
      }

      await ChatAPI.join(goalClassID);

      const historyRes = await ChatAPI.messages(goalClassID);
      const history = historyRes.data?.messages || [];

      ChatDb.saveMessages(goalClassID, history);

      set({
        messages: history,
      });

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
            const msg = data.message;
            if (!msg) return;

            ChatDb.saveMessages(goalClassID, [msg]);

            set((state) => {
              const exists = state.messages.some(
                (m) => String(m.id) === String(msg.id)
              );

              if (exists) return state;

              const withoutPending = state.messages.filter(
                (m) =>
                  !(
                    m.pending &&
                    m.body === msg.body &&
                    m.user_id === msg.user_id
                  )
              );

              return {
                messages: [...withoutPending, msg],
              };
            });
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
      const older = res.data?.messages || [];

      if (older.length) {
        ChatDb.saveMessages(goalClassID, older);

        set((state) => {
          const ids = new Set(state.messages.map((m) => String(m.id)));

          const uniqueOlder = older.filter(
            (m: any) => !ids.has(String(m.id))
          );

          return {
            messages: [...uniqueOlder, ...state.messages],
          };
        });
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

    const tempMsg = {
      id: `temp_${Date.now()}`,
      temp_id: `temp_${Date.now()}`,
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
      messages: [...state.messages, tempMsg],
    }));

    const ws = get().socket;

    try {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            body: clean,
            type: "text",
          })
        );

        return;
      }

      const res = await ChatAPI.sendHTTP(goalClassID, clean);
      const msg = res.data?.message;

      if (msg) {
        ChatDb.saveMessages(goalClassID, [msg]);

        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === tempMsg.id ? msg : m
          ),
        }));
      }
    } catch (e) {
      console.log("Send message error:", e);

      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempMsg.id ? { ...m, failed: true, pending: false } : m
        ),
      }));
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

  closeChat: () => {
    const ws = get().socket;

    if (ws) {
      ws.close();
    }

    set({
      socket: null,
      isConnected: false,
      typingUser: null,
    });
  },
}));