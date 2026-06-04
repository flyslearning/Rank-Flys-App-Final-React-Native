import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TextInput,
  Alert,
  RefreshControl,
  Animated,
  Platform,
  Linking,
} from "react-native";
import CachedRemoteImage from "../../components/CachedRemoteImage";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { mentorshipApi } from "../../api/mentorship.api";

const PURPLE = "#8b5cf6";
const PURPLE_DARK = "#7c3aed";
const BLUE = "#3b82f6";
const GREEN = "#22c55e";
const ORANGE = "#fb923c";
const RED = "#ef4444";
const DARK = "#0f172a";
const BG = "#f8fafc";

type TabType = "home" | "ebooks" | "tests" | "sessions" | "announcements";

const TREAT_API_TIME_AS_IST_WALL_TIME = true;

const normalizeBool = (v: any) => v === true || v === 1 || v === "true";

const getMainData = (res: any) => res?.data?.data || res?.data || res || {};

const getArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const sortByOrder = (data: any[]) =>
  [...data].sort((a, b) => {
    const oa = Number(a.order ?? a.sort_order ?? 0);
    const ob = Number(b.order ?? b.sort_order ?? 0);
    if (oa !== ob) return oa - ob;
    return String(a.name || a.title || "").localeCompare(String(b.name || b.title || ""));
  });

const sortByDateDesc = (data: any[], key = "created_at") =>
  [...data].sort(
    (a, b) => new Date(b?.[key] || 0).getTime() - new Date(a?.[key] || 0).getTime()
  );

