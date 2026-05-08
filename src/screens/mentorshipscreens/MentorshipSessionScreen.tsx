import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const RED = "#ef4444";
const DARK = "#0f172a";
const BG = "#f8fafc";

const formatDateTime = (value?: string) => {
  if (!value) return "";

  const cleaned = value.replace("Z", "").replace("+00:00", "");
  const d = new Date(cleaned);

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function MentorshipSessionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { session, mentorshipTitle } = route.params || {};

  const openRecording = session?.openRecording === true;
  const url = openRecording ? session?.recording_url : session?.meet_link;

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color={RED} />
          <Text style={styles.emptyTitle}>Session not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!url) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={BG} />

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerLabel}>{mentorshipTitle}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {session.title}
            </Text>
          </View>
        </View>

        <View style={styles.center}>
          <Ionicons name="link-outline" size={52} color={BLUE} />
          <Text style={styles.emptyTitle}>
            {openRecording ? "Recording link missing" : "Meet link missing"}
          </Text>
          <Text style={styles.emptySub}>
            Admin ne abhi link add nahi kiya hai.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ecfdf5" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>
            {openRecording ? "Session Recording" : "Live Session"}
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {session.title}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {formatDateTime(session.start_time)} - {formatDateTime(session.end_time)}
          </Text>
        </View>

        {session.is_live ? (
          <View style={styles.livePill}>
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoCard}>
        <View style={styles.iconBox}>
          <Ionicons
            name={openRecording ? "play-circle-outline" : "videocam-outline"}
            size={24}
            color={GREEN}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.sessionTitle} numberOfLines={2}>
            {session.title}
          </Text>
          <Text style={styles.sessionDesc} numberOfLines={2}>
            {session.description || "Premium mentorship session"}
          </Text>
        </View>
      </View>

      <View style={styles.webWrap}>
        <WebView
          source={{ uri: url }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          renderError={() => (
            <View style={styles.center}>
              <Ionicons name="warning-outline" size={48} color={RED} />
              <Text style={styles.emptyTitle}>Unable to open session</Text>
              <Text style={styles.emptySub}>Link app ke andar load nahi ho raha.</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "android" ? 8 : 4,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  headerLabel: {
    color: GREEN,
    fontSize: 11,
    fontWeight: "900",
  },
  headerTitle: {
    color: DARK,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 1,
  },
  headerSub: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  livePill: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  livePillText: {
    color: RED,
    fontSize: 10,
    fontWeight: "900",
  },
  infoCard: {
    margin: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  sessionTitle: {
    color: DARK,
    fontSize: 15,
    fontWeight: "900",
  },
  sessionDesc: {
    marginTop: 3,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  webWrap: {
    flex: 1,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    marginTop: 10,
    color: DARK,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  emptySub: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});