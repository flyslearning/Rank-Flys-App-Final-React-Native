import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  StatusBar,
  Alert,
  Animated,
  Platform,
  RefreshControl,
} from "react-native";
import CachedRemoteImage from "../../components/CachedRemoteImage";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { mentorshipApi } from "../../api/mentorship.api";

const PURPLE = "#7c3aed";
const LAVENDER = "#f5f3ff";
const DARK = "#0f172a";
const MUTED = "#64748b";
const BG = "#f8fafc";
const GREEN = "#16a34a";
const ORANGE = "#f97316";
const BLUE = "#2563eb";
const RED = "#dc2626";

const CACHE_KEY = "mentorship_listing_cache_v3";
const CACHE_TIME_KEY = "mentorship_listing_cache_time_v3";
const CACHE_VERSION_KEY = "mentorship_listing_version_v3";

type PlanTab = "all" | "my";

const normalizeArray = (res: any) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

const normalizeBool = (v: any) => v === true || v === 1 || v === "true";

const hasPlanAccess = (item: any) => {
  return (
    normalizeBool(item?.has_access) ||
    normalizeBool(item?.is_free) ||
    normalizeBool(item?.hasAccess) ||
    normalizeBool(item?.isFree)
  );
};

const getOriginalPricePaise = (item: any) => {
  return Number(
    item?.original_price_paise ||
      item?.price_paise ||
      item?.discount_price_paise ||
      0
  );
};

const getDiscountPricePaise = (item: any) => {
  return Number(
    item?.discount_price_paise ||
      item?.price_paise ||
      item?.original_price_paise ||
      0
  );
};

const getDiscountPercent = (item: any) => {
  const apiPercent = Number(item?.discount_percent || 0);
  if (apiPercent > 0) return apiPercent;

  const original = getOriginalPricePaise(item);
  const discounted = getDiscountPricePaise(item);

  if (original > 0 && discounted > 0 && discounted < original) {
    return Math.round(((original - discounted) / original) * 100);
  }

  return 0;
};

const formatRupeesFromPaise = (paise: number) => {
  return `₹${Math.round(Number(paise || 0) / 100)}`;
};

const getPriceText = (item: any) => {
  if (normalizeBool(item?.is_free)) return "FREE";

  const discountPricePaise = getDiscountPricePaise(item);
  const priceRupees =
    Number(item?.price_rupees || 0) ||
    Math.round(Number(discountPricePaise || 0) / 100);

  return priceRupees > 0 ? `₹${priceRupees}` : "₹0";
};

const getEbookCount = (item: any) => {
  if (Number(item?.ebook_count || 0) > 0) return Number(item.ebook_count);
  if (Array.isArray(item?.ebooks)) return item.ebooks.length;

  return (
    item?.items?.filter?.((x: any) =>
      String(x?.content_type || x?.type || "").toLowerCase().includes("ebook")
    )?.length || 0
  );
};

const getTestCount = (item: any) => {
  if (Number(item?.test_count || 0) > 0) return Number(item.test_count);
  if (Array.isArray(item?.test_series)) return item.test_series.length;

  return (
    item?.items?.filter?.((x: any) =>
      String(x?.content_type || x?.type || "").toLowerCase().includes("test")
    )?.length || 0
  );
};

function AnimatedCard({ children, index = 0 }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: index * 55,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      {children}
    </Animated.View>
  );
}