const formatDateTime = (value?: string) => {
  if (!value) return "";

  let d: Date;

  if (TREAT_API_TIME_AS_IST_WALL_TIME) {
    const cleaned = value.replace("Z", "").replace("+00:00", "");
    d = new Date(cleaned);
  } else {
    d = new Date(value);
  }

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString("en-IN", {
    timeZone: TREAT_API_TIME_AS_IST_WALL_TIME ? undefined : "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const buildTreeList = (nodes: any[]) => {
  const normalized = nodes.map((node) => ({
    ...node,
    parent_id: node.parent_id || null,
    children: [],
  }));

  const map = new Map<string, any>();
  normalized.forEach((node) => map.set(node.id, node));

  const roots: any[] = [];

  normalized.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const flat: any[] = [];

  const walk = (items: any[], level = 0) => {
    sortByOrder(items).forEach((item) => {
      flat.push({ ...item, level });
      if (item.children?.length) walk(item.children, level + 1);
    });
  };

  walk(roots, 0);
  return flat;
};

const parseFullMentorship = (
  raw: any,
  mentorshipId: string,
  announcementsRaw: any[] = [],
  sessionsRaw: any[] = []
) => {
  const mainData = getMainData(raw);
  const mentorshipData = mainData?.mentorship || mainData;

  const mentorship = {
    id: mentorshipData?.id || mentorshipId,
    title: mentorshipData?.title || mentorshipData?.name || "Mentorship",
    description: mentorshipData?.description || "",
    image_url: mentorshipData?.image_url || mentorshipData?.image || "",
    explore_text: mentorshipData?.explore_text || "Explore Mentorship",
  };

  const hasAccess =
    normalizeBool(mainData?.has_access) ||
    normalizeBool(mainData?.hasAccess) ||
    normalizeBool(mentorshipData?.has_access) ||
    normalizeBool(mentorshipData?.is_free);

  const loadedEbookSeries: any[] = [];
  const loadedEbookNodes: any[] = [];

  const ebookGroups = Array.isArray(mainData?.ebooks) ? mainData.ebooks : [];

  ebookGroups.forEach((group: any) => {
    const series = group?.series || {};
    const seriesId = series?.id;
    if (!seriesId) return;

    loadedEbookSeries.push({
      ...series,
      id: seriesId,
      title: series?.title || "Ebook Series",
      description: series?.description || "",
      image_url: series?.image_url || "",
      sort_order: Number(series?.sort_order || 0),
    });

    const nodes = Array.isArray(group?.nodes) ? group.nodes : [];

    nodes.forEach((node: any) => {
      loadedEbookNodes.push({
        ...node,
        id: node?.id,
        series_id: node?.series_id || seriesId,
        series_title: series?.title || "Ebook Series",
        name: node?.name || node?.title || "Untitled",
        title: node?.title || node?.name || "Untitled",
        type: node?.type === "pdf" ? "file" : node?.type || "file",
        file_url: node?.file_url || node?.fileUrl || node?.pdf_url || node?.url || null,
        parent_id: node?.parent_id || null,
        is_demo: normalizeBool(node?.is_demo || node?.isDemo),
        order: Number(node?.order ?? node?.sort_order ?? 0),
      });
    });
  });

  const loadedTestSeries: any[] = [];
  const loadedTests: any[] = [];

  const testGroups = Array.isArray(mainData?.test_series) ? mainData.test_series : [];

  testGroups.forEach((group: any) => {
    const series = group?.series || {};
    const seriesId = series?.id;
    if (!seriesId) return;

    loadedTestSeries.push({
      ...series,
      id: seriesId,
      title: series?.title || "Test Series",
      description: series?.description || "",
      image_url: series?.image_url || "",
      sort_order: Number(series?.sort_order || 0),
    });

    const groupTests = Array.isArray(group?.tests) ? group.tests : [];

    groupTests.forEach((test: any) => {
      loadedTests.push({
        ...test,
        id: test?.id,
        series_id: test?.series_id || seriesId,
        series_title: series?.title || "Test Series",
        title: test?.title || test?.name || "Untitled Test",
        description: test?.description || "",
        duration_minutes: Number(test?.duration_minutes || test?.duration || 0),
        total_questions: Number(test?.total_questions || test?.question_count || 0),
        is_demo: normalizeBool(test?.is_demo || test?.isDemo),
        order: Number(test?.order ?? test?.sort_order ?? 0),
      });
    });
  });

  const announcements = sortByDateDesc(
    announcementsRaw.map((x: any) => ({
      ...x,
      id: x.id,
      title: x.title || "Announcement",
      message: x.message || "",
      image_url: x.image_url || null,
      is_pinned: normalizeBool(x.is_pinned),
      created_at: x.created_at || "",
    }))
  ).sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));

  const liveSessions = [...sessionsRaw]
    .map((x: any) => ({
      ...x,
      id: x.id,
      title: x.title || "Live Session",
      description: x.description || "",
      meet_link: x.meet_link || "",
      recording_url: x.recording_url || null,
      start_time: x.start_time || "",
      end_time: x.end_time || "",
      is_live: normalizeBool(x.is_live),
      created_at: x.created_at || "",
    }))
    .sort(
      (a, b) =>
        new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime()
    );

  return {
    mentorship,
    hasAccess,
    ebookSeries: sortByOrder(loadedEbookSeries),
    ebookNodes: buildTreeList(loadedEbookNodes),
    testSeries: sortByOrder(loadedTestSeries),
    tests: sortByOrder(loadedTests),
    announcements,
    liveSessions,
    version:
      Number(mainData?.version || mainData?.sync_version || mainData?.updated_version || 1) ||
      1,
    saved_at: Date.now(),
    raw: mainData,
  };
};

function FadeCard({ children, delay = 0, style }: any) {
  const fade = useRef(new Animated.Value(0)).current;
  const move = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(move, {
        toValue: 0,
        duration: 220,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fade, transform: [{ translateY: move }] }]}>
      {children}
    </Animated.View>
  );
}

