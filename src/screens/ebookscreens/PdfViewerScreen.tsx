import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  AppState,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Pdf from "react-native-pdf";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ScreenCapture from "expo-screen-capture";

import { RootStackParamList } from "../../types";
import { useAuthStore } from "../../store/auth.store";
import { getCachedPdfUrl, deleteCachedPdf } from "../../utils/pdfCache";
import { AuthAPI } from "../../api/auth.api";
import CustomAlert from "../extrascreens/CustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "PdfViewer">;

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
};

export default function PdfViewerScreen({ route, navigation }: Props) {
  const { title, fileUrl } = route.params;

  const accessToken = useAuthStore((state) => state.accessToken);

  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hiddenForPrivacy, setHiddenForPrivacy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);

  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
  });

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  const showAlert = (
    title: string,
    message: string,
    confirmText = "Got it",
    onConfirm?: () => void
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      confirmText,
      onConfirm,
    });
  };

  const closeAlert = () => {
    setAlertState((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const isSecurePdf = useMemo(() => {
    const cleanUrl = fileUrl.toLowerCase().split("?")[0];

    return (
      fileUrl.startsWith("https://") &&
      cleanUrl.endsWith(".pdf") &&
      !fileUrl.includes("..") &&
      !fileUrl.startsWith("file://")
    );
  }, [fileUrl]);

  useEffect(() => {
    const preparePdf = async () => {
      try {
        setLoading(true);

        if (!isSecurePdf) {
          setLoading(false);
          return;
        }

        if (!accessToken) {
          setLoading(false);
          return;
        }

        const localUrl = await getCachedPdfUrl(fileUrl, accessToken);

        setLocalPdfUrl(localUrl);
      } catch (error) {
        console.log("PDF cache error:", error);

        setLoading(false);

        showAlert(
          "PDF Load Failed",
          "PDF download/open nahi ho payi. Please internet check karke retry karo.",
          "Retry",
          async () => {
            closeAlert();
            await handleRetry();
          }
        );
      }
    };

    preparePdf();
  }, [fileUrl, accessToken, reloadKey, isSecurePdf]);

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

  useEffect(() => {
    if (!loading) return;

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const dotLoop = Animated.loop(
      Animated.timing(dotAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotateLoop.start();
    pulseLoop.start();
    dotLoop.start();

    return () => {
      rotateLoop.stop();
      pulseLoop.stop();
      dotLoop.stop();
      rotateAnim.setValue(0);
      dotAnim.setValue(0);
    };
  }, [loading, rotateAnim, pulseAnim, dotAnim]);

  const handleRetry = async () => {
    setLoading(true);
    setTotalPages(0);
    setCurrentPage(0);
    setLocalPdfUrl(null);

    await deleteCachedPdf(fileUrl);

    setReloadKey((prev) => prev + 1);
  };

  const handleSessionExpired = () => {
    showAlert(
      "Session Expired",
      "Please login again to access this protected PDF.",
      "Go Back",
      () => {
        closeAlert();
        navigation.goBack();
      }
    );
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const dotOneOpacity = dotAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.25, 1, 0.25, 0.25],
  });

  const dotTwoOpacity = dotAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.25, 0.25, 1, 0.25],
  });

  const dotThreeOpacity = dotAnim.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: [0.25, 0.25, 0.25, 1],
  });

  if (!isSecurePdf) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Invalid PDF" onBack={() => navigation.goBack()} />

        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={58} color="#ef4444" />
          <Text style={styles.errorTitle}>Invalid PDF URL</Text>
          <Text style={styles.errorText}>{fileUrl}</Text>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          confirmText={alertState.confirmText}
          onClose={closeAlert}
          onConfirm={alertState.onConfirm}
        />
      </SafeAreaView>
    );
  }

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Authentication Error" onBack={() => navigation.goBack()} />

        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={58} color="#ef4444" />
          <Text style={styles.errorTitle}>Login Required</Text>
          <Text style={styles.errorText}>
            Access token missing hai. Please login again.
          </Text>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          confirmText={alertState.confirmText}
          onClose={closeAlert}
          onConfirm={alertState.onConfirm}
        />
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

        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          confirmText={alertState.confirmText}
          onClose={closeAlert}
          onConfirm={alertState.onConfirm}
        />
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
            {totalPages > 0
              ? `Page ${currentPage}/${totalPages}`
              : "Preparing PDF"}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={handleRetry}>
          <Ionicons name="refresh" size={18} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#16a34a" />
        <Text style={styles.infoText}>
          Secure PDF viewer enabled. Screenshot protection active.
        </Text>
      </View>

      <View style={styles.pdfWrap}>
        {loading && (
          <View style={styles.loader}>
            <Animated.View
              style={[
                styles.loaderCircle,
                {
                  transform: [{ rotate }, { scale: pulseAnim }],
                },
              ]}
            >
              <View style={styles.loaderInner}>
                <Ionicons name="document-text" size={42} color="#2563eb" />
              </View>
            </Animated.View>

            <Text style={styles.loadingTitle}>Opening secure PDF</Text>

            <View style={styles.dotsRow}>
              <Animated.View style={[styles.dot, { opacity: dotOneOpacity }]} />
              <Animated.View style={[styles.dot, { opacity: dotTwoOpacity }]} />
              <Animated.View style={[styles.dot, { opacity: dotThreeOpacity }]} />
            </View>

            <Text style={styles.loadingText}>
              Please wait, PDF ready hote hi automatically open ho jayegi.
            </Text>

            <View style={styles.detailBox}>
              <View style={styles.detailRow}>
                <Ionicons name="cloud-outline" size={17} color="#2563eb" />
                <Text style={styles.detailText}>Secure file connecting</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="lock-closed-outline" size={17} color="#2563eb" />
                <Text style={styles.detailText}>Protected access verified</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="reader-outline" size={17} color="#2563eb" />
                <Text style={styles.detailText}>Preparing mobile viewer</Text>
              </View>
            </View>
          </View>
        )}

        {localPdfUrl && (
          <View style={styles.securePdfContainer}>
            <Pdf
              key={`${reloadKey}-${localPdfUrl}`}
              source={{
                uri: localPdfUrl,
                cache: true,
              }}
              trustAllCerts={false}
              enablePaging={true}
              horizontal={false}
              spacing={4}
              fitPolicy={0}
              minScale={1}
              maxScale={3}
              style={styles.pdf}
              onLoadProgress={() => {
                setLoading(true);
              }}
              onLoadComplete={(pages) => {
                setTotalPages(pages);
                setCurrentPage(1);
                setLoading(false);
              }}
              onPageChanged={(page, pages) => {
                setCurrentPage(page);
                setTotalPages(pages);
              }}
              onError={async (error) => {
                console.log("PDF load error:", error);

                try {
                  setLoading(true);

                  await deleteCachedPdf(fileUrl);
                  await AuthAPI.validate();

                  setTotalPages(0);
                  setCurrentPage(0);
                  setLocalPdfUrl(null);
                  setReloadKey((prev) => prev + 1);
                } catch (refreshError) {
                  setLoading(false);
                  handleSessionExpired();
                }
              }}
            />
          </View>
        )}
      </View>

      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        onClose={closeAlert}
        onConfirm={alertState.onConfirm}
      />
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

  securePdfContainer: {
    flex: 1,
    position: "relative",
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

  loaderCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 5,
    borderColor: "#dbeafe",
    borderTopColor: "#2563eb",
    borderRightColor: "#60a5fa",
    justifyContent: "center",
    alignItems: "center",
  },

  loaderInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingTitle: {
    marginTop: 22,
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },

  dotsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#2563eb",
    marginHorizontal: 4,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },

  detailBox: {
    width: "100%",
    marginTop: 22,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
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