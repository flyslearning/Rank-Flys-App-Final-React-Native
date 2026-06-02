import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import SectionTitle from "../home/SectionTitle";
import BookCard from "./BookCard";
import { EbookAPI } from "../../api/ebook.api";
import { EbookDb } from "../../db/ebookDb";

export default function BooksLibrarySlider({ navigation }: any) {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadBooks();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.04,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadBooks = async () => {
    try {
      const cached = EbookDb.getBooks();
      setBooks(cached);

      setLoading(true);

      const res = await EbookAPI.getHomeBooks();
      const list = res.data?.data || res.data || [];

      EbookDb.saveBooks(list);
      setBooks(list);
    } catch (error) {
      console.log("Books home error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!loading && books.length === 0) return null;

  const goToFlysLibrary = () => {
    navigation.navigate("FlysLibrary");
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <SectionTitle title="Books Library" subtitle="Read premium books" />

        <TouchableOpacity
          style={styles.topButton}
          onPress={goToFlysLibrary}
          activeOpacity={0.88}
        >
          <View style={styles.topButtonIcon}>
            <Ionicons name="library-outline" size={14} color="#2563EB" />
          </View>

          <View>
            <Text style={styles.topButtonText}>Flys Library</Text>
            <Text style={styles.topButtonSub}>View all books</Text>
          </View>

          <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading && books.length === 0 ? (
        <ActivityIndicator color="#2563EB" />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onPress={() =>
                navigation.navigate("BookDetail", {
                  bookId: book.id,
                })
              }
            />
          ))}

          <Animated.View
            style={[
              styles.viewAllAnimWrap,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.viewAllBook}
              onPress={goToFlysLibrary}
              activeOpacity={0.88}
            >
              <View style={styles.viewAllShadow} />

              <LinearGradient
                colors={["#EEF4FF", "#DBEAFE", "#BFDBFE"]}
                style={styles.viewAllCover}
              >
                <View style={styles.viewAllTopBadge}>
                  <Ionicons name="sparkles" size={12} color="#2563EB" />
                  <Text style={styles.viewAllBadgeText}>Premium</Text>
                </View>

                <View style={styles.viewAllIcon}>
                  <Ionicons name="library" size={28} color="#2563EB" />
                </View>

                <Text style={styles.viewAllText}>Explore Full</Text>
                <Text style={styles.viewAllText}>Library</Text>

                <View style={styles.viewAllArrow}>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                </View>
              </LinearGradient>

              <LinearGradient
                colors={["#F8FAFC", "#E2E8F0", "#CBD5E1"]}
                style={styles.viewAllBottomPages}
              />

              <LinearGradient
                colors={["#020617", "#0F172A", "#334155"]}
                style={styles.viewAllSpine}
              />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topButton: {
    paddingLeft: 5,
    paddingRight: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    shadowColor: "#2563EB",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  topButtonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  topButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900",
  },

  topButtonSub: {
    color: "#DBEAFE",
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "700",
  },

  scrollContent: {
    paddingTop: 12,
    paddingBottom: 18,
    paddingRight: 16,
  },

  viewAllAnimWrap: {
    width: 122,
    marginLeft: 12,
    marginRight: 16,
    paddingLeft: 10,
    paddingBottom: 14,
  },

  viewAllBook: {
    width: "100%",
    aspectRatio: 9 / 16,
    borderRadius: 6,
    position: "relative",
    transform: [{ perspective: 900 }, { rotateY: "-6deg" }],
  },

  viewAllCover: {
  width: "100%",
  height: "100%",
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#60A5FA",

  alignItems: "center",
  justifyContent: "center",

  paddingHorizontal: 12,
  overflow: "hidden",

  shadowColor: "#2563EB",
  shadowOpacity: 0.25,
  shadowRadius: 14,
  shadowOffset: {
    width: 0,
    height: 8,
  },
  elevation: 8,
},

  viewAllShadow: {
    position: "absolute",
    left: 5,
    right: -10,
    bottom: -13,
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.2)",
  },

  viewAllSpine: {
    position: "absolute",
    left: -9,
    top: 7,
    bottom: 8,
    width: 12,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    zIndex: -2,
  },

  viewAllBottomPages: {
    position: "absolute",
    left: 5,
    right: -5,
    bottom: -7,
    height: 8,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 6,
    zIndex: -1,
  },

  viewAllTopBadge: {
  position: "absolute",
  top: 12,
  flexDirection: "row",
  alignItems: "center",

  paddingHorizontal: 10,
  paddingVertical: 5,

  borderRadius: 999,
  backgroundColor: "#FFFFFF",

  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 4,
  shadowOffset: {
    width: 0,
    height: 2,
  },
},

  viewAllBadgeText: {
    color: "#2563EB",
    fontSize: 8,
    fontWeight: "900",
  },

  viewAllIcon: {
    width: 38,
    height: 38,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 20,
  },

  viewAllText: {
    color: "#1E3A8A",
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  viewAllArrow: {
    marginTop: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
});