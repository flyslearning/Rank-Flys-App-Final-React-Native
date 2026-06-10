import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCachedImageUri } from "../../utils/imageCache";

const { width } = Dimensions.get("window");

const HERO_WIDTH = width - 40;
const HERO_HEIGHT = HERO_WIDTH * (1080 / 1920);

export default function ClassroomHero({
  product,
  thumbnailUrl,
}: {
  product: any;
  thumbnailUrl?: string;
}) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  const [cachedThumbnailUri, setCachedThumbnailUri] = useState<string | null>(
    null
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    let mounted = true;

    const cacheThumbnail = async () => {
      if (!thumbnailUrl) {
        setCachedThumbnailUri(null);
        return;
      }

      try {
        const localUri = await getCachedImageUri(thumbnailUrl);

        if (mounted) {
          setCachedThumbnailUri(localUri);
        }
      } catch (error) {
        console.log("CLASSROOM HERO IMAGE CACHE ERROR:", error);

        if (mounted) {
          setCachedThumbnailUri(thumbnailUrl);
        }
      }
    };

    cacheThumbnail();

    return () => {
      mounted = false;
    };
  }, [thumbnailUrl]);

  return (
    <Animated.View
      style={[
        styles.hero,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.imageOuter}>
        <View style={styles.imageWrap}>
          {cachedThumbnailUri ? (
            <Image
              source={{ uri: cachedThumbnailUri }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="school-outline" size={42} color="#FFFFFF" />
              <Text style={styles.thumbnailText}>Personalized Classroom</Text>
            </View>
          )}

          <View style={styles.liveBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.kicker}>Premium Online Learning</Text>

        <Text style={styles.title}>
          {product?.title || "Personalized Classroom"}
        </Text>

        <Text style={styles.description}>
          {product?.description ||
            "Small batch personalized online classroom with subject-wise learning, study tracking and expert guidance."}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="people-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>
              {product?.max_students_per_batch || 20}
            </Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="videocam-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>Live</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="document-text-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statNumber}>Daily</Text>
            <Text style={styles.statLabel}>Tests</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 6,
    marginBottom: 8,
  },

  imageOuter: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    marginHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  imageWrap: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "transparent",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailText: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  liveBadge: {
    position: "absolute",
    left: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },

  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },

  liveBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  content: {
    marginHorizontal: 16,
    paddingTop: 18,
  },

  kicker: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginBottom: 7,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 31,
    letterSpacing: -0.5,
  },

  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: "#475569",
    fontWeight: "600",
  },

  statsRow: {
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  statNumber: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 15,
  },

  statLabel: {
    marginTop: 3,
    color: "#64748B",
    fontWeight: "700",
    fontSize: 11.5,
  },

  divider: {
    width: 1,
    height: 46,
    backgroundColor: "#E5E7EB",
  },
});