import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSyllabusStore } from "../../store/syllabus.store";

const ACCENT = "#7C3AED";
const ACCENT_DARK = "#5B21B6";
const ACCENT_SOFT = "#F5F3FF";
const BG = "#FAF7FF";

function PulseCircle({ syncing }: { syncing: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!syncing) {
      scale.setValue(1);
      opacity.setValue(0.55);
      rotate.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.45,
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
            toValue: 0.08,
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

    const rotateLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 950,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
    };
  }, [syncing, opacity, rotate, scale]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.pulseWrap}>
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      />

      <View style={styles.refreshInner}>
        {syncing ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="refresh" size={21} color={ACCENT} />
          </Animated.View>
        ) : (
          <Ionicons name="refresh" size={21} color={ACCENT} />
        )}
      </View>
    </View>
  );
}

const TopicRow = memo(function TopicRow({
  topic,
  onToggle,
}: {
  topic: any;
  onToggle: (topic: any) => void;
}) {
  const done = topic.status === "completed";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.topicRow,
        done && styles.topicDone,
        pressed && styles.pressed,
      ]}
      onPress={() => onToggle(topic)}
    >
      <View style={styles.topicLeft}>
        <Ionicons
          name={done ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={done ? "#16A34A" : "#94A3B8"}
        />

        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={[styles.topicTitle, done && styles.topicTitleDone]}
          >
            {topic.name}
          </Text>

          <Text style={styles.topicMeta}>
            {done ? "Completed · tap to undo" : "Pending · tap to complete"}
          </Text>
        </View>
      </View>

      <View style={[styles.statusPill, done && styles.statusPillDone]}>
        <Text style={[styles.statusText, done && styles.statusTextDone]}>
          {done ? "Done" : "Pending"}
        </Text>
      </View>
    </Pressable>
  );
});

const ChapterCard = memo(function ChapterCard({
  chapter,
  topics,
  isOpen,
  onToggleChapter,
  onToggleTopic,
}: {
  chapter: any;
  topics: any[];
  isOpen: boolean;
  onToggleChapter: (chapterID: string) => void;
  onToggleTopic: (topic: any) => void;
}) {
  const chapterCompleted = useMemo(
    () => topics.filter((t) => t.status === "completed").length,
    [topics]
  );

  const chapterPercent =
    topics.length === 0 ? 0 : Math.round((chapterCompleted / topics.length) * 100);

  return (
    <View style={styles.chapterCard}>
      <Pressable
        style={({ pressed }) => [
          styles.chapterHeader,
          pressed && styles.pressed,
        ]}
        onPress={() => onToggleChapter(chapter.id)}
      >
        <View style={styles.chapterIcon}>
          <Ionicons name="layers-outline" size={18} color={ACCENT} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.chapterTitleRow}>
            <Text numberOfLines={2} style={styles.chapterTitle}>
              {chapter.name}
            </Text>

            <Text style={styles.chapterPercent}>{chapterPercent}%</Text>
          </View>

          <View style={styles.miniBar}>
            <View style={[styles.miniFill, { width: `${chapterPercent}%` }]} />
          </View>

          <Text style={styles.chapterMeta}>
            {chapterCompleted}/{topics.length} topics completed
          </Text>
        </View>

        <Ionicons
          name={isOpen ? "remove-circle" : "add-circle"}
          size={25}
          color={ACCENT}
        />
      </Pressable>

      {isOpen && (
        <View style={styles.topicWrapper}>
          {topics.length === 0 ? (
            <Text style={styles.emptySmall}>No topics found</Text>
          ) : (
            topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} onToggle={onToggleTopic} />
            ))
          )}
        </View>
      )}
    </View>
  );
});

