import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  StatusBar,
  Platform,
  RefreshControl,
} from "react-native";
import CachedRemoteImage from "../../components/CachedRemoteImage";
import { Ionicons } from "@expo/vector-icons";
import CustomAlert from "../extrascreens/CustomAlert";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, EbookSeriesItem } from "../../types";
import { EbookAPI } from "../../api/ebook.api";
import { EbookDb } from "../../db/ebookDb";
import { recordError } from "../../utils/crashlytics";

type Props = NativeStackScreenProps<RootStackParamList, "StudyMaterial">;

type StudyMaterialItem = EbookSeriesItem & {
  image_url?: any;
};

export default function StudyMaterialScreen({ navigation }: Props) {
  const [items, setItems] = useState<StudyMaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
  });

  const getImageUrl = (item: StudyMaterialItem) => {
    if (!item.image_url) return "";

    if (typeof item.image_url === "string") {
      return item.image_url.trim();
    }

    if (item.image_url?.Valid && item.image_url?.String) {
      return item.image_url.String;
    }

    return "";
  };

  const loadStudyMaterial = useCallback(async (showLoader = false) => {
    try {
      setErrorMessage("");

      if (showLoader) setLoading(true);

      const cached = EbookDb.getStudyMaterial();

      if (cached.length > 0) {
        setItems(cached as any);
        setLoading(false);
      }

      const res = await EbookAPI.getStudyMaterial();

      const rawList = Array.isArray(res.data) ? res.data : res.data?.data;

        if (!Array.isArray(rawList)) {
          recordError(res.data, "StudyMaterialScreen: invalid API response format");
        }

        const list = Array.isArray(rawList) ? rawList : [];

      const sorted = [...list].sort(
        (a: any, b: any) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );

      EbookDb.saveStudyMaterial(sorted);
      setItems(sorted);
       } catch (error: any) {
        const errorData = error?.response?.data || error?.message || error;

        console.log("Study material load error:", errorData);

        recordError(error, "StudyMaterialScreen: load study material failed");

        const cached = EbookDb.getStudyMaterial();

        if (cached.length > 0) {
          setItems(cached as any);
          setErrorMessage("Internet/server issue hai. Cached study material dikha rahe hain.");
          return;
        }

        setErrorMessage(
          "Study material load nahi ho paaya. Internet check karke retry karo."
        );

        setAlertData({
          title: "Unable to Load",
          message: "Study material load nahi ho paaya. Please retry.",
        });

        setAlertVisible(true);
      } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudyMaterial(true);
  }, [loadStudyMaterial]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudyMaterial(false);
    setRefreshing(false);
  };

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const unique = Array.from(new Map(items.map((item) => [item.id, item])).values());

    if (!keyword) return unique;

    return unique.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";

      return title.includes(keyword) || description.includes(keyword);
    });
  }, [items, search]);

  const openStudyMaterial = (item: StudyMaterialItem) => {
    navigation.navigate("EbookNodes", {
      seriesId: item.id,
      seriesTitle: item.title,
      parentId: null,
      parentTitle: item.title,
    });
  };

  const renderCard = ({ item }: { item: StudyMaterialItem }) => {
    const imageUrl = getImageUrl(item);

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.card}
        onPress={() => openStudyMaterial(item)}
      >
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <CachedRemoteImage
                uri={imageUrl}
                style={styles.seriesImage}
              />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="library-outline" size={48} color="#2563eb" />
              <Text style={styles.placeholderText}>Study Material</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || "Best notes, books and practice material."}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.miniChip}>
              <Ionicons name="document-text-outline" size={15} color="#2563eb" />
              <Text style={styles.miniChipText}>Notes & Books</Text>
            </View>

            <View style={styles.miniChip}>
              <Ionicons name="shield-checkmark-outline" size={15} color="#16a34a" />
              <Text style={styles.miniChipText}>Included</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Preparation Resource</Text>
              <Text style={styles.infoValue}>Open and start learning</Text>
            </View>

            <View style={styles.infoIconWrap}>
              <Ionicons name="school-outline" size={24} color="#2563eb" />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.exploreBtn}
            onPress={() => openStudyMaterial(item)}
          >
            <Text style={styles.exploreText}>
              {item.explore_text || "Explore Now"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
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
          <Text style={styles.loadingText}>Loading study material...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.container}>
        <View style={styles.header}>
          <CustomAlert
            visible={alertVisible}
            title={alertData.title}
            message={alertData.message}
            onClose={() => setAlertVisible(false)}
          />

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={22} color="#64748b" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search study material..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />

            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.resultRow}>
              <Text style={styles.resultTitle}>Study Material</Text>
              <Text style={styles.resultCount}>{filteredItems.length} found</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="folder-open-outline" size={46} color="#94a3b8" />

              <Text style={styles.emptyTitle}>
                {errorMessage ? "Unable to load study material" : "No study material found"}
              </Text>

              <Text style={styles.emptyText}>
                {errorMessage || "Try refreshing or search another keyword."}
              </Text>

              {errorMessage ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.retryBtn}
                  onPress={() => loadStudyMaterial(true)}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
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
    flex: 1,
    height: "100%",
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "700",
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
  listContent: { paddingHorizontal: 18, paddingBottom: 30 },
  resultRow: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  resultCount: { fontSize: 13, fontWeight: "800", color: "#64748b" },
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
  seriesImage: { width: "100%", height: "100%", resizeMode: "cover" },
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
  cardBody: { padding: 18 },
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
  metaRow: { flexDirection: "row", gap: 10, marginTop: 14, flexWrap: "wrap" },
  miniChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
  },
  miniChipText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "900",
    color: "#475569",
  },
  infoBox: {
    marginTop: 14,
    backgroundColor: "#eff6ff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },
  infoValue: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "900",
    color: "#2563eb",
  },
  retryBtn: {
  marginTop: 16,
  height: 44,
  paddingHorizontal: 24,
  borderRadius: 14,
  backgroundColor: "#2563eb",
  justifyContent: "center",
  alignItems: "center",
},
retryText: {
  color: "#ffffff",
  fontSize: 14,
  fontWeight: "900",
},
  infoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  exploreBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  exploreText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginRight: 5,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
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