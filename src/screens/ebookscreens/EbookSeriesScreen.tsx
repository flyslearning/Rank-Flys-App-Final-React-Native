import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  StatusBar,
  Platform,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, EbookSeriesItem } from "../../types";
import { EbookAPI } from "../../api/ebook.api";

type Props = NativeStackScreenProps<RootStackParamList, "EbookSeries">;

export default function EbookSeriesScreen({ navigation }: Props) {
  const [series, setSeries] = useState<EbookSeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const loadSeries = useCallback(async () => {
    try {
      setLoading(true);

      const res = await EbookAPI.getSeries();
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

      setSeries(data);
    } catch (error: any) {
      console.log("Ebook series error:", error?.response?.data || error.message);
      Alert.alert("Error", "Ebook series load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSeries();
    setRefreshing(false);
  };

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const uniqueSeries = useMemo(() => {
    const map = new Map<string, EbookSeriesItem>();

    series.forEach((item) => {
      map.set(`${item.id}-${item.title}`, item);
    });

    return Array.from(map.values());
  }, [series]);

  const filteredSeries = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return uniqueSeries;

    return uniqueSeries.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      return title.includes(keyword) || description.includes(keyword);
    });
  }, [uniqueSeries, search]);

  const renderCard = ({ item }: { item: EbookSeriesItem }) => {
    const imageUrl = item.image_url || "";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() =>
          navigation.navigate("EbookNodes", {
            seriesId: item.id,
            seriesTitle: item.title,
            parentId: null,
            parentTitle: item.title,
          })
        }
      >
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.seriesImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="book-outline" size={44} color="#2563eb" />
              <Text style={styles.placeholderText}>Ebook Series</Text>
            </View>
          )}

          <View style={styles.imageOverlay} />

          <View style={styles.testBadge}>
            <Ionicons name="library-outline" size={14} color="#ffffff" />
            <Text style={styles.testBadgeText}>Ebook</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || "Complete study material and ebook notes."}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.infoChip}>
              <Ionicons name="document-text-outline" size={16} color="#475569" />
              <Text style={styles.infoChipText}>Study Material</Text>
            </View>

            <View style={styles.exploreBtn}>
              <Text style={styles.exploreText}>
                {item.explore_text || "Explore Now"}
              </Text>
              <Ionicons name="chevron-forward" size={17} color="#ffffff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading ebooks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={22} color="#64748b" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search ebook series..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                style={styles.clearBtn}
              >
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredSeries}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.resultRow}>
              <Text style={styles.resultTitle}>Available Ebook Series</Text>
              <Text style={styles.resultCount}>
                {filteredSeries.length} found
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No ebooks found</Text>
              <Text style={styles.emptyText}>Try searching another keyword.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 14,
  },
  searchBox: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  searchInput: {
    fontFamily: "Geologica",
    flex: 1,
    height: "100%",
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "100",
    color: "#0f172a",
  },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 30,
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
    fontWeight: "100",
    fontFamily: "Geologica",
    color: "#0f172a",
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "100",
    fontFamily: "Geologica",
    color: "#64748b",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginBottom: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 7,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#dbeafe",
    position: "relative",
  },
  seriesImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eff6ff",
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#2563eb",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.08)",
  },
  testBadge: {
    position: "absolute",
    right: 14,
    bottom: 14,
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  testBadgeText: {
    marginLeft: 5,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  cardBody: {
    padding: 18,
  },
  cardTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: "900",
    color: "#0f172a",
  },
  cardDescription: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: "#64748b",
  },
  footerRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoChip: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
  },
  infoChipText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "900",
    color: "#475569",
  },
  exploreBtn: {
    height: 42,
    paddingLeft: 15,
    paddingRight: 11,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
  },
  exploreText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#64748b",
  },
  emptyBox: {
    marginTop: 60,
    padding: 28,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyTitle: {
    fontFamily: "Geologica",
    marginTop: 12,
    fontSize: 19,
    fontWeight: "900",
    color: "#0f172a",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
});