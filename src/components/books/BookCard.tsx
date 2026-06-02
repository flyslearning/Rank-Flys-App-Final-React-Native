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

export default function BookCard({
  book,
  onPress,
  large = false,
}: Props) {
  const imageUrl =
    book?.cover_image_url ||
    book?.image_url;

  if (!imageUrl) return null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.container,
        large && styles.largeContainer,
      ]}
    >
      <View
        style={[
          styles.book,
          large && styles.largeBook,
        ]}
      >
        {/* Book Spine */}
        <LinearGradient
          colors={[
            "#0F172A",
            "#1E293B",
            "#334155",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.spine}
        />

        {/* Cover */}
        <Image
          source={{ uri: imageUrl }}
          style={styles.cover}
          resizeMode="cover"
        />

        {/* Gloss Reflection */}
        <LinearGradient
          colors={[
            "rgba(255,255,255,0.35)",
            "rgba(255,255,255,0.12)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gloss}
          pointerEvents="none"
        />

        {/* Bottom Thickness */}
        <View style={styles.bottomDepth} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    marginRight: 18,
    marginBottom: 12,
  },

  largeContainer: {
    width: "47%",
    marginRight: 0,
    marginBottom: 22,
  },

  book: {
    width: "100%",
    aspectRatio: 9 / 16,

    borderRadius: 8,
    overflow: "visible",

    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 4,
      height: 8,
    },
    elevation: 8,

    transform: [
      { perspective: 1000 },
      { rotateY: "-6deg" },
    ],
  },

  largeBook: {
    aspectRatio: 9 / 16,
  },

  cover: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },

  spine: {
    position: "absolute",
    left: -7,
    top: 5,
    bottom: 5,
    width: 10,

    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,

    zIndex: -1,
  },

  gloss: {
    position: "absolute",
    left: 10,
    top: 0,
    bottom: 0,

    width: 22,
    borderRadius: 8,
  },

  bottomDepth: {
    position: "absolute",
    left: 6,
    right: -2,
    bottom: -5,

    height: 7,

    backgroundColor: "#94A3B8",

    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,

    zIndex: -1,
  },
});