import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Image,
  RefreshControl,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { EbookAPI } from "../../api/ebook.api";
import { EbookDb } from "../../db/ebookDb";

const LIMIT = 20;
const { width } = Dimensions.get("window");
const HORIZONTAL_PADDING = 18;
const GAP = 14;
const ITEM_WIDTH = (width - HORIZONTAL_PADDING * 2 - GAP * 2) / 3;

const FALLBACK_IMAGE =
  "https://dummyimage.com/300x450/e5e7eb/64748b.png&text=Book";

const TOP_SPACE =
  Platform.OS === "android" ? Math.max((StatusBar.currentHeight || 0) - 4, 0) : 0;

export default function BooksLibraryScreen({ navigation }: any) {
  const [books, setBooks] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pulse = useRef(new Animated.Value(1)).current;
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCachedBooks();
    fetchBooks(true);

    Animated.loop(
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
    ).start();

    Animated.loop(
      Animated.timing(wave, {
        toValue: 1,
        duration: 2600,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const loadCachedBooks = () => {
    try {
      const cached = EbookDb.getBooks?.() || [];
      if (cached.length) {
        setBooks(normalizeBooks(cached));
        setLoading(false);
      }
    } catch (error) {
      console.log("Library cache error:", error);
    }
  };

  const normalizeBooks = (items: any[]) => {
    return items.filter(Boolean).map((item) => ({
      ...item,
      cover_image_url:
        item.cover_image_url ||
        item.image_url ||
        item.cover_image ||
        item.cover_url ||
        item.thumbnail ||
        item.image ||
        item.book_cover ||
        FALLBACK_IMAGE,
    }));
  };

  const fetchBooks = async (reset = false) => {
    if ((loadingMore && !reset) || refreshing) return;

    try {
      reset ? setLoading(true) : setLoadingMore(true);

      const currentOffset = reset ? 0 : offset;
      const res = await EbookAPI.getAllBooks(LIMIT, currentOffset);

      const rawList = res.data?.data || res.data || [];
      const list = normalizeBooks(rawList);

      setBooks((prev) => {
        const merged = reset ? list : [...prev, ...list];
        const unique = Array.from(
          new Map(merged.map((book) => [book.id, book])).values()
        );

        EbookDb.saveBooks?.(unique);
        return unique;
      });

      setOffset(reset ? list.length : offset + list.length);
      setHasMore(list.length === LIMIT);
    } catch (error) {
      console.log("Books library API error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    setOffset(0);
    fetchBooks(true);
  }, []);

  const loadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    fetchBooks(false);
  };

  const openLibraryPass = () => {
    navigation.navigate("LibraryPassPlans");
  };

  const renderBook = ({ item }: any) => {
    return (
      <Pressable
        style={styles.bookCard}
        android_ripple={{ color: "#E0E7FF" }}
        onPress={() =>
          navigation.navigate("BookDetail", {
            bookId: item.id,
          })
        }
      >
        <View style={styles.coverWrap}>
          <View style={styles.bookSpine} />

          <Image
            source={{ uri: item.cover_image_url || FALLBACK_IMAGE }}
            style={styles.cover}
            resizeMode="cover"
          />

          <View style={styles.bookBase} />
        </View>
      </Pressable>
    );
  };

  const waveTranslate = wave.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  const header = useMemo(
    () => (
      <View>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Book Library</Text>
            <Text style={styles.headerSub}>Premium reading collection</Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="library" size={20} color="#2563EB" />
          </View>
        </View>

        <Animated.View style={[styles.passCardWrap, { transform: [{ scale: pulse }] }]}>
          <Pressable onPress={openLibraryPass}>
            <LinearGradient
              colors={["#111827", "#1D4ED8", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.passCard}
            >
              <Animated.View
                style={[
                  styles.waveTop,
                  {
                    transform: [{ translateX: waveTranslate }, { rotate: "-8deg" }],
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.waveBottom,
                  {
                    transform: [{ translateX: waveTranslate }, { rotate: "8deg" }],
                  },
                ]}
              />

              <View style={styles.passTicketCutLeft} />
              <View style={styles.passTicketCutRight} />

              <View style={styles.passContent}>
                <View style={styles.passLeft}>
                  <View style={styles.passIcon}>
                    <Ionicons name="film" size={24} color="#FFFFFF" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.passLabel}>LIBRARY PASS</Text>
                    <Text style={styles.passTitle}>Unlock Premium Books</Text>
                    <Text style={styles.passSubtitle}>
                      One pass. Unlimited premium reading.
                    </Text>
                  </View>
                </View>

                <View style={styles.passBottom}>
                  <View style={styles.passPill}>
                    <Ionicons name="sparkles" size={13} color="#FACC15" />
                    <Text style={styles.passPillText}>Premium Access</Text>
                  </View>

                  <View style={styles.passButton}>
                    <Text style={styles.passButtonText}>View Plans</Text>
                    <Ionicons name="arrow-forward" size={15} color="#0F172A" />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Explore Books</Text>
            <Text style={styles.sectionSubtitle}>Choose your next read</Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{books.length} Books</Text>
          </View>
        </View>
      </View>
    ),
    [books.length, waveTranslate]
  );

  if (loading && books.length === 0) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <FlatList
        data={books}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderBook}
        numColumns={3}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.45}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="book-outline" size={46} color="#2563EB" />
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptySub}>Books will appear here soon.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color="#2563EB" />
            </View>
          ) : (
            <View style={styles.bottomSpace} />
          )
        }
        initialNumToRender={12}
        maxToRenderPerBatch={9}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: TOP_SPACE,
  },

  center: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: TOP_SPACE,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },

  content: {
    paddingBottom: 34,
    backgroundColor: "#FFFFFF",
  },

  header: {
    minHeight: 68,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  headerCenter: {
    flex: 1,
    marginLeft: 13,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },

  headerSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  passCardWrap: {
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 26,
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
  },

  passCard: {
    minHeight: 150,
    borderRadius: 26,
    overflow: "hidden",
    padding: 18,
  },

  waveTop: {
    position: "absolute",
    top: -38,
    left: -30,
    width: width * 0.9,
    height: 86,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  waveBottom: {
    position: "absolute",
    bottom: -44,
    right: -40,
    width: width * 0.95,
    height: 96,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.11)",
  },

  passTicketCutLeft: {
    position: "absolute",
    left: -13,
    top: 62,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },

  passTicketCutRight: {
    position: "absolute",
    right: -13,
    top: 62,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },

  passContent: {
    flex: 1,
    justifyContent: "space-between",
  },

  passLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  passIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  passLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#BFDBFE",
    letterSpacing: 1,
  },

  passTitle: {
    marginTop: 4,
    fontSize: 21,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },

  passSubtitle: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "700",
    color: "#DBEAFE",
  },

  passBottom: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  passPill: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  passPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  passButton: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  passButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
  },

  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },

  countText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
  },

  row: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GAP,
  },

  bookCard: {
    width: ITEM_WIDTH,
    marginBottom: 26,
  },