export default function MentorshipScreens() {
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState<PlanTab>("all");
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const saveLocal = useCallback(async (items: any[], version = 1) => {
    await AsyncStorage.multiSet([
      [CACHE_KEY, JSON.stringify(items)],
      [CACHE_TIME_KEY, String(Date.now())],
      [CACHE_VERSION_KEY, String(version || 1)],
    ]);
  }, []);

  const loadLocal = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return false;

      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) return false;

      setMentorships(parsed);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchFresh = useCallback(
    async (force = false) => {
      try {
        setSyncing(true);

        const localVersionText = await AsyncStorage.getItem(CACHE_VERSION_KEY);
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

        const res = await mentorshipApi.getMyMentorships();
        const freshItems = normalizeArray(res);
        const version =
          Number(res?.version || res?.sync_version || res?.data?.version || 1) || 1;

        await saveLocal(freshItems, version);
        setMentorships(freshItems);
      } catch (error: any) {
        console.log("Mentorship list sync error:", error?.response?.data || error?.message);

        const hasLocal = await loadLocal();
        if (!hasLocal) Alert.alert("Error", "Mentorship plans load nahi hue.");
      } finally {
        setSyncing(false);
        setLoading(false);
      }
    },
    [loadLocal, saveLocal]
  );

  const loadMentorships = useCallback(async () => {
    setLoading(true);
    const hasLocal = await loadLocal();

    if (hasLocal) {
      setLoading(false);
      fetchFresh(false);
    } else {
      await fetchFresh(true);
    }
  }, [fetchFresh, loadLocal]);

  useEffect(() => {
    loadMentorships();
  }, [loadMentorships]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFresh(true);
    setRefreshing(false);
  };

  const myPlans = useMemo(() => {
    return mentorships.filter((item) => hasPlanAccess(item));
  }, [mentorships]);

  const visiblePlans = useMemo(() => {
    const base = activeTab === "my" ? myPlans : mentorships;
    const keyword = search.trim().toLowerCase();

    if (!keyword) return base;

    return base.filter((item: any) =>
      `${item?.title || ""} ${item?.description || ""} ${item?.explore_text || ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [activeTab, mentorships, myPlans, search]);

  const openMentorship = (item: any) => {
    navigation.navigate("My Mentor", {
      mentorshipId: item.id,
    });
  };

  const buyMentorship = (item: any) => {
    navigation.navigate("CheckoutScreen", {
      item,
      content_id: item.id,
      content_type: "mentorship_series",
    });
  };

  const renderPlanTab = (key: PlanTab, title: string, count: number, icon: any) => {
    const active = activeTab === key;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.planTab, active && styles.activePlanTab]}
        onPress={() => {
          setActiveTab(key);
          setSearch("");
        }}
      >
        <Ionicons name={icon} size={17} color={active ? "#fff" : PURPLE} />
        <Text style={[styles.planTabText, active && styles.activePlanTabText]}>
          {title}
        </Text>
        <View style={[styles.planTabCount, active && styles.activePlanTabCount]}>
          <Text style={[styles.planTabCountText, active && styles.activePlanTabCountText]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPriceBlock = (item: any, small = false) => {
    const isFree = normalizeBool(item?.is_free);
    const hasAccess = hasPlanAccess(item);
    const originalPricePaise = getOriginalPricePaise(item);
    const discountPricePaise = getDiscountPricePaise(item);
    const discountPercent = getDiscountPercent(item);

    if (hasAccess) {
      return <Text style={small ? styles.priceSmallMain : styles.footerPrice}>Unlocked</Text>;
    }

    if (isFree) {
      return <Text style={small ? styles.priceSmallMain : styles.footerPrice}>FREE</Text>;
    }

    const hasDiscount =
      originalPricePaise > 0 &&
      discountPricePaise > 0 &&
      discountPricePaise < originalPricePaise;

    return (
      <View>
        <View style={styles.priceLine}>
          <Text style={small ? styles.priceSmallMain : styles.footerPrice}>
            {formatRupeesFromPaise(discountPricePaise)}
          </Text>

          {hasDiscount && (
            <Text style={small ? styles.priceSmallCut : styles.footerCutPrice}>
              {formatRupeesFromPaise(originalPricePaise)}
            </Text>
          )}
        </View>

        {hasDiscount && discountPercent > 0 && (
          <Text style={small ? styles.priceSmallOff : styles.footerOff}>
            {discountPercent}% OFF
          </Text>
        )}
      </View>
    );
  };

  const renderCard = ({ item, index }: { item: any; index: number }) => {
    const isFree = normalizeBool(item?.is_free);
    const hasAccess = hasPlanAccess(item);
    const locked = !hasAccess;
    const ebookCount = getEbookCount(item);
    const testCount = getTestCount(item);
    const discountPercent = getDiscountPercent(item);

    return (
      <AnimatedCard index={index}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.planCard}
          onPress={() => openMentorship(item)}
        >
          <View style={styles.cardHero}>
            {item?.image_url ? (
              <CachedRemoteImage
                uri={item.image_url}
                style={styles.cardImage}
              />
            ) : (
              <View style={styles.cardPlaceholder}>
                <Ionicons name="school-outline" size={56} color={PURPLE} />
              </View>
            )}

            <View style={styles.heroShade} />

            <View
              style={[
                styles.statusPill,
                hasAccess ? styles.unlockedPill : locked ? styles.premiumPill : styles.freePill,
              ]}
            >
              <Ionicons
                name={hasAccess ? "checkmark-circle" : locked ? "lock-closed" : "flash"}
                size={13}
                color="#fff"
              />
              <Text style={styles.statusText}>
                {hasAccess ? "MY PLAN" : isFree ? "FREE" : "PREMIUM"}
              </Text>
            </View>

            {!hasAccess && !isFree && discountPercent > 0 && (
              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.planTitle} numberOfLines={2}>
              {item?.title || "Mentorship Plan"}
            </Text>

            <Text style={styles.planDesc} numberOfLines={2}>
              {item?.description || "Complete mentorship with ebook series and test series."}
            </Text>

            <View style={styles.featureRow}>
              <View style={styles.featureBox}>
                <View style={styles.featureIconPurple}>
                  <Ionicons name="book-outline" size={20} color={PURPLE} />
                </View>
                <View>
                  <Text style={styles.featureValue}>{ebookCount}</Text>
                  <Text style={styles.featureLabel}>Ebook Series</Text>
                </View>
              </View>

              <View style={styles.featureBox}>
                <View style={styles.featureIconBlue}>
                  <Ionicons name="document-text-outline" size={20} color={BLUE} />
                </View>
                <View>
                  <Text style={styles.featureValue}>{testCount}</Text>
                  <Text style={styles.featureLabel}>Test Series</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.footerLabel}>
                  {locked ? "Offer Price" : "Current Status"}
                </Text>
                {renderPriceBlock(item)}
              </View>

              {locked ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.buyButton}
                  onPress={() => buyMentorship(item)}
                >
                  <Text style={styles.buttonText}>Buy Now</Text>
                  <Ionicons name="arrow-forward" size={17} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.openButton}
                  onPress={() => openMentorship(item)}
                >
                  <Text style={styles.buttonText}>Open Plan</Text>
                  <Ionicons name="arrow-forward" size={17} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </AnimatedCard>
    );
  };

  const syncScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fbf7ff" />
        <View style={styles.loadingScreen}>
          <Animated.View style={[styles.loadingOrb, { transform: [{ scale: syncScale }] }]}>
            <Ionicons name="school-outline" size={42} color={PURPLE} />
          </Animated.View>
          <Text style={styles.loadingTitle}>Loading Mentorships</Text>
          <Text style={styles.loadingSub}>Your plans are getting ready...</Text>
          <ActivityIndicator color={PURPLE} style={{ marginTop: 18 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbf7ff" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextBox}>
              <Text style={styles.headerKicker}>Mentorship Series</Text>
              <Text style={styles.headerTitle}>
                {activeTab === "my" ? "My Mentorships" : "Choose Your Plan"}
              </Text>
            </View>

            <Animated.View style={[styles.syncButton, syncing && { transform: [{ scale: syncScale }] }]}>
              <Ionicons
                name={syncing ? "sync" : "cloud-done-outline"}
                size={19}
                color={syncing ? BLUE : GREEN}
              />
            </Animated.View>
          </View>

          <View style={styles.searchBox}>
            <View style={styles.searchIconBox}>
              <Ionicons name="search-outline" size={20} color={PURPLE} />
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={
                activeTab === "my"
                  ? "Search my mentorships..."
                  : "Search mentorship series..."
              }
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />

            {search.length > 0 ? (
              <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch("")}>
                <Ionicons name="close" size={17} color={MUTED} />
              </TouchableOpacity>
            ) : (
              <View style={styles.totalPill}>
                <Text style={styles.totalText}>{visiblePlans.length}</Text>
              </View>
            )}
          </View>

          <View style={styles.tabsRow}>
            {renderPlanTab("all", "All Plans", mentorships.length, "layers-outline")}
            {renderPlanTab("my", "My Mentorships", myPlans.length, "checkmark-done-outline")}
          </View>
        </View>

        <FlatList
          data={visiblePlans}
          keyExtractor={(item, index) => `${item?.id || index}`}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              <Text style={styles.sectionTitle}>
                {activeTab === "my" ? "My Unlocked Mentorships" : "Available Mentorships"}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={activeTab === "my" ? "lock-closed-outline" : "school-outline"}
                  size={48}
                  color={PURPLE}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === "my" ? "No unlocked plan yet" : "No mentorship found"}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === "my"
                  ? "Jab plan unlock/buy hoga, yahan show hoga."
                  : "Search clear karo ya refresh try karo."}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  loadingOrb: {
    width: 92,
    height: 92,
    borderRadius: 32,
    backgroundColor: LAVENDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  loadingTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: DARK,
  },
  loadingSub: {
    marginTop: 6,
    color: MUTED,
    fontWeight: "700",
    textAlign: "center",
  },

  header: {
    backgroundColor: "#fbf7ff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 6 : 4,
    paddingBottom: 10,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 1,
    borderColor: "#f3e8ff",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 13,
  },
  headerTextBox: { flex: 1, minWidth: 0 },
  headerKicker: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: DARK,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 2,
  },
  headerSub: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    height: 54,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ede9fe",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  searchIconBox: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: LAVENDER,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: DARK,
    fontSize: 15,
    fontWeight: "800",
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  totalPill: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: LAVENDER,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  totalText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "900",
  },

  tabsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  planTab: {
    flex: 1,
    height: 46,
    borderRadius: 17,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ede9fe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  activePlanTab: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  planTabText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "900",
  },
  activePlanTabText: {
    color: "#fff",
  },
  planTabCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: LAVENDER,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  activePlanTabCount: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  planTabCountText: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: "900",
  },
  activePlanTabCountText: {
    color: "#fff",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 38,
  },
  sectionTitle: {
    color: DARK,
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 12,
  },

  planCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    marginBottom: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHero: {
    height: 188,
    backgroundColor: LAVENDER,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.10)",
  },
  statusPill: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  unlockedPill: { backgroundColor: GREEN },
  premiumPill: { backgroundColor: ORANGE },
  freePill: { backgroundColor: BLUE },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  discountPill: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: RED,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  discountPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  priceLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  priceSmallMain: {
    color: DARK,
    fontSize: 13,
    fontWeight: "900",
  },
  priceSmallCut: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "800",
    textDecorationLine: "line-through",
  },
  priceSmallOff: {
    color: GREEN,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 1,
  },

  cardBody: { padding: 16 },
  planTitle: {
    color: DARK,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "900",
  },
  planDesc: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 7,
  },
  featureRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  featureBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  featureIconPurple: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: LAVENDER,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconBlue: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  featureValue: {
    color: DARK,
    fontSize: 17,
    fontWeight: "900",
  },
  featureLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 1,
  },
  cardFooter: {
    marginTop: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  footerLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
  },
  footerPrice: {
    color: PURPLE,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 1,
  },
  footerCutPrice: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "line-through",
    marginTop: 2,
  },
  footerOff: {
    color: GREEN,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  buyButton: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  openButton: {
    minHeight: 44,
    borderRadius: 16,
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },

  emptyBox: {
    alignItems: "center",
    marginTop: 70,
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 30,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: LAVENDER,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },
  emptySub: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
});