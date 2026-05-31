import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  AppState,
  Animated,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";
import { ChatAPI } from "../../api/chat.api";
import PollCard from "../../components/chat/PollCard";

const CHAT_WS = "wss://api.flyslearning.com/chat-ws/api/v1/chat";

const BLUE = "#2563EB";
const BG = "#FFFFFF";
const PAGE = "#F8FAFC";
const BORDER = "#E5E7EB";
const TEXT = "#111827";
const MUTED = "#6B7280";
const GREEN = "#22C55E";
const ORANGE = "#F59E0B";
const RED = "#EF4444";

const DEBUG = false;
const log = (...a: any[]) => DEBUG && console.log("[GROUP_CHAT]", ...a);

type Msg = {
  id?: string;
  message_id?: string;
  temp_id?: string;
  user_id?: string;
  sender_id?: string;
  user_name?: string;
  name?: string;
  body?: string;
  message?: string;
  type?: string;
  created_at?: string;
  pending?: boolean;
  failed?: boolean;
  role?: string;
  user_role?: string;
  member_role?: string;
  sender_role?: string;
  author_role?: string;
  profile?: { role?: string; user_role?: string };
  user?: { role?: string; user_role?: string };
  poll_id?: string;
  poll?: any;
  is_pinned?: boolean;
  pinned_at?: string;
  reply_to_message_id?: string;
  reply_to_body?: string;
  reply_to_user_name?: string;
};

type OnlineUser = {
  user_id?: string;
  id?: string;
  user_name?: string;
  name?: string;
  full_name?: string;
};

type Status = "connecting" | "connected" | "reconnecting" | "offline";

function parseJwt(token: string) {
  try {
    const p = token.split(".")[1];
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function isUnauthorized(text: string) {
  return (
    text.includes("401") ||
    text.includes("Unauthorized") ||
    text.includes("unauthorized")
  );
}

function keyOf(m: Msg, index = 0) {
  return String(
    m.id || m.message_id || m.temp_id || `${m.created_at || "msg"}-${index}`
  );
}

function normalize(arr: Msg[]) {
  const map = new Map<string, Msg>();

  arr.forEach((m, i) => {
    map.set(keyOf(m, i), m);
  });

  return [...map.values()].sort(
    (a, b) =>
      new Date(a.created_at || 0).getTime() -
      new Date(b.created_at || 0).getTime()
  );
}

function extractOnlineUsers(data: any): OnlineUser[] {
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.online_users)) return data.online_users;
  if (Array.isArray(data?.online?.users)) return data.online.users;
  return [];
}

function onlineUserName(u: OnlineUser) {
  return u.user_name || u.full_name || u.name || "Student";
}

