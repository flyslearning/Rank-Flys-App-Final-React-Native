import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { EbookAPI } from "../../api/ebook.api";
import { EbookDb } from "../../db/ebookDb";

const { width } = Dimensions.get("window");

const BLUE = "#2563EB";
const BLUE2 = "#1D4ED8";
const PURPLE = "#7C3AED";
const DARK = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const BG = "#FFFFFF";
const SOFT_BG = "#F8FAFC";
const CARD = "#FFFFFF";
const GREEN = "#16A34A";
const ORANGE = "#F59E0B";

const COVER_WIDTH = Math.min(width * 0.43, 180);
const COVER_HEIGHT = COVER_WIDTH * 1.48;

export default function BookDetailScreen({ route, navigation }: any) {
  const { bookId } = route.params;
  const insets = useSafeAreaInsets();

  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const pulse = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDetail();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.025,
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

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    waveLoop.start();

    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      waveLoop.stop();
    };
  }, [bookId]);

  const loadDetail = async () => {
    try {
      setLoading(true);

      const cached = EbookDb.getBookDetail?.(bookId);
      if (cached) setDetail(cached);

      const res = await EbookAPI.getBookDetail(bookId);
      const data = res.data?.data || res.data;

      EbookDb.saveBookDetail?.(data);
      setDetail(data);
    } catch (e: any) {
      console.log("Book detail error:", e?.response?.data || e?.message || e);
      Alert.alert("Error", "Book detail load nahi ho payi.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !detail) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <View style={styles.center}>
          <ActivityIndicator color={BLUE} size="large" />
          <Text style={styles.loadingText}>Loading book...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const book = detail?.book || detail || {};
  const access = detail?.access || {};
  const progress = detail?.progress || {};

  const price = Number(access?.price_rupees || book?.price_rupees || 0);
  const hasAccess = Boolean(access?.has_access || access?.has_book_access);
  const hasLibraryPass = Boolean(access?.has_library_pass);
  const isBookFree = Boolean(access?.is_book_free || price <= 0);
  const freePages = Number(access?.free_pages || book?.free_pages || 0);
  const totalPages = Number(book?.total_pages || 0);
  const lastPage = Number(progress?.last_page_no || 1);
  const accessType = access?.access_type || "locked";

  const progressPercent =
    totalPages > 0 ? Math.min(100, Math.round((lastPage / totalPages) * 100)) : 0;

  const openReader = () => {
    navigation.navigate("BookReader", {
      bookId,
      title: book.title,
      startPage: lastPage,
      price,
      hasAccess,
      access,
    });
  };

  const openLibraryPass = () => {
    navigation.navigate("LibraryPassPlans", {
      bookId,
      goalClassId: book.goal_class_id,
    });
  };

  const buyBook = () => {
    navigation.navigate("CheckoutScreen", {
      item: {
        ...book,
        id: bookId,
        content_type: "book",
        title: book.title,
        description: book.description,
        image_url: book.cover_image_url,
        price_paise: price * 100,
        original_price_paise: price * 100,
        discount_price_paise: price * 100,
        has_access: hasAccess,
        is_free: isBookFree,
      },
      content_id: bookId,
      content_type: "book",
      onSuccess: loadDetail,
    });
  };

  const waveMove = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 24],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Book Detail</Text>
          <Text style={styles.headerSub}>
            {hasAccess ? "Unlocked Premium Book" : "Premium Digital Book"}
          </Text>
        </View>

        <Pressable onPress={loadDetail} style={styles.iconBtn}>
          <Ionicons name="refresh" size={20} color={BLUE} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={hasAccess ? ["#ECFDF5", "#FFFFFF", "#F8FBFF"] : ["#FFFFFF", "#F8FBFF", "#EEF6FF"]}
          style={styles.hero}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <Animated.View
            style={[
              styles.coverStage,
              {
                transform: [{ translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.bookShadow} />

            <View style={styles.bookWrap}>
              <View style={styles.bookBack} />
              <View style={styles.bookPagesRight} />
              <View style={styles.bookPagesBottom} />
              <View style={styles.bookSpine} />

              <Image
                source={{ uri: book.cover_image_url }}
                style={styles.cover}
                resizeMode="cover"
              />

              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.68)",
                  "rgba(255,255,255,0.16)",
                  "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coverGloss}
              />

              <View style={styles.coverDarkEdge} />
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{book.title}</Text>

              <LinearGradient colors={["#EFF6FF", "#F5F3FF"]} style={styles.authorPill}>
                <Ionicons name="sparkles" size={13} color={BLUE} />
                <Text style={styles.author}>By Flys Learning</Text>
              </LinearGradient>

              <Text style={styles.desc}>
                {book.description || "Premium study book for your preparation."}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                hasAccess ? styles.unlockedBadge : styles.lockedBadge,
              ]}
            >
              <Ionicons
                name={hasAccess ? "checkmark-circle" : "lock-closed"}
                size={15}
                color={hasAccess ? GREEN : BLUE}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: hasAccess ? GREEN : BLUE },
                ]}
              >
                {hasAccess ? "Unlocked" : "Locked"}
              </Text>
            </View>
          </View>

          {hasAccess && (
            <LinearGradient colors={["#ECFDF5", "#FFFFFF"]} style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="shield-checkmark" size={28} color={GREEN} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>
                  {hasLibraryPass ? "Library Pass Active" : "Book Purchased"}
                </Text>
                <Text style={styles.successText}>
                  Aapko full book access mil chuka hai. Continue reading from page {lastPage}.
                </Text>
              </View>
            </LinearGradient>
          )}

          <View style={styles.statsGrid}>
            <StatCard icon="document-text-outline" color={BLUE} value={totalPages} label="Pages" />
            <StatCard icon="eye-outline" color={PURPLE} value={freePages} label="Free" />
            <StatCard icon="cash-outline" color={ORANGE} value={`₹${price}`} label="Price" />
          </View>

          <View style={styles.accessInfoGrid}>
            <MiniInfo
              icon={hasAccess ? "checkmark-done-circle" : "lock-closed-outline"}
              title="Access"
              value={hasAccess ? "Full Access" : "Free Preview"}
              color={hasAccess ? GREEN : BLUE}
            />
            <MiniInfo
              icon="bookmark-outline"
              title="Last Read"
              value={`Page ${lastPage}`}
              color={PURPLE}
            />
          </View>

          {!hasAccess && (
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <Pressable onPress={openLibraryPass} style={styles.passPress}>
                <LinearGradient
                  colors={["#FFFFFF", "#F8FBFF", "#EEF6FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.passCard}
                >
                  <Animated.View
                    style={[
                      styles.passTopWave,
                      { transform: [{ translateX: waveMove }] },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.passBottomWave,
                      {
                        transform: [
                          {
                            translateX: Animated.multiply(waveMove, -1),
                          },
                        ],
                      },
                    ]}
                  />

                  <View style={styles.passShine} />

                  <View style={styles.passIconBox}>
                    <LinearGradient
                      colors={["#FEF3C7", "#FDE68A"]}
                      style={styles.passIconInner}
                    >
                      <Ionicons name="library" size={28} color="#B45309" />
                    </LinearGradient>
                  </View>

                  <View style={styles.passInfo}>
                    <Text style={styles.passMini}>BEST VALUE</Text>
                    <Text style={styles.passTitle}>Unlock Library Pass</Text>
                    <Text style={styles.passDesc}>
                      One pass se eligible premium books unlock karo
                    </Text>
                  </View>

                  <LinearGradient colors={[BLUE, BLUE2]} style={styles.passArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name={hasAccess ? "shield-checkmark" : "sparkles"}
                size={24}
                color={BLUE}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>
                {hasAccess ? "Full book unlocked" : "Start reading free"}
              </Text>
              <Text style={styles.infoText}>
                {hasAccess
                  ? `You can read all pages without restriction.`
                  : `Read first ${freePages} pages free. Full book unlock price is ₹${price}.`}
              </Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressLabel}>Reading Progress</Text>
              <Text style={styles.progressValue}>Page {lastPage}</Text>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
              </View>

              <Text style={styles.progressPercent}>{progressPercent}% completed</Text>
            </View>

            <Pressable onPress={openReader} style={styles.smallReadBtn}>
              <Ionicons name="book-outline" size={17} color="#FFFFFF" />
              <Text style={styles.smallReadText}>Open</Text>
            </Pressable>
          </View>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>What you get</Text>

            <Benefit text="Clean premium reading experience" />
            <Benefit text="Continue from saved progress" />
            <Benefit text="Instant access after unlock" />
            <Benefit text="Best for revision and preparation" />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            bottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Pressable onPress={openReader} style={styles.readBtn}>
          <LinearGradient colors={[BLUE, BLUE2]} style={styles.bottomGradient}>
            <Ionicons name="reader-outline" size={20} color="#FFFFFF" />
            <Text style={styles.readText}>
              {hasAccess ? "Read Book" : "Start Free"}
            </Text>
          </LinearGradient>
        </Pressable>

        {!hasAccess && (
          <Pressable onPress={buyBook} style={styles.buyBtn}>
            <LinearGradient
              colors={["#60A5FA", BLUE, BLUE2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bottomGradient}
            >
              <Ionicons name="bag-handle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.buyText}>Buy ₹{price}</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function StatCard({ icon, color, value, label }: any) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniInfo({ icon, title, value, color }: any) {
  return (
    <View style={styles.miniInfoCard}>
      <View style={[styles.miniIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.miniTitle}>{title}</Text>
        <Text style={styles.miniValue}>{value}</Text>
      </View>
    </View>
  );
}

function Benefit({ text }: any) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name="checkmark-circle" size={18} color={GREEN} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  center: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "800",
    color: MUTED,
  },
  header: {
    height: 62,
    paddingHorizontal: 16,
    backgroundColor: BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: DARK,
    fontSize: 18,
    fontWeight: "900",
  },
  headerSub: {
    marginTop: 1,
    color: MUTED,
    fontSize: 11,
    fontWeight: "800",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: DARK,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  scrollContent: {
    paddingBottom: 107,
  },
  hero: {
    minHeight: 305,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
  },
  heroGlowOne: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(37,99,235,0.10)",
    top: 4,
    right: -70,
  },
  heroGlowTwo: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(124,58,237,0.08)",
    bottom: -55,
    left: -60,
  },
  coverStage: {
    alignItems: "center",
    justifyContent: "center",
  },
  bookShadow: {
    position: "absolute",
    bottom: -18,
    width: COVER_WIDTH * 1.55,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.14)",
  },
  bookWrap: {
    width: COVER_WIDTH,
    height: COVER_HEIGHT,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.25,
    shadowRadius: 25,
    shadowOffset: { width: 14, height: 18 },
    elevation: 16,
    transform: [
      { perspective: 1000 },
      { rotateY: "-10deg" },
      { rotateZ: "-1.5deg" },
    ],
  },
  bookBack: {
    position: "absolute",
    left: 10,
    top: 10,
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#CBD5E1",
    transform: [{ translateX: 13 }, { translateY: 9 }],
  },
  bookPagesRight: {
    position: "absolute",
    right: -12,
    top: 12,
    width: 18,
    height: COVER_HEIGHT - 26,
    backgroundColor: "#F8FAFC",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  bookPagesBottom: {
    position: "absolute",
    left: 12,
    right: -9,
    bottom: -10,
    height: 14,
    backgroundColor: "#E2E8F0",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  bookSpine: {
    position: "absolute",
    left: -13,
    top: 10,
    width: 18,
    height: COVER_HEIGHT - 18,
    backgroundColor: "#94A3B8",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    zIndex: 3,
  },
  cover: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    zIndex: 2,
  },
  coverGloss: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "48%",
    height: "100%",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    zIndex: 4,
  },
  coverDarkEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 12,
    height: "100%",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    backgroundColor: "rgba(15,23,42,0.16)",
    zIndex: 5,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  title: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    color: DARK,
  },
  authorPill: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  author: {
    fontSize: 12,
    fontWeight: "900",
    color: BLUE,
  },
  desc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: MUTED,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  unlockedBadge: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  lockedBadge: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  successCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  successIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#14532D",
  },
  successText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: "#15803D",
  },
  statsGrid: {
    marginTop: 22,
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 104,
    backgroundColor: CARD,
    borderRadius: 22,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    shadowColor: DARK,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  statValue: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: "900",
    color: DARK,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },
  accessInfoGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  miniInfoCard: {
    flex: 1,
    padding: 13,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  miniIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  miniTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },
  miniValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "900",
    color: DARK,
  },
  passPress: {
    marginTop: 22,
  },
  passCard: {
    minHeight: 112,
    borderRadius: 24,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    overflow: "hidden",
    shadowColor: BLUE,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  passTopWave: {
    position: "absolute",
    top: -28,
    left: -40,
    width: width * 0.95,
    height: 62,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  passBottomWave: {
    position: "absolute",
    bottom: -32,
    right: -40,
    width: width * 0.95,
    height: 68,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: "rgba(124,58,237,0.09)",
  },
  passShine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 90,
    height: "130%",
    backgroundColor: "rgba(255,255,255,0.45)",
    transform: [{ rotate: "18deg" }, { translateX: -30 }],
  },
  passIconBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  passIconInner: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  passInfo: {
    flex: 1,
    marginLeft: 14,
  },
  passMini: {
    fontSize: 9,
    letterSpacing: 1.3,
    fontWeight: "900",
    color: BLUE,
  },
  passTitle: {
    marginTop: 3,
    color: DARK,
    fontSize: 20,
    fontWeight: "900",
  },
  passDesc: {
    marginTop: 4,
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  passArrow: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  infoCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    gap: 13,
  },
  infoIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: "900",
  },
  infoText: {
    marginTop: 5,
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  progressCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    shadowColor: DARK,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  progressLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
  },
  progressValue: {
    marginTop: 3,
    color: DARK,
    fontSize: 18,
    fontWeight: "900",
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: BLUE,
  },
  progressPercent: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: "800",
    color: MUTED,
  },
  smallReadBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  smallReadText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  benefitsCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: SOFT_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: DARK,
    marginBottom: 10,
  },
  benefitRow: {
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    color: DARK,
  },
  bottomBar: {
    position: "absolute",
    left: 14,
    right: 14,
    minHeight: 74,
    borderRadius: 28,
    backgroundColor: CARD,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: DARK,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  readBtn: {
    flex: 1.2,
    height: 54,
    borderRadius: 19,
    overflow: "hidden",
  },
  buyBtn: {
    flex: 1,
    height: 54,
    borderRadius: 19,
    overflow: "hidden",
  },
  bottomGradient: {
    flex: 1,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  readText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  buyText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});