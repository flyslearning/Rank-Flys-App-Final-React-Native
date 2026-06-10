import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CachedRemoteImage from "../components/CachedRemoteImage";
import {
  fetchSearchData,
  filterSearchData,
  GlobalSearchItem,
} from "../api/search.api";

export default function GlobalSearchScreen({ navigation }: any) {
  const [query, setQuery] = useState("");
  const [allData, setAllData] = useState<GlobalSearchItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadSearchData = async () => {
      try {
        setInitialLoading(true);
        const data = await fetchSearchData();
        setAllData(data);
      } catch (error) {
        console.log("Search data load error:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadSearchData();
  }, []);

  const results = useMemo(() => {
    return filterSearchData(allData, query);
  }, [allData, query]);

  const getImageUrl = (item: any) => {
    const image =
      item?.raw?.image_url ||
      item?.raw?.thumbnail ||
      item?.raw?.cover_image ||
      item?.raw?.banner_url;

    if (!image) return "";
    if (typeof image === "string") return image.trim();
    if (image?.Valid && image?.String) return image.String;

    return "";
  };

  const getTypeLabel = (type: string) => {
    if (type === "ebook_series") return "Ebook";
    if (type === "study_material") return "Study";
    if (type === "test_series") return "Test";
    if (type === "mentorship") return "Mentorship";
    return "Content";
  };

  const getFullTypeLabel = (type: string) => {
    if (type === "ebook_series") return "Ebook Series";
    if (type === "study_material") return "Study Material";
    if (type === "test_series") return "Test Series";
    if (type === "mentorship") return "Mentorship";
    return "Learning Content";
  };

  const getTypeIcon = (type: string) => {
    if (type === "ebook_series") return "book-outline";
    if (type === "study_material") return "library-outline";
    if (type === "test_series") return "document-text-outline";
    if (type === "mentorship") return "person-outline";
    return "school-outline";
  };

  const openItem = (item: GlobalSearchItem) => {
    Keyboard.dismiss();

    if (item.type === "ebook_series") {
      navigation.navigate("EbookNodes", {
        seriesId: item.id,
        seriesTitle: item.title,
        parentId: null,
        parentTitle: item.title,
      });
      return;
    }

    if (item.type === "study_material") {
      navigation.navigate("StudyMaterial");
      return;
    }

    if (item.type === "test_series") {
      navigation.navigate("Tests", { seriesId: item.id });
      return;
    }

    if (item.type === "mentorship") {
      navigation.navigate("MentorshipSeries", { mentorshipId: item.id });
    }
  };

  const renderCard = ({ item }: { item: GlobalSearchItem }) => {
    const imageUrl = getImageUrl(item);
    const typeIcon = getTypeIcon(item.type);
    const shortType = getTypeLabel(item.type);
    const fullType = getFullTypeLabel(item.type);

    const description =
      item.raw?.description ||
      item.raw?.short_description ||
      item.subtitle ||
      "Explore this content and continue your preparation.";

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.card}
        onPress={() => openItem(item)}
      >
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <CachedRemoteImage uri={imageUrl} style={styles.seriesImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name={typeIcon as any} size={42} color="#2563EB" />
              <Text style={styles.placeholderText}>{fullType}</Text>
            </View>
          )}

          <View style={styles.typeBadge}>
            <Ionicons name={typeIcon as any} size={13} color="#FFFFFF" />
            <Text style={styles.typeBadgeText} numberOfLines={1}>
              {shortType}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {description}
          </Text>

          <View style={styles.infoBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {fullType}
              </Text>
            </View>

            <View style={styles.infoIconWrap}>
              <Ionicons name={typeIcon as any} size={22} color="#2563EB" />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.exploreBtn}
            onPress={() => openItem(item)}
          >
            <Text style={styles.exploreText}>Explore Now</Text>
            <Ionicons name="chevron-forward" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const showInitial = query.trim().length < 2;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color="#2563EB" />
            </TouchableOpacity>

            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search content..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              cursorColor="#2563EB"
              textAlignVertical="center"
              returnKeyType="search"
              numberOfLines={1}
            />

            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery("")}
                style={styles.clearBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={17} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {initialLoading ? (
          <View style={styles.loadingBox}>
            <View style={styles.loadingCard}>
              <View style={styles.loaderCircle}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
              <Text style={styles.loadingTitle}>Please wait</Text>
              <Text style={styles.loadingText}>Preparing search...</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
            renderItem={renderCard}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              showInitial ? (
                <View style={styles.startBox}>
                  <Ionicons name="search-outline" size={42} color="#2563EB" />
                  <Text style={styles.startTitle}>Search content</Text>
                  <Text style={styles.startText} numberOfLines={2}>
                    Find ebooks, tests, mentorship and study material.
                  </Text>
                </View>
              ) : (
                <View style={styles.resultRow}>
                  <Text style={styles.resultTitle}>Search Results</Text>
                  <Text style={styles.resultCount}>{results.length} found</Text>
                </View>
              )
            }
            ListEmptyComponent={
              !showInitial ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="search-outline" size={42} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No result found</Text>
                  <Text style={styles.emptyText}>Try another keyword.</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 48 : 22,
    paddingBottom: 14,
    backgroundColor: "#F8FAFC",
  },
  searchBox: {
    height: 52,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 52,
    marginLeft: 10,
    marginRight: 6,
    paddingVertical: 0,
    includeFontPadding: false,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  resultRow: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 6,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#DBEAFE",
    position: "relative",
  },
  seriesImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#2563EB",
  },
  typeBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    maxWidth: 125,
    backgroundColor: "#111827",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  typeBadgeText: {
    marginLeft: 5,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    maxWidth: 92,
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#64748B",
  },
  infoBox: {
    marginTop: 14,
    backgroundColor: "#EFF6FF",
    borderRadius: 17,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },
  infoValue: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
    color: "#2563EB",
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  exploreBtn: {
    marginTop: 14,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  exploreText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginRight: 4,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 6,
  },
  loaderCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  loadingText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
  startBox: {
    marginTop: 52,
    padding: 26,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  startTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  startText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  emptyBox: {
    marginTop: 52,
    padding: 26,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
});