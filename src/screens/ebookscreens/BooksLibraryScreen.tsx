import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EbookAPI } from "../../api/ebook.api";
import { EbookDb } from "../../db/ebookDb";
import BookCard from "../../components/books/BookCard";

export default function BooksLibraryScreen({ navigation }: any) {
  const [books, setBooks] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [end, setEnd] = useState(false);

  useEffect(() => {
    const cached = EbookDb.getBooks?.() || [];
    if (cached.length) setBooks(cached);
    loadBooks(0);
  }, []);

  const loadBooks = async (nextOffset = offset) => {
    if (loading || end) return;

    try {
      setLoading(true);

      const res = await EbookAPI.getAllBooks?.(20, nextOffset);
      const list = res?.data?.data || res?.data || [];

      if (list.length < 20) setEnd(true);

      const finalList =
        nextOffset === 0 ? list : [...books, ...list];

      EbookDb.saveBooks?.(finalList);
      setBooks(finalList);
      setOffset(nextOffset + 20);
    } catch (e) {
      console.log("Books library error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>

        <View>
          <Text style={styles.title}>Books Library</Text>
          <Text style={styles.sub}>Choose your book and start reading</Text>
        </View>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            large
            onPress={() =>
              navigation.navigate("BookDetail", {
                bookId: item.id,
              })
            }
          />
        )}
        onEndReached={() => loadBooks(offset)}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading ? <ActivityIndicator color="#2563EB" /> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
  },
  sub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  row: {
    justifyContent: "space-between",
  },
});