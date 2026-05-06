import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(width * 0.78, 330);

type Props = {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  placeholder?: string;
  navigation?: any;
};

const menuItems = [
  { label: "Profile", icon: "person-circle-outline", screen: "Profile" },
  { label: "E-Books", icon: "book-outline", screen: "EbookSeries" },
  { label: "Test Series", icon: "document-text-outline", screen: "TestSeries" },
  { label: "Doubts", icon: "chatbubble-ellipses-outline", screen: "Doubt" },
  { label: "Reels", icon: "play-circle-outline", screen: "Reel" },
];

export default function HomeHeader({
  searchValue = "",
  onSearchChange,
  placeholder = "Search ebooks, tests...",
  navigation,
}: Props) {
  const [search, setSearch] = useState(searchValue);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 180,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerOpen(false));
  };

  const handleNavigate = (screen: string) => {
    closeDrawer();
    setTimeout(() => navigation?.navigate?.(screen), 180);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    onSearchChange?.(text);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.82} onPress={openDrawer} style={styles.iconButton}>
            <Ionicons name="menu" size={27} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#64748B" />

            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder={placeholder}
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              cursorColor="#2563EB"
              returnKeyType="search"
            />

            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")} style={styles.clearButton}>
                <Ionicons name="close" size={17} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {drawerOpen && (
        <View style={styles.drawerRoot} pointerEvents="box-none">
          <Animated.View pointerEvents="box-none" style={[styles.overlay, { opacity: fadeAnim }]}>
            <Pressable style={styles.overlayPress} onPress={closeDrawer} />
          </Animated.View>

          <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
            <SafeAreaView edges={["top"]} style={styles.drawerSafe}>
              <View style={styles.drawerHeader}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>S</Text>
                </View>

                <View style={styles.brandBox}>
                  <Text style={styles.brandTitle}>Study App</Text>
                  <Text style={styles.brandSubtitle}>Premium Learning</Text>
                </View>

                <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.menuList}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    style={[styles.menuItem, index === 0 && styles.activeMenuItem]}
                    onPress={() => handleNavigate(item.screen)}
                  >
                    <View style={[styles.menuIconBox, index === 0 && styles.activeIconBox]}>
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={index === 0 ? "#FFFFFF" : "#475569"}
                      />
                    </View>

                    <Text style={[styles.menuText, index === 0 && styles.activeMenuText]}>
                      {item.label}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={index === 0 ? "#FFFFFF" : "#94A3B8"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity activeOpacity={0.8} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F8FAFC",
    zIndex: 20,
  },
  header: {
    height: 72,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 6 : 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  searchBox: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerRoot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  overlayPress: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    height,
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 26,
    shadowOffset: { width: 8, height: 0 },
    elevation: 24,
  },
  drawerSafe: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 32,
    borderBottomRightRadius: 32,
  },
  drawerHeader: {
    marginTop: 18,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  brandBox: {
    flex: 1,
    marginLeft: 12,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  menuList: {
    gap: 12,
  },
  menuItem: {
    height: 58,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  activeMenuItem: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activeIconBox: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  activeMenuText: {
    color: "#FFFFFF",
  },
  logoutBtn: {
    height: 56,
    borderRadius: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    marginTop: "auto",
    marginBottom: 28,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#EF4444",
  },
});