import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { startPersonalizedClassroomPayment } from "../../utils/payment";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePersonalizedClassroomStore } from "../../store/personalizedClassroom.store";

import ClassroomHeader from "../../components/personalizedclassroom/ClassroomHeader";
import ClassroomHero from "../../components/personalizedclassroom/ClassroomHero";
import WhatYouGet from "../../components/personalizedclassroom/WhatYouGet";
import ClassroomGallery from "../../components/personalizedclassroom/ClassroomGallery";
import ClassroomPlans from "../../components/personalizedclassroom/ClassroomPlans";
import ClassroomFAQ from "../../components/personalizedclassroom/ClassroomFAQ";
import BottomBuyBar from "../../components/personalizedclassroom/BottomBuyBar";
import ClassroomEnquiryCard from "../../components/personalizedclassroom/ClassroomEnquiryCard";

function getImageUrl(img: any) {
  if (!img) return "";
  if (typeof img === "string") return img;
  return img.image_url || img.url || "";
}

export default function PersonalizedClassroomDetailsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const {
    product,
    images,
    plans,
    hasAccess,
    accessState,
    selectedPlan,
    loading,
    detailsLoading,
    orderLoading,
    error,
    loadDetails,
    setSelectedPlan,
    clearError,
  } = usePersonalizedClassroomStore();

  useEffect(() => {
    loadDetails();
  }, []);

  useEffect(() => {
    if (hasAccess && accessState === "active") {
      navigation.replace("PersonalizedClassroomHome");
    }
  }, [hasAccess, accessState]);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error, [{ text: "OK", onPress: clearError }]);
    }
  }, [error]);

  const thumbnailUrl = useMemo(() => {
    return product?.thumbnail_url || getImageUrl(images?.[0]);
  }, [product, images]);

  const sortedImages = useMemo(() => {
    if (!Array.isArray(images)) return [];

    return [...images].sort(
      (a: any, b: any) => (a?.sort_order || 0) - (b?.sort_order || 0)
    );
  }, [images]);

const handleBuyNow = async () => {
  if (!selectedPlan?.id) {
    Alert.alert("Select Plan", "Please select monthly or yearly plan.");
    return;
  }

  navigation.navigate("CheckoutScreen", {
    item: {
      ...selectedPlan,
      title: selectedPlan.title || product?.title || "Personalized Classroom",
      description:
        product?.description ||
        "Personalized online classroom for focused learning.",
      image_url: product?.thumbnail_url,
    },
    content_id: selectedPlan.id,
    content_type: "personalized_classroom",
    checkout_for: "personalized_classroom",
  });
};

  if (detailsLoading && !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading classroom...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />

      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + insets.bottom },
          ]}
        >
          <ClassroomHeader onBack={() => navigation.goBack()} />

          <ClassroomHero product={product} thumbnailUrl={thumbnailUrl} />

          {accessState === "grace" && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#8A5A00" />
              <Text style={styles.warningText}>
                Your access is in grace period. Please renew soon.
              </Text>
            </View>
          )}

          {accessState === "locked" && (
            <View style={styles.warningBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#8A5A00" />
              <Text style={styles.warningText}>
                Your classroom access is locked. Renew your plan to continue.
              </Text>
            </View>
          )}

          <WhatYouGet />

          <ClassroomGallery images={sortedImages} />

          <ClassroomPlans
            plans={plans || []}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
          />

          <ClassroomFAQ />
          <ClassroomEnquiryCard />

          {hasAccess && (
            <TouchableOpacity
              style={styles.goButton}
              activeOpacity={0.85}
              onPress={() => navigation.replace("PersonalizedClassroomHome")}
            >
              <Text style={styles.goButtonText}>Go to Classroom</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <BottomBuyBar
          selectedPlan={selectedPlan}
          orderLoading={orderLoading}
          accessState={accessState}
          onBuy={handleBuyNow}
        />

        {loading && !detailsLoading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  scrollContent: {
    paddingTop: 0,
    flexGrow: 1,
    backgroundColor: "#F8F9FB",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FB",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
    fontWeight: "700",
  },
  warningBox: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFF3CD",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: "#8A5A00",
    fontWeight: "800",
    lineHeight: 20,
  },
  goButton: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  goButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
});