coverWrap: {
  width: ITEM_WIDTH,
  aspectRatio: 9 / 16,
  borderRadius: 6,
  backgroundColor: "#E2E8F0",
  overflow: "visible",

  shadowColor: "#020617",
  shadowOpacity: 0.25,
  shadowRadius: 12,
  shadowOffset: {
    width: 6,
    height: 9,
  },
  elevation: 9,

  transform: [{ perspective: 900 }, { rotateY: "-6deg" }],
},

cover: {
  width: "100%",
  height: "100%",
  borderRadius: 6,
  backgroundColor: "#E5E7EB",
},

bookSpine: {
  position: "absolute",
  left: -9,
  top: 7,
  bottom: 8,
  width: 12,
  borderTopLeftRadius: 5,
  borderBottomLeftRadius: 5,
  backgroundColor: "#0F172A",
  zIndex: -3,
},

bookBase: {
  position: "absolute",
  left: 5,
  right: -5,
  bottom: -7,
  height: 8,
  borderBottomLeftRadius: 5,
  borderBottomRightRadius: 6,
  backgroundColor: "#E2E8F0",
  zIndex: -2,
},

  footer: {
    paddingVertical: 18,
  },

  bottomSpace: {
    height: 20,
  },

  emptyBox: {
    marginTop: 70,
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },

  emptySub: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
});