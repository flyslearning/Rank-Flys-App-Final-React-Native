// src/components/personalizedclassroom/BottomBuyBar.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  selectedPlan: any;
  orderLoading?: boolean;
  accessState?: string | null;
  onBuy: () => void;
};

function formatPrice(pricePaise?: number) {
  if (!pricePaise) return "₹0";
  return `₹${Math.round(pricePaise / 100).toLocaleString("en-IN")}`;
}

export default function BottomBuyBar({
  selectedPlan,
  orderLoading = false,
  accessState,
  onBuy,
}: Props) {
  const insets = useSafeAreaInsets();
  const disabled = !selectedPlan || orderLoading;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      <View style={styles.leftSection}>
        <Text style={styles.label}>Selected Plan</Text>

        <Text style={styles.price}>
          {selectedPlan ? formatPrice(selectedPlan.price_paise) : "Choose Plan"}
        </Text>

        <Text style={styles.planTitle} numberOfLines={1}>
          {selectedPlan?.title || "Select a plan to continue"}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        disabled={disabled}
        style={[styles.buyButton, disabled && styles.disabledButton]}
        onPress={onBuy}
      >
        {orderLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buyText}>
            {accessState === "locked" || accessState === "grace"
              ? "Renew"
              : "Buy Now"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,

    minHeight: 76,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 10,

    backgroundColor: "#FFFFFF",

    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EEF2F7",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,

    elevation: 10,
    zIndex: 50,
  },

  leftSection: {
    flex: 1,
    paddingRight: 10,
  },

  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  price: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  planTitle: {
    marginTop: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },

  buyButton: {
    height: 50,
    minWidth: 124,
    paddingHorizontal: 20,

    borderRadius: 16,
    backgroundColor: "#2563EB",

    alignItems: "center",
    justifyContent: "center",

    ...Platform.select({
      ios: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.24,
        shadowRadius: 9,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  disabledButton: {
    backgroundColor: "#A1A1AA",
    shadowOpacity: 0,
    elevation: 0,
  },

  buyText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});