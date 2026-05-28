import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Image,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Text,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
  Modal,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";

import { EbookAPI } from "../../api/ebook.api";
import { EbookDb } from "../../db/ebookDb";
import BookPaywall from "../../components/books/BookPaywall";

const PAGE_LIMIT = 10;
const A4_RATIO = 1.414;

const simpleHash = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getStableImageKey = (page: any) => {
  if (page.image_key) return page.image_key;
  if (page.s3_key) return page.s3_key;
  if (page.remote_key) return page.remote_key;
  return (page.image_url || "").split("?")[0];
};

const getLocalPagePath = (bookId: string, pageNo: number, imageKey: string) => {
  const keyHash = simpleHash(imageKey);
  return `${FileSystem.documentDirectory}books/${bookId}/page-${pageNo}-${keyHash}.webp`;
};

const getApiMessage = (error: any) =>
  error?.response?.data || error?.response?.data?.message || error?.message || "";

export default function BookReaderScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();

  const {
    bookId,
    title = "Book Reader",
    startPage = 1,
    price = 0,
    coverImageUrl = "",
  } = route.params;

  const [screen, setScreen] = useState(Dimensions.get("window"));
  const [pages, setPages] = useState<any[]>([]);
  const [nextFrom, setNextFrom] = useState<number | null>(startPage);
  const [loading, setLoading] = useState(false);
  const [pageLabel, setPageLabel] = useState(startPage);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<any>(null);
  const loadingRef = useRef(false);
  const currentPage = useRef(startPage);

  const pageWidth = screen.width;
  const headerHeight = 64;
  const footerHeight = 76 + insets.bottom;
  const availableHeight = screen.height - headerHeight - footerHeight - insets.top;

  const maxPageWidth = pageWidth - 18;
  const maxPageHeight = availableHeight - 10;

  let bookPageWidth = maxPageWidth;
  let bookPageHeight = bookPageWidth * A4_RATIO;

  if (bookPageHeight > maxPageHeight) {
    bookPageHeight = maxPageHeight;
    bookPageWidth = bookPageHeight / A4_RATIO;
  }

  const bookmarkedPages = useMemo(
    () => new Set(bookmarks.map((b) => Number(b.page_no))),
    [bookmarks]
  );

  const isCurrentBookmarked = bookmarkedPages.has(Number(pageLabel));

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setScreen(window);
    });
    return () => sub?.remove?.();
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await EbookAPI.getBookBookmarks?.(bookId);
      const data = res?.data?.data || res?.data || [];
      setBookmarks(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.log("Bookmark API failed:", getApiMessage(error));
      setBookmarks([]);
    }
  }, [bookId]);

  const resolvePageImage = async (page: any) => {
    if (page.locked || !page.image_url) return page;

    const imageKey = getStableImageKey(page);

    try {
      const folder = `${FileSystem.documentDirectory}books/${bookId}/`;
      const folderInfo = await FileSystem.getInfoAsync(folder);

      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      }

      const localUri = getLocalPagePath(bookId, page.page_no, imageKey);
      const localInfo = await FileSystem.getInfoAsync(localUri);

      if (localInfo.exists) {
        return {
          ...page,
          image_url: localUri,
          local_uri: localUri,
          image_key: imageKey,
          remote_key: imageKey,
        };
      }

      const downloaded = await FileSystem.downloadAsync(page.image_url, localUri);

      return {
        ...page,
        image_url: downloaded.uri,
        local_uri: downloaded.uri,
        image_key: imageKey,
        remote_key: imageKey,
      };
    } catch (error) {
      console.log("Image cache failed, using remote image");
      return {
        ...page,
        image_key: imageKey,
        remote_key: imageKey,
      };
    }
  };

  const setFallbackPage = useCallback(() => {
    if (!coverImageUrl) return;

    setPages([
      {
        page_no: 1,
        image_url: coverImageUrl,
        image_key: coverImageUrl,
        remote_key: coverImageUrl,
        fallback: true,
      },
    ]);
    setPageLabel(1);
    currentPage.current = 1;
  }, [coverImageUrl]);

  const loadPages = useCallback(
    async (from?: number | null, reset = false, scrollToPage?: number) => {
      const pageFrom = Number(from ?? nextFrom);

    if (loadingRef.current || !pageFrom || pageFrom <= 0) return;

      try {
        loadingRef.current = true;
        setLoading(true);

        const res = await EbookAPI.getBookPages(bookId, pageFrom, PAGE_LIMIT);
        const data = res.data?.data || res.data;
        const list = data?.pages || [];

        const localList = await Promise.all(list.map(resolvePageImage));

        setPages((prev) => {
          const map = new Map();
          const source = reset ? localList : [...prev, ...localList];

          source.forEach((page: any) => {
            map.set(page.page_no, page);
          });

          return Array.from(map.values()).sort(
            (a: any, b: any) => a.page_no - b.page_no
          );
        });
        if (reset && scrollToPage) {
        setTimeout(() => {
          const targetIndex = localList.findIndex(
            (p: any) => Number(p.page_no) === Number(scrollToPage)
          );

          if (targetIndex >= 0) {
            listRef.current?.scrollToIndex({
              index: targetIndex,
              animated: false,
            });
          }
        }, 300);
      }

        if (localList.length) {
          EbookDb.saveBookPages?.(bookId, localList);
        }

        setNextFrom(data?.next_from || null);
      } catch (error: any) {
        console.log("Book pages API failed:", {
          status: error?.response?.status,
          data: error?.response?.data,
          message: error?.message,
        });

        const cached = EbookDb.getBookPages?.(bookId, pageFrom, PAGE_LIMIT) || [];

        if (cached.length) {
          setPages(cached);
        } else {
          setFallbackPage();
        }

        setNextFrom(null);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [bookId, nextFrom, setFallbackPage]
  );


  const saveProgress = useCallback(() => {
    EbookAPI.saveBookProgress?.(bookId, currentPage.current).catch(() => {});
  }, [bookId]);

  useEffect(() => {
  const initialFrom = Math.max(1, Number(startPage) - 4);

  setPages([]);
  setNextFrom(initialFrom);
  setPageLabel(startPage);
  currentPage.current = startPage;

  const cached = EbookDb.getBookPages?.(bookId, initialFrom, PAGE_LIMIT) || [];
  if (cached.length) setPages(cached);

  loadPages(initialFrom, true, startPage);
  loadBookmarks();
}, [bookId, startPage]);

  useEffect(() => {
    const timer = setInterval(saveProgress, 20000);
    return () => {
      clearInterval(timer);
      saveProgress();
    };
  }, [saveProgress]);

  const handleBookmark = async () => {
  const pageNo = currentPage.current;

  const wasBookmarked = bookmarks.some(
    (b) => Number(b.page_no) === Number(pageNo)
  );

  const oldBookmarks = bookmarks;

  setBookmarks((prev) => {
    if (wasBookmarked) {
      return prev.filter((b) => Number(b.page_no) !== Number(pageNo));
    }

    return [
      ...prev,
      {
        id: `local-${pageNo}`,
        book_id: bookId,
        page_no: pageNo,
        created_at: new Date().toISOString(),
      },
    ];
  });

  try {
    await EbookAPI.toggleBookBookmark?.(bookId, pageNo);
    await loadBookmarks();
  } catch (error: any) {
    setBookmarks(oldBookmarks);
    console.log("Bookmark toggle API failed:", getApiMessage(error));
  }
};

  const jumpToPage = async (pageNo: number) => {
  const initialFrom = Math.max(1, pageNo - 4);

  setShowBookmarks(false);
  setPages([]);
  setNextFrom(initialFrom);
  setPageLabel(pageNo);
  currentPage.current = pageNo;

  await loadPages(initialFrom, true, pageNo);
};

  const onMomentumEnd = (event: any) => {
  const index = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
  const page = pages[index];

  if (page?.page_no) {
    currentPage.current = page.page_no;
    setPageLabel(page.page_no);
  }

  if (index >= pages.length - 2 && nextFrom && !loadingRef.current) {
    loadPages(nextFrom);
  }
};

  const openZoom = (uri: string) => {
    setZoomScale(1);
    setZoomImage(uri);
  };

  const renderPage = ({ item, index }: any) => {
    const inputRange = [
      (index - 1) * pageWidth,
      index * pageWidth,
      (index + 1) * pageWidth,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.91, 1, 0.91],
      extrapolate: "clamp",
    });

    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ["9deg", "0deg", "-9deg"],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.55, 1, 0.55],
      extrapolate: "clamp",
    });

    const marked = bookmarkedPages.has(Number(item.page_no));

    return (
      <View style={[styles.slide, { width: pageWidth, height: availableHeight }]}>
        <Animated.View
          style={[
            styles.pageCard,
            {
              width: bookPageWidth,
              height: bookPageHeight,
              opacity,
              transform: [{ perspective: 1200 }, { rotateY }, { scale }],
            },
          ]}
        >
          {item.locked || !item.image_url ? (
            <BookPaywall
              price={price}
              onBuyBook={() => navigation.navigate("BookDetail", { bookId })}
              onBuyPass={() => navigation.navigate("LibraryPassPlans", { bookId })}
            />
          ) : (
            <Pressable style={styles.imageTapArea} onPress={() => openZoom(item.image_url)}>
              <Image source={{ uri: item.image_url }} style={styles.pageImage} resizeMode="stretch" />

              <View style={styles.leftBinding} />
              <View style={styles.rightShade} />

              {marked && (
                <View style={styles.bookmarkRibbon}>
                  <Ionicons name="bookmark" size={18} color="#FFFFFF" />
                </View>
              )}

              {item.fallback && (
                <View style={styles.fallbackBadge}>
                  <Text style={styles.fallbackText}>Preview</Text>
                </View>
              )}

              <View style={styles.pageBadge}>
                <Text style={styles.pageBadgeText}>Page {item.page_no}</Text>
              </View>
            </Pressable>
          )}
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.roundBtn}>
          <Ionicons name="chevron-back" size={25} color="#111827" />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text style={styles.subTitle}>
            Page {pageLabel} {isCurrentBookmarked ? "• Bookmarked" : ""}
          </Text>
        </View>

        <Pressable
          onPress={() => setShowBookmarks(true)}
          style={[styles.roundBtn, styles.bookmarkListBtn]}
        >
          <Ionicons name="bookmarks-outline" size={22} color="#2563EB" />
        </Pressable>
      </View>

      <View style={styles.readerArea}>
        <Animated.FlatList
          data={pages}
          ref={listRef}
          keyExtractor={(item) => String(item.page_no)}
          renderItem={renderPage}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          getItemLayout={(_, index) => ({
            length: pageWidth,
            offset: pageWidth * index,
            index,
          })}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
            }, 300);
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={[styles.empty, { width: pageWidth, height: availableHeight }]}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.emptyText}>Loading book...</Text>
            </View>
          }
        />
      </View>
      

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable onPress={handleBookmark} style={styles.primaryFooterBtn}>
          <Ionicons
            name={isCurrentBookmarked ? "bookmark" : "bookmark-outline"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.primaryFooterText}>
            {isCurrentBookmarked ? "Remove Bookmark" : "Bookmark Page"}
          </Text>
        </Pressable>

        <View style={styles.pagePill}>
          <Ionicons name="book-outline" size={16} color="#2563EB" />
          <Text style={styles.pagePillText}>{pageLabel}</Text>
        </View>
      </View>

      {loading && pages.length > 0 && (
        <View style={[styles.loadingFloat, { bottom: footerHeight + 12 }]}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingFloatText}>Loading...</Text>
        </View>
      )}

      <Modal visible={!!zoomImage} animationType="fade" transparent>
        <View style={styles.zoomOverlay}>
          <View style={styles.zoomTopBar}>
            <Pressable style={styles.zoomRoundBtn} onPress={() => setZoomImage(null)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.zoomTitle}>Zoom</Text>

            <Pressable style={styles.zoomRoundBtn} onPress={() => setZoomScale(1)}>
              <Ionicons name="refresh" size={21} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.zoomScroll}
            contentContainerStyle={styles.zoomContent}
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.zoomInnerContent}
            >
              {zoomImage && (
                <Image
                  source={{ uri: zoomImage }}
                  style={{
                    width: screen.width * zoomScale,
                    height: screen.width * A4_RATIO * zoomScale,
                  }}
                  resizeMode="contain"
                />
              )}
            </ScrollView>
          </ScrollView>

          <View style={styles.zoomControls}>
            <Pressable
              style={styles.zoomControlBtn}
              onPress={() => setZoomScale((v) => Math.max(1, Number((v - 0.25).toFixed(2))))}
            >
              <Ionicons name="remove" size={22} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.zoomScaleText}>{Math.round(zoomScale * 100)}%</Text>

            <Pressable
              style={styles.zoomControlBtn}
              onPress={() => setZoomScale((v) => Math.min(4, Number((v + 0.25).toFixed(2))))}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showBookmarks} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bookmarkSheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Bookmarks</Text>
                <Text style={styles.sheetSubTitle}>{bookmarks.length} saved pages</Text>
              </View>

              <Pressable onPress={() => setShowBookmarks(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            </View>

            <FlatList
              data={bookmarks}
              keyExtractor={(item) => String(item.id || item.page_no)}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.noBookmarkBox}>
                  <Ionicons name="bookmark-outline" size={34} color="#94A3B8" />
                  <Text style={styles.noBookmarkText}>Abhi koi bookmark nahi hai.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <Pressable onPress={() => jumpToPage(Number(item.page_no))} style={styles.bookmarkRow}>
                  <View style={styles.bookmarkIconBox}>
                    <Ionicons name="bookmark" size={18} color="#2563EB" />
                  </View>

                  <View style={styles.bookmarkInfo}>
                    <Text style={styles.bookmarkPageText}>Page {item.page_no}</Text>
                    <Text style={styles.bookmarkDateText}>Tap to open this page</Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 64,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  roundBtn: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bookmarkListBtn: { backgroundColor: "#EFF6FF", borderColor: "#DBEAFE" },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 12 },
  title: { color: "#0F172A", fontSize: 16, fontWeight: "900" },
  subTitle: { marginTop: 2, color: "#64748B", fontSize: 12, fontWeight: "700" },
  readerArea: { flex: 1, backgroundColor: "#F1F5F9" },
  slide: { alignItems: "center", justifyContent: "center" },
  pageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  imageTapArea: { width: "100%", height: "100%" },
  pageImage: { width: "100%", height: "100%", backgroundColor: "#FFFFFF" },
  leftBinding: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: "rgba(15,23,42,0.08)",
  },
  rightShade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: "rgba(255,255,255,0.48)",
  },
  bookmarkRibbon: {
    position: "absolute",
    top: 0,
    right: 16,
    width: 34,
    height: 46,
    backgroundColor: "#2563EB",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pageBadge: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(15,23,42,0.66)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pageBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: "#64748B", fontSize: 14, fontWeight: "700" },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryFooterBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    elevation: 4,
  },
  primaryFooterText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  pagePill: {
    height: 48,
    minWidth: 70,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
  },
  pagePillText: { color: "#1E3A8A", fontSize: 13, fontWeight: "900" },
  loadingFloat: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 5,
  },
  loadingFloatText: { color: "#475569", fontSize: 12, fontWeight: "800" },
  zoomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)" },
  zoomClose: {
    position: "absolute",
    top: 46,
    right: 18,
    zIndex: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomScroll: { flex: 1 },
  zoomContent: { minHeight: "100%", alignItems: "center", justifyContent: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    justifyContent: "flex-end",
  },
  bookmarkSheet: {
    maxHeight: "72%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  sheetTitle: { color: "#0F172A", fontSize: 20, fontWeight: "900" },
  sheetSubTitle: { marginTop: 3, color: "#64748B", fontSize: 13, fontWeight: "700" },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bookmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  bookmarkIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bookmarkInfo: { flex: 1 },
  bookmarkPageText: { color: "#0F172A", fontSize: 15, fontWeight: "900" },
  bookmarkDateText: { marginTop: 3, color: "#64748B", fontSize: 12, fontWeight: "700" },
  noBookmarkBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  noBookmarkText: { color: "#64748B", fontSize: 14, fontWeight: "700" },
  fallbackBadge: {
  position: "absolute",
  top: 10,
  left: 10,
  backgroundColor: "rgba(37,99,235,0.9)",
  paddingHorizontal: 10,
  paddingVertical: 5,
  borderRadius: 999,
},
fallbackText: {
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: "900",
},
zoomTopBar: {
  height: 82,
  paddingHorizontal: 18,
  paddingTop: 34,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},
zoomRoundBtn: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "rgba(255,255,255,0.18)",
  alignItems: "center",
  justifyContent: "center",
},
zoomTitle: {
  color: "#FFFFFF",
  fontSize: 15,
  fontWeight: "900",
},
zoomControls: {
  position: "absolute",
  bottom: 28,
  alignSelf: "center",
  flexDirection: "row",
  alignItems: "center",
  gap: 16,
  backgroundColor: "rgba(255,255,255,0.16)",
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 999,
},
zoomControlBtn: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "rgba(255,255,255,0.18)",
  alignItems: "center",
  justifyContent: "center",
},
zoomScaleText: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "900",
  minWidth: 44,
  textAlign: "center",
},
zoomInnerContent: {
  minHeight: "100%",
  alignItems: "center",
  justifyContent: "center",
},
});