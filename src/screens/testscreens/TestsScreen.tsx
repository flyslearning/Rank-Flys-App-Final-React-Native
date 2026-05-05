import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, TestItem } from "../../types";
import { TestAPI } from "../../api/test.api";

import {
  getTestsLocal,
  saveTests,
  updateTestSeriesAccess,
  updateTestSeriesCount,
} from "../../db/testDb";

type Props = NativeStackScreenProps<RootStackParamList, "Tests">;

export default function TestsScreen({ route, navigation }: Props) {
  const { seriesId } = route.params;

  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadTests = useCallback(async () => {
  try {
    const localTests = getTestsLocal(seriesId) as any[];

    if (localTests.length > 0) {
      setTests(localTests);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const res = await TestAPI.getTestsBySeries(seriesId);

    const freshTests = res.data?.data || [];
    const hasAccess = res.data?.has_access === true;
    const isFree = res.data?.is_free === true;

    saveTests(seriesId, freshTests);
    updateTestSeriesAccess(seriesId, hasAccess, isFree);
    updateTestSeriesCount(seriesId, freshTests.length);

    const updatedLocalTests = getTestsLocal(seriesId) as any[];
    setTests(updatedLocalTests);
  } catch (error: any) {
    console.log("Tests error:", error.response?.data || error.message);

    const localTests = getTestsLocal(seriesId) as any[];

    if (localTests.length > 0) {
      setTests(localTests);
    } else {
      Alert.alert("Error", "Tests load failed");
    }
  } finally {
    setLoading(false);
  }
}, [seriesId]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const filteredTests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tests;

    return tests.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const description = item.description?.toLowerCase() || "";
      return title.includes(keyword) || description.includes(keyword);
    });
  }, [tests, search]);

  const renderTestCard = ({ item, index }: { item: TestItem; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.numberBox}>
          <Text style={styles.numberText}>{String(index + 1).padStart(2, "0")}</Text>
        </View>

        <View style={styles.readyBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
          <Text style={styles.readyText}>READY</Text>
        </View>
      </View>

      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description || "Start practicing with exam-level questions."}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={18} color="#2563eb" />
          <View>
            <Text style={styles.statValue}>{item.duration_minutes} min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="help-circle-outline" size={18} color="#2563eb" />
          <View>
            <Text style={styles.statValue}>{item.total_questions}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
        </View>
      </View>

      <View style={styles.footerRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("Attempts", { testId: item.id })}
        >
          <Text style={styles.secondaryText}>Attempts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.primaryBtn}
          onPress={() =>
            navigation.navigate("TestAttempt", {
              testId: item.id,
              seriesId: seriesId,
            })
          }
        >
          <Text style={styles.primaryText}>Start Test</Text>
          <Ionicons name="chevron-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading tests...</Text>
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
              placeholder="Search tests..."
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
          data={filteredTests}
          keyExtractor={(item) => item.id}
          renderItem={renderTestCard}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.resultRow}>
              <Text style={styles.resultTitle}>Available Tests</Text>
              <Text style={styles.resultCount}>{filteredTests.length} found</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No tests found</Text>
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
    flex: 1,
    height: "100%",
    fontFamily: "Geologica",
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
    fontFamily: "Geologica",
    fontSize: 13,
    fontWeight: "100",
    color: "#64748b",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 7,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  numberBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },

  numberText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 5,
  },

  readyText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#15803d",
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

  statsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },

  statBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#eef2f7",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  statValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
  },

  footerRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },

  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#334155",
  },

  primaryBtn: {
    flex: 1.35,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryText: {
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