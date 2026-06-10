import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { getCachedImageUri } from "../../utils/imageCache";

const { width } = Dimensions.get("window");

const IMAGE_WIDTH = width * 0.74;
const IMAGE_HEIGHT = IMAGE_WIDTH / 2;

function getImageUrl(img: any) {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.image_url || img.url || "";
}

export default function ClassroomGallery({ images }: { images: any[] }) {
  const [cachedGallery, setCachedGallery] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    let mounted = true;

    const cacheGalleryImages = async () => {
      try {
        const urls = images.map(getImageUrl).filter(Boolean);

        if (!urls.length) {
          if (mounted) setCachedGallery([]);
          return;
        }

        const cachedUrls = await Promise.all(
          urls.map(async (url) => await getCachedImageUri(url))
        );

        if (mounted) {
          setCachedGallery(cachedUrls);
        }
      } catch (error) {
        console.log("GALLERY IMAGE CACHE ERROR:", error);

        if (mounted) {
          setCachedGallery(images.map(getImageUrl).filter(Boolean));
        }
      }
    };

    cacheGalleryImages();

    return () => {
      mounted = false;
    };
  }, [images]);

  useEffect(() => {
    if (!cachedGallery.length) return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cachedGallery]);

  if (!cachedGallery.length) return null;

  return (
    <Animated.View
      style={[
        styles.block,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>Gallery</Text>
          <Text style={styles.title}>Classroom Preview</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{cachedGallery.length} Photos</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryScroll}
      >
        {cachedGallery.map((url, index) => (
          <Animated.View
            key={`${url}-${index}`}
            style={[
              styles.card,
              {
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.94, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image source={{ uri: url }} style={styles.image} />

            <View style={styles.imageFooter}>
              <Text style={styles.imageLabel}>Preview {index + 1}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 22,
  },

  headerRow: {
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },

  title: {
    fontSize: 21,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.4,
  },

  countBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  countText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
  },

  galleryScroll: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 6,
  },

  card: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    marginRight: 14,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  imageFooter: {
    position: "absolute",
    left: 12,
    bottom: 12,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },

  imageLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
});