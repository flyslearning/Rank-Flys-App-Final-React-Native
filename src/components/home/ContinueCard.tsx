// src/components/home/ContinueCard.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  View,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

const { width } = Dimensions.get("window");

const SLIDER_WIDTH = width - 40;
const SLIDER_HEIGHT = SLIDER_WIDTH * 0.5625;

type Props = {
  onPress?: () => void;
};

const images = [
  require("../../assets/Ads/1.png"),
  require("../../assets/Ads/2.png"),
  require("../../assets/Ads/3.png"),
  require("../../assets/Ads/4.png"),
  require("../../assets/Ads/5.png"),
  require("../../assets/Ads/6.png"),
  require("../../assets/Ads/7.png"),
];

const sliderImages = [images[images.length - 1], ...images, images[0]];

export default function ContinueLearningCard({ onPress }: Props) {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentIndexRef = useRef(1);

  const safeScrollToIndex = (
    index: number,
    animated: boolean
  ) => {
    if (!sliderImages.length) return;

    const safeIndex = Math.min(
      Math.max(index, 0),
      sliderImages.length - 1
    );

    try {
      flatListRef.current?.scrollToIndex({
        index: safeIndex,
        animated,
      });
    } catch {}
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      safeScrollToIndex(1, false);
    }, 50);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;

      safeScrollToIndex(nextIndex, true);

      currentIndexRef.current = Math.min(
        nextIndex,
        sliderImages.length - 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    let index = Math.round(
      event.nativeEvent.contentOffset.x / SLIDER_WIDTH
    );

    if (index === 0) {
      index = images.length;
      safeScrollToIndex(index, false);
    }

    if (index === sliderImages.length - 1) {
      index = 1;
      safeScrollToIndex(index, false);
    }

    currentIndexRef.current = index;

    const realIndex = Math.max(
      0,
      Math.min(index - 1, images.length - 1)
    );

    setActiveIndex(realIndex);
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={sliderImages}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: SLIDER_WIDTH,
          offset: SLIDER_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          const safeIndex = Math.min(
            Math.max(info.index, 0),
            sliderImages.length - 1
          );

          setTimeout(() => {
            safeScrollToIndex(safeIndex, true);
          }, 100);
        }}
        renderItem={({ item }) => (
          <Pressable style={styles.slide} onPress={onPress}>
            <Image source={item} style={styles.image} resizeMode="cover" />
          </Pressable>
        )}
      />

      <View style={styles.dots}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  slide: {
    width: SLIDER_WIDTH,
    height: SLIDER_HEIGHT,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dots: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#CBD5E1",
  },
  activeDot: {
    width: 20,
    backgroundColor: "#2563EB",
  },
});