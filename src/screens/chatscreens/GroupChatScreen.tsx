import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, AppState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";

const CHAT_API = "https://api.flyslearning.com/chat/api/v1/chat";
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

const DEBUG = true;
const log = (...a: any[]) => DEBUG && console.log("[CHAT_WS_ONLY]", ...a);

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

function keyOf(m: Msg, index = 0) {
  return String(m.id || m.message_id || m.temp_id || `${m.created_at || "msg"}-${index}`);
}

function normalize(arr: Msg[]) {
  const map = new Map<string, Msg>();
  arr.forEach((m, i) => map.set(keyOf(m, i), m));
  return [...map.values()].sort(
    (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
  );
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
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

  const myUserID = String(payload?.user_id || user?.id || user?.user_id || user?.profile?.id || "");
  const myName =
    user?.name ||
    user?.full_name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    "You";

  const myIds = useMemo(
    () => new Set([myUserID, payload?.user_id, user?.id, user?.user_id].filter(Boolean).map(String)),
    [myUserID, payload, user]
  );

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
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
  const manualClose = useRef(false);
  const reconnectAttempt = useRef(0);
  const socketOpening = useRef(false);
  const initialLoaded = useRef(false);

  const listData = useMemo(() => [...messages].reverse(), [messages]);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const wsUrl = useMemo(() => {
    return `${CHAT_WS}/ws/${encodeURIComponent(goalClassID)}?token=${encodeURIComponent(token)}`;
  }, [goalClassID, token]);

  const typingText = useMemo(() => {
    const names = Object.values(typingUsers);
    if (!names.length) return "";
    if (names.length === 1) return `${names[0]} typing...`;
    return `${names[0]} and ${names.length - 1} others typing...`;
  }, [typingUsers]);

  const joinChat = useCallback(async () => {
    const res = await fetch(`${CHAT_API}/join`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ goal_class_id: goalClassID }),
    });

    const body = await readJson(res);
    if (!res.ok) throw new Error(`Join failed ${res.status}: ${JSON.stringify(body)}`);
  }, [authHeaders, goalClassID]);

  const fetchMessages = useCallback(
    async (before?: string) => {
      const url = before
        ? `${CHAT_API}/groups/${goalClassID}/messages?before=${encodeURIComponent(before)}`
        : `${CHAT_API}/groups/${goalClassID}/messages`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await readJson(res);
      if (!res.ok) throw new Error(`Messages failed ${res.status}: ${JSON.stringify(body)}`);

      return Array.isArray(body?.messages) ? body.messages : [];
    },
    [goalClassID, token]
  );

  const fetchOnline = useCallback(async () => {
    const res = await fetch(`${CHAT_API}/groups/${goalClassID}/online`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = await readJson(res);
    if (res.ok && mounted.current) setOnlineCount(Number(body?.online_count || 0));
  }, [goalClassID, token]);

  const closeSocket = useCallback((manual = true, nextStatus: Status = "offline") => {
    manualClose.current = manual;

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    const ws = wsRef.current;
    wsRef.current = null;
    socketOpening.current = false;

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
  }, []);

  const sendWs = useCallback((payload: any) => {
    const ws = wsRef.current;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }

    log("WS_SEND_BLOCKED_NOT_CONNECTED", payload);
    return false;
  }, []);

  const connectSocket = useCallback(() => {
    if (!token || !goalClassID) {
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

    log("WS_CONNECTING", {
      url: wsUrl.replace(token, "***TOKEN***"),
      tokenLength: token.length,
      goalClassID,
    });

    setStatus(reconnectAttempt.current > 0 ? "reconnecting" : "connecting");

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mounted.current || wsRef.current !== ws) return;

      log("WS_CONNECTED");

      socketOpening.current = false;
      reconnectAttempt.current = 0;
      setStatus("connected");

      fetchOnline().catch(() => {});
    };

    ws.onmessage = (event) => {
      if (!mounted.current || wsRef.current !== ws) return;

      try {
        const data = JSON.parse(event.data);
        const eventName = data?.event;

        log("WS_EVENT", eventName);

        if (eventName === "message.created" && data?.message) {
          const incoming: Msg = data.message;

          setMessages((prev) => {
            const incomingID = incoming.id || incoming.message_id;
            const incomingUserID = String(incoming.user_id || incoming.sender_id || "");

            const withoutTemp = prev.filter((m) => {
              if (!m.temp_id) return true;

              const sameUser = myIds.has(incomingUserID);
              const sameBody =
                String(m.body || m.message || "") === String(incoming.body || incoming.message || "");

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
      log("WS_ERROR", String(e));
    };

    ws.onclose = (e: any) => {
      if (!mounted.current || wsRef.current !== ws) return;

      log("WS_CLOSED", {
        code: e?.code,
        reason: e?.reason,
        manual: manualClose.current,
      });

      wsRef.current = null;
      socketOpening.current = false;

      if (manualClose.current) return;

      reconnectAttempt.current += 1;
      setStatus("reconnecting");

      const reason = String(e?.reason || "");

      if (reason.includes("400") || reason.includes("Bad Request")) {
        log("BACKEND_WS_BAD_REQUEST_FIX_REQUIRED");
        setStatus("offline");
        return;
      }

      const delay = Math.min(1000 * reconnectAttempt.current, 5000);

      reconnectTimer.current = setTimeout(() => {
        if (mounted.current) connectSocket();
      }, delay);
    };
  }, [token, goalClassID, wsUrl, fetchOnline, myIds]);

  const openChat = useCallback(async () => {
    if (!token || !goalClassID) {
      setLoading(false);
      setStatus("offline");
      return;
    }

    try {
      setLoading(true);
      setStatus("connecting");

      log("OPEN_CHAT_START");

      await joinChat();

      const [history] = await Promise.all([fetchMessages(), fetchOnline()]);

      if (!mounted.current) return;

      setMessages(normalize(history));
      setHasMoreOlder(history.length >= 20);
      initialLoaded.current = true;

      log("OPEN_CHAT_LOADED", { count: history.length });

      connectSocket();
    } catch (e) {
      log("OPEN_CHAT_FAILED", String(e));
      setStatus("offline");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [token, goalClassID, joinChat, fetchMessages, fetchOnline, connectSocket]);

  useEffect(() => {
    mounted.current = true;
    openChat();

    const sub = AppState.addEventListener("change", (state) => {
      log("APP_STATE", state);

      if (state === "active") {
        manualClose.current = false;
        connectSocket();
      } else {
        closeSocket(true);
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

      if (text.trim()) {
        sendWs({ event: "typing.start" });
      }

      if (typingTimer.current) clearTimeout(typingTimer.current);

      typingTimer.current = setTimeout(() => {
        sendWs({ event: "typing.stop" });
      }, 1200);
    },
    [sendWs]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    if (status !== "connected" || wsRef.current?.readyState !== WebSocket.OPEN) {
      log("MESSAGE_NOT_SENT_SOCKET_OFFLINE");
      return;
    }

    setInput("");
    sendWs({ event: "typing.stop" });

    const tempID = `temp-${Date.now()}`;

    const optimistic: Msg = {
      temp_id: tempID,
      user_id: myUserID,
      user_name: myName,
      body: text,
      type: "text",
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => normalize([...prev, optimistic]));

    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });

    const ok = sendWs({
      body: text,
      type: "text",
    });

    if (!ok) {
      setMessages((prev) =>
        prev.map((m) => (m.temp_id === tempID ? { ...m, pending: false, failed: true } : m))
      );
      return;
    }

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.temp_id === tempID ? { ...m, pending: false } : m))
      );
    }, 1800);
  }, [input, status, sendWs, myUserID, myName]);

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

      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.logo}>
            <Ionicons name="people" size={24} color={BLUE} />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>Community Chat</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, { backgroundColor: statusMeta.color }]} />
              <Text style={styles.subtitle}>{statusMeta.text}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.refresh} onPress={connectSocket}>
            <Ionicons name="flash" size={20} color={BLUE} />
          </TouchableOpacity>
        </View>

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
                return <Bubble item={item} isMine={myIds.has(senderID)} />;
              }}
              contentContainerStyle={[styles.list, { flexGrow: messages.length ? undefined : 1 }]}
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
                  <Ionicons name="chatbubble-ellipses-outline" size={54} color={BLUE} />
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
            Aapka internet ya realtime connection issue ki wajah se message abhi send nahi ho pa raha hai.                </Text>
              </View>
            )}

            <View
              style={[
                styles.inputWrap,
                { paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 10) : 10 },
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

const Bubble = memo(({ item, isMine }: { item: Msg; isMine: boolean }) => {
  const name = item.user_name || item.name || "Student";
  const body = item.body || item.message || "";

  return (
    <View style={[styles.row, isMine ? styles.myRow : styles.otherRow]}>
      {!isMine && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{String(name).charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
        {!isMine && <Text style={styles.name}>{name}</Text>}
        <Text style={[styles.msg, isMine && styles.myMsg]}>{body}</Text>
        <Text style={[styles.time, isMine && styles.myTime]}>
          {item.failed ? "Failed" : item.pending ? "Sending..." : formatTime(item.created_at)}
        </Text>
      </View>
    </View>
  );
});

function formatTime(date?: string) {
  if (!date) return "";
  try {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
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
  emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
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
  myBubble: { backgroundColor: BLUE, borderBottomRightRadius: 5 },
  otherBubble: {
    backgroundColor: BG,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: BORDER,
  },
  name: { fontSize: 12, fontWeight: "900", color: BLUE, marginBottom: 4 },
  msg: { fontSize: 15, lineHeight: 21, fontWeight: "500", color: TEXT },
  myMsg: { color: "#FFFFFF" },
  time: {
    alignSelf: "flex-end",
    marginTop: 5,
    fontSize: 10,
    fontWeight: "700",
    color: MUTED,
  },
  myTime: { color: "#DBEAFE" },
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
  sendDisabled: { backgroundColor: "#93C5FD" },
});