const SubjectCard = memo(function SubjectCard({
  subject,
  index,
  chapters,
  topicsByChapter,
  isOpen,
  openChapterID,
  onToggleSubject,
  onToggleChapter,
  onToggleTopic,
}: {
  subject: any;
  index: number;
  chapters: any[];
  topicsByChapter: Record<string, any[]>;
  isOpen: boolean;
  openChapterID: string | null;
  onToggleSubject: (subjectID: string) => void;
  onToggleChapter: (chapterID: string) => void;
  onToggleTopic: (topic: any) => void;
}) {
  const subjectStats = useMemo(() => {
    let total = 0;
    let done = 0;

    chapters.forEach((chapter) => {
      const topics = topicsByChapter[chapter.id] ?? [];
      total += topics.length;
      done += topics.filter((t) => t.status === "completed").length;
    });

    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    return { total, done, percent };
  }, [chapters, topicsByChapter]);

  return (
    <View style={styles.subjectCard}>
      <Pressable
        style={({ pressed }) => [
          styles.subjectHeader,
          pressed && styles.pressed,
        ]}
        onPress={() => onToggleSubject(subject.id)}
      >
        <View style={styles.subjectLeft}>
          <View style={styles.subjectIcon}>
            <Text style={styles.subjectIndex}>{index + 1}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.subjectTitleRow}>
              <Text numberOfLines={1} style={styles.subjectTitle}>
                {subject.name}
              </Text>

              <Text style={styles.subjectPercent}>{subjectStats.percent}%</Text>
            </View>

            <Text numberOfLines={1} style={styles.subjectSub}>
              {subject.description ||
                `${chapters.length} chapters · ${subjectStats.done}/${subjectStats.total} topics`}
            </Text>

            <View style={styles.subjectMiniBar}>
              <View
                style={[
                  styles.subjectMiniFill,
                  { width: `${subjectStats.percent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.chevronBox}>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={21}
            color={ACCENT}
          />
        </View>
      </Pressable>

      {isOpen && (
        <View style={styles.chapterWrapper}>
          {chapters.length === 0 ? (
            <Text style={styles.emptySmall}>No chapters found</Text>
          ) : (
            chapters.map((chapter) => (
              <ChapterCard
                key={chapter.id}
                chapter={chapter}
                topics={topicsByChapter[chapter.id] ?? []}
                isOpen={openChapterID === chapter.id}
                onToggleChapter={onToggleChapter}
                onToggleTopic={onToggleTopic}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
});

export default function SyllabusTracker() {
  const {
    subjects,
    chaptersBySubject,
    topicsByChapter,
    openSubjectID,
    openChapterID,
    loading,
    syncing,
    loadLocal,
    syncNow,
    refresh,
    toggleSubject,
    toggleChapter,
    completeTopic,
  } = useSyllabusStore();

  useEffect(() => {
    loadLocal();
    syncNow();
  }, [loadLocal, syncNow]);

  const stats = useMemo(() => {
    const chapters = Object.values(chaptersBySubject).flat();
    const topics = Object.values(topicsByChapter).flat();

    const completedTopics = topics.filter(
      (topic: any) => topic.status === "completed"
    ).length;

    const percent =
      topics.length === 0 ? 0 : Math.round((completedTopics / topics.length) * 100);

    return {
      totalSubjects: subjects.length,
      totalChapters: chapters.length,
      totalTopics: topics.length,
      completedTopics,
      percent,
    };
  }, [subjects.length, chaptersBySubject, topicsByChapter]);

  const renderSubject = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <SubjectCard
        subject={item}
        index={index}
        chapters={chaptersBySubject[item.id] ?? []}
        topicsByChapter={topicsByChapter}
        isOpen={openSubjectID === item.id}
        openChapterID={openChapterID}
        onToggleSubject={toggleSubject}
        onToggleChapter={toggleChapter}
        onToggleTopic={completeTopic}
      />
    ),
    [
      chaptersBySubject,
      topicsByChapter,
      openSubjectID,
      openChapterID,
      toggleSubject,
      toggleChapter,
      completeTopic,
    ]
  );

  const header = (
    <>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>SYLLABUS TRACKER</Text>
          <Text style={styles.title}>Track Your Progress</Text>
          <Text style={styles.subtitle}>
            Offline-first sync · tap completed topic again to undo
          </Text>
        </View>

        <Pressable onPress={refresh} style={styles.refreshButton}>
          <PulseCircle syncing={syncing} />
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>Overall Completion</Text>
            <Text style={styles.heroPercent}>{stats.percent}%</Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="analytics-outline" size={27} color={ACCENT} />
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${stats.percent}%` }]} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalSubjects}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalChapters}</Text>
            <Text style={styles.statLabel}>Chapters</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {stats.completedTopics}/{stats.totalTopics}
            </Text>
            <Text style={styles.statLabel}>Topics</Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBgCircle} />
      <View style={styles.topBgCircleTwo} />

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        renderItem={renderSubject}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={ACCENT}
            colors={[ACCENT]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyBox}>
              <Ionicons name="cloud-offline-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No local syllabus found</Text>
              <Text style={styles.emptyText}>
                Pull to refresh or check /sync/full response.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
  },

  topBgCircle: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#EDE9FE",
    top: -90,
    right: -90,
  },

  topBgCircleTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#F3E8FF",
    top: 130,
    left: -80,
  },

  header: {
    marginTop: 48,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: ACCENT,
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  title: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.9,
  },

  subtitle: {
    color: "#6B7280",
    marginTop: 5,
    fontWeight: "700",
    fontSize: 13,
  },

  refreshButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  pulseWrap: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },

  pulseCircle: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT,
  },

  refreshInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },

  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    shadowColor: ACCENT_DARK,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroLabel: {
    color: "#6B7280",
    fontWeight: "800",
    fontSize: 13,
  },

  heroPercent: {
    fontSize: 40,
    fontWeight: "900",
    color: ACCENT,
    marginTop: 2,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },

  progressBar: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#EDE9FE",
    marginTop: 16,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: ACCENT,
    borderRadius: 999,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  statBox: {
    flex: 1,
    backgroundColor: "#F8F5FF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  statLabel: {
    color: "#6B7280",
    marginTop: 3,
    fontSize: 11,
    fontWeight: "800",
  },

  scrollContent: {
    paddingBottom: 50,
  },

  subjectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    shadowColor: ACCENT_DARK,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
    elevation: 4,
  },

  subjectHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pressed: {
    opacity: 0.82,
  },

  subjectLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 13,
  },

  subjectIcon: {
    width: 50,
    height: 50,
    borderRadius: 19,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },

  subjectIndex: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: "900",
  },

  subjectTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  subjectTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
  },

  subjectPercent: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "900",
  },

  subjectSub: {
    color: "#6B7280",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },

  subjectMiniBar: {
    height: 6,
    backgroundColor: "#EDE9FE",
    borderRadius: 999,
    marginTop: 8,
    overflow: "hidden",
  },

  subjectMiniFill: {
    height: "100%",
    backgroundColor: ACCENT,
    borderRadius: 999,
  },

  chevronBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  chapterWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  chapterCard: {
    backgroundColor: "#FBFAFF",
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    overflow: "hidden",
  },

  chapterHeader: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  chapterIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },

  chapterTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  chapterTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  chapterPercent: {
    fontSize: 13,
    fontWeight: "900",
    color: ACCENT,
  },

  miniBar: {
    height: 7,
    backgroundColor: "#EDE9FE",
    borderRadius: 999,
    marginTop: 9,
    overflow: "hidden",
  },

  miniFill: {
    height: "100%",
    backgroundColor: ACCENT,
    borderRadius: 999,
  },

  chapterMeta: {
    color: "#6B7280",
    marginTop: 7,
    fontSize: 12,
    fontWeight: "700",
  },

  topicWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  topicRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  topicDone: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },

  topicLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  topicTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  topicTitleDone: {
    color: "#166534",
  },

  topicMeta: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 3,
    fontWeight: "700",
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: ACCENT_SOFT,
  },

  statusPillDone: {
    backgroundColor: "#DCFCE7",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
    color: ACCENT,
  },

  statusTextDone: {
    color: "#16A34A",
  },

  emptySmall: {
    textAlign: "center",
    color: "#9CA3AF",
    fontWeight: "800",
    paddingVertical: 16,
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 30,
    alignItems: "center",
    marginTop: 30,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginTop: 12,
  },

  emptyText: {
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    fontWeight: "600",
  },
});