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
import { useFocusEffect } from "@react-navigation/native";

import { RootStackParamList, EbookNode } from "../../types";
import { EbookAPI } from "../../api/ebook.api";
import { EbookDb } from "../../db/ebookDb";

type Props = NativeStackScreenProps<RootStackParamList, "EbookNodes">;

const PDF_BASE_URL = "https://your-domain.com/uploads/";

export default function EbookNodesScreen({ route, navigation }: Props) {
  const { seriesId, seriesTitle, parentId, parentTitle } = route.params;

  const [nodes, setNodes] = useState<EbookNode[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const safeParentId = parentId || null;

  const getNodeTitle = (node: EbookNode) => {
    return node.name || node.title || "Untitled";
  };

  const normalizeNodeType = (node: EbookNode) => {
    if (node.type === "pdf") return "file";
    return node.type;
  };

  const isDemoUnlocked = (node: any) => {
    return node?.is_demo === true || node?.is_demo === 1 || node?.is_demo === "true";
  };

  const canOpenNode = (node: EbookNode) => {
    return hasAccess || isDemoUnlocked(node);
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

    if (cleanUrl.startsWith("https://")) return cleanUrl;
    if (cleanUrl.startsWith("http://")) return null;
    if (cleanUrl.includes("..")) return null;

    return `${PDF_BASE_URL}${encodeURIComponent(cleanUrl)}`;
  };

  const loadNodes = useCallback(
    async (showLoader = false) => {
      try {
        if (showLoader) setLoading(true);

        const cachedNodes = EbookDb.getNodes(seriesId, safeParentId);

        if (cachedNodes.length > 0) {
          const cachedAccess = EbookDb.getSeriesAccess(seriesId);

          setHasAccess(cachedAccess.hasAccess || cachedAccess.isFree);
          setNodes(sortNodesOrderWise(cachedNodes as any));
          setLoading(false);
        }

        const res = await EbookAPI.getNodes(seriesId, safeParentId);

        const apiNodes: EbookNode[] = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        const access =
          res.data?.has_access === true ||
          res.data?.is_free === true ||
          res.data?.has_access === 1 ||
          res.data?.is_free === 1;

        const normalizedNodes: EbookNode[] = apiNodes.map((item: any) => ({
          ...item,
          id: item.id,
          series_id: item.series_id || seriesId,
          name: item.name || item.title || "Untitled",
          title: item.title || item.name || "Untitled",
          type: item.type || "file",
          parent_id: item.parent_id ?? safeParentId,
          file_url: item.file_url || null,
          is_demo:
            item.is_demo === true ||
            item.is_demo === 1 ||
            item.is_demo === "true",
          order: Number(item.order ?? item.sort_order ?? 0),
          sort_order: Number(item.sort_order ?? item.order ?? 0),
          created_at: item.created_at || "",
          has_children: item.has_children === true || item.type === "folder",
        }));

        EbookDb.saveNodes(seriesId, safeParentId, normalizedNodes as any);

        setHasAccess(access);
        setNodes(sortNodesOrderWise(normalizedNodes as any));
      } catch (error: any) {
        console.log("Ebook nodes error:", error?.response?.data || error.message);

        const cachedNodes = EbookDb.getNodes(seriesId, safeParentId);

        if (cachedNodes.length > 0) {
          setNodes(sortNodesOrderWise(cachedNodes as any));
        } else {
          Alert.alert("Error", "Ebook content load failed");
        }
      } finally {
        setLoading(false);
      }
    },
    [seriesId, safeParentId]
  );

  useEffect(() => {
    loadNodes(true);
  }, [loadNodes]);

  useFocusEffect(
    useCallback(() => {
      loadNodes(false);
    }, [loadNodes])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNodes(false);
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

  const showPurchaseAlert = () => {
    Alert.alert(
      "Purchase Required",
      "Please purchase this series first, then you can access ebook files."
    );
  };

  const openNode = async (node: EbookNode) => {
    if (!canOpenNode(node)) {
      showPurchaseAlert();
      return;
    }

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
      Alert.alert("Invalid File", "Only secure HTTPS PDF files are allowed.");
      return;
    }

    navigation.navigate("PdfViewer", {
      title: getNodeTitle(node),
      fileUrl: securePdfUrl,
    });
  };

  const renderNode = ({ item }: { item: EbookNode }) => {
    const type = normalizeNodeType(item);
    const isFolder = type === "folder";
    const isDemo = isDemoUnlocked(item);
    const unlocked = canOpenNode(item);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => openNode(item)}
      >
        <View
          style={[
            styles.iconBox,
            isDemo ? styles.demoIconBox : isFolder ? styles.folderIconBox : styles.fileIconBox,
          ]}
        >
          <Ionicons
            name={
              !unlocked
                ? "lock-closed-outline"
                : isDemo
                ? "sparkles-outline"
                : isFolder
                ? "folder-open-outline"
                : "document-text-outline"
            }
            size={34}
            color={!unlocked ? "#f97316" : isDemo ? "#059669" : isFolder ? "#d97706" : "#2563eb"}
          />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <View
              style={[
                styles.typeBadge,
                isDemo ? styles.demoBadge : isFolder ? styles.folderBadge : styles.fileBadge,
              ]}
            >
              <Ionicons
                name={
                  !unlocked
                    ? "lock-closed-outline"
                    : isDemo
                    ? "gift-outline"
                    : isFolder
                    ? "albums-outline"
                    : "reader-outline"
                }
                size={13}
                color={!unlocked ? "#c2410c" : isDemo ? "#047857" : isFolder ? "#92400e" : "#1d4ed8"}
              />

              <Text
                style={[
                  styles.typeBadgeText,
                  isDemo ? styles.demoBadgeText : isFolder ? styles.folderBadgeText : styles.fileBadgeText,
                ]}
              >
                {!unlocked ? "Locked" : isDemo ? "Free Demo" : isFolder ? "Folder" : "PDF / File"}
              </Text>
            </View>

            <Ionicons
              name={
                !unlocked
                  ? "lock-closed-outline"
                  : isFolder
                  ? "chevron-forward"
                  : "open-outline"
              }
              size={21}
              color="#94a3b8"
            />
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {getNodeTitle(item)}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {!unlocked
              ? "Purchase this series first, then you can access this ebook content."
              : isDemo
              ? "Free demo unlocked. Tap to preview this ebook content."
              : isFolder
              ? item.has_children
                ? "Open this folder to view chapters and files."
                : "Folder available for ebook content."
              : "Tap to open and read this ebook inside the app."}
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.infoChip}>
              <Ionicons
                name={
                  !unlocked
                    ? "lock-closed-outline"
                    : isDemo
                    ? "gift-outline"
                    : isFolder
                    ? "layers-outline"
                    : "book-outline"
                }
                size={16}
                color="#475569"
              />

              <Text style={styles.infoChipText}>
                {!unlocked
                  ? "Purchase Required"
                  : isDemo
                  ? "Demo Access"
                  : isFolder
                  ? "Chapter Folder"
                  : "Reading Material"}
              </Text>
            </View>

            <View
              style={[
                styles.exploreBtn,
                !unlocked && styles.lockedBtn,
                isDemo && styles.demoBtn,
              ]}
            >
              <Text style={styles.exploreText}>
                {!unlocked ? "Buy First" : isDemo ? "Preview" : isFolder ? "Open" : "Read"}
              </Text>

              <Ionicons
                name={
                  !unlocked
                    ? "lock-closed-outline"
                    : isFolder
                    ? "chevron-forward"
                    : "open-outline"
                }
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
              placeholder="Search files or folders..."
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
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderNode}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              <View style={styles.titleBox}>
                <Text style={styles.screenTitle} numberOfLines={2}>
                  {parentTitle || seriesTitle}
                </Text>

                <View
                  style={[
                    styles.accessBadge,
                    hasAccess ? styles.accessBadgeOk : styles.accessBadgeLocked,
                  ]}
                >
                  <Ionicons
                    name={
                      hasAccess
                        ? "checkmark-circle-outline"
                        : "lock-closed-outline"
                    }
                    size={14}
                    color="#ffffff"
                  />
                  <Text style={styles.accessBadgeText}>
                    {hasAccess ? "Access Available" : "Purchase Required"}
                  </Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Ionicons name="folder-outline" size={21} color="#d97706" />
                  <Text style={styles.statValue}>{folderCount}</Text>
                  <Text style={styles.statLabel}>Folders</Text>
                </View>

                <View style={styles.statCard}>
                  <Ionicons
                    name="document-text-outline"
                    size={21}
                    color="#2563eb"
                  />
                  <Text style={styles.statValue}>{fileCount}</Text>
                  <Text style={styles.statLabel}>Files</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="folder-open-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No ebook content found</Text>
              <Text style={styles.emptyText}>
                Try refreshing or searching another keyword.
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748b", fontWeight: "800" },
  header: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 6,
  },
  searchBox: {
    height: 52,
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
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
  },
  clearBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
  },
  listContent: { paddingHorizontal: 18, paddingBottom: 24 },
  titleBox: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  screenTitle: {
    color: "#0f172a",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "900",
  },
  accessBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  accessBadgeOk: { backgroundColor: "#16a34a" },
  accessBadgeLocked: { backgroundColor: "#f97316" },
  accessBadgeText: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: {
    marginTop: 5,
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 12,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },
  folderIconBox: { backgroundColor: "#fef3c7" },
  fileIconBox: { backgroundColor: "#eff6ff" },
  demoIconBox: { backgroundColor: "#d1fae5" },
  cardBody: { flex: 1 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  folderBadge: { backgroundColor: "#fef3c7" },
  fileBadge: { backgroundColor: "#dbeafe" },
  demoBadge: { backgroundColor: "#d1fae5" },
  typeBadgeText: { fontSize: 11, fontWeight: "900" },
  folderBadgeText: { color: "#92400e" },
  fileBadgeText: { color: "#1d4ed8" },
  demoBadgeText: { color: "#047857" },
  cardTitle: {
    marginTop: 10,
    color: "#0f172a",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  cardDescription: {
    marginTop: 5,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  footerRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  infoChip: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoChipText: { color: "#475569", fontSize: 11, fontWeight: "900" },
  exploreBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lockedBtn: { backgroundColor: "#f97316" },
  demoBtn: { backgroundColor: "#10b981" },
  exploreText: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  emptyBox: {
    marginTop: 55,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  emptyText: {
    marginTop: 5,
    color: "#64748b",
    fontWeight: "700",
    textAlign: "center",
  },
});