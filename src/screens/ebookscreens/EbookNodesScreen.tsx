import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, EbookNode } from "../../types";
import { EbookAPI } from "../../api/ebook.api";

type Props = NativeStackScreenProps<RootStackParamList, "EbookNodes">;

const PDF_BASE_URL = "https://your-domain.com/uploads/";

export default function EbookNodesScreen({ route, navigation }: Props) {
  const { seriesId, seriesTitle, parentId, parentTitle } = route.params;

  const [nodes, setNodes] = useState<EbookNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const getNodeTitle = (node: EbookNode) => {
    return node.name || node.title || "Untitled";
  };

  const normalizeNodeType = (node: EbookNode) => {
    if (node.type === "pdf") return "file";
    return node.type;
  };

  const sortNodesOrderWise = (data: EbookNode[]) => {
    return [...data].sort((a: any, b: any) => {
      const orderA = Number(a.order ?? a.sort_order ?? 0);
      const orderB = Number(b.order ?? b.sort_order ?? 0);

      if (orderA !== orderB) return orderA - orderB;

      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      if (dateA !== dateB) return dateA - dateB;

      return getNodeTitle(a).localeCompare(getNodeTitle(b));
    });
  };

  const getSecurePdfUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return null;

    const cleanUrl = fileUrl.trim();

    if (cleanUrl.startsWith("https://")) {
      return cleanUrl;
    }

    if (cleanUrl.startsWith("http://")) {
      return null;
    }

    if (cleanUrl.includes("..")) {
      return null;
    }

    return `${PDF_BASE_URL}${encodeURIComponent(cleanUrl)}`;
  };

  const loadNodes = useCallback(async () => {
    try {
      setLoading(true);

      const res = await EbookAPI.getNodes(seriesId, parentId || null);
      const data: EbookNode[] = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setNodes(sortNodesOrderWise(data));
    } catch (error: any) {
      console.log("Ebook nodes error:", error?.response?.data || error.message);
      Alert.alert("Error", "Ebook content load failed");
    } finally {
      setLoading(false);
    }
  }, [seriesId, parentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNodes();
    setRefreshing(false);
  };

  const uniqueNodes = useMemo(() => {
    const map = new Map<string, EbookNode>();

    nodes.forEach((item) => {
      map.set(item.id, item);
    });

    return sortNodesOrderWise(Array.from(map.values()));
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const filtered = !keyword
      ? uniqueNodes
      : uniqueNodes.filter((item) => {
          const title = getNodeTitle(item).toLowerCase();
          const type = normalizeNodeType(item)?.toLowerCase() || "";
          return title.includes(keyword) || type.includes(keyword);
        });

    return sortNodesOrderWise(filtered);
  }, [uniqueNodes, search]);

  const folderCount = useMemo(() => {
    return uniqueNodes.filter((item) => normalizeNodeType(item) === "folder")
      .length;
  }, [uniqueNodes]);

  const fileCount = useMemo(() => {
    return uniqueNodes.filter((item) => normalizeNodeType(item) !== "folder")
      .length;
  }, [uniqueNodes]);

  const openNode = async (node: EbookNode) => {
    const type = normalizeNodeType(node);

    if (type === "folder") {
      navigation.push("EbookNodes", {
        seriesId,
        seriesTitle,
        parentId: node.id,
        parentTitle: getNodeTitle(node),
      });
      return;
    }

    const securePdfUrl = getSecurePdfUrl(node.file_url);

    if (!securePdfUrl) {
      Alert.alert(
        "Invalid File",
        "Only secure HTTPS PDF files are allowed."
      );
      return;
    }

    navigation.navigate("PdfViewer", {
      title: getNodeTitle(node),
      fileUrl: securePdfUrl,
    });
  };

  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  const renderNode = ({ item }: { item: EbookNode }) => {
    const type = normalizeNodeType(item);
    const isFolder = type === "folder";

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => openNode(item)}
      >
        <View
          style={[
            styles.iconBox,
            isFolder ? styles.folderIconBox : styles.fileIconBox,
          ]}
        >
          <Ionicons
            name={isFolder ? "folder-open-outline" : "document-text-outline"}
            size={34}
            color={isFolder ? "#d97706" : "#2563eb"}
          />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <View
              style={[
                styles.typeBadge,
                isFolder ? styles.folderBadge : styles.fileBadge,
              ]}
            >
              <Ionicons
                name={isFolder ? "albums-outline" : "reader-outline"}
                size={13}
                color={isFolder ? "#92400e" : "#1d4ed8"}
              />

              <Text
                style={[
                  styles.typeBadgeText,
                  isFolder ? styles.folderBadgeText : styles.fileBadgeText,
                ]}
              >
                {isFolder ? "Folder" : "PDF / File"}
              </Text>
            </View>

            <Ionicons
              name={isFolder ? "chevron-forward" : "open-outline"}
              size={21}
              color="#94a3b8"
            />
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {getNodeTitle(item)}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {isFolder
              ? item.has_children
                ? "Open this folder to view chapters and files."
                : "Folder available for ebook content."
              : "Tap to open and read this ebook inside the app."}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.infoChip}>
              <Ionicons
                name={isFolder ? "layers-outline" : "book-outline"}
                size={16}
                color="#475569"
              />

              <Text style={styles.infoChipText}>
                {isFolder ? "Chapter Folder" : "Reading Material"}
              </Text>
            </View>

            <View style={styles.exploreBtn}>
              <Text style={styles.exploreText}>
                {isFolder ? "Open" : "Read"}
              </Text>

              <Ionicons
                name={isFolder ? "chevron-forward" : "open-outline"}
                size={17}
                color="#ffffff"
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <View style={styles.container}>
        <View style={styles.header}>
          {parentId && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={19} color="#2563eb" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={22} color="#64748b" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search ebook content..."
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
          data={filteredNodes}
          keyExtractor={(item) => item.id}
          renderItem={renderNode}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.titleBox}>
                <Text style={styles.pageLabel}>EBOOK CONTENT</Text>

                <Text style={styles.pageTitle} numberOfLines={2}>
                  {parentTitle || seriesTitle}
                </Text>

                <Text style={styles.pageSubtitle}>
                  Open folders, chapters and PDF notes.
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Ionicons name="folder-outline" size={19} color="#d97706" />
                  <Text style={styles.statText}>{folderCount} Folders</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons
                    name="document-text-outline"
                    size={19}
                    color="#2563eb"
                  />
                  <Text style={styles.statText}>{fileCount} Files</Text>
                </View>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultTitle}>Available Content</Text>
                <Text style={styles.resultCount}>
                  {filteredNodes.length} found
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="file-tray-outline" size={46} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No content found</Text>
              <Text style={styles.emptyText}>
                This folder does not have any chapters or files.
              </Text>
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
  backButton: {
    alignSelf: "flex-start",
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButtonText: {
    marginLeft: 5,
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "900",
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
  listContent: { paddingHorizontal: 18, paddingBottom: 30 },
  titleBox: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pageLabel: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  pageTitle: {
    marginTop: 7,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900",
    color: "#0f172a",
  },
  pageSubtitle: {
    marginTop: 7,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  statText: {
    marginLeft: 7,
    color: "#475569",
    fontSize: 13,
    fontWeight: "900",
  },
  resultRow: {
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
    marginBottom: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 6,
    flexDirection: "row",
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  folderIconBox: { backgroundColor: "#fef3c7" },
  fileIconBox: { backgroundColor: "#dbeafe" },
  cardBody: { flex: 1, marginLeft: 14 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },
  folderBadge: { backgroundColor: "#fffbeb" },
  fileBadge: { backgroundColor: "#eff6ff" },
  typeBadgeText: { marginLeft: 4, fontSize: 11, fontWeight: "900" },
  folderBadgeText: { color: "#92400e" },
  fileBadgeText: { color: "#1d4ed8" },
  cardTitle: {
    marginTop: 9,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    color: "#0f172a",
  },
  cardDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
    color: "#64748b",
  },
  footerRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoChip: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
  },
  infoChipText: {
    marginLeft: 5,
    fontSize: 11,
    fontWeight: "900",
    color: "#475569",
  },
  exploreBtn: {
    height: 38,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 13,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
  },
  exploreText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 4,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#64748b",
  },
  emptyBox: {
    marginTop: 50,
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