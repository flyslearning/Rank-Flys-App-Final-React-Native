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
  ScrollView,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { useAuthStore } from "../../store/auth.store";
import {
  saveStudySession,
  getTodayStudySeconds,
} from "../../db/studySessionDb";
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
const SOFT_ORANGE = "#FFF7ED";

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
  return (
    text.includes("401") ||
    text.includes("Unauthorized") ||
    text.includes("unauthorized")
  );
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

function getUsersFromSocketPayload(data: any): StudyUser[] {
  if (Array.isArray(data?.study?.users)) return data.study.users;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.active_students)) return data.active_students;
  if (Array.isArray(data?.students)) return data.students;
  return [];
}

function AnimatedStudentCard({
  item,
  myUserID,
}: {
  item: StudyUser;
  myUserID: string;
}) {
  const scale = useRef(new Animated.Value(0.94)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const ring = useRef(new Animated.Value(0)).current;

  const isMe = String(item.user_id) === myUserID;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ring, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [opacity, ring, scale, translateY]);

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.9],
  });

  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  return (
    <Animated.View
      style={[
        styles.userCard,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={styles.avatarWrap}>
        <Animated.View
          style={[
            styles.avatarRing,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {String(item.user_name || "S").charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.user_name || "Student"} {isMe ? "(You)" : ""}
        </Text>

        <Text style={styles.userTime}>
          Focused for {formatDuration(item.started_at)}
        </Text>
      </View>

      <View style={styles.liveBadge}>
        <View style={styles.liveBadgeDot} />
        <Text style={styles.liveBadgeText}>LIVE</Text>
      </View>
    </Animated.View>
  );
}

export default function StudyRoomScreen() {
  const insets = useSafeAreaInsets();
  const navigation: any = useNavigation();

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
  const [isPaused, setIsPaused] = useState(false);
  const [studySeconds, setStudySeconds] = useState(0);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [studyCount, setStudyCount] = useState(0);
  const [studyUsers, setStudyUsers] = useState<StudyUser[]>([]);
  const [showAllStudents, setShowAllStudents] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mounted = useRef(true);
  const manualClose = useRef(false);
  const reconnectTimer = useRef<any>(null);
  const refreshStudentsTimer = useRef<any>(null);
  const reconnectAttempt = useRef(0);
  const socketOpening = useRef(false);

  const studyTimerRef = useRef<any>(null);
  const isStudyingRef = useRef(false);
  const isPausedRef = useRef(false);

  const sessionStartedAtRef = useRef<number | null>(null);
  const activeDurationRef = useRef(0);
  const lastResumeAtRef = useRef<number | null>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  const modalScale = useRef(new Animated.Value(0.96)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const closeSpin = useRef(new Animated.Value(0)).current;

  const previewUsers = useMemo(() => studyUsers.slice(0, 4), [studyUsers]);

  const getCurrentToken = useCallback(() => {
    const state: any = useAuthStore.getState();
    return state.accessToken || state.access_token || state.token || "";
  }, []);

  const refreshTokenOnlyWhenNeeded = useCallback(async () => {
    const state: any = useAuthStore.getState();

    if (typeof state.refreshAccessToken === "function") {
      const fresh = await state.refreshAccessToken();
      if (fresh) return fresh;
    }

    return null;
  }, []);

  const getCurrentActiveSeconds = useCallback(() => {
    if (!isStudyingRef.current) return 0;

    let total = activeDurationRef.current;

    if (!isPausedRef.current && lastResumeAtRef.current) {
      total += Math.floor((Date.now() - lastResumeAtRef.current) / 1000);
    }

    return Math.max(0, total);
  }, []);

  const stopTimer = useCallback(() => {
    if (studyTimerRef.current) {
      clearInterval(studyTimerRef.current);
      studyTimerRef.current = null;
    }
  }, []);

  const startActiveTimer = useCallback(() => {
    stopTimer();

    const update = () => {
      setStudySeconds(getCurrentActiveSeconds());
    };

    update();
    studyTimerRef.current = setInterval(update, 1000);
  }, [getCurrentActiveSeconds, stopTimer]);

  const sendWs = useCallback((payload: any) => {
    const ws = wsRef.current;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }

    return false;
  }, []);

  const requestActiveStudents = useCallback(() => {
    sendWs({ event: "study_count" });
    sendWs({ event: "get_study_count" });
    sendWs({ event: "active_students" });
    sendWs({ event: "get_active_students" });
  }, [sendWs]);

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
    if (!isStudying || isPaused) {
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
  }, [isStudying, isPaused, pulse]);

  useEffect(() => {
    if (showAllStudents) {
      closeSpin.setValue(0);
      modalScale.setValue(0.96);
      modalOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(closeSpin, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showAllStudents, modalScale, modalOpacity, closeSpin]);

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

  const closeSocket = useCallback(
    (manual = true, nextStatus: Status = "offline") => {
      manualClose.current = manual;

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }

      if (refreshStudentsTimer.current) {
        clearInterval(refreshStudentsTimer.current);
        refreshStudentsTimer.current = null;
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
        requestActiveStudents();
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

        requestActiveStudents();

        setTimeout(() => {
          if (mounted.current) requestActiveStudents();
        }, 500);

        if (refreshStudentsTimer.current) {
          clearInterval(refreshStudentsTimer.current);
        }

        refreshStudentsTimer.current = setInterval(() => {
          if (mounted.current && wsRef.current?.readyState === WebSocket.OPEN) {
            requestActiveStudents();
          }
        }, 15000);

        if (isStudyingRef.current && !isPausedRef.current) {
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

          const allowedEvents = [
            "study_count_update",
            "study_count",
            "active_students",
            "get_active_students",
            "students_update",
          ];

          const users = getUsersFromSocketPayload(data);

          if (allowedEvents.includes(eventName) || users.length > 0) {
            setStudyCount(Number(data?.study?.count || data?.count || users.length || 0));
            setStudyUsers(users);
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

        if (refreshStudentsTimer.current) {
          clearInterval(refreshStudentsTimer.current);
          refreshStudentsTimer.current = null;
        }

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
      refreshTokenOnlyWhenNeeded,
      requestActiveStudents,
      sendWs,
      userDp,
    ]
  );

  const restoreLocalStudy = useCallback(async () => {
    const active = await AsyncStorage.getItem(STUDY_ACTIVE_KEY);
    const savedStartedAt = await AsyncStorage.getItem(STUDY_STARTED_AT_KEY);

    if (active === "true" && savedStartedAt) {
      const startTime = Number(savedStartedAt);

      if (startTime > 0) {
        const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));

        sessionStartedAtRef.current = startTime;
        activeDurationRef.current = elapsed;
        lastResumeAtRef.current = Date.now();

        isStudyingRef.current = true;
        isPausedRef.current = false;

        setIsStudying(true);
        setIsPaused(false);
        setStudySeconds(elapsed);

        startActiveTimer();
        await startStudyNotification(myName, startTime);
      }
    }
  }, [myName, startActiveTimer]);

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

      const freshToken = await refreshTokenOnlyWhenNeeded();
      await connectSocket(freshToken || undefined);
    } catch (error) {
      console.log("OPEN_STUDY_ROOM_ERROR:", error);
      setStatus("offline");
      setLoading(false);
    }
  }, [
    token,
    goalClassID,
    restoreLocalStudy,
    joinChat,
    connectSocket,
    refreshTokenOnlyWhenNeeded,
  ]);

  const startStudy = useCallback(async () => {
    if (status !== "connected") return;

    const now = Date.now();

    const ok = sendWs({
      event: "study_start",
      dp: userDp,
    });

    if (!ok) return;

    sessionStartedAtRef.current = now;
    activeDurationRef.current = 0;
    lastResumeAtRef.current = now;

    isStudyingRef.current = true;
    isPausedRef.current = false;

    setIsStudying(true);
    setIsPaused(false);
    setStudySeconds(0);

    await AsyncStorage.setItem(STUDY_ACTIVE_KEY, "true");
    await AsyncStorage.setItem(STUDY_STARTED_AT_KEY, String(now));

    startActiveTimer();
    requestActiveStudents();
    await startStudyNotification(myName, now);
  }, [status, sendWs, userDp, myName, startActiveTimer, requestActiveStudents]);

  const pauseStudy = useCallback(() => {
    if (!isStudyingRef.current || isPausedRef.current) return;

    if (lastResumeAtRef.current) {
      activeDurationRef.current += Math.floor(
        (Date.now() - lastResumeAtRef.current) / 1000
      );
    }

    lastResumeAtRef.current = null;
    isPausedRef.current = true;

    setIsPaused(true);
    setStudySeconds(activeDurationRef.current);

    stopTimer();
    sendWs({ event: "study_pause" });
    requestActiveStudents();
  }, [sendWs, stopTimer, requestActiveStudents]);

  const resumeStudy = useCallback(() => {
    if (!isStudyingRef.current || !isPausedRef.current) return;

    lastResumeAtRef.current = Date.now();
    isPausedRef.current = false;

    setIsPaused(false);
    startActiveTimer();

    sendWs({
      event: "study_start",
      dp: userDp,
    });

    requestActiveStudents();
  }, [sendWs, userDp, startActiveTimer, requestActiveStudents]);

  const stopStudy = useCallback(async () => {
    sendWs({ event: "study_stop" });

    const now = Date.now();
    const finalSeconds = getCurrentActiveSeconds();

    if (sessionStartedAtRef.current && finalSeconds > 0) {
      const date = new Date(sessionStartedAtRef.current).toISOString().slice(0, 10);

      await saveStudySession({
        date,
        start_time: sessionStartedAtRef.current,
        end_time: now,
        duration_seconds: finalSeconds,
      });

      setTodaySeconds(getTodayStudySeconds());
    }

    sessionStartedAtRef.current = null;
    lastResumeAtRef.current = null;
    activeDurationRef.current = 0;

    isStudyingRef.current = false;
    isPausedRef.current = false;

    setIsStudying(false);
    setIsPaused(false);
    setStudySeconds(0);

    await AsyncStorage.removeItem(STUDY_ACTIVE_KEY);
    await AsyncStorage.removeItem(STUDY_STARTED_AT_KEY);

    stopTimer();
    requestActiveStudents();
    await stopStudyNotification();
  }, [sendWs, stopTimer, getCurrentActiveSeconds, requestActiveStudents]);

  useEffect(() => {
    mounted.current = true;

    openStudyRoom();
    setTodaySeconds(getTodayStudySeconds());

    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        manualClose.current = false;

        setTodaySeconds(getTodayStudySeconds());

        if (isStudyingRef.current && !isPausedRef.current) {
          startActiveTimer();
        }

        setTimeout(async () => {
          if (!mounted.current) return;

          const freshToken = await refreshTokenOnlyWhenNeeded();
          await connectSocket(freshToken || undefined);

          setTimeout(() => {
            if (mounted.current) requestActiveStudents();
          }, 700);
        }, 500);
      } else {
        closeSocket(true);

        if (isStudyingRef.current && !isPausedRef.current) {
          stopTimer();
        }
      }
    });

    return () => {
      mounted.current = false;
      sub.remove();
      stopTimer();
      closeSocket(true);
    };
  }, []);

  const closeModalAnimated = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.96,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => setShowAllStudents(false));
  }, [modalOpacity, modalScale]);

  const spin = closeSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["-180deg", "0deg"],
  });

  const statusMeta = {
    connected: { text: "Connected", color: GREEN },
    connecting: { text: "Connecting...", color: ORANGE },
    reconnecting: { text: "Reconnecting...", color: ORANGE },
    offline: { text: "Offline", color: RED },
  }[status];

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

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("StudyStats")}
            activeOpacity={0.85}
          >
            <Ionicons name="stats-chart" size={20} color={BLUE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={async () => {
              closeSocket(false, "reconnecting");

              const freshToken = await refreshTokenOnlyWhenNeeded();
              await connectSocket(freshToken || undefined);

              setTimeout(() => {
                if (mounted.current) requestActiveStudents();
              }, 700);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={20} color={BLUE} />
          </TouchableOpacity>
        </View>
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.heroCard, { transform: [{ scale: pulse }] }]}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroLabel}>FOCUS SESSION</Text>
                  <Text style={styles.heroName} numberOfLines={1}>
                    {myName}
                  </Text>
                </View>

                <View
                  style={[
                    styles.livePill,
                    isStudying && !isPaused ? styles.liveOn : styles.liveOff,
                  ]}
                >
                  <View
                    style={[
                      styles.liveDot,
                      isStudying && !isPaused
                        ? styles.liveDotOn
                        : styles.liveDotOff,
                    ]}
                  />
                  <Text
                    style={[
                      styles.livePillText,
                      isStudying && !isPaused
                        ? styles.liveTextOn
                        : styles.liveTextOff,
                    ]}
                  >
                    {isStudying ? (isPaused ? "PAUSED" : "LIVE") : "READY"}
                  </Text>
                </View>
              </View>

              <Text style={styles.timer}>{formatStudyTime(studySeconds)}</Text>

              <Text style={styles.studyStatus}>
                {isStudying
                  ? isPaused
                    ? "Timer paused. Resume when ready."
                    : "Deep focus mode is active"
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
                activeOpacity={0.9}
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

              {isStudying && (
                <TouchableOpacity
                  style={[
                    styles.mainButton,
                    styles.secondaryMainButton,
                    { backgroundColor: isPaused ? GREEN : ORANGE },
                  ]}
                  onPress={isPaused ? resumeStudy : pauseStudy}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name={isPaused ? "play-circle" : "pause-circle"}
                    size={23}
                    color="#FFFFFF"
                  />

                  <Text style={styles.mainButtonText}>
                    {isPaused ? "Resume Study" : "Pause Study"}
                  </Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            <View style={styles.statsGrid}>
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
                <Text style={styles.statLabel}>Current session</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.todayCard}
              onPress={() => navigation.navigate("StudyStats")}
              activeOpacity={0.9}
            >
              <View style={styles.todayLeft}>
                <View style={styles.statIconOrange}>
                  <Ionicons name="stats-chart-outline" size={23} color={ORANGE} />
                </View>

                <View>
                  <Text style={styles.todayLabel}>Today total</Text>
                  <Text style={styles.todayTime}>{formatStudyTime(todaySeconds)}</Text>
                </View>
              </View>

              <View style={styles.todayRight}>
                <Text style={styles.todayView}>View stats</Text>
                <Ionicons name="chevron-forward" size={18} color={BLUE} />
              </View>
            </TouchableOpacity>

            <View style={styles.listHeader}>
              <View>
                <Text style={styles.sectionTitle}>Active Students</Text>
                <Text style={styles.sectionSub}>
                  {status === "connected"
                    ? "Live students currently focused"
                    : "Waiting for live connection"}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.viewAllButton,
                  studyUsers.length === 0 && styles.viewAllDisabled,
                ]}
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
              scrollEnabled={false}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="people-circle-outline" size={58} color={MUTED} />
                  <Text style={styles.emptyTitle}>No active students yet</Text>
                  <Text style={styles.emptyText}>
                    Connected hote hi active students yaha show honge.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <AnimatedStudentCard item={item} myUserID={myUserID} />
              )}
            />
          </ScrollView>
        </Animated.View>
      )}

      <Modal
        visible={showAllStudents}
        animationType="none"
        transparent
        onRequestClose={closeModalAnimated}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                paddingBottom: Math.max(insets.bottom, 16),
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>All Active Students</Text>
                <Text style={styles.modalSub}>
                  {studyUsers.length} students studying now
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalClose}
                onPress={closeModalAnimated}
                activeOpacity={0.85}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="close" size={22} color={TEXT} />
                </Animated.View>
              </TouchableOpacity>
            </View>

            <FlatList
              data={studyUsers}
              keyExtractor={(item) => String(item.user_id)}
              renderItem={({ item }) => (
                <AnimatedStudentCard item={item} myUserID={myUserID} />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalList}
            />
          </Animated.View>
        </Animated.View>
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
  title: { fontSize: 21, fontWeight: "900", color: TEXT },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  subtitle: { fontSize: 12, fontWeight: "800", color: MUTED },
  headerActions: { flexDirection: "row", gap: 9 },
  headerButton: {
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
    borderRadius: 32,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0EAFF",
    shadowColor: "#2563EB",
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: BLUE,
    letterSpacing: 1.2,
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
  secondaryMainButton: { marginTop: 12 },
  startButton: { backgroundColor: GREEN },
  stopButton: { backgroundColor: RED },
  disabledButton: { backgroundColor: "#9CA3AF" },
  mainButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },

  statsGrid: { flexDirection: "row", gap: 12, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 23,
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
  statIconOrange: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: SOFT_ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: { fontSize: 24, fontWeight: "900", color: TEXT },
  statNumberSmall: { fontSize: 17, fontWeight: "900", color: TEXT },
  statLabel: { marginTop: 3, fontSize: 12, fontWeight: "800", color: MUTED },

  todayCard: {
    marginTop: 14,
    backgroundColor: BG,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  todayLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  todayLabel: { fontSize: 12, fontWeight: "800", color: MUTED },
  todayTime: { marginTop: 3, fontSize: 20, fontWeight: "900", color: TEXT },
  todayRight: { flexDirection: "row", alignItems: "center", gap: 3 },
  todayView: { fontSize: 12, fontWeight: "900", color: BLUE },

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
  viewAllDisabled: { opacity: 0.5 },
  viewAllText: { fontSize: 12, fontWeight: "900", color: BLUE, marginRight: 3 },
  list: { paddingBottom: Platform.OS === "ios" ? 30 : 16 },

  userCard: {
    backgroundColor: BG,
    borderRadius: 22,
    padding: 13,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: GREEN,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  liveBadgeText: { color: GREEN, fontSize: 10, fontWeight: "900" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "82%",
    backgroundColor: BG,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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