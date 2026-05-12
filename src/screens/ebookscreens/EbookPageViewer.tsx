import React from "react";
import {
  FlatList,
  Image,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function EbookPageViewer({ route, navigation }: any) {
  const { title, pageBaseUrl, totalPages } = route.params;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#2563eb" />
        </TouchableOpacity>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      </View>

      <FlatList
        data={pages}
        keyExtractor={(item) => String(item)}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <View style={styles.pageBox}>
            <Image
              source={{
                uri: `${pageBaseUrl}/page-${item}.webp`,
              }}
              style={styles.pageImage}
              resizeMode="contain"
            />

            <Text style={styles.pageText}>
              Page {item}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5e7eb",
  },
  header: {
    height: 60,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  pageBox: {
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  pageImage: {
    width,
    height: width * 1.42,
    backgroundColor: "#fff",
  },
  pageText: {
    textAlign: "center",
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
});