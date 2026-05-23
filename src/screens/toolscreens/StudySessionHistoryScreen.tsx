import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  StatusBar,
  TouchableOpacity,
  Platform,
  Easing,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import {
  getAllStudySessions,
  type StudySession,
} from "../../db/studySessionDb";

const BLUE = "#2563EB";
const BG = "#FFFFFF";
const PAGE = "#F8FAFC";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E5E7EB";
const GREEN = "#22C55E";
const ORANGE = "#F59E0B";
const RED = "#EF4444";
const SOFT_BLUE = "#EFF6FF";
const SOFT_GREEN = "#F0FDF4";
const SOFT_ORANGE = "#FFF7ED";
const SOFT_RED = "#FEF2F2";

type FilterType = "all" | "today" | "best";

function getLocalDateKey(time = Date.now()) {
  const d = new Date(time);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatClock(sec: number) {
  const safe = Math.max(0, Math.floor(sec || 0));
  const h = String(Math.floor(safe / 3600)).padStart(2, "0");
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function formatDuration(sec: number) {
  const safe = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDayName(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Study Day";

  return d.toLocaleDateString([], {
    weekday: "long",
  });
}

function FilterChip({
  title,
  active,
  onPress,
  icon,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={15} color={active ? "#FFFFFF" : BLUE} />
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function SessionCard({
  item,
  index,
  isBest,
}: {
  item: StudySession;
  index: number;
  isBest: boolean;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const pauseSeconds = Number((item as any)?.total_pause_seconds || 0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 65),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [index, opacity, pulse, scale, translateY]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.75],
  });

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  return (
    <Animated.View
      style={[
        styles.sessionCard,
        isBest && styles.bestCard,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={styles.sessionTop}>
        <View style={styles.iconWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          <View style={[styles.dateIcon, isBest && styles.bestDateIcon]}>
            <Ionicons
              name={isBest ? "trophy-outline" : "calendar-outline"}
              size={22}
              color={isBest ? ORANGE : BLUE}
            />
          </View>
        </View>

        <View style={styles.sessionInfo}>
          <Text style={styles.dayText}>{getDayName(item.date)}</Text>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>

        <View style={[styles.doneBadge, isBest && styles.bestBadge]}>
          <View style={[styles.badgeDot, isBest && { backgroundColor: ORANGE }]} />
          <Text style={[styles.doneText, isBest && { color: ORANGE }]}>
            {isBest ? "BEST" : "DONE"}
          </Text>
        </View>
      </View>

      <View style={styles.timeBox}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Start</Text>
          <Text style={styles.timeValue}>{formatTime(item.start_time)}</Text>
        </View>

        <View style={styles.timeDivider} />

        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>End</Text>
          <Text style={styles.timeValue}>{formatTime(item.end_time)}</Text>
        </View>
      </View>

      <View style={styles.bigDuration}>
        <Ionicons name="timer-outline" size={20} color={GREEN} />
        <Text style={styles.bigDurationText}>
          {formatClock(item.duration_seconds)}
        </Text>
      </View>

      <View style={styles.bottomPills}>
        <View style={styles.studyPill}>
          <Text style={styles.studyPillText}>
            Study: {formatDuration(item.duration_seconds)}
          </Text>
        </View>

        {pauseSeconds > 0 && (
          <View style={styles.pausePill}>
            <Text style={styles.pausePillText}>
              Pause: {formatDuration(pauseSeconds)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function StudySessionHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation: any = useNavigation();

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [infoVisible, setInfoVisible] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const infoScale = useRef(new Animated.Value(0.9)).current;
  const infoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSessions(getAllStudySessions());

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(slide, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();

    const spin = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 4600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spin.start();
    return () => spin.stop();
  }, []);

  useEffect(() => {
    if (infoVisible) {
      infoScale.setValue(0.9);
      infoOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(infoScale, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(infoOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [infoVisible, infoOpacity, infoScale]);

  const todayKey = getLocalDateKey();

  const bestDuration = useMemo(() => {
    if (sessions.length === 0) return 0;
    return Math.max(...sessions.map((s) => Number(s.duration_seconds || 0)));
  }, [sessions]);

  const totalSeconds = useMemo(() => {
    return sessions.reduce(
      (sum, item) => sum + Number(item.duration_seconds || 0),
      0
    );
  }, [sessions]);

  const todaySeconds = useMemo(() => {
    return sessions
      .filter((s) => s.date === todayKey)
      .reduce((sum, item) => sum + Number(item.duration_seconds || 0), 0);
  }, [sessions, todayKey]);

  const filteredSessions = useMemo(() => {
    if (filter === "today") {
      return sessions.filter((s) => s.date === todayKey);
    }

    if (filter === "best") {
      return [...sessions].sort(
        (a, b) => Number(b.duration_seconds || 0) - Number(a.duration_seconds || 0)
      );
    }

    return sessions;
  }, [filter, sessions, todayKey]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const closeInfo = () => {
    Animated.parallel([
      Animated.timing(infoOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(infoScale, {
        toValue: 0.9,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => setInfoVisible(false));
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={23} color={TEXT} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Session History</Text>
          <Text style={styles.subtitle}>Date wise focus records</Text>
        </View>

        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setInfoVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="information-circle-outline" size={23} color={BLUE} />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.body,
          {
            opacity: fade,
            transform: [{ translateY: slide }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.heroCard,
            {
              transform: [{ scale: heroScale }],
            },
          ]}
        >
          <View style={styles.heroText}>
            <Text style={styles.heroLabel}>TOTAL STUDY</Text>
            <Text style={styles.heroTime}>{formatClock(totalSeconds)}</Text>
            <Text style={styles.heroSub}>
              {sessions.length} sessions saved locally
            </Text>
          </View>

          <View style={styles.heroCircle}>
            <Animated.View style={[styles.heroOrbit, { transform: [{ rotate: spin }] }]}>
              <View style={styles.heroDot} />
            </Animated.View>

            <Ionicons name="book" size={39} color={BLUE} />
          </View>
        </Animated.View>

        <View style={styles.filterRow}>
          <FilterChip
            title="All"
            icon="albums-outline"
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />

          <FilterChip
            title="Today"
            icon="today-outline"
            active={filter === "today"}
            onPress={() => setFilter("today")}
          />

          <FilterChip
            title="Best"
            icon="trophy-outline"
            active={filter === "best"}
            onPress={() => setFilter("best")}
          />
        </View>

        <FlatList
          data={filteredSessions}
          keyExtractor={(item, index) => String(item.id || index)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="file-tray-outline" size={46} color={BLUE} />
              </View>

              <Text style={styles.emptyTitle}>No sessions found</Text>
              <Text style={styles.emptyText}>
                Is filter me abhi koi saved study session nahi hai.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <SessionCard
              item={item}
              index={index}
              isBest={Number(item.duration_seconds || 0) === bestDuration && bestDuration > 0}
            />
          )}
        />
      </Animated.View>

      <Modal visible={infoVisible} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.infoModal,
              {
                opacity: infoOpacity,
                transform: [{ scale: infoScale }],
              },
            ]}
          >
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={42} color={BLUE} />
            </View>

            <Text style={styles.infoTitle}>Your Session History</Text>

            <Text style={styles.infoText}>
              Your session history is saved in your phone local storage. If you
              delete or uninstall the app, this session history will also be
              deleted.
            </Text>

            <TouchableOpacity
              style={styles.okButton}
              onPress={closeInfo}
              activeOpacity={0.85}
            >
              <Text style={styles.okText}>Okay</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE,
  },

  header: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: TEXT,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: SOFT_BLUE,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  body: {
    flex: 1,
    padding: 16,
  },

  heroCard: {
    backgroundColor: BG,
    borderRadius: 32,
    padding: 22,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: BLUE,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },

  heroText: {
    flex: 1,
  },

  heroLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: BLUE,
    letterSpacing: 1.2,
  },

  heroTime: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: "900",
    color: TEXT,
  },

  heroSub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "800",
    color: MUTED,
  },

  heroCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: SOFT_BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  heroOrbit: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },

  heroDot: {
    position: "absolute",
    top: -5,
    left: 33,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  summaryGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  summaryValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  filterRow: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: "row",
    gap: 10,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  filterChipActive: {
    backgroundColor: BLUE,
    borderColor: BLUE,
  },

  filterText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "900",
    color: BLUE,
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  list: {
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
  },

  sessionCard: {
    backgroundColor: BG,
    padding: 16,
    borderRadius: 26,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  bestCard: {
    borderColor: "#FDBA74",
    backgroundColor: "#FFFBEB",
  },

  sessionTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconWrap: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  pulseRing: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BLUE,
  },

  dateIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: SOFT_BLUE,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  bestDateIcon: {
    backgroundColor: SOFT_ORANGE,
    borderColor: "#FED7AA",
  },

  sessionInfo: {
    flex: 1,
  },

  dayText: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  dateText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SOFT_GREEN,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  bestBadge: {
    backgroundColor: SOFT_ORANGE,
    borderColor: "#FED7AA",
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
    marginRight: 5,
  },

  doneText: {
    fontSize: 10,
    fontWeight: "900",
    color: GREEN,
  },

  timeBox: {
    marginTop: 15,
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  timeItem: {
    flex: 1,
  },

  timeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: MUTED,
  },

  timeValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "900",
    color: TEXT,
  },

  timeDivider: {
    width: 1,
    height: 34,
    backgroundColor: BORDER,
    marginHorizontal: 12,
  },

  bigDuration: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SOFT_GREEN,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 18,
  },

  bigDurationText: {
    marginLeft: 8,
    fontSize: 21,
    fontWeight: "900",
    color: GREEN,
  },

  bottomPills: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  studyPill: {
    backgroundColor: SOFT_BLUE,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },

  studyPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: BLUE,
  },

  pausePill: {
    backgroundColor: SOFT_ORANGE,
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },

  pausePillText: {
    fontSize: 12,
    fontWeight: "900",
    color: ORANGE,
  },

  emptyBox: {
    marginTop: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
    borderRadius: 28,
    padding: 32,
    borderWidth: 1,
    borderColor: BORDER,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: SOFT_BLUE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: "700",
    color: MUTED,
    textAlign: "center",
    lineHeight: 21,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  infoModal: {
    width: "100%",
    backgroundColor: BG,
    borderRadius: 30,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  infoIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: SOFT_BLUE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  infoTitle: {
    marginTop: 16,
    fontSize: 21,
    fontWeight: "900",
    color: TEXT,
    textAlign: "center",
  },

  infoText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
  },

  okButton: {
    marginTop: 20,
    width: "100%",
    backgroundColor: BLUE,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },

  okText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});