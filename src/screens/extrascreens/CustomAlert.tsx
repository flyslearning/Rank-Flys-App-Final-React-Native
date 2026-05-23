import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  title?: string;
  message?: string;

  // TYPES
  type?: "info" | "exit";

  // BUTTONS
  confirmText?: string;
  cancelText?: string;

  // ACTIONS
  onClose: () => void;
  onConfirm?: () => void;
}

const CustomAlert = ({
  visible,
  title,
  message,
  type = "info",
  confirmText,
  cancelText,
  onClose,
  onConfirm,
}: Props) => {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),

        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const isExit = type === "exit";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.alertWrapper,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Pressable style={styles.alertContainer}>

            {/* ICON */}
            <View
              style={[
                styles.topCircle,
                isExit && styles.exitCircle,
              ]}
            >
              <Ionicons
                name={
                  isExit
                    ? "log-out-outline"
                    : "alert-circle"
                }
                size={58}
                color="#ffffff"
              />
            </View>

            {/* TITLE */}
            <Text style={styles.title}>
              {title || "Alert"}
            </Text>

            {/* MESSAGE */}
            <Text style={styles.message}>
              {message || "Something went wrong"}
            </Text>

            {/* INFO ALERT */}
            {!isExit && (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.button}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>
                  {confirmText || "Got it"}
                </Text>

                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#ffffff"
                />
              </TouchableOpacity>
            )}

            {/* EXIT ALERT */}
            {isExit && (
              <View style={styles.exitButtons}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.cancelButton}
                  onPress={onClose}
                >
                  <Text style={styles.cancelText}>
                    {cancelText || "Stay"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.exitButton}
                  onPress={onConfirm}
                >
                  <Ionicons
                    name="exit-outline"
                    size={18}
                    color="#ffffff"
                  />

                  <Text style={styles.exitText}>
                    {confirmText || "Exit"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  alertWrapper: {
    width: "100%",
  },

  alertContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 32,
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",

    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,

    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  topCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,

    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.36,
    shadowRadius: 18,
    elevation: 12,

    borderWidth: 7,
    borderColor: "#bfdbfe",
  },

  exitCircle: {
    backgroundColor: "#ef4444",
    borderColor: "#fecaca",

    shadowColor: "#ef4444",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
  },

  message: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
    lineHeight: 25,
    marginBottom: 28,
  },

  // INFO BUTTON
  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 16,
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
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },

  // EXIT BUTTONS
  exitButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 15,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  cancelText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },

  exitButton: {
    flex: 1,
    backgroundColor: "#ef4444",
    paddingVertical: 15,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,

    shadowColor: "#ef4444",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },

  exitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
});