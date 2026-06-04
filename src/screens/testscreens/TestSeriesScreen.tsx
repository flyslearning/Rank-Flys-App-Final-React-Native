import React, { useEffect, useMemo, useState, useCallback } from "react";
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
} from "react-native";
import CachedRemoteImage from "../../components/CachedRemoteImage";
import CustomAlert from "../extrascreens/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, TestSeries } from "../../types";
import { TestAPI } from "../../api/test.api";
import {
  getTestSeriesLocal,
  saveTestSeries,
} from "../../db/testDb";

type Props = NativeStackScreenProps<RootStackParamList, "TestSeries">;

type SeriesWithCount = TestSeries & {
  price?: number;
  price_paise?: number;
  original_price_paise?: number;
  discount_price_paise?: number;
  discount_percent?: number;
  is_free?: boolean;
  has_access?: boolean;
  created_at?: string;
  image_url?: any;
};

const normalizeBool = (v: any) => v === true || v === 1 || v === "true";

const formatRupeesFromPaise = (paise: number) => {
  return `₹${Math.round(Number(paise || 0) / 100)}`;
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

export default function TestSeriesScreen({ navigation }: Props) {
  const [series, setSeries] = useState<SeriesWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
  });

  const loadSeries = useCallback(async () => {
    try {
      const localData = getTestSeriesLocal() as SeriesWithCount[];

      if (localData.length > 0) {
        setSeries(localData);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const res = await TestAPI.getTestSeries();
      const seriesList = res.data?.data || [];

      const sortedSeries = [...seriesList].sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const seriesWithCounts = sortedSeries;

      saveTestSeries(seriesWithCounts);

      const updatedLocalData = getTestSeriesLocal() as SeriesWithCount[];
      setSeries(updatedLocalData);
    } catch (error: any) {
      console.log("Test series not found:", error.response?.data || error.message);

      const localData = getTestSeriesLocal() as SeriesWithCount[];

      if (localData.length > 0) {
        setSeries(localData);
      } else {
        setAlertData({
          title: "Not Found 😢",
          message: "Test series not found",
        });

        setAlertVisible(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeries();
  }, [loadSeries]);

  const filteredSeries = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return series;

    return series.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      return title.includes(keyword) || description.includes(keyword);
    });
  }, [series, search]);

  const openSeriesDetails = (item: SeriesWithCount) => {
    navigation.navigate("Tests", { seriesId: item.id });
  };

  const buySeries = (item: SeriesWithCount) => {
    navigation.navigate("CheckoutScreen", {
      item,
      content_id: item.id,
      content_type: "test_series",
    });
  };

  const getPrice = (item: SeriesWithCount) => {
    if (normalizeBool(item.is_free)) return "FREE";

    const discountPricePaise = getDiscountPricePaise(item);

    if (discountPricePaise > 0) {
      return formatRupeesFromPaise(discountPricePaise);
    }

    if (typeof item.price === "number") return `₹${item.price}`;

    return `₹${Math.round((item.price_paise || 0) / 100)}`;
  };

  const renderPriceBlock = (item: SeriesWithCount) => {
    const isFree = normalizeBool(item.is_free);
    const hasAccess = normalizeBool(item.has_access);

    if (isFree) return <Text style={styles.priceValue}>FREE</Text>;
    if (hasAccess) return <Text style={styles.priceValue}>Unlocked</Text>;

    const originalPricePaise = getOriginalPricePaise(item);
    const discountPricePaise = getDiscountPricePaise(item);
    const discountPercent = getDiscountPercent(item);

    const hasDiscount =
      originalPricePaise > 0 &&
      discountPricePaise > 0 &&
      discountPricePaise < originalPricePaise;

    return (
      <View>
        <View style={styles.priceLine}>
          <Text style={styles.priceValue}>{getPrice(item)}</Text>

          {hasDiscount && (
            <Text style={styles.cutPrice}>
              {formatRupeesFromPaise(originalPricePaise)}
            </Text>
          )}
        </View>

        {hasDiscount && discountPercent > 0 && (
          <Text style={styles.offText}>{discountPercent}% OFF</Text>
        )}
      </View>
    );
  };

  const renderCard = ({ item }: { item: SeriesWithCount }) => {
    const imageUrl =
      item.image_url?.Valid && item.image_url?.String
        ? item.image_url.String
        : typeof item.image_url === "string"
        ? item.image_url
        : "";

    const isFree = normalizeBool(item.is_free);
    const hasAccess = normalizeBool(item.has_access);
    const isLockedPaid = !isFree && !hasAccess;
    const discountPercent = getDiscountPercent(item);

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.card}
        onPress={() => openSeriesDetails(item)}
      >
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <CachedRemoteImage uri={imageUrl} style={styles.seriesImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="school-outline" size={46} color="#2563eb" />
              <Text style={styles.placeholderText}>Test Series</Text>
            </View>
          )}


          {isLockedPaid && discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || "Practice with exam-focused mock tests."}
          </Text>

          <View style={styles.metaRow}>

            <View style={styles.miniChip}>
              <Ionicons
                name={isFree || hasAccess ? "shield-checkmark-outline" : "wallet-outline"}
                size={15}
                color="#2563eb"
              />
              <Text style={styles.miniChipText}>
                {isFree ? "Free Access" : hasAccess ? "Purchased" : "Paid Series"}
              </Text>
            </View>
          </View>

          <View style={styles.priceBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.priceLabel}>
                {isFree ? "Access Type" : hasAccess ? "Access Status" : "Offer Price"}
              </Text>

              {renderPriceBlock(item)}
            </View>

            <View style={styles.priceIconWrap}>
              <Ionicons
                name={isFree || hasAccess ? "ribbon-outline" : "pricetag-outline"}
                size={23}
                color="#2563eb"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            {isLockedPaid && (
              <TouchableOpacity
                activeOpacity={0.86}
                style={styles.buyBtn}
                onPress={() => buySeries(item)}
              >
                <Ionicons name="cart-outline" size={17} color="#ffffff" />
                <Text style={styles.buyText}>Buy Now</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.86}
              style={[styles.exploreBtn, !isLockedPaid && styles.fullExploreBtn]}
              onPress={() => openSeriesDetails(item)}
            >
              <Text style={styles.exploreText}>
                {item.explore_text || "Explore Now"}
              </Text>
              <Ionicons name="chevron-forward" size={17} color="#ffffff" />
            </TouchableOpacity>
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
          <Text style={styles.loadingText}>Loading test series...</Text>
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
              placeholder="Search test series..."
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
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.resultRow}>
              <Text style={styles.resultTitle}>Available Test Series</Text>
              <Text style={styles.resultCount}>{filteredSeries.length} found</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No series found</Text>
              <Text style={styles.emptyText}>Try searching another keyword.</Text>
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
    borderRadius: 26,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dbeafe",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.13,
    shadowRadius: 25,
    elevation: 9,
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#dbeafe",
    position: "relative",
  },
  seriesImage: { width: "100%", height: "100%" },
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
  discountBadge: {
    position: "absolute",
    right: 14,
    top: 14,
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  discountBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
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
  metaRow: {
    marginTop: 13,
    flexDirection: "row",
    gap: 9,
    flexWrap: "wrap",
  },
  miniChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
  },
  miniChipText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
  },
  priceBox: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  priceLine: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  priceValue: {
    marginTop: 3,
    fontSize: 21,
    fontWeight: "900",
    color: "#0f172a",
  },
  cutPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
    textDecorationLine: "line-through",
  },
  offText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "900",
    color: "#16a34a",
  },
  priceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  buttonRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buyBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buyText: {
    marginLeft: 6,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  exploreBtn: {
    flex: 1,
    height: 46,
    paddingLeft: 15,
    paddingRight: 11,
    borderRadius: 16,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullExploreBtn: { flex: 1 },
  exploreText: {
    color: "#ffffff",
    fontSize: 13,
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