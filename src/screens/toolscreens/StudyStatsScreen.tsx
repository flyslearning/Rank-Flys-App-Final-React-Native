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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  getAllStudySessions,
  getTodayStudySeconds,
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

function formatDuration(sec: number) {
  const safe = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatClock(sec: number) {
  const safe = Math.max(0, Math.floor(sec || 0));
  const h = String(Math.floor(safe / 3600)).padStart(2, "0");
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function getDayName(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Study Day";

  return d.toLocaleDateString([], {
    weekday: "long",
  });
}

function AnimatedStatCard({
  icon,
  label,
  value,
  color,
  bg,
  delay = 0,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  bg: string;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function SessionCard({
  item,
  index,
}: {
  item: StudySession;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(22)).current;
  const scale = useRef(new Animated.Value(0.97)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const pauseSeconds = Number((item as any)?.total_pause_seconds || 0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 70),
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
          duration: 1300,
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
    outputRange: [1, 1.7],
  });

  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.dateIconWrap}>
          <Animated.View
            style={[
              styles.datePulse,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />

          <View style={styles.dateIcon}>
            <Ionicons name="calendar-outline" size={22} color={BLUE} />
          </View>
        </View>

        <View style={styles.cardTitleWrap}>
          <Text style={styles.day}>{getDayName(item.date)}</Text>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
        </View>

        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>DONE</Text>
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

      <View style={styles.cardBottom}>
        <View style={styles.durationPill}>
          <Ionicons name="timer-outline" size={17} color={GREEN} />
          <Text style={styles.durationText}>
            Study: {formatDuration(item.duration_seconds)}
          </Text>
        </View>

        {pauseSeconds > 0 && (
          <View style={styles.pausePill}>
            <Ionicons name="pause-circle-outline" size={17} color={ORANGE} />
            <Text style={styles.pauseText}>
              Pause: {formatDuration(pauseSeconds)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function StudyStatsScreen() {
  const insets = useSafeAreaInsets();
  const navigation: any = useNavigation();

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [todaySeconds, setTodaySeconds] = useState(0);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStats();

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

    const spinLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 4500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinLoop.start();
    return () => spinLoop.stop();
  }, []);

  const loadStats = () => {
    setSessions(getAllStudySessions());
    setTodaySeconds(getTodayStudySeconds());
  };

  const totalSeconds = useMemo(() => {
    return sessions.reduce(
      (sum, item) => sum + Number(item.duration_seconds || 0),
      0
    );
  }, [sessions]);

  const totalPauseSeconds = useMemo(() => {
    return sessions.reduce(
      (sum, item: any) => sum + Number(item.total_pause_seconds || 0),
      0
    );
  }, [sessions]);

  const bestSession = useMemo(() => {
    if (sessions.length === 0) return 0;
    return Math.max(...sessions.map((s) => Number(s.duration_seconds || 0)));
  }, [sessions]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={23} color={TEXT} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Study Statistics</Text>
          <Text style={styles.subtitle}>Your focus journey</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadStats}
          activeOpacity={0.85}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="refresh" size={20} color={BLUE} />
          </Animated.View>
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
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>TODAY FOCUS</Text>
            <Text style={styles.heroTime}>{formatClock(todaySeconds)}</Text>
            <Text style={styles.heroSub}>
              {sessions.length > 0
                ? `${sessions.length} total sessions completed`
                : "Start your first study session"}
            </Text>
          </View>

          <View style={styles.heroCircle}>
            <Animated.View
              style={[styles.heroOrbit, { transform: [{ rotate: spin }] }]}
            >
              <View style={styles.heroDot} />
            </Animated.View>

            <Ionicons name="flame" size={42} color={ORANGE} />
          </View>
        </Animated.View>

        <View style={styles.statsGrid}>
          <AnimatedStatCard
            icon="library-outline"
            label="Sessions"
            value={String(sessions.length)}
            color={BLUE}
            bg={SOFT_BLUE}
            delay={80}
          />

          <AnimatedStatCard
            icon="time-outline"
            label="Total Study"
            value={formatDuration(totalSeconds)}
            color={GREEN}
            bg={SOFT_GREEN}
            delay={160}
          />
        </View>

        <View style={styles.statsGrid}>
          <AnimatedStatCard
            icon="trophy-outline"
            label="Best Session"
            value={formatDuration(bestSession)}
            color={ORANGE}
            bg={SOFT_ORANGE}
            delay={240}
          />

          <AnimatedStatCard
            icon="pause-circle-outline"
            label="Total Pause"
            value={formatDuration(totalPauseSeconds)}
            color={RED}
            bg={SOFT_RED}
            delay={320}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Session History</Text>
            <Text style={styles.sectionSub}>Latest study sessions</Text>
          </View>
        </View>

        <FlatList
          data={sessions}
          keyExtractor={(item, index) => String(item.id || index)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="book-outline" size={48} color={BLUE} />
              </View>

              <Text style={styles.emptyTitle}>No study session yet</Text>
              <Text style={styles.emptyText}>
                Abhi koi study session save nahi hua. Start Study dabao aur
                session complete karo.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <SessionCard item={item} index={index} />
          )}
        />
      </Animated.View>
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

  backButton: {
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
    fontSize: 23,
    fontWeight: "900",
    color: TEXT,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  refreshButton: {
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
    backgroundColor: BLUE,
    borderRadius: 32,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: BLUE,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
    overflow: "hidden",
  },

  heroLeft: {
    flex: 1,
  },

  heroLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#DBEAFE",
    letterSpacing: 1.2,
  },

  heroTime: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  heroSub: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "800",
    color: "#DBEAFE",
  },

  heroCircle: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },

  heroOrbit: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  heroDot: {
    position: "absolute",
    top: -5,
    left: 36,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  statIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: TEXT,
  },

  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: TEXT,
  },

  sectionSub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: MUTED,
  },

  list: {
    paddingBottom: Platform.OS === "ios" ? 38 : 24,
  },

  card: {
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

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  dateIconWrap: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  datePulse: {
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

  cardTitleWrap: {
    flex: 1,
  },

  day: {
    fontSize: 16,
    fontWeight: "900",
    color: TEXT,
  },

  date: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "800",
    color: MUTED,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SOFT_GREEN,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN,
    marginRight: 5,
  },

  badgeText: {
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

  cardBottom: {
    marginTop: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SOFT_GREEN,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },

  durationText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "900",
    color: GREEN,
  },

  pausePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SOFT_ORANGE,
    borderWidth: 1,
    borderColor: "#FED7AA",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },

  pauseText: {
    marginLeft: 6,
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
});