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
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
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
              style={styles.viewAllCard}
              onPress={goToFlysLibrary}
              activeOpacity={0.85}
            >
              <View style={styles.viewAllIcon}>
                <Ionicons name="library" size={25} color="#2563EB" />
              </View>

              <Text style={styles.viewAllText}>Explore Full Library</Text>

              <View style={styles.viewAllArrow}>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </View>
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
  marginTop: 0,
  color: "#DBEAFE",
  fontSize: 7,
  lineHeight: 9,
  fontWeight: "700",
},
  viewAllCard: {
    width: 136,
    height: 180,
    borderRadius: 20,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: "#2563EB",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  scrollContent: {
  paddingTop: 10,
  paddingBottom: 10,
  paddingRight: 16,
},
viewAllAnimWrap: {
  marginLeft: 12,
  marginRight: 16,
},
  viewAllIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  viewAllText: {
    color: "#1E3A8A",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  viewAllSub: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  viewAllArrow: {
    marginTop: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
});