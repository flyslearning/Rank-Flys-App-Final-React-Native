import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Pdf from "react-native-pdf";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ScreenCapture from "expo-screen-capture";
import { RootStackParamList } from "../../types";

type Props = NativeStackScreenProps<RootStackParamList, "PdfViewer">;

export default function PdfViewerScreen({ route, navigation }: Props) {
  const { title, fileUrl } = route.params;

  const [loading, setLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hiddenForPrivacy, setHiddenForPrivacy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const pdfUrl = useMemo(() => {
    const separator = fileUrl.includes("?") ? "&" : "?";
    return `${fileUrl}${separator}v=${Date.now()}-${reloadKey}`;
  }, [fileUrl, reloadKey]);

  const isSecurePdf = useMemo(() => {
    const cleanUrl = fileUrl.toLowerCase().split("?")[0];
    return fileUrl.startsWith("https://") && cleanUrl.endsWith(".pdf");
  }, [fileUrl]);

  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(console.log);

    const subscription = AppState.addEventListener("change", (state) => {
      setHiddenForPrivacy(state !== "active");
    });

    return () => {
      subscription.remove();
      ScreenCapture.allowScreenCaptureAsync().catch(console.log);
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setLoadPercent(0);
    setTotalPages(0);
    setCurrentPage(0);
    setReloadKey((prev) => prev + 1);
  };

  if (!isSecurePdf) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Invalid PDF" onBack={() => navigation.goBack()} />

        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={58} color="#ef4444" />
          <Text style={styles.errorTitle}>Invalid PDF URL</Text>
          <Text style={styles.errorText}>{fileUrl}</Text>

          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (hiddenForPrivacy) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Protected" onBack={() => navigation.goBack()} />

        <View style={styles.center}>
          <Ionicons name="eye-off-outline" size={58} color="#2563eb" />
          <Text style={styles.errorTitle}>Content hidden</Text>
          <Text style={styles.errorText}>
            App background me hai, PDF privacy ke liye hidden hai.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <Header title={title} onBack={() => navigation.goBack()} />

      <View style={styles.actionBar}>
        <View style={styles.pageChip}>
          <Ionicons name="document-text-outline" size={16} color="#2563eb" />
          <Text style={styles.pageChipText}>
            {totalPages > 0 ? `Page ${currentPage}/${totalPages}` : "Preparing PDF"}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={handleRetry}>
          <Ionicons name="refresh" size={18} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#16a34a" />
        <Text style={styles.infoText}>
          Secure PDF viewer enabled. Zoom aur swipe pages available hai.
        </Text>
      </View>

      <View style={styles.pdfWrap}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2563eb" />

            <Text style={styles.loadingTitle}>PDF loading...</Text>
            <Text style={styles.loadingPercent}>{loadPercent}%</Text>

            <View style={styles.progressOuter}>
              <View
                style={[
                  styles.progressInner,
                  { width: `${Math.min(loadPercent, 100)}%` },
                ]}
              />
            </View>

            <Text style={styles.loadingText}>
              PDF ready hote hi automatically open ho jayegi.
            </Text>

            <View style={styles.detailBox}>
              <View style={styles.detailRow}>
                <Ionicons name="cloud-download-outline" size={17} color="#2563eb" />
                <Text style={styles.detailText}>Downloading / Preparing PDF</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="reader-outline" size={17} color="#2563eb" />
                <Text style={styles.detailText}>
                  Pages: {totalPages > 0 ? totalPages : "Loading..."}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="phone-portrait-outline" size={17} color="#2563eb" />
                <Text style={styles.detailText}>Optimized for mobile reading</Text>
              </View>
            </View>
          </View>
        )}

        <Pdf
          key={reloadKey}
          source={{
            uri: pdfUrl,
            cache: false,
          }}
          trustAllCerts={false}
          enablePaging={true}
          horizontal={false}
          spacing={4}
          fitPolicy={0}
          minScale={1}
          maxScale={3}
          style={styles.pdf}
          onLoadProgress={(percent) => {
            const value = Math.round(percent * 100);
            setLoadPercent(value);
            setLoading(true);
          }}
          onLoadComplete={(pages) => {
            setTotalPages(pages);
            setCurrentPage(1);
            setLoadPercent(100);
            setLoading(false);
          }}
          onPageChanged={(page, pages) => {
            setCurrentPage(page);
            setTotalPages(pages);
          }}
          onError={(error) => {
            setLoading(false);
            console.log("PDF load error:", error);

            Alert.alert(
              "PDF Error",
              "PDF open nahi ho raha. Please retry karo ya PDF URL check karo."
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function Header({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="arrow-back" size={22} color="#2563eb" />
      </TouchableOpacity>

      <View style={styles.headerTextBox}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.secureText}>Protected PDF Viewer</Text>
      </View>

      <View style={styles.lockBox}>
        <Ionicons name="lock-closed" size={17} color="#16a34a" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    height: 64,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
  },
  secureText: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#16a34a",
  },
  lockBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBar: {
    marginHorizontal: 12,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  pageChip: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginRight: 10,
  },
  pageChipText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: "900",
    color: "#1d4ed8",
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },
  pdfWrap: {
    flex: 1,
    marginTop: 8,
    backgroundColor: "#ffffff",
  },
  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  loadingPercent: {
    marginTop: 8,
    fontSize: 34,
    fontWeight: "900",
    color: "#2563eb",
  },
  progressOuter: {
    width: "100%",
    height: 12,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
    marginTop: 14,
  },
  progressInner: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2563eb",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "center",
  },
  detailBox: {
    width: "100%",
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 18,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ffffff",
  },
});