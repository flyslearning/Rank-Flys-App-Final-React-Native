import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  AppState,
  Platform,
  Animated,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/auth.store";
import {
  startStudyNotification,
  stopStudyNotification,
} from "../../utils/studyNotification";

const CHAT_API = "https://api.flyslearning.com/chat/api/v1/chat";
const CHAT_WS = "wss://api.flyslearning.com/chat-ws/api/v1/chat";

const BLUE = "#2563EB";
const BG = "#FFFFFF";
const PAGE = "#F8FAFC";
const BORDER = "#E5E7EB";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const GREEN = "#22C55E";
const RED = "#EF4444";
const ORANGE = "#F59E0B";
const SOFT_BLUE = "#EFF6FF";
const SOFT_GREEN = "#F0FDF4";

const STUDY_ACTIVE_KEY = "study_room_active";
const STUDY_STARTED_AT_KEY = "study_room_started_at";

type Status = "connecting" | "connected" | "reconnecting" | "offline";

type StudyUser = {
  user_id: string;
  user_name: string;
  dp?: string;
  started_at: number;
};

function parseJwt(token: string) {
  try {
    const p = token.split(".")[1];
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function isUnauthorized(text: string) {
  return text.includes("401") || text.includes("Unauthorized") || text.includes("unauthorized");
}

function formatStudyTime(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDuration(startedAt?: number) {
  if (!startedAt) return "Just now";

  const diff = Math.max(0, Math.floor(Date.now() / 1000 - startedAt));
  const min = Math.floor(diff / 60);

  if (min < 1) return "Just now";
  if (min < 60) return `${min} min`;

  const h = Math.floor(min / 60);
  const m = min % 60;

  return `${h}h ${m}m`;
}

export default function StudyRoomScreen() {
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
    payload?.name ||
    "Student";

  const userDp =
    user?.avatar || user?.profile?.avatar || user?.dp || user?.profile?.dp || "";

  const [status, setStatus] = useState<Status>("connecting");
  const [loading, setLoading] = useState(true);
  const [isStudying, setIsStudying] = useState(false);
  const [studySeconds, setStudySeconds] = useState(0);
  const [studyCount, setStudyCount] = useState(0);
  const [studyUsers, setStudyUsers] = useState<StudyUser[]>([]);
  const [showAllStudents, setShowAllStudents] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mounted = useRef(true);
  const manualClose = useRef(false);
  const reconnectTimer = useRef<any>(null);
  const reconnectAttempt = useRef(0);
  const socketOpening = useRef(false);
  const studyTimerRef = useRef<any>(null);
  const isStudyingRef = useRef(false);

  const pulse = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  const previewUsers = useMemo(() => studyUsers.slice(0, 4), [studyUsers]);

  const getCurrentToken = useCallback(() => {
    const state: any = useAuthStore.getState();
    return state.accessToken || token;
  }, [token]);

  const refreshTokenOnlyWhenNeeded = useCallback(async () => {
    const state: any = useAuthStore.getState();
    const fresh = await state.refreshAccessToken?.();
    return fresh || null;
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  useEffect(() => {
    if (!isStudying) {
      pulse.setValue(1);
      return;
    }

    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.035,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    anim.start();

    return () => anim.stop();
  }, [isStudying, pulse]);

  const joinChat = useCallback(async () => {
    let currentToken = getCurrentToken();

    if (!currentToken) {
      throw new Error("No token");
    }

    let res = await fetch(`${CHAT_API}/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal_class_id: goalClassID }),
    });

    let body = await readJson(res);

    if (res.status === 401) {
      const freshToken = await refreshTokenOnlyWhenNeeded();

      if (!freshToken) {
        throw new Error("Token refresh failed");
      }

      res = await fetch(`${CHAT_API}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${freshToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal_class_id: goalClassID }),
      });

      body = await readJson(res);
    }

    if (!res.ok) {
      throw new Error(`Join failed ${res.status}: ${JSON.stringify(body)}`);
    }
  }, [goalClassID, getCurrentToken, refreshTokenOnlyWhenNeeded]);

  const sendWs = useCallback((payload: any) => {
    const ws = wsRef.current;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }

    return false;
  }, []);

  const stopTimer = useCallback(() => {
    if (studyTimerRef.current) {
      clearInterval(studyTimerRef.current);
      studyTimerRef.current = null;
    }
  }, []);

  const startTimerFrom = useCallback(
    (startTime: number) => {
      stopTimer();

      const update = () => {
        const sec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setStudySeconds(sec);
      };

      update();
      studyTimerRef.current = setInterval(update, 1000);
    },
    [stopTimer]
  );

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

  const connectSocket = useCallback(
    async (forceToken?: string) => {
      const currentToken = forceToken || getCurrentToken();

      if (!currentToken || !goalClassID) {
        setStatus("offline");
        setLoading(false);
        return;
      }

      const current = wsRef.current;

      if (current?.readyState === WebSocket.OPEN) {
        setStatus("connected");
        setLoading(false);
        return;
      }

      if (current?.readyState === WebSocket.CONNECTING || socketOpening.current) {
        setLoading(false);
        return;
      }

      socketOpening.current = true;
      manualClose.current = false;

      setStatus(reconnectAttempt.current > 0 ? "reconnecting" : "connecting");

      const freshWsUrl = `${CHAT_WS}/ws/${encodeURIComponent(
        goalClassID
      )}?token=${encodeURIComponent(currentToken)}`;

      const ws = new WebSocket(freshWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted.current || wsRef.current !== ws) return;

        socketOpening.current = false;
        reconnectAttempt.current = 0;
        setStatus("connected");
        setLoading(false);

        if (isStudyingRef.current) {
          sendWs({
            event: "study_start",
            dp: userDp,
          });
        }
      };

      ws.onmessage = (event) => {
        if (!mounted.current || wsRef.current !== ws) return;

        try {
          const data = JSON.parse(event.data);
          const eventName = data?.event;

          if (eventName === "study_count_update") {
            const users = Array.isArray(data?.study?.users) ? data.study.users : [];

            setStudyCount(Number(data?.study?.count || 0));
            setStudyUsers(users);

            const me = users.find(
              (u: StudyUser) => String(u.user_id) === myUserID
            );

            if (me?.started_at && isStudyingRef.current) {
              const serverStart = Number(me.started_at) * 1000;
              startTimerFrom(serverStart);
            }
          }
        } catch {}
      };

      ws.onerror = () => {
        if (!mounted.current) return;
        socketOpening.current = false;
        setLoading(false);
      };

      ws.onclose = async (e: any) => {
        if (!mounted.current || wsRef.current !== ws) return;

        wsRef.current = null;
        socketOpening.current = false;
        setLoading(false);

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
      myUserID,
      refreshTokenOnlyWhenNeeded,
      sendWs,
      startTimerFrom,
      userDp,
    ]
  );

  const restoreLocalStudy = useCallback(async () => {
    const active = await AsyncStorage.getItem(STUDY_ACTIVE_KEY);
    const savedStartedAt = await AsyncStorage.getItem(STUDY_STARTED_AT_KEY);

    if (active === "true" && savedStartedAt) {
      const startTime = Number(savedStartedAt);

      if (startTime > 0) {
        isStudyingRef.current = true;
        setIsStudying(true);
        startTimerFrom(startTime);
        await startStudyNotification(myName, startTime);
      }
    }
  }, [myName, startTimerFrom]);

  const openStudyRoom = useCallback(async () => {
    if (!token || !goalClassID) {
      setLoading(false);
      setStatus("offline");
      return;
    }

    try {
      setLoading(true);
      setStatus("connecting");

      await restoreLocalStudy();
      await joinChat();

      if (!mounted.current) return;

      await connectSocket();
    } catch (error) {
      console.log("OPEN_STUDY_ROOM_ERROR:", error);
      setStatus("offline");
      setLoading(false);
    }
  }, [token, goalClassID, restoreLocalStudy, joinChat, connectSocket]);

  const startStudy = useCallback(async () => {
    if (status !== "connected") return;

    const startTime = Date.now();

    const ok = sendWs({
      event: "study_start",
      dp: userDp,
    });

    if (!ok) return;

    isStudyingRef.current = true;
    setIsStudying(true);

    await AsyncStorage.setItem(STUDY_ACTIVE_KEY, "true");
    await AsyncStorage.setItem(STUDY_STARTED_AT_KEY, String(startTime));

    startTimerFrom(startTime);
    await startStudyNotification(myName, startTime);
  }, [status, sendWs, userDp, myName, startTimerFrom]);

  const stopStudy = useCallback(async () => {
    sendWs({ event: "study_stop" });

    isStudyingRef.current = false;
    setIsStudying(false);
    setStudySeconds(0);

    await AsyncStorage.removeItem(STUDY_ACTIVE_KEY);
    await AsyncStorage.removeItem(STUDY_STARTED_AT_KEY);

    stopTimer();
    await stopStudyNotification();
  }, [sendWs, stopTimer]);

  useEffect(() => {
    mounted.current = true;
    openStudyRoom();

    const sub = AppState.addEventListener("change", (state) => {
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
      stopTimer();
      closeSocket(true);
    };
  }, [openStudyRoom, connectSocket, closeSocket, stopTimer]);

  const statusMeta = {
    connected: { text: "Connected", color: GREEN },
    connecting: { text: "Connecting...", color: ORANGE },
    reconnecting: { text: "Reconnecting...", color: ORANGE },
    offline: { text: "Offline", color: RED },
  }[status];

  const renderStudent = ({ item }: { item: StudyUser }) => {
    const isMe = String(item.user_id) === myUserID;

    return (
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {String(item.user_name || "S").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.user_name || "Student"} {isMe ? "(You)" : ""}
          </Text>
          <Text style={styles.userTime}>
            Focused for {formatDuration(item.started_at)}
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      </View>
    );
  };

  if (!token || !goalClassID) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color={RED} />
        <Text style={styles.emptyTitle}>Study Room unavailable</Text>
        <Text style={styles.emptyText}>Token ya goalClassID missing hai.</Text>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerIcon}>
          <Ionicons name="school-outline" size={24} color={BLUE} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>Focus Study Room</Text>

          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: statusMeta.color }]} />
            <Text style={styles.subtitle}>{statusMeta.text}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.refresh} onPress={() => connectSocket()}>
          <Ionicons name="refresh" size={20} color={BLUE} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loading}>Opening study room...</Text>
        </View>
      ) : (
        <Animated.View
          style={[
            styles.body,
            {
              opacity: fade,
              transform: [{ translateY: slide }],
            },
          ]}
        >
          <Animated.View style={[styles.heroCard, { transform: [{ scale: pulse }] }]}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>FOCUS SESSION</Text>
                <Text style={styles.heroName}>{myName}</Text>
              </View>

              <View style={[styles.livePill, isStudying ? styles.liveOn : styles.liveOff]}>
                <View
                  style={[
                    styles.liveDot,
                    isStudying ? styles.liveDotOn : styles.liveDotOff,
                  ]}
                />
                <Text
                  style={[
                    styles.livePillText,
                    isStudying ? styles.liveTextOn : styles.liveTextOff,
                  ]}
                >
                  {isStudying ? "LIVE" : "READY"}
                </Text>
              </View>
            </View>

            <Text style={styles.timer}>{formatStudyTime(studySeconds)}</Text>

            <Text style={styles.studyStatus}>
              {isStudying
                ? "Background focus mode is active"
                : "Start your focused study session"}
            </Text>

            <TouchableOpacity
              style={[
                styles.mainButton,
                isStudying ? styles.stopButton : styles.startButton,
                status !== "connected" && !isStudying && styles.disabledButton,
              ]}
              onPress={isStudying ? stopStudy : startStudy}
              disabled={status !== "connected" && !isStudying}
            >
              <Ionicons
                name={isStudying ? "stop-circle" : "play-circle"}
                size={23}
                color="#FFFFFF"
              />

              <Text style={styles.mainButtonText}>
                {isStudying ? "Stop Study" : "Start Study"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconGreen}>
                <Ionicons name="people-outline" size={22} color={GREEN} />
              </View>
              <Text style={styles.statNumber}>{studyCount}</Text>
              <Text style={styles.statLabel}>Studying now</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconBlue}>
                <Ionicons name="time-outline" size={22} color={BLUE} />
              </View>
              <Text style={styles.statNumberSmall}>
                {formatStudyTime(studySeconds)}
              </Text>
              <Text style={styles.statLabel}>Your time</Text>
            </View>
          </View>

          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionTitle}>Active Students</Text>
              <Text style={styles.sectionSub}>Students currently focused</Text>
            </View>

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setShowAllStudents(true)}
              disabled={studyUsers.length === 0}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={15} color={BLUE} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={previewUsers}
            keyExtractor={(item) => String(item.user_id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="moon-outline" size={52} color={MUTED} />
                <Text style={styles.emptyTitle}>No one studying yet</Text>
                <Text style={styles.emptyText}>Start karo aur first student bano.</Text>
              </View>
            }
            renderItem={renderStudent}
          />
        </Animated.View>
      )}

      <Modal
        visible={showAllStudents}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllStudents(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>All Active Students</Text>
                <Text style={styles.modalSub}>{studyUsers.length} students studying now</Text>
              </View>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowAllStudents(false)}
              >
                <Ionicons name="close" size={22} color={TEXT} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={studyUsers}
              keyExtractor={(item) => String(item.user_id)}
              renderItem={renderStudent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 16,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: SOFT_BLUE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", color: TEXT },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  subtitle: { fontSize: 12, fontWeight: "800", color: MUTED },
  refresh: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: SOFT_BLUE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  body: { flex: 1, backgroundColor: PAGE, padding: 16 },
  heroCard: {
    backgroundColor: BG,
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0EAFF",
    shadowColor: "#2563EB",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: BLUE,
    letterSpacing: 1,
  },
  heroName: { marginTop: 5, fontSize: 19, fontWeight: "900", color: TEXT },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  liveOn: { backgroundColor: SOFT_GREEN, borderColor: "#BBF7D0" },
  liveOff: { backgroundColor: "#F8FAFC", borderColor: BORDER },
  liveDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  liveDotOn: { backgroundColor: GREEN },
  liveDotOff: { backgroundColor: MUTED },
  livePillText: { fontSize: 11, fontWeight: "900" },
  liveTextOn: { color: GREEN },
  liveTextOff: { color: MUTED },
  timer: {
    marginTop: 22,
    fontSize: 52,
    fontWeight: "900",
    color: TEXT,
    letterSpacing: 1,
    textAlign: "center",
  },
  studyStatus: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "800",
    color: MUTED,
    textAlign: "center",
  },
  mainButton: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingVertical: 15,
    borderRadius: 20,
  },
  startButton: { backgroundColor: GREEN },
  stopButton: { backgroundColor: RED },
  disabledButton: { backgroundColor: "#9CA3AF" },
  mainButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  statIconGreen: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: SOFT_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statIconBlue: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: SOFT_BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statNumber: { fontSize: 24, fontWeight: "900", color: TEXT },
  statNumberSmall: { fontSize: 17, fontWeight: "900", color: TEXT },
  statLabel: { marginTop: 3, fontSize: 12, fontWeight: "800", color: MUTED },
  listHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: TEXT },
  sectionSub: { marginTop: 3, fontSize: 12, fontWeight: "700", color: MUTED },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: SOFT_BLUE,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  viewAllText: { fontSize: 12, fontWeight: "900", color: BLUE, marginRight: 3 },
  list: { paddingBottom: Platform.OS === "ios" ? 30 : 16 },
  userCard: {
    backgroundColor: BG,
    borderRadius: 20,
    padding: 13,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 17,
    backgroundColor: SOFT_BLUE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    marginRight: 12,
  },
  avatarText: { color: BLUE, fontWeight: "900", fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "900", color: TEXT },
  userTime: { marginTop: 3, fontSize: 12, fontWeight: "700", color: MUTED },
  liveBadge: {
    backgroundColor: SOFT_GREEN,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  liveBadgeText: { color: GREEN, fontSize: 10, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "82%",
    backgroundColor: BG,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "900", color: TEXT },
  modalSub: { marginTop: 4, fontSize: 12, fontWeight: "700", color: MUTED },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalList: { paddingBottom: 10 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: BG,
  },
  loading: { marginTop: 12, fontSize: 15, fontWeight: "900", color: BLUE },
  emptyBox: { alignItems: "center", justifyContent: "center", padding: 35 },
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
});