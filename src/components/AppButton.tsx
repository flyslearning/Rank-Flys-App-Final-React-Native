import React, { useRef, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function AppButton({
  title,
  onPress,
  loading,
  disabled,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // 🔥 Loading pulse animation
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      opacity.setValue(1);
    }
  }, [loading]);

  // 🔥 Press Animations
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      speed: 20,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity: disabled ? 0.6 : opacity,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.button,
          disabled && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",

    // 🔥 Premium Shadow
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },

    elevation: 8,
  },

  disabled: {
    backgroundColor: "#c7d2fe",
    shadowOpacity: 0,
    elevation: 0,
  },

  text: {
    color: "#ffffff",
    fontFamily: "Geologica",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});