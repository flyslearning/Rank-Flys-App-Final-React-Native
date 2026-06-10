import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  View,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Linking,
  ImageSourcePropType,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getToolAdvertisements } from "../../api/tools.api";
import { getCachedImageUri } from "../../utils/imageCache";

const { width } = Dimensions.get("window");

const SLIDER_WIDTH = width - 40;
const SLIDER_HEIGHT = SLIDER_WIDTH * (720 / 1920);

type Props = {
  onPress?: () => void;
};

type AdvertisementAction = {
  type:
    | "ebook_series"
    | "ebook_book"
    | "test_series"
    | "study_material"
    | "test"
    | "mentorship"
    | "library_pass"
    | "external_url"
    | "none"
    | "ebook_page"
    | "testseries_page"
    | "mentorship_page"
    | "book_library_page"
    | "study_material_page"
    | "connect_page";
  id?: string;
  url?: string;
};

type SliderItem = {
  id: string;
  title?: string;
  image: ImageSourcePropType | { uri: string };
  action?: AdvertisementAction;
  isRemote?: boolean;
};

const defaultImages: SliderItem[] = [
  {
    id: "local-1",
    image: require("../../assets/Ads/1.png"),
  },
  {
    id: "local-2",
    image: require("../../assets/Ads/2.png"),
  },
  {
    id: "local-3",
    image: require("../../assets/Ads/3.png"),
  },
  {
    id: "local-4",
    image: require("../../assets/Ads/4.png"),
  },
  {
    id: "local-5",
    image: require("../../assets/Ads/5.png"),
  },
];

export default function ContinueLearningCard({ onPress }: Props) {
  const navigation = useNavigation<any>();

  const flatListRef = useRef<FlatList<SliderItem>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [images, setImages] = useState<SliderItem[]>(defaultImages);

  const currentIndexRef = useRef(1);

  const sliderImages = useMemo(() => {
    if (!images.length) return [];

    return [images[images.length - 1], ...images, images[0]];
  }, [images]);

  const safeScrollToIndex = (index: number, animated: boolean) => {
    if (!sliderImages.length) return;

    const safeIndex = Math.min(Math.max(index, 0), sliderImages.length - 1);

    try {
      flatListRef.current?.scrollToIndex({
        index: safeIndex,
        animated,
      });
    } catch {}
  };

  useEffect(() => {
    let mounted = true;

        const fetchAds = async () => {
      try {
        const response = await getToolAdvertisements();

        const apiAds = response?.data || [];

        if (!Array.isArray(apiAds) || apiAds.length === 0) {
          if (mounted) {
            setImages(defaultImages);
          }
          return;
        }

        const cachedRemoteImages: SliderItem[] = await Promise.all(
          apiAds
            .filter((ad: any) => ad?.image_url)
            .map(async (ad: any, index: number) => {
              const localImageUri = await getCachedImageUri(ad.image_url);

              return {
                id: ad.id || `remote-${index}`,
                title: ad.title,
                image: { uri: localImageUri },
                action: ad.action,
                isRemote: true,
              };
            })
        );

        if (mounted && cachedRemoteImages.length > 0) {
          setImages(cachedRemoteImages);
          setActiveIndex(0);
          currentIndexRef.current = 1;
        } else {
          if (mounted) {
            setImages(defaultImages);
          }
        }
      } catch (error) {
        console.log("ADVERTISEMENT API ERROR:", error);

        if (mounted) {
          setImages(defaultImages);
        }
      }
    };

    fetchAds();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      safeScrollToIndex(1, false);
    }, 80);

    return () => clearTimeout(timeout);
  }, [sliderImages.length]);

  useEffect(() => {
    if (sliderImages.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;

      safeScrollToIndex(nextIndex, true);

      currentIndexRef.current = Math.min(nextIndex, sliderImages.length - 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    if (!images.length || !sliderImages.length) return;

    let index = Math.round(event.nativeEvent.contentOffset.x / SLIDER_WIDTH);

    if (index === 0) {
      index = images.length;
      safeScrollToIndex(index, false);
    }

    if (index === sliderImages.length - 1) {
      index = 1;
      safeScrollToIndex(index, false);
    }

    currentIndexRef.current = index;

    const realIndex = Math.max(0, Math.min(index - 1, images.length - 1));

    setActiveIndex(realIndex);
  };

  const handleAdPress = async (item: SliderItem) => {
  const action = item.action;

  if (!action || action.type === "none") {
    onPress?.();
    return;
  }

  // External URL
  if (action.type === "external_url" && action.url) {
    const canOpen = await Linking.canOpenURL(action.url);
    if (canOpen) {
      await Linking.openURL(action.url);
    }
    return;
  }

  switch (action.type) {
    // Detail / ID based screens
    case "ebook_series":
      if (action.id) {
        navigation.navigate("EbookNodes" as never, {
          seriesId: action.id,
        } as never);
      }
      return;

    case "ebook_book":
      if (action.id) {
        navigation.navigate("BookDetail" as never, {
          bookId: action.id,
        } as never);
      }
      return;

    case "test_series":
      if (action.id) {
        navigation.navigate("Tests" as never, {
          seriesId: action.id,
        } as never);
      }
      return;

    case "test":
      if (action.id) {
        navigation.navigate("TestAttempt" as never, {
          testId: action.id,
        } as never);
      }
      return;

    case "mentorship":
      if (action.id) {
        navigation.navigate("Mentorship Plans" as never, {
          mentorshipID: action.id,
        } as never);
      }
      return;

    case "library_pass":
      if (action.id) {
        navigation.navigate("LibraryPassPlans" as never, {
          goalClassId: action.id,
        } as never);
      }
      return;

    case "study_material":
      if (action.id) {
        navigation.navigate("StudyMaterial" as never, {
          id: action.id,
        } as never);
      }
      return;

    // Page / main screen targets
    case "ebook_page":
      navigation.navigate("EbookSeries" as never);
      return;

    case "testseries_page":
      navigation.navigate("TestSeries" as never);
      return;

    case "mentorship_page":
      navigation.navigate("Mentorship" as never);
      return;

    case "book_library_page":
      navigation.navigate("BooksLibrary" as never);
      return;

    case "study_material_page":
      navigation.navigate("StudyMaterial" as never);
      return;
      
    case "connect_page":
    navigation.navigate("Connect" as never);
    return;

    default:
      onPress?.();
      return;
  }
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
        keyExtractor={(item, index) => `${item.id}-${index}`}
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
          <Pressable style={styles.slide} onPress={() => handleAdPress(item)}>
            <Image source={item.image} style={styles.image} resizeMode="cover" />
          </Pressable>
        )}
      />

      <View style={styles.dots}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, activeIndex === index && styles.activeDot]}
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
    borderRadius: 14,
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