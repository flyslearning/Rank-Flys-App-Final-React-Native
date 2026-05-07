import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
}: Props) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.alertContainer}>
          <View style={styles.topCircle}>
            <Ionicons name="alert-circle" size={58} color="#ffffff" />
          </View>

          <Text style={styles.title}>
            {title || "Alert"}
          </Text>

          <Text style={styles.message}>
            {message || "Something went wrong"}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Got it</Text>
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },

  alertContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingTop: 38,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",

    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,

    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  topCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,

    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,

    borderWidth: 6,
    borderColor: "#bfdbfe",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 10,
  },

  message: {
    fontSize: 16,
    fontWeight: "600",
    color: "#010101",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 26,
  },

  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,

    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});