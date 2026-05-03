import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type Props = {
  name?: string;
};

export default function HomeHeader({ name = "Student" }: Props) {
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.left}>
          <Text style={styles.greeting}>Hello 👋</Text>

          <Text numberOfLines={1} style={styles.name}>
            {name}
          </Text>

          <Text style={styles.subtitle}>Ready to continue learning?</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.avatar}
          />
          <View style={styles.onlineDot} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F8FAFC",
  },

  container: {
    marginTop: Platform.OS === "android" ? 8 : 4,
    marginBottom: 24,
    paddingHorizontal: 20,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  left: {
    flex: 1,
    paddingRight: 10,
  },

  greeting: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  name: {
    fontSize: Math.min(width * 0.07, 30),
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },
});