export default function GroupChatScreen() {
  const insets = useSafeAreaInsets();
  const auth: any = useAuthStore();
  const user: any = auth?.user;

  const token =
    auth?.accessToken ||
    auth?.access_token ||
    auth?.token ||
    user?.accessToken ||
    user?.access_token ||
    user?.token ||
    "";

  const payload: any = useMemo(() => parseJwt(token), [token]);

  const goalClassID = String(
    payload?.goal_class_id ||
      user?.goal_class_id ||
      user?.goalClassID ||
      user?.profile?.goal_class_id ||
      ""
  );

  const myUserID = String(
    payload?.user_id || user?.id || user?.user_id || user?.profile?.id || ""
  );

  const myName =
    user?.name ||
    user?.full_name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    "You";

  const myIds = useMemo(
    () =>
      new Set(
        [myUserID, payload?.user_id, user?.id, user?.user_id]
          .filter(Boolean)
          .map(String)
      ),
    [myUserID, payload, user]
  );
  const myRole = String(
  payload?.role ||
    payload?.user_role ||
    user?.role ||
    user?.user_role ||
    user?.profile?.role ||
    user?.profile?.user_role ||
    ""
  )
    .trim()
    .toLowerCase();
  const canCreatePoll =
  myRole.includes("teacher") || myRole.includes("admin");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Msg[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [menuMessage, setMenuMessage] = useState<Msg | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [highlightedMessageID, setHighlightedMessageID] = useState<string | null>(null);
  const [showPollPanel, setShowPollPanel] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("connecting");
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<FlatList>(null);
  const mounted = useRef(true);
  const reconnectTimer = useRef<any>(null);
  const typingTimer = useRef<any>(null);
  const typingStartedRef = useRef(false);
  const manualClose = useRef(false);
  const reconnectAttempt = useRef(0);
  const socketOpening = useRef(false);
  const initialLoaded = useRef(false);

  const listData = useMemo(() => [...messages].reverse(), [messages]);

  const getCurrentToken = useCallback(() => {
    const state: any = useAuthStore.getState();
    return state.accessToken || token;
  }, [token]);

  const refreshTokenOnlyWhenNeeded = useCallback(async () => {
    const state: any = useAuthStore.getState();
    const fresh = await state.refreshAccessToken?.();
    return fresh || null;
  }, []);

  const typingText = useMemo(() => {
    const names = Object.values(typingUsers);

    if (!names.length) return "";
    if (names.length === 1) return `${names[0]} typing...`;

    return `${names[0]} and ${names.length - 1} others typing...`;
  }, [typingUsers]);

  const onlineNamesText = useMemo(() => {
    if (!onlineUsers.length) return "";

    return onlineUsers
      .filter((u) => {
        const id = String(u.user_id || u.id || "");
        return !id || !myIds.has(id);
      })
      .slice(0, 4)
      .map(onlineUserName)
      .join(", ");
  }, [onlineUsers, myIds]);

  const joinChat = useCallback(async () => {
    await ChatAPI.join(goalClassID);
  }, [goalClassID]);

  const fetchMessages = useCallback(
    async (before?: string) => {
      const res = await ChatAPI.messages(goalClassID, before);
      return Array.isArray(res.data?.messages) ? res.data.messages : [];
    },
    [goalClassID]
  );

  const fetchOnline = useCallback(async () => {
    const res = await ChatAPI.online(goalClassID);

    if (!mounted.current) return;

    setOnlineCount(Number(res.data?.online_count || 0));
    setOnlineUsers(extractOnlineUsers(res.data));
  }, [goalClassID]);
 const fetchPinnedMessages = useCallback(async () => {
  const res = await ChatAPI.pinnedMessages(goalClassID);
  const pinned = res.data?.pinned_messages || [];
  setPinnedMessages(pinned);
}, [goalClassID]);

const fetchUnreadCount = useCallback(async () => {
  const res = await ChatAPI.unreadCount(goalClassID);
  setUnreadCount(Number(res.data?.unread_count || 0));
}, [goalClassID]);

const markRead = useCallback(async () => {
  const latest = messages[messages.length - 1];
  if (!latest?.id) return;

  await ChatAPI.markRead(goalClassID, latest.id);
  setUnreadCount(0);
}, [goalClassID, messages]);

  const closeSocket = useCallback(
  (manual = true, nextStatus: Status = "offline") => {
    manualClose.current = manual;

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    const ws = wsRef.current;
    wsRef.current = null;
    socketOpening.current = false;

    setOnlineCount(0);
    setOnlineUsers([]);

    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      try {
        ws.close(1000, "client close");
      } catch {}
    }

    if (manual) setStatus(nextStatus);
  },
  []
);

  const sendWs = useCallback((payload: any) => {
    const ws = wsRef.current;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }

    log("WS_SEND_BLOCKED", payload);
    return false;
  }, []);

  const connectSocket = useCallback(
    async (forceToken?: string) => {
      const currentToken = forceToken || getCurrentToken();

      if (!currentToken || !goalClassID) {
        setStatus("offline");
        return;
      }

      const current = wsRef.current;

      if (current?.readyState === WebSocket.OPEN) {
        setStatus("connected");
        return;
      }

      if (current?.readyState === WebSocket.CONNECTING || socketOpening.current) {
        return;
      }

      socketOpening.current = true;
      manualClose.current = false;

      setStatus(reconnectAttempt.current > 0 ? "reconnecting" : "connecting");

      const wsUrl = `${CHAT_WS}/ws/${encodeURIComponent(
        goalClassID
      )}?token=${encodeURIComponent(currentToken)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
      if (!mounted.current || wsRef.current !== ws) return;

      socketOpening.current = false;
      reconnectAttempt.current = 0;
     setStatus("connected");

      joinChat()
        .then(() => fetchOnline())
        .catch(() => {});

      setTimeout(() => {
        if (mounted.current) {
          joinChat()
            .then(() => fetchOnline())
            .catch(() => {});
        }
      }, 1000);

      setTimeout(() => {
        if (mounted.current) fetchOnline().catch(() => {});
      }, 1000);
    };

      ws.onmessage = (event) => {
        if (!mounted.current || wsRef.current !== ws) return;

        try {
          const data = JSON.parse(event.data);
          const eventName = data?.event;

          if (eventName === "message.created" && data?.message) {
            const incoming: Msg = data.message;

            setMessages((prev) => {
              const incomingID = incoming.id || incoming.message_id;
              const incomingUserID = String(
                incoming.user_id || incoming.sender_id || ""
              );

              const withoutTemp = prev.filter((m) => {
                if (!m.temp_id) return true;

                const sameUser = myIds.has(incomingUserID);
                const sameBody =
                  String(m.body || m.message || "") ===
                  String(incoming.body || incoming.message || "");

                return !(sameUser && sameBody);
              });

              const exists = withoutTemp.some(
                (m) => String(m.id || m.message_id) === String(incomingID)
              );

              if (exists) return withoutTemp;

              return normalize([...withoutTemp, incoming]);
            });

            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset({ offset: 0, animated: true });
            });
          }

          if (eventName === "presence.updated") {
            setOnlineCount(Number(data?.online_count || 0));

            const users = extractOnlineUsers(data);
            if (users.length) {
              setOnlineUsers(users);
            }
          }
          if (eventName === "poll.updated" && data?.poll) {
          const poll = data.poll;

          setMessages((prev) =>
            prev.map((m) =>
              String(m.poll_id) === String(poll.id)
                ? { ...m, poll }
                : m
            )
          );
        }

        if (eventName === "poll.closed" && data?.poll) {
          const poll = data.poll;

          setMessages((prev) =>
            prev.map((m) =>
              String(m.poll_id) === String(poll.id)
                ? {
                    ...m,
                    poll: {
                      ...(m.poll || {}),
                      ...poll,
                      is_active: false,
                    },
                  }
                : m
            )
          );
        }

        if (eventName === "pinned.updated") {
          setPinnedMessages(data?.pinned_messages || []);
        }

        if (eventName === "message.read") {
          setUnreadCount(0);
        }

          if (eventName === "typing.start") {
            const userID = String(data?.user_id || "");
            const userName = String(data?.user_name || "Someone");

            if (!userID || myIds.has(userID)) return;

            setTypingUsers((prev) => ({ ...prev, [userID]: userName }));

            setTimeout(() => {
              setTypingUsers((prev) => {
                const next = { ...prev };
                delete next[userID];
                return next;
              });
            }, 2500);
          }

          if (eventName === "typing.stop") {
            const userID = String(data?.user_id || "");
            if (!userID) return;

            setTypingUsers((prev) => {
              const next = { ...prev };
              delete next[userID];
              return next;
            });
          }
        } catch (e) {
          log("WS_PARSE_ERROR", String(e));
        }
      };

      ws.onerror = (e) => {
        log("WS_ERROR", e);
        socketOpening.current = false;
      };

      ws.onclose = async (e: any) => {
        if (!mounted.current || wsRef.current !== ws) return;

        wsRef.current = null;
        socketOpening.current = false;

        if (manualClose.current) return;

        reconnectAttempt.current += 1;
        setStatus("reconnecting");

        const reason = String(e?.reason || "");
        const code = String(e?.code || "");
        const closeText = `${code} ${reason}`;

        if (reason.includes("400") || reason.includes("Bad Request")) {
          setStatus("offline");
          return;
        }

        if (isUnauthorized(closeText)) {
          const freshToken = await refreshTokenOnlyWhenNeeded();

          if (!freshToken) {
            setStatus("offline");
            return;
          }

          reconnectTimer.current = setTimeout(() => {
            if (mounted.current) connectSocket(freshToken);
          }, 700);

          return;
        }

        const delay = Math.min(1000 * reconnectAttempt.current, 5000);

        reconnectTimer.current = setTimeout(() => {
          if (mounted.current) connectSocket();
        }, delay);
      };
    },
    [
      goalClassID,
      getCurrentToken,
      fetchOnline,
      joinChat,
      myIds,
      refreshTokenOnlyWhenNeeded,
    ]
  );

  const openChat = useCallback(async () => {
    if (!token || !goalClassID) {
      setLoading(false);
      setStatus("offline");
      return;
    }

    try {
      setLoading(true);
      setStatus("connecting");

      await joinChat();

      const [history] = await Promise.all([
      fetchMessages(),
      fetchOnline(),
      fetchPinnedMessages(),
      fetchUnreadCount(),
    ]);

      if (!mounted.current) return;

      setMessages(normalize(history));
      setHasMoreOlder(history.length >= 20);
      initialLoaded.current = true;

      await connectSocket();
    } catch (e) {
      log("OPEN_CHAT_FAILED", String(e));
      setStatus("offline");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [token, goalClassID, joinChat, fetchMessages, fetchOnline,fetchPinnedMessages, fetchUnreadCount, connectSocket]);

  useEffect(() => {
    mounted.current = true;
    openChat();

    const sub = AppState.addEventListener("change", (state) => {
  if (state === "active") {
    manualClose.current = false;
    connectSocket();

    fetchOnline().catch(() => {});

    setTimeout(() => {
      if (mounted.current) fetchOnline().catch(() => {});
    }, 1000);
  }
  });

    return () => {
      mounted.current = false;
      sub.remove();

      if (typingTimer.current) clearTimeout(typingTimer.current);

      closeSocket(true);
    };
  }, [openChat, connectSocket, closeSocket]);

  const loadOlder = useCallback(async () => {
    if (
      loading ||
      loadingOlder ||
      !hasMoreOlder ||
      !initialLoaded.current ||
      messages.length < 20
    ) {
      return;
    }

    const oldest = messages[0]?.created_at;
    if (!oldest) return;

    try {
      setLoadingOlder(true);

      const older = await fetchMessages(oldest);

      if (!older.length) {
        setHasMoreOlder(false);
        return;
      }

      setMessages((prev) => normalize([...older, ...prev]));

      if (older.length < 20) {
        setHasMoreOlder(false);
      }
    } catch (e) {
      log("LOAD_OLDER_FAILED", String(e));
    } finally {
      setLoadingOlder(false);
    }
  }, [loading, loadingOlder, hasMoreOlder, messages, fetchMessages]);

  const handleTyping = useCallback(
  (text: string) => {
    setInput(text);

    if (text.trim() && !typingStartedRef.current) {
      typingStartedRef.current = true;
      sendWs({ event: "typing.start" });
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      typingStartedRef.current = false;
      sendWs({ event: "typing.stop" });
    }, 1500);
  },
  [sendWs]
);
const handlePinMessage = useCallback(async (item: Msg) => {
  const messageID = String(item.id || item.message_id || "");
  if (!messageID) return;

  try {
    await ChatAPI.pinMessage(goalClassID, messageID);

    const res = await ChatAPI.pinnedMessages(goalClassID);
    setPinnedMessages(res.data?.pinned_messages || []);
  } catch (e) {
    console.log("PIN_MESSAGE_ERROR", e);
  }
}, [goalClassID]);
const handleUnpinMessage = useCallback(async (item: Msg) => {
  const messageID = String(item.id || item.message_id || "");
  if (!messageID) return;

  try {
    await ChatAPI.unpinMessage(goalClassID, messageID);

    const res = await ChatAPI.pinnedMessages(goalClassID);
    setPinnedMessages(res.data?.pinned_messages || []);
  } catch (e) {
    console.log("UNPIN_MESSAGE_ERROR", e);
  }
}, [goalClassID]);
  const openMessageMenu = useCallback((item: Msg) => {
    setMenuMessage(item);
    setShowMessageMenu(true);
  }, []);
  const closeMessageMenu = useCallback(() => {
  setShowMessageMenu(false);
  setMenuMessage(null);
}, []);

const handleReplyFromMenu = useCallback(() => {
  if (!menuMessage) return;
  setReplyTo(menuMessage);
  closeMessageMenu();
}, [menuMessage, closeMessageMenu]);

const handlePinFromMenu = useCallback(async () => {
  if (!menuMessage) return;

  if (menuMessage.is_pinned) {
    await handleUnpinMessage(menuMessage);
  } else {
    await handlePinMessage(menuMessage);
  }

  closeMessageMenu();
}, [menuMessage, handlePinMessage, handleUnpinMessage, closeMessageMenu]);

const scrollToMessage = useCallback(
  (messageID: string) => {
    const originalIndex = messages.findIndex(
      (m) =>
        String(m.id || m.message_id) === String(messageID)
    );

    if (originalIndex < 0) return;

    const reversedIndex = messages.length - 1 - originalIndex;

    listRef.current?.scrollToIndex({
      index: reversedIndex,
      animated: true,
      viewPosition: 0.5,
    });

    setHighlightedMessageID(messageID);

    setTimeout(() => {
      setHighlightedMessageID(null);
    }, 1800);
  },
  [messages]
);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    if (status !== "connected" || wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    setInput("");
    typingStartedRef.current = false;
    sendWs({ event: "typing.stop" });

    const tempID = `temp-${Date.now()}`;

    const optimistic: Msg = {
      temp_id: tempID,
      user_id: myUserID,
      user_name: myName,
      body: text,
      type: "text",
      role: myRole,
      created_at: new Date().toISOString(),
      pending: true,
      reply_to_message_id: replyTo?.id || replyTo?.message_id || "",
      reply_to_body: replyTo?.body || replyTo?.message || "",
      reply_to_user_name: replyTo?.user_name || replyTo?.name || "",
    };

    setMessages((prev) => normalize([...prev, optimistic]));

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    const ok = sendWs({
    event: "message.send",
    body: text,
    type: "text",
    reply_to_message_id: replyTo?.id || replyTo?.message_id || undefined,
    });

    if (!ok) {
      setMessages((prev) =>
        prev.map((m) =>
          m.temp_id === tempID ? { ...m, pending: false, failed: true } : m
        )
      );
      return;
      setReplyTo(null);
    }

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.temp_id === tempID ? { ...m, pending: false } : m
        )
      );
    }, 1800);
  }, [input, status, sendWs, myUserID, myName, myRole]);

  const handleCreatePoll = useCallback(async () => {
  const question = pollQuestion.trim();
  const options = pollOptions.map((x) => x.trim()).filter(Boolean);

  if (!question || options.length < 2) return;

  try {
    setCreatingPoll(true);

    const res = await ChatAPI.createPoll(goalClassID, {
      question,
      options,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    const msg = res.data?.message;

    if (msg) {
      setMessages((prev) => normalize([...prev, msg]));
    }

    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollPanel(false);

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  } catch (e) {
    console.log("CREATE_POLL_ERROR", e);
  } finally {
    setCreatingPoll(false);
  }
}, [pollQuestion, pollOptions, goalClassID]);

  const statusMeta = {
    connected: { text: `${onlineCount} online`, color: GREEN },
    connecting: { text: "Connecting realtime...", color: ORANGE },
    reconnecting: { text: "Reconnecting...", color: ORANGE },
    offline: { text: "Realtime offline", color: RED },
  }[status];

  if (!token || !goalClassID) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={56} color={RED} />
        <Text style={styles.emptyTitle}>Chat unavailable</Text>
        <Text style={styles.emptyText}>Token ya goalClassID missing hai.</Text>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Modal
  visible={showMessageMenu}
  transparent
  animationType="fade"
  onRequestClose={closeMessageMenu}
>
  <TouchableOpacity
    activeOpacity={1}
    style={styles.menuOverlay}
    onPress={closeMessageMenu}
  >
    <View style={styles.messageMenu}>
      <View style={styles.menuHandle} />

      <Text style={styles.menuTitle}>Message Options</Text>

      <TouchableOpacity style={styles.menuItem} onPress={handleReplyFromMenu}>
        <View style={styles.menuIconBox}>
          <Ionicons name="return-up-back" size={19} color={BLUE} />
        </View>
        <View>
          <Text style={styles.menuItemTitle}>Reply</Text>
          <Text style={styles.menuItemSub}>Reply to this message</Text>
        </View>
      </TouchableOpacity>

      {canCreatePoll && (
        <TouchableOpacity style={styles.menuItem} onPress={handlePinFromMenu}>
          <View style={styles.menuIconBox}>
            <Ionicons
              name={menuMessage?.is_pinned ? "remove-circle" : "pin"}
              size={19}
              color={BLUE}
            />
          </View>
          <View>
            <Text style={styles.menuItemTitle}>
              {menuMessage?.is_pinned ? "Unpin Message" : "Pin Message"}
            </Text>
            <Text style={styles.menuItemSub}>
              {menuMessage?.is_pinned ? "Remove from top bar" : "Show at top"}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.menuCancel} onPress={closeMessageMenu}>
        <Text style={styles.menuCancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.logo}>
            <Ionicons name="people" size={24} color={BLUE} />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>Connect</Text>

            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: statusMeta.color }]} />
              <Text style={styles.subtitle}>{statusMeta.text}</Text>
            </View>

            {!!onlineNamesText && (
              <Text style={styles.onlineNames} numberOfLines={1}>
                Online: {onlineNamesText}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.refresh} onPress={() => connectSocket()}>
            <Ionicons name="flash" size={20} color={BLUE} />
          </TouchableOpacity>
          {canCreatePoll && (
          <TouchableOpacity
            style={styles.refresh}
            onPress={() => setShowPollPanel((v) => !v)}
          >
            <Ionicons name="bar-chart" size={20} color={BLUE} />
          </TouchableOpacity>
        )}
        </View>

        {!!pinnedMessages.length && (
      <TouchableOpacity
          activeOpacity={0.85}
          style={styles.pinnedBar}
          onPress={() => {
            const pinned = pinnedMessages[0];
            const id = String(pinned?.id || pinned?.message_id || "");
            if (id) scrollToMessage(id);
          }}
        >
        <Ionicons name="pin" size={15} color={BLUE} />
        <Text style={styles.pinnedText} numberOfLines={1}>
          {pinnedMessages[0]?.body || pinnedMessages[0]?.poll?.question || "Pinned message"}
        </Text>
      </TouchableOpacity>
    )}
        {showPollPanel && canCreatePoll && (
  <View style={styles.pollPanel}>
    <Text style={styles.pollPanelTitle}>Create Poll</Text>

    <TextInput
      value={pollQuestion}
      onChangeText={setPollQuestion}
      placeholder="Poll question..."
      placeholderTextColor="#9CA3AF"
      style={styles.pollInput}
    />

    {pollOptions.map((option, index) => (
      <TextInput
        key={index}
        value={option}
        onChangeText={(text) => {
          setPollOptions((prev) =>
            prev.map((x, i) => (i === index ? text : x))
          );
        }}
        placeholder={`Option ${index + 1}`}
        placeholderTextColor="#9CA3AF"
        style={styles.pollInput}
      />
    ))}

        <View style={styles.pollActions}>
          {pollOptions.length < 5 && (
            <TouchableOpacity
              style={styles.pollSmallBtn}
              onPress={() => setPollOptions((prev) => [...prev, ""])}
            >
              <Ionicons name="add" size={16} color={BLUE} />
              <Text style={styles.pollSmallBtnText}>Add option</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.pollCreateBtn,
              creatingPoll && { opacity: 0.6 },
            ]}
            disabled={creatingPoll}
            onPress={handleCreatePoll}
          >
            <Text style={styles.pollCreateText}>
              {creatingPoll ? "Creating..." : "Create"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )}

        <View style={styles.body}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={BLUE} />
              <Text style={styles.loading}>Opening community...</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={listData}
              inverted
              keyExtractor={(item, index) => keyOf(item, index)}
              renderItem={({ item }) => {
                const senderID = String(item.user_id || item.sender_id || "");
                if (item.type === "poll" || item.poll_id || item.poll) {
            return (
              <PollCard
                item={item}
                isMine={myIds.has(senderID)}
                goalClassID={goalClassID}
                isTeacherOrAdmin={myRole.includes("teacher") || myRole.includes("admin")}
                onVote={async (pollID, optionID) => {
                  const res = await ChatAPI.votePoll(goalClassID, pollID, optionID);
                  const poll = res.data?.poll;

                  if (poll) {
                    setMessages((prev) =>
                      prev.map((m) =>
                        String(m.poll_id) === String(poll.id)
                          ? { ...m, poll }
                          : m
                      )
                    );
                  }
                }}
                onClose={async (pollID) => {
                  await ChatAPI.closePoll(goalClassID, pollID);
                }}
              />
            );
          }

          return (
              <Bubble
            item={item}
            isMine={myIds.has(senderID)}
            onLongPress={() => openMessageMenu(item)}
            isHighlighted={
              highlightedMessageID === String(item.id || item.message_id)
            }
          />
            );
              }}
              contentContainerStyle={[
                styles.list,
                { flexGrow: messages.length ? undefined : 1 },
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              onEndReached={loadOlder}
              onEndReachedThreshold={0.35}
              ListFooterComponent={
                loadingOlder && hasMoreOlder ? (
                  <ActivityIndicator size="small" color={BLUE} />
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={54}
                    color={BLUE}
                  />
                  <Text style={styles.emptyTitle}>No messages yet</Text>
                  <Text style={styles.emptyText}>First message aap bhejo.</Text>
                </View>
              }
            />
          )}

          <View style={styles.bottom}>
            {!!typingText && <Text style={styles.typing}>{typingText}</Text>}

            {status === "offline" && !loading && (
              <View style={styles.offlineBar}>
                <Ionicons name="warning-outline" size={15} color={RED} />
                <Text style={styles.offlineText}>
                  Realtime connection issue ki wajah se message abhi send nahi ho
                  pa raha hai.
                </Text>
              </View>
            )}
            {replyTo && (
              <View style={styles.replyPreview}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.replyTitle}>
                    Replying to {replyTo.user_name || replyTo.name || "Student"}
                  </Text>
                  <Text style={styles.replyBody} numberOfLines={1}>
                    {replyTo.body || replyTo.message || replyTo.poll?.question || "Poll"}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Ionicons name="close-circle" size={22} color={MUTED} />
                </TouchableOpacity>
              </View>
            )}
            <View
              style={[
                styles.inputWrap,
                {
                  paddingBottom:
                    Platform.OS === "ios" ? Math.max(insets.bottom, 10) : 10,
                },
              ]}
            >
              <View style={styles.inputBox}>
                <TextInput
                  value={input}
                  onChangeText={handleTyping}
                  placeholder="Type your message..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={1000}
                  style={styles.input}
                  textAlignVertical="center"
                  editable={status === "connected"}
                />

                <TouchableOpacity
                  style={[
                    styles.send,
                    (!input.trim() || status !== "connected") && styles.sendDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!input.trim() || status !== "connected"}
                >
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const Bubble = memo(
  ({
    item,
    isMine,
    onLongPress,
isHighlighted,
}: {
  item: Msg;
  isMine: boolean;
  onLongPress?: () => void;
  isHighlighted?: boolean;
}) => {
const roleLabel = prettyRole(item);
const isAdmin = roleLabel === "Admin";
const isTeacher = roleLabel === "Teacher";
const isVerified = isAdmin || isTeacher;

const realName = item.user_name || item.name || "Student";
const name = isAdmin ? "Admin" : realName;

const body = item.body || item.message || "";

  return (
    <View style={[styles.row, isMine ? styles.myRow : styles.otherRow]}>
      {!isMine && (
  <>
    {isAdmin ? (
      <View style={styles.adminSideBadge}>
        <Ionicons name="shield-checkmark" size={18} color="#B91C1C" />
      </View>
    ) : (
      <View style={[styles.avatar, isTeacher && styles.verifiedAvatar]}>
        <Text style={[styles.avatarText, isTeacher && styles.verifiedAvatarText]}>
          {String(name).charAt(0).toUpperCase()}
        </Text>
      </View>
    )}
  </>
)}

      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={onLongPress}
        style={[
          styles.bubble,
          isMine ? styles.myBubble : styles.otherBubble,
          isTeacher && styles.verifiedBubble,
          isAdmin && styles.adminBubble,
          isMine && isTeacher && styles.myVerifiedBubble,
          isMine && isAdmin && styles.myAdminBubble,
          isHighlighted && styles.highlightedBubble,
        ]}
      >
        {isVerified && <BlueTickGlow color={isAdmin ? "#EF4444" : "#2563EB"} />}

        {!isMine && (
          <View style={styles.nameRow}>
            {!isAdmin && (
              <Text
                style={[
                  styles.name,
                  isTeacher && styles.verifiedName,
                ]}
              >
                {name}
              </Text>
            )}

            {isVerified && (
              <Animated.View style={[styles.roleBadge, isAdmin && styles.adminRoleBadge]}>
               <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color={isAdmin ? "#B91C1C" : "#FFFFFF"}
                  />
                <Text style={[styles.roleBadgeText, isAdmin && styles.adminRoleBadgeText]}>
                {isAdmin ? "FLYS Connect" : roleLabel || "Verified"}
              </Text>
              </Animated.View>
            )}
          </View>
        )}

        {isMine && isVerified && (
          <View style={[styles.nameRow, styles.myNameRow]}>
            <View style={styles.roleBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#FFFFFF" />
              <Text style={styles.roleBadgeText}>
                {roleLabel || "Verified"}
              </Text>
            </View>
          </View>
        )}
        {!!item.reply_to_message_id && (
          <View style={styles.replyInBubble}>
            <Text style={styles.replyInBubbleName}>
              {item.reply_to_user_name || "Student"}
            </Text>
            <Text style={styles.replyInBubbleText} numberOfLines={1}>
              {item.reply_to_body || "Original message"}
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.msg,
            isMine && styles.myMsg,
            isVerified && !isMine && styles.verifiedMsg,
          ]}
        >
          {body}
        </Text>

        <Text
          style={[
            styles.time,
            isMine && styles.myTime,
            isTeacher && !isMine && styles.verifiedTime,
            isAdmin && !isMine && styles.adminTime,
          ]}
        >
          {item.failed
            ? "Failed"
            : item.pending
            ? "Sending..."
            : formatTime(item.created_at)}
        </Text>
      </TouchableOpacity>
    </View>
  );
});
const BlueTickGlow = memo(({ color = "#2563EB" }: { color?: string }) => {
  <Ionicons name="checkmark-done-circle" size={21} color={color} />
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.18,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.55,
            duration: 850,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.tickGlow,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <Ionicons name="checkmark-done-circle" size={21} color={color} />
    </Animated.View>
  );
});

function formatTime(date?: string) {
  if (!date) return "";

  try {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
function getRoleFromMessage(m: Msg) {
  return String(
    m.role ||
      m.user_role ||
      m.member_role ||
      m.sender_role ||
      m.author_role ||
      m.profile?.role ||
      m.profile?.user_role ||
      m.user?.role ||
      m.user?.user_role ||
      ""
  )
    .trim()
    .toLowerCase();
}

function isTeacherOrAdmin(m: Msg) {
  const role = getRoleFromMessage(m);
  return (
    role === "teacher" ||
    role === "admin" ||
    role.includes("teacher") ||
    role.includes("admin")
  );
}

function prettyRole(m: Msg) {
  const role = getRoleFromMessage(m);
  if (role.includes("admin")) return "Admin";
  if (role.includes("teacher")) return "Teacher";
  return "";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: BG,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 21, fontWeight: "900", color: TEXT },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  subtitle: { fontSize: 12, fontWeight: "800", color: MUTED },
  onlineNames: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
  },
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  body: { flex: 1, backgroundColor: PAGE },
  list: { padding: 14 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: BG,
  },
  loading: { marginTop: 12, fontSize: 15, fontWeight: "900", color: BLUE },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: MUTED,
    textAlign: "center",
  },
  row: { flexDirection: "row", marginVertical: 5, alignItems: "flex-end" },
  myRow: { justifyContent: "flex-end" },
  otherRow: { justifyContent: "flex-start" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  avatarText: { color: BLUE, fontWeight: "900", fontSize: 13 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
  },
  myBubble: {
  backgroundColor: "#FFFFFF", // light grey
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderBottomRightRadius: 5,
},
  otherBubble: {
    backgroundColor: BG,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: BORDER,
  },
  name: { fontSize: 12, fontWeight: "900", color: BLUE, marginBottom: 4 },
  msg: { fontSize: 15, lineHeight: 21, fontWeight: "500", color: TEXT },
  myMsg: {
  color: "#111827",
  },
  time: {
    alignSelf: "flex-end",
    marginTop: 5,
    fontSize: 10,
    fontWeight: "700",
    color: MUTED,
  },
  myTime: {
  color: "#070707",
  },
  bottom: { backgroundColor: BG },
  typing: {
    paddingHorizontal: 18,
    paddingTop: 5,
    fontSize: 12,
    fontWeight: "800",
    color: BLUE,
  },
  offlineBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#FEF2F2",
    borderTopWidth: 1,
    borderTopColor: "#FECACA",
  },
  offlineText: {
    flex: 1,
    color: RED,
    fontSize: 11,
    fontWeight: "800",
  },
  inputWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F8FAFC",
    borderRadius: 25,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    paddingTop: Platform.OS === "ios" ? 9 : 7,
    paddingBottom: 7,
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 18,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  verifiedAvatar: {
  backgroundColor: BLUE,
  borderColor: "#60A5FA",
  shadowColor: BLUE,
  shadowOpacity: 0.28,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 5,
},
verifiedAvatarText: { color: "#FFFFFF" },

verifiedBubble: {
  backgroundColor: "#EFF6FF",
  borderColor: "#60A5FA",
  borderWidth: 1.4,
  shadowColor: BLUE,
  shadowOpacity: 0.18,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
},
myVerifiedBubble: {
  backgroundColor: "#F3F4F6",
  borderColor: "#D1D5DB",
  borderWidth: 1,
},

tickGlow: {
  position: "absolute",
  right: -8,
  top: -8,
  width: 25,
  height: 25,
  borderRadius: 13,
  backgroundColor: "#FFFFFF",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#BFDBFE",
  shadowColor: BLUE,
  shadowOpacity: 0.35,
  shadowRadius: 9,
  shadowOffset: { width: 0, height: 3 },
  elevation: 6,
  zIndex: 10,
},

nameRow: {
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 4,
},
myNameRow: {
  justifyContent: "flex-end",
},
verifiedName: { color: "#1D4ED8" },

roleBadge: {
  flexDirection: "row",
  alignItems: "center",
  gap: 3,
  backgroundColor: BLUE,
  paddingHorizontal: 7,
  paddingVertical: 3,
  borderRadius: 999,
},
roleBadgeText: {
  color: "#FFFFFF",
  fontSize: 10,
  fontWeight: "900",
},
adminAvatar: {
  backgroundColor: "#FEE2E2",
  borderColor: "#F87171",
  shadowColor: "#DC2626",
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 7,
},

adminBubble: {
  backgroundColor: "#FEF2F2",
  borderColor: "#F87171",
  borderWidth: 1.6,
  shadowColor: "#DC2626",
  shadowOpacity: 0.22,
  shadowRadius: 13,
  shadowOffset: { width: 0, height: 5 },
  elevation: 6,
},

myAdminBubble: {
  backgroundColor: "#DC2626",
  borderColor: "#FCA5A5",
},

adminName: {
  color: "#B91C1C",
},

adminRoleBadge: {
  backgroundColor: "#FEE2E2",
  borderWidth: 1,
  borderColor: "#F87171",
  shadowColor: "#DC2626",
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 8,
},

adminRoleBadgeText: {
  color: "#B91C1C",
  fontWeight: "900",
},
adminSideBadge: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: "#FEE2E2",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 8,
  borderWidth: 1.5,
  borderColor: "#F87171",
  shadowColor: "#DC2626",
  shadowOpacity: 0.3,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 6,
},

verifiedMsg: { color: "#0F172A", fontWeight: "700" },
verifiedTime: { color: "#1D4ED8" },
adminTime: {
  color: "#B91C1C",
  fontWeight: "900",
},
pinnedBar: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  paddingHorizontal: 14,
  paddingVertical: 8,
  backgroundColor: "#EFF6FF",
  borderBottomWidth: 1,
  borderBottomColor: "#DBEAFE",
},

pollPanel: {
  backgroundColor: "#FFFFFF",
  padding: 14,
  borderBottomWidth: 1,
  borderBottomColor: BORDER,
},

pollPanelTitle: {
  fontSize: 15,
  fontWeight: "900",
  color: TEXT,
  marginBottom: 10,
},

pollInput: {
  backgroundColor: "#F8FAFC",
  borderWidth: 1,
  borderColor: BORDER,
  borderRadius: 14,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 8,
  fontSize: 14,
  fontWeight: "700",
  color: TEXT,
},

pollActions: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 4,
},

pollSmallBtn: {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
  paddingHorizontal: 12,
  paddingVertical: 9,
  borderRadius: 14,
  backgroundColor: "#EFF6FF",
  borderWidth: 1,
  borderColor: "#DBEAFE",
},

pollSmallBtnText: {
  color: BLUE,
  fontSize: 12,
  fontWeight: "900",
},

pollCreateBtn: {
  paddingHorizontal: 18,
  paddingVertical: 10,
  borderRadius: 14,
  backgroundColor: BLUE,
},

pollCreateText: {
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: "900",
},

pinnedText: {
  flex: 1,
  color: BLUE,
  fontSize: 12,
  fontWeight: "900",
},
replyPreview: {
  marginHorizontal: 12,
  marginTop: 8,
  padding: 10,
  borderRadius: 14,
  backgroundColor: "#EFF6FF",
  borderWidth: 1,
  borderColor: "#DBEAFE",
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

replyTitle: {
  fontSize: 12,
  fontWeight: "900",
  color: BLUE,
},

replyBody: {
  marginTop: 3,
  fontSize: 12,
  fontWeight: "700",
  color: MUTED,
},

replyInBubble: {
  padding: 8,
  borderRadius: 10,
  backgroundColor: "rgba(37,99,235,0.10)",
  borderLeftWidth: 3,
  borderLeftColor: BLUE,
  marginBottom: 7,
},

replyInBubbleName: {
  fontSize: 11,
  fontWeight: "900",
  color: BLUE,
},

replyInBubbleText: {
  marginTop: 2,
  fontSize: 11,
  fontWeight: "700",
  color: MUTED,
},
menuOverlay: {
  flex: 1,
  backgroundColor: "rgba(15,23,42,0.35)",
  justifyContent: "flex-end",
},

messageMenu: {
  backgroundColor: "#FFFFFF",
  paddingHorizontal: 18,
  paddingTop: 10,
  paddingBottom: Platform.OS === "ios" ? 34 : 28,
  borderTopLeftRadius: 26,
  borderTopRightRadius: 26,
  borderWidth: 1,
  borderColor: "#E0E7FF",
},

menuHandle: {
  width: 46,
  height: 5,
  borderRadius: 999,
  backgroundColor: "#CBD5E1",
  alignSelf: "center",
  marginBottom: 14,
},

menuTitle: {
  fontSize: 17,
  fontWeight: "900",
  color: TEXT,
  marginBottom: 12,
},

menuItem: {
  flexDirection: "row",
  alignItems: "center",
  gap: 12,
  padding: 13,
  borderRadius: 18,
  backgroundColor: "#F8FAFC",
  borderWidth: 1,
  borderColor: "#E5E7EB",
  marginBottom: 10,
},

menuIconBox: {
  width: 42,
  height: 42,
  borderRadius: 16,
  backgroundColor: "#EFF6FF",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#DBEAFE",
},

menuItemTitle: {
  fontSize: 14,
  fontWeight: "900",
  color: TEXT,
},

menuItemSub: {
  marginTop: 2,
  fontSize: 11,
  fontWeight: "700",
  color: MUTED,
},

menuCancel: {
  marginTop: 4,
  marginBottom: 26,
  height: 44,
  borderRadius: 18,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#EEF2FF",
},

menuCancelText: {
  fontSize: 14,
  fontWeight: "900",
  color: BLUE,
},
highlightedBubble: {
  borderWidth: 2,
  borderColor: "#F59E0B",
  shadowColor: "#F59E0B",
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 8,
},
  sendDisabled: { backgroundColor: "#93C5FD" },
});
