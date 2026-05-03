import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Platform,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ScreenCapture from "expo-screen-capture";
import { RootStackParamList } from "../../types";

type Props = NativeStackScreenProps<RootStackParamList, "PdfViewer">;

export default function PdfViewerScreen({ route, navigation }: Props) {
  const { title, fileUrl } = route.params;
  const [loading, setLoading] = useState(true);
  const [hiddenForPrivacy, setHiddenForPrivacy] = useState(false);

  const isSecurePdf = useMemo(() => {
    return (
      fileUrl.startsWith("https://") &&
      fileUrl.toLowerCase().split("?")[0].endsWith(".pdf")
    );
  }, [fileUrl]);

  useEffect(() => {
    const enablePrivacy = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (error) {
        console.log("Screen privacy error:", error);
      }
    };

    enablePrivacy();

    const subscription = AppState.addEventListener("change", (state) => {
      setHiddenForPrivacy(state !== "active");
    });

    return () => {
      subscription.remove();

      ScreenCapture.allowScreenCaptureAsync().catch((error) => {
        console.log("Allow screen capture error:", error);
      });
    };
  }, []);

  const viewerUrl =
    Platform.OS === "android"
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
          fileUrl
        )}`
      : fileUrl;

  const securityScript = `
    document.documentElement.style.webkitUserSelect = 'none';
    document.documentElement.style.userSelect = 'none';
    document.documentElement.style.webkitTouchCallout = 'none';

    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });

    document.addEventListener('copy', function(e) {
      e.preventDefault();
    });

    document.addEventListener('cut', function(e) {
      e.preventDefault();
    });

    document.addEventListener('selectstart', function(e) {
      e.preventDefault();
    });

    true;
  `;

  const Header = ({ heading }: { heading: string }) => (
    <View style={styles.header}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color="#2563eb" />
      </TouchableOpacity>

      <View style={styles.headerTextBox}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {heading}
        </Text>
        <Text style={styles.secureText}>Protected ebook viewer</Text>
      </View>

      <View style={styles.lockBox}>
        <Ionicons name="lock-closed" size={17} color="#16a34a" />
      </View>
    </View>
  );

  if (!isSecurePdf) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

        <Header heading="Invalid PDF" />

        <View style={styles.center}>
          <Ionicons name="shield-alert-outline" size={54} color="#ef4444" />

          <Text style={styles.errorTitle}>Blocked for security</Text>

          <Text style={styles.errorText}>
            Only secure HTTPS PDF files are allowed inside the app.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hiddenForPrivacy) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

        <Header heading="Protected" />

        <View style={styles.center}>
          <Ionicons name="eye-off-outline" size={58} color="#2563eb" />

          <Text style={styles.errorTitle}>Content hidden</Text>

          <Text style={styles.errorText}>
            Ebook content is hidden when the app is not active.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      <Header heading={title} />

      <View style={styles.warningBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#16a34a" />
        <Text style={styles.warningText}>
          Screenshot, screen recording and external opening are restricted.
        </Text>
      </View>

      <View style={styles.webWrap}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Opening protected PDF...</Text>
          </View>
        )}

        <WebView
          source={{ uri: viewerUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={false}
          cacheEnabled={false}
          incognito={true}
          originWhitelist={["https://*"]}
          injectedJavaScript={securityScript}
          injectedJavaScriptBeforeContentLoaded={securityScript}
          allowsBackForwardNavigationGestures={false}
          allowFileAccess={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="never"
          setSupportMultipleWindows={false}
          pullToRefreshEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            Alert.alert("Error", "PDF failed to load.");
          }}
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;

            if (url.startsWith("about:blank")) return true;

            if (Platform.OS === "android") {
              return url.startsWith("https://docs.google.com/");
            }

            return url === fileUrl;
          }}
        />
      </View>
    </SafeAreaView>
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
    marginLeft: 10,
  },
  warningBox: {
    marginHorizontal: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },
  webWrap: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webview: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  errorTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 21,
  },
});