export default function MyMentor() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mentorshipId } = route.params || {};

  const CACHE_KEY = `my_mentor_full_${mentorshipId}`;
  const VERSION_KEY = `my_mentor_version_${mentorshipId}`;

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const [mentorship, setMentorship] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [ebookSeries, setEbookSeries] = useState<any[]>([]);
  const [ebookNodes, setEbookNodes] = useState<any[]>([]);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const applyParsedData = useCallback((parsed: any) => {
    setMentorship(parsed.mentorship);
    setHasAccess(parsed.hasAccess);
    setEbookSeries(parsed.ebookSeries || []);
    setEbookNodes(parsed.ebookNodes || []);
    setTestSeries(parsed.testSeries || []);
    setTests(parsed.tests || []);
    setAnnouncements(parsed.announcements || []);
    setLiveSessions(parsed.liveSessions || []);
  }, []);

  const saveLocal = useCallback(
    async (parsed: any) => {
      await AsyncStorage.multiSet([
        [CACHE_KEY, JSON.stringify(parsed)],
        [VERSION_KEY, String(parsed.version || 1)],
      ]);
    },
    [CACHE_KEY, VERSION_KEY]
  );

  const loadLocal = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return false;
      applyParsedData(JSON.parse(cached));
      return true;
    } catch {
      return false;
    }
  }, [CACHE_KEY, applyParsedData]);

  const fetchFresh = useCallback(
    async (force = false) => {
      if (!mentorshipId) return;

      try {
        setSyncing(true);

        const localVersionText = await AsyncStorage.getItem(VERSION_KEY);
        const localVersion = Number(localVersionText || 0);

        if (!force && localVersion > 0 && mentorshipApi.syncCheck) {
          try {
            const check = await mentorshipApi.syncCheck(localVersion);
            const updateAvailable =
              check?.update_available ??
              check?.data?.update_available ??
              check?.data?.data?.update_available ??
              true;

            if (updateAvailable === false) return;
          } catch {}
        }

        const [fullRes, annRes, sessionsRes] = await Promise.all([
          mentorshipApi.getFullDetails(mentorshipId),
          mentorshipApi.getAnnouncements(mentorshipId),
          mentorshipApi.getLiveSessions(mentorshipId),
        ]);

        const parsed = parseFullMentorship(
          fullRes,
          mentorshipId,
          getArray(annRes),
          getArray(sessionsRes)
        );

        await saveLocal(parsed);
        applyParsedData(parsed);
      } catch (error: any) {
        console.log("My Mentor sync error:", error?.response?.data || error?.message);
        const hasLocal = await loadLocal();
        if (!hasLocal) Alert.alert("Error", "Mentorship content load nahi hua.");
      } finally {
        setSyncing(false);
        setLoading(false);
      }
    },
    [mentorshipId, VERSION_KEY, saveLocal, applyParsedData, loadLocal]
  );

  const loadMentorship = useCallback(async () => {
    if (!mentorshipId) {
      Alert.alert("Error", "mentorshipId missing hai.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const hasLocal = await loadLocal();

    if (hasLocal) {
      setLoading(false);
      fetchFresh(false);
    } else {
      await fetchFresh(true);
    }
  }, [mentorshipId, loadLocal, fetchFresh]);

  useEffect(() => {
    loadMentorship();
  }, [loadMentorship]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFresh(true);
    setRefreshing(false);
  };

  const filteredEbookNodes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return ebookNodes;
    return ebookNodes.filter((node) =>
      `${node?.name || ""} ${node?.series_title || ""} ${node?.type || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [ebookNodes, search]);

  const filteredTests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tests;
    return tests.filter((test) =>
      `${test?.title || ""} ${test?.description || ""} ${test?.series_title || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [tests, search]);

  const filteredSessions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return liveSessions;
    return liveSessions.filter((s) =>
      `${s.title || ""} ${s.description || ""}`.toLowerCase().includes(keyword)
    );
  }, [liveSessions, search]);

  const filteredAnnouncements = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return announcements;
    return announcements.filter((a) =>
      `${a.title || ""} ${a.message || ""}`.toLowerCase().includes(keyword)
    );
  }, [announcements, search]);

  const openUrl = async (url?: string | null) => {
    if (!url) {
      Alert.alert("Link Missing", "Link available nahi hai.");
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("Invalid Link", "Ye link open nahi ho sakta.");
      return;
    }

    Linking.openURL(url);
  };

  const openSessionUrl = async (session: any, type: "meet" | "recording") => {
    if (!hasAccess) {
      Alert.alert(
        "Locked",
        type === "meet"
          ? "Live session join karne ke liye mentorship buy karo."
          : "Recording dekhne ke liye mentorship buy karo."
      );
      return;
    }

    const url = type === "meet" ? session?.meet_link : session?.recording_url;
    await openUrl(url);
  };

  const openEbookNode = (node: any) => {
    const unlocked = hasAccess || normalizeBool(node?.is_demo);

    if (!unlocked) {
      Alert.alert("Locked", "Is ebook content ko access karne ke liye mentorship buy karo.");
      return;
    }

    if (node?.type === "folder") {
      navigation.navigate("EbookNodes", {
        seriesId: node.series_id,
        seriesTitle: node.series_title,
        parentId: node.id,
        parentTitle: node.name,
      });
      return;
    }

    if (!node?.file_url) {
      Alert.alert("File Missing", "PDF file URL nahi mila.");
      return;
    }

    navigation.navigate("PdfViewer", {
      title: node.name,
      fileUrl: node.file_url,
    });
  };

  const startTest = (test: any) => {
    const unlocked = hasAccess || normalizeBool(test?.is_demo);

    if (!unlocked) {
      Alert.alert("Locked", "Is test ko start karne ke liye mentorship buy karo.");
      return;
    }

    navigation.navigate("TestAttempt", {
      testId: test.id,
      seriesId: test.series_id,
      duration_minutes: test.duration_minutes,
      total_questions: test.total_questions,
      title: test.title,
      description: test.description,
    });
  };

  const openAttempts = (test: any) => {
    navigation.navigate("Attempts", { testId: test.id });
  };

  const folderCount = ebookNodes.filter((x) => x.type === "folder").length;
  const fileCount = ebookNodes.filter((x) => x.type !== "folder").length;

  const renderTab = (key: TabType, label: string, icon: any, count: number) => {
    const active = activeTab === key;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.tabBtn, active && styles.activeTabBtn]}
        onPress={() => {
          setActiveTab(key);
          setSearch("");
        }}
      >
        <Ionicons name={icon} size={15} color={active ? "#fff" : PURPLE_DARK} />
        <Text style={[styles.tabText, active && styles.activeTabText]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.tabCount, active && styles.activeTabCount]}>
          <Text style={[styles.tabCountText, active && styles.activeTabCountText]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={styles.loadingText}>Loading mentorship...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const syncScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf5ff" />

      <View style={styles.container}>
        <View style={styles.topHeader}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.headerLabel}>My Mentor</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {mentorship?.title || "Mentorship"}
              </Text>
              <Text style={styles.headerDescription} numberOfLines={2}>
                {mentorship?.description || "Premium ebooks, sessions, announcements and tests."}
              </Text>
            </View>

            <Animated.View style={[styles.syncBadge, syncing && { transform: [{ scale: syncScale }] }]}>
              <Ionicons
                name={syncing ? "sync" : "cloud-done-outline"}
                size={17}
                color={syncing ? BLUE : GREEN}
              />
            </Animated.View>
          </View>

          <View style={styles.searchShell}>
            <View style={styles.searchIconCircle}>
              <Ionicons name="search-outline" size={19} color={PURPLE_DARK} />
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={
                activeTab === "home"
                  ? "Search content..."
                  : activeTab === "ebooks"
                  ? "Search folders or PDFs..."
                  : activeTab === "tests"
                  ? "Search tests..."
                  : activeTab === "sessions"
                  ? "Search sessions..."
                  : "Search announcements..."
              }
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />

            {search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
                <Ionicons name="close" size={17} color="#64748b" />
              </TouchableOpacity>
            ) : (
              <View style={styles.shortcutPill}>
                <Text style={styles.shortcutText}>
                  {activeTab === "announcements" ? "NEWS" : activeTab.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.tabsOuter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsWrap}>
            {renderTab("home", "Home", "home-outline", ebookSeries.length + tests.length)}
            {renderTab("ebooks", "Ebooks", "book-outline", ebookNodes.length)}
            {renderTab("tests", "Tests", "document-text-outline", tests.length)}
            {renderTab("sessions", "Sessions", "videocam-outline", liveSessions.length)}
            {renderTab("announcements", "Updates", "megaphone-outline", announcements.length)}
          </ScrollView>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === "home" && (
            <View>
              <FadeCard style={styles.heroCard}>
                <View style={styles.imageWrap}>
                  {mentorship?.image_url ? (
                    <CachedRemoteImage
                        uri={mentorship.image_url}
                        style={styles.heroImage}
                      />
                  ) : (
                    <View style={styles.placeholder}>
                      <Ionicons name="school-outline" size={54} color={PURPLE} />
                    </View>
                  )}

                  <View style={[styles.accessBadge, hasAccess ? styles.accessOk : styles.accessLocked]}>
                    <Ionicons name={hasAccess ? "checkmark-circle" : "lock-closed"} size={15} color="#fff" />
                    <Text style={styles.accessBadgeText}>{hasAccess ? "UNLOCKED" : "LOCKED"}</Text>
                  </View>
                </View>

                <View style={styles.heroBody}>
                  <Text style={styles.title}>{mentorship?.title}</Text>
                  <Text style={styles.description}>{mentorship?.description}</Text>

                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Ionicons name="book-outline" size={22} color={PURPLE_DARK} />
                      <Text style={styles.statValue}>{ebookSeries.length}</Text>
                      <Text style={styles.statLabel}>Series</Text>
                    </View>

                    <View style={styles.statCard}>
                      <Ionicons name="videocam-outline" size={22} color={GREEN} />
                      <Text style={styles.statValue}>{liveSessions.length}</Text>
                      <Text style={styles.statLabel}>Sessions</Text>
                    </View>

                    <View style={styles.statCard}>
                      <Ionicons name="megaphone-outline" size={22} color={ORANGE} />
                      <Text style={styles.statValue}>{announcements.length}</Text>
                      <Text style={styles.statLabel}>Updates</Text>
                    </View>
                  </View>
                </View>
              </FadeCard>

              <Text style={styles.sectionTitle}>Included Content</Text>

              {[
                {
                  key: "ebooks",
                  title: "Ebook Library",
                  sub: `${folderCount} folders • ${fileCount} files`,
                  icon: "book-outline",
                  color: PURPLE_DARK,
                  bg: "#f5f3ff",
                },
                {
                  key: "tests",
                  title: "Test Series",
                  sub: `${tests.length} tests available`,
                  icon: "document-text-outline",
                  color: BLUE,
                  bg: "#eff6ff",
                },
                {
                  key: "sessions",
                  title: "Live Sessions",
                  sub: `${liveSessions.length} sessions available`,
                  icon: "videocam-outline",
                  color: GREEN,
                  bg: "#ecfdf5",
                },
                {
                  key: "announcements",
                  title: "Announcements",
                  sub: `${announcements.length} important updates`,
                  icon: "megaphone-outline",
                  color: ORANGE,
                  bg: "#fff7ed",
                },
              ].map((item: any, index) => (
                <FadeCard key={item.key} delay={index * 45}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.contentRow}
                    onPress={() => {
                      setSearch("");
                      setActiveTab(item.key);
                    }}
                  >
                    <View style={[styles.rowIcon, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>

                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowSub}>{item.sub}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={21} color="#94a3b8" />
                  </TouchableOpacity>
                </FadeCard>
              ))}
            </View>
          )}

          {activeTab === "ebooks" && (
            <View>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitleNoMargin}>Ebooks</Text>
                  <Text style={styles.sectionSub}>
                    {folderCount} folders • {fileCount} files
                  </Text>
                </View>
                <Text style={styles.countPill}>{filteredEbookNodes.length}</Text>
              </View>

              {filteredEbookNodes.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="book-outline" size={44} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No ebooks found</Text>
                </View>
              ) : (
                filteredEbookNodes.map((node, index) => {
                  const unlocked = hasAccess || normalizeBool(node?.is_demo);
                  const isFolder = node?.type === "folder";
                  const level = Number(node?.level || 0);
                  const indent = Math.min(level * 14, 42);

                  return (
                    <FadeCard key={`node-${node.series_id}-${node.id}`} delay={index * 18}>
                      <TouchableOpacity
                        activeOpacity={0.88}
                        style={[styles.treeCard, { marginLeft: indent }]}
                        onPress={() => openEbookNode(node)}
                      >
                        {level > 0 && <View style={styles.treeLine} />}

                        <View
                          style={[
                            styles.listIconBox,
                            !unlocked ? styles.lockIconBox : isFolder ? styles.folderIconBox : styles.fileIconBox,
                          ]}
                        >
                          <Ionicons
                            name={
                              !unlocked
                                ? "lock-closed-outline"
                                : isFolder
                                ? "folder-open-outline"
                                : "document-text-outline"
                            }
                            size={24}
                            color={!unlocked ? ORANGE : isFolder ? "#d97706" : BLUE}
                          />
                        </View>

                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle} numberOfLines={2}>
                            {node.name}
                          </Text>
                          <Text style={styles.rowSub} numberOfLines={1}>
                            {node.series_title}
                          </Text>
                        </View>

                        <View style={[styles.smallBadge, isFolder && styles.folderBadge]}>
                          <Text style={[styles.smallBadgeText, isFolder && styles.folderBadgeText]}>
                            {!unlocked ? "Lock" : isFolder ? "Folder" : "PDF"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </FadeCard>
                  );
                })
              )}
            </View>
          )}

          {activeTab === "tests" && (
            <View>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitleNoMargin}>Tests</Text>
                  <Text style={styles.sectionSub}>Practice and attempts</Text>
                </View>
                <Text style={styles.countPill}>{filteredTests.length}</Text>
              </View>

              {filteredTests.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="document-text-outline" size={44} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No tests found</Text>
                </View>
              ) : (
                filteredTests.map((test, index) => {
                  const unlocked = hasAccess || normalizeBool(test?.is_demo);

                  return (
                    <FadeCard key={`test-${test.series_id}-${test.id}`} delay={index * 25}>
                      <View style={styles.testCard}>
                        <View style={styles.cardTopRow}>
                          <View style={[styles.listIconBox, unlocked ? styles.testIconBox : styles.lockIconBox]}>
                            <Ionicons
                              name={unlocked ? "document-text-outline" : "lock-closed-outline"}
                              size={25}
                              color={unlocked ? BLUE : ORANGE}
                            />
                          </View>

                          <View style={styles.rowBody}>
                            <Text style={styles.rowTitle} numberOfLines={2}>
                              {test.title}
                            </Text>
                            <Text style={styles.rowSub} numberOfLines={2}>
                              {test.description || test.series_title}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaChip}>
                            <Ionicons name="time-outline" size={15} color="#475569" />
                            <Text style={styles.metaChipText}>{test.duration_minutes} min</Text>
                          </View>

                          <View style={styles.metaChip}>
                            <Ionicons name="help-circle-outline" size={15} color="#475569" />
                            <Text style={styles.metaChipText}>{test.total_questions} Qs</Text>
                          </View>
                        </View>

                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.secondaryBtn} onPress={() => openAttempts(test)}>
                            <Ionicons name="reader-outline" size={16} color="#334155" />
                            <Text style={styles.secondaryBtnText}>Attempts</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.primaryBtn, !unlocked && styles.lockedStartBtn]}
                            onPress={() => startTest(test)}
                          >
                            <Text style={styles.primaryBtnText}>{unlocked ? "Start Test" : "Locked"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </FadeCard>
                  );
                })
              )}
            </View>
          )}

          {activeTab === "sessions" && (
            <View>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitleNoMargin}>Live Sessions</Text>
                  <Text style={styles.sectionSub}>Upcoming classes and recordings</Text>
                </View>
                <Text style={styles.countPill}>{filteredSessions.length}</Text>
              </View>

              {filteredSessions.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="videocam-outline" size={44} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No sessions found</Text>
                </View>
              ) : (
                filteredSessions.map((session, index) => {
                  const unlocked = hasAccess;

                  return (
                    <FadeCard key={session.id} delay={index * 25}>
                      <View style={[styles.sessionCard, !unlocked && styles.lockedSessionCard]}>
                        <View style={styles.cardTopRow}>
                          <View
                            style={[
                              styles.listIconBox,
                              !unlocked
                                ? styles.lockIconBox
                                : session.is_live
                                ? styles.liveIconBox
                                : styles.sessionIconBox,
                            ]}
                          >
                            <Ionicons
                              name={
                                !unlocked
                                  ? "lock-closed-outline"
                                  : session.is_live
                                  ? "radio-outline"
                                  : "videocam-outline"
                              }
                              size={25}
                              color={!unlocked ? ORANGE : session.is_live ? RED : GREEN}
                            />
                          </View>

                          <View style={styles.rowBody}>
                            <View style={styles.sessionTopLine}>
                              {session.is_live && unlocked ? (
                                <View style={styles.livePill}>
                                  <Text style={styles.livePillText}>LIVE</Text>
                                </View>
                              ) : null}

                              {!unlocked ? (
                                <View style={styles.lockPill}>
                                  <Ionicons name="lock-closed" size={11} color={ORANGE} />
                                  <Text style={styles.lockPillText}>LOCKED</Text>
                                </View>
                              ) : null}
                            </View>

                            <Text style={styles.rowTitle} numberOfLines={2}>
                              {session.title}
                            </Text>

                            <Text style={styles.rowSub} numberOfLines={2}>
                              {session.description}
                            </Text>

                            <View style={[styles.sessionTimeBox, !unlocked && styles.lockedTimeBox]}>
                              <Ionicons name="time-outline" size={16} color={unlocked ? GREEN : ORANGE} />
                              <Text style={[styles.sessionTimeText, !unlocked && styles.lockedTimeText]}>
                                {formatDateTime(session.start_time)} - {formatDateTime(session.end_time)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.primaryBtn, !unlocked && styles.lockedStartBtn]}
                            onPress={() => openSessionUrl(session, "meet")}
                          >
                            <Ionicons
                              name={unlocked ? "enter-outline" : "lock-closed-outline"}
                              size={16}
                              color="#fff"
                            />
                            <Text style={styles.primaryBtnText}>{unlocked ? "Join Meet" : "Locked"}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.secondaryBtn, !unlocked && styles.lockedSecondaryBtn]}
                            onPress={() => openSessionUrl(session, "recording")}
                          >
                            <Ionicons
                              name={unlocked ? "play-circle-outline" : "lock-closed-outline"}
                              size={16}
                              color={unlocked ? "#334155" : ORANGE}
                            />
                            <Text style={[styles.secondaryBtnText, !unlocked && styles.lockedSecondaryBtnText]}>
                              Recording
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </FadeCard>
                  );
                })
              )}
            </View>
          )}

          {activeTab === "announcements" && (
            <View>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitleNoMargin}>Announcements</Text>
                  <Text style={styles.sectionSub}>Pinned and latest updates</Text>
                </View>
                <Text style={styles.countPill}>{filteredAnnouncements.length}</Text>
              </View>

              {filteredAnnouncements.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="megaphone-outline" size={44} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No announcements found</Text>
                </View>
              ) : (
                filteredAnnouncements.map((item, index) => (
                  <FadeCard key={item.id} delay={index * 25}>
                    <View style={[styles.announcementCard, item.is_pinned && styles.pinnedCard]}>
                      {item.image_url ? (
                        <CachedRemoteImage
                            uri={item.image_url}
                            style={styles.announcementImage}
                          />
                      ) : null}

                      <View style={styles.announcementBody}>
                        <View style={styles.announcementTop}>
                          <View
                            style={[
                              styles.announcementIcon,
                              item.is_pinned ? styles.pinIconBox : styles.announceIconBox,
                            ]}
                          >
                            <Ionicons
                              name={item.is_pinned ? "pin-outline" : "megaphone-outline"}
                              size={22}
                              color={item.is_pinned ? ORANGE : PURPLE_DARK}
                            />
                          </View>

                          <View style={styles.rowBody}>
                            {item.is_pinned && (
                              <View style={styles.pinPill}>
                                <Text style={styles.pinPillText}>PINNED</Text>
                              </View>
                            )}

                            <Text style={styles.rowTitle} numberOfLines={2}>
                              {item.title}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.announcementMessage}>{item.message}</Text>

                        <View style={styles.dateRow}>
                          <Ionicons name="time-outline" size={14} color="#64748b" />
                          <Text style={styles.timeText}>{formatDateTime(item.created_at)}</Text>
                        </View>
                      </View>
                    </View>
                  </FadeCard>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748b", fontWeight: "800" },

  topHeader: {
    backgroundColor: "#faf5ff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 8,
    paddingBottom: 5,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: "#f3e8ff",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 7,
  },
  syncBadge: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  headerLabel: { color: PURPLE_DARK, fontSize: 11, fontWeight: "900" },
  headerTitle: { color: DARK, fontSize: 18, fontWeight: "900", marginTop: 0 },
  headerDescription: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    lineHeight: 16,
  },
  searchShell: {
    height: 49,
    borderRadius: 17,
    backgroundColor: "#fff",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ede9fe",
  },
  searchIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: DARK,
    fontWeight: "800",
  },
  clearBtn: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutPill: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  shortcutText: { color: "#64748b", fontSize: 10, fontWeight: "900" },

  tabsOuter: { height: 60, justifyContent: "center" },
  tabsWrap: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  tabBtn: {
    height: 40,
    minWidth: 102,
    maxWidth: 130,
    borderRadius: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
  },
  activeTabBtn: { backgroundColor: PURPLE, borderColor: PURPLE },
  tabText: { color: PURPLE_DARK, fontSize: 12, fontWeight: "900", maxWidth: 74 },
  activeTabText: { color: "#fff" },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  activeTabCount: { backgroundColor: "rgba(255,255,255,0.24)" },
  tabCountText: { color: PURPLE_DARK, fontSize: 10, fontWeight: "900" },
  activeTabCountText: { color: "#fff" },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  imageWrap: { height: 170, backgroundColor: "#f5f3ff" },
  heroImage: { width: "100%", height: "100%" },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  accessBadge: {
    position: "absolute",
    top: 13,
    right: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  accessOk: { backgroundColor: GREEN },
  accessLocked: { backgroundColor: ORANGE },
  accessBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900" },
  heroBody: { padding: 16 },
  title: { fontSize: 21, lineHeight: 28, color: DARK, fontWeight: "900" },
  description: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  statsRow: { flexDirection: "row", gap: 9, marginTop: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statValue: { marginTop: 5, fontSize: 19, fontWeight: "900", color: DARK },
  statLabel: { marginTop: 2, color: "#64748b", fontSize: 11, fontWeight: "800" },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 11,
    color: DARK,
    fontSize: 19,
    fontWeight: "900",
  },
  sectionTitleNoMargin: { color: DARK, fontSize: 19, fontWeight: "900" },
  sectionSub: { marginTop: 3, color: "#64748b", fontSize: 13, fontWeight: "700" },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  countPill: {
    minWidth: 36,
    textAlign: "center",
    backgroundColor: "#f5f3ff",
    color: PURPLE_DARK,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { color: DARK, fontSize: 15, lineHeight: 21, fontWeight: "900" },
  rowSub: {
    marginTop: 3,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  treeCard: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  treeLine: {
    position: "absolute",
    left: -8,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#ddd6fe",
    borderRadius: 999,
  },
  listIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  lockIconBox: { backgroundColor: "#fff7ed" },
  folderIconBox: { backgroundColor: "#fef3c7" },
  fileIconBox: { backgroundColor: "#eff6ff" },
  testIconBox: { backgroundColor: "#eff6ff" },
  sessionIconBox: { backgroundColor: "#ecfdf5" },
  liveIconBox: { backgroundColor: "#fee2e2" },
  announceIconBox: { backgroundColor: "#f5f3ff" },
  pinIconBox: { backgroundColor: "#fff7ed" },

  smallBadge: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 8,
  },
  smallBadgeText: { color: "#475569", fontSize: 10, fontWeight: "900" },
  folderBadge: { backgroundColor: "#fef3c7" },
  folderBadgeText: { color: "#92400e" },

  testCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sessionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  lockedSessionCard: {
    borderColor: "#fed7aa",
    backgroundColor: "#fffaf5",
  },
  announcementCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  pinnedCard: { borderColor: "#fed7aa", backgroundColor: "#fffaf5" },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start" },

  sessionTopLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },
  lockPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ffedd5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockPillText: { color: ORANGE, fontSize: 10, fontWeight: "900" },
  sessionTimeBox: {
    marginTop: 9,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  lockedTimeBox: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  sessionTimeText: {
    color: "#166534",
    fontSize: 10,
    fontWeight: "900",
  },
  lockedTimeText: { color: ORANGE },

  announcementImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#f1f5f9",
  },
  announcementBody: { padding: 14 },
  announcementTop: { flexDirection: "row", alignItems: "flex-start" },
  announcementIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  announcementMessage: {
    marginTop: 10,
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 13 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f8fafc",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaChipText: { color: "#475569", fontSize: 12, fontWeight: "900" },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  secondaryBtn: {
    flex: 1,
    minHeight: 43,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 43,
    borderRadius: 14,
    backgroundColor: GREEN,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
  },
  lockedStartBtn: { backgroundColor: ORANGE },
  lockedSecondaryBtn: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  secondaryBtnText: { color: "#334155", fontSize: 13, fontWeight: "900" },
  lockedSecondaryBtnText: { color: ORANGE },
  primaryBtnText: { color: "#fff", fontSize: 13, fontWeight: "900" },

  pinPill: {
    alignSelf: "flex-start",
    backgroundColor: "#ffedd5",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 5,
  },
  pinPillText: { color: "#c2410c", fontSize: 10, fontWeight: "900" },
  livePill: {
    alignSelf: "flex-start",
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 5,
  },
  livePillText: { color: RED, fontSize: 10, fontWeight: "900" },
  timeText: { color: "#475569", fontSize: 12, fontWeight: "800" },
  dateRow: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 5 },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: { marginTop: 10, color: DARK, fontSize: 17, fontWeight: "900" },
});