import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  book?: any;
  onPress?: () => void;
  large?: boolean;
};

const FALLBACK_IMAGE =
  "https://dummyimage.com/300x450/e5e7eb/64748b.png&text=Book";

export default function BookCard({
  book,
  onPress,
  large = false,
}: Props) {
  const imageUrl =
    book?.cover_image_url ||
    book?.image_url ||
    FALLBACK_IMAGE;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.wrap,
        large ? styles.largeWrap : null,
      ]}
    >
      <View
        style={[
          styles.shadowBook,
          large ? styles.largeShadowBook : null,
        ]}
      >
        <LinearGradient
          colors={["#1E293B", "#0F172A"]}
          style={styles.bookSide}
        />

        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.cover,
            large ? styles.largeCover : null,
          ]}
          resizeMode="cover"
        />

        <LinearGradient
          colors={[
            "rgba(255,255,255,0.45)",
            "transparent",
          ]}
          style={styles.gloss}
          pointerEvents="none"
        />

        <View style={styles.bottomDepth} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 120,
    marginRight: 18,
    paddingLeft: 8,
    paddingBottom: 12,
  },

  largeWrap: {
    width: "47%",
    marginRight: 0,
    marginBottom: 24,
  },

  shadowBook: {
    height: 176,
    borderRadius: 14,
    backgroundColor: "#CBD5E1",
    shadowColor: "#0F172A",
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {
      width: 6,
      height: 10,
    },
    elevation: 8,
    transform: [
      { perspective: 800 },
      { rotateY: "-8deg" },
    ],
  },

  largeShadowBook: {
    height: 230,
  },

  cover: {
    width: "100%",
    height: 176,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
  },

  largeCover: {
    height: 230,
  },

  bookSide: {
    position: "absolute",
    left: -8,
    top: 8,
    width: 12,
    height: "96%",
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    zIndex: -1,
  },

  gloss: {
    position: "absolute",
    top: 0,
    left: 10,
    width: 28,
    height: "100%",
    opacity: 0.35,
    borderRadius: 14,
  },

  bottomDepth: {
    position: "absolute",
    bottom: -7,
    left: 8,
    right: -3,
    height: 10,
    backgroundColor: "#94A3B8",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: -1,
  },
});