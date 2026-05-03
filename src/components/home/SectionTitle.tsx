import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = {
  title: string;
  rightText?: string;
};

export default function SectionTitle({ title, rightText }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  rightText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
});