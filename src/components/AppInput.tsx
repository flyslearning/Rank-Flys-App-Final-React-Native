import React from "react";
import { TextInput, StyleSheet, View } from "react-native";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "number-pad";
};

export default function AppInput({
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
}: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 7,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    fontFamily: "Geologica",
    borderColor: "#e2e8f0",
    padding: 15,
    borderRadius: 16,
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
  },
});