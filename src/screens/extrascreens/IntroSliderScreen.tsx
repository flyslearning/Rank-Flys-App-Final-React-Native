import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import LottieView from "lottie-react-native";
import { useAppStore } from "../../store/app.store";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Practice Smart Tests",
    subtitle:
      "Attempt mock tests with real exam interface & smart analytics.",
    animation: require("../../assets/animations/test.json"),
  },
  {
    id: "2",
    title: "Read Ebook Notes",
    subtitle:
      "Structured notes, PDFs & study material for your success.",
    animation: require("../../assets/animations/ebook.json"),
  },
  {
    id: "3",
    title: "Track Your Growth",
    subtitle:
      "Analyze accuracy, performance & improve daily.",
    animation: require("../../assets/animations/growth.json"),
  },
];

export default function IntroSliderScreen() {
  const completeIntro = useAppStore((s) => s.completeIntro);

  const [index, setIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const flatListRef = useRef<FlatList>(null);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goNext = async () => {
    animateButton();

    if (index === slides.length - 1) {
      await completeIntro();
      return;
    }

    flatListRef.current?.scrollToIndex({
      index: index + 1,
      animated: true,
    });
  };

  const renderItem = ({ item, index: i }: any) => {
    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [100, 0, 100],
      extrapolate: "clamp",
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.85, 1, 0.85],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.slide}>
        <Animated.View
          style={{
            transform: [{ translateY }, { scale }],
            opacity,
          }}
        >
          <LottieView
            source={item.animation}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity }]}>
          {item.title}
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity }]}>
          {item.subtitle}
        </Animated.Text>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 🎨 Floating Background Circles */}
      <Animated.View style={[styles.circle, styles.topCircle]} />
      <Animated.View style={[styles.circle, styles.bottomCircle]} />
      <Animated.View style={[styles.circleSmall, styles.leftCircle]} />
      <Animated.View style={[styles.circleSmall, styles.rightCircle]} />

      {/* Skip */}
      <TouchableOpacity style={styles.skipButton} onPress={completeIntro}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slider */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        onMomentumScrollEnd={(event) => {
          const currentIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setIndex(currentIndex);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => {
            const scale = scrollX.interpolate({
              inputRange: [
                (i - 1) * width,
                i * width,
                (i + 1) * width,
              ],
              outputRange: [0.7, 1.4, 0.7],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    transform: [{ scale }],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity style={styles.nextButton} onPress={goNext}>
            <Text style={styles.nextText}>
              {index === slides.length - 1 ? "Get Started" : "Next"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  /* 🎨 Circles */
  circle: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 200,
    backgroundColor: "#2563eb20",
  },

  circleSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: "#60a5fa30",
  },

  topCircle: {
    top: -80,
    right: -60,
  },

  bottomCircle: {
    bottom: -100,
    left: -80,
  },

  leftCircle: {
    top: height * 0.3,
    left: -40,
  },

  rightCircle: {
    bottom: height * 0.25,
    right: -40,
  },

  skipButton: {
    position: "absolute",
    right: 20,
    top: 50,
    zIndex: 10,
  },

  skipText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 15,
  },

  slide: {
    width,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  lottie: {
    width: 260,
    height: 260,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontFamily: "Bungee",
    color: "#0f172a",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "700",
   
    marginTop: 12,
    lineHeight: 22,
  },

  bottom: {
    padding: 24,
    paddingBottom: 40,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    marginHorizontal: 6,
  },

  nextButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    elevation: 5,
  },

  nextText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});