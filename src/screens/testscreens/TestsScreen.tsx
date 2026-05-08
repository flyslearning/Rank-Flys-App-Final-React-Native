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
  getTestSeriesAccessLocal,
} from "../../db/testDb";

type Props = NativeStackScreenProps<RootStackParamList, "Tests">;

export default function TestsScreen({ route, navigation }: Props) {
  const { seriesId } = route.params;

  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [hasAccess, setHasAccess] = useState(false);
  const [isFree, setIsFree] = useState(false);

  const loadTests = useCallback(async () => {
    try {
      const localAccess = getTestSeriesAccessLocal(seriesId);

      setHasAccess(localAccess.has_access);
      setIsFree(localAccess.is_free);

      const localTests = getTestsLocal(seriesId) as any[];

      if (localTests.length > 0) {
        setTests(localTests);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const res = await TestAPI.getTestsBySeries(seriesId);

      const freshTests = res.data?.data || [];
      const apiHasAccess = res.data?.has_access === true;
      const apiIsFree = res.data?.is_free === true;

      setHasAccess(apiHasAccess);
      setIsFree(apiIsFree);

      saveTests(seriesId, freshTests);
      updateTestSeriesAccess(seriesId, apiHasAccess, apiIsFree);
      updateTestSeriesCount(seriesId, freshTests.length);

      const updatedLocalTests = getTestsLocal(seriesId) as any[];
      setTests(updatedLocalTests);
    } catch (error: any) {
      console.log("Tests error:", error.response?.data || error.message);

      const localAccess = getTestSeriesAccessLocal(seriesId);

      setHasAccess(localAccess.has_access);
      setIsFree(localAccess.is_free);

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

  const canStartTest = hasAccess || isFree;

  const renderTestCard = ({ item, index }: { item: TestItem; index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardGlow} />

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
          <View style={styles.statIconBox}>
            <Ionicons name="time-outline" size={18} color="#2563eb" />
          </View>
          <View>
            <Text style={styles.statValue}>{item.duration_minutes} min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        <View style={styles.statBox}>
          <View style={styles.statIconBox}>
            <Ionicons name="help-circle-outline" size={18} color="#2563eb" />
          </View>
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
          <Ionicons name="document-text-outline" size={16} color="#334155" />
          <Text style={styles.secondaryText}>Attempts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.primaryBtn, !canStartTest && styles.primaryBtnLocked]}
          onPress={() => {
            if (!canStartTest) {
              Alert.alert("Locked", "Please purchase this test series to start the test.");
              return;
            }

            navigation.navigate("TestAttempt", {
              testId: item.id,
              seriesId: seriesId,
              duration_minutes: item.duration_minutes,
              total_questions: item.total_questions,
              title: item.title,
              description: item.description,
            } as any);
          }}
        >
          <Text style={styles.primaryText}>
            {canStartTest ? "Start Test" : "Locked"}
          </Text>

          <Ionicons
            name={canStartTest ? "arrow-forward-circle" : "lock-closed"}
            size={20}
            color="#ffffff"
          />
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
    paddingTop: Platform.OS === "android" ? 20 : 10,
    paddingBottom: 16,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0f172a",
  },

  pageSubtitle: {
    marginTop: 5,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },

  searchBox: {
    height: 58,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 5,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontFamily: "Geologica",
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

  clearBtn: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 34,
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
    fontFamily: "Geologica",
    color: "#0f172a",
  },

  resultCount: {
    fontFamily: "Geologica",
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#dbeafe",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.11,
    shadowRadius: 24,
    elevation: 8,
    overflow: "hidden",
  },

  cardGlow: {
    position: "absolute",
    top: -45,
    right: -45,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#eff6ff",
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  numberBox: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
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
    fontSize: 22,
    lineHeight: 29,
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
    marginTop: 17,
    flexDirection: "row",
    gap: 10,
  },

  statBox: {
    flex: 1,
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#eef2f7",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    fontSize: 14,
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
    height: 46,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  secondaryText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#334155",
  },

  primaryBtn: {
    flex: 1.35,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.23,
    shadowRadius: 14,
    elevation: 5,
  },

  primaryBtnLocked: {
    backgroundColor: "#94a3b8",
    shadowColor: "#64748b",
    shadowOpacity: 0.18,
  },

  primaryText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 6,
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