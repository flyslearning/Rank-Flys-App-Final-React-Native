// src/components/home/HomeHeader.tsx

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
  Image,
  Modal,
  Alert,
  ScrollView,
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";

const { width, height } = Dimensions.get("window");

const isSmall = width < 380;
const isTablet = width >= 768;
const DRAWER_WIDTH = isTablet ? 390 : isSmall ? width * 0.88 : Math.min(width * 0.82, 350);

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
  { label: "Reels", icon: "play-circle-outline", screen: "Flys" },
];

export default function HomeHeader({
  searchValue = "",
  onSearchChange,
  placeholder = "Search ebooks, tests...",
  navigation,
}: Props) {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((state) => state.logout);

  const [search, setSearch] = useState(searchValue);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const menuPressScale = useRef(new Animated.Value(1)).current;

  const openDrawer = () => {
    Keyboard.dismiss();
    setDrawerOpen(true);

    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 190,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 18,
        stiffness: 140,
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
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 230,
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

  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          closeDrawer();
          setTimeout(async () => {
            await logout();
          }, 180);
        },
      },
    ]);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    onSearchChange?.(text);
  };

  const pressMenuIn = () => {
    Animated.spring(menuPressScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 30,
      bounciness: 7,
    }).start();
  };

  const pressMenuOut = () => {
    Animated.spring(menuPressScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 7,
    }).start();
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: menuPressScale }] }}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={openDrawer}
              onPressIn={pressMenuIn}
              onPressOut={pressMenuOut}
              style={styles.iconButton}
            >
              <Ionicons name="menu" size={27} color="#2563EB" />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#2563EB" />

            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              cursorColor="#2563EB"
              returnKeyType="search"
            />

            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")} style={styles.clearButton}>
                <Ionicons name="close" size={17} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={drawerOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeDrawer}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Pressable style={styles.overlayPress} onPress={closeDrawer} />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <View
              style={[
                styles.drawerContent,
                {
                  paddingTop: Math.max(insets.top + 6, Platform.OS === "android" ? 32 : 24),
                  paddingBottom: Math.max(insets.bottom + 18, 30),
                },
              ]}
            >
              <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} activeOpacity={0.86}>
                <Ionicons name="close" size={21} color="#2563EB" />
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                contentContainerStyle={styles.drawerScroll}
              >
                <View style={styles.logoSection}>
                  <View style={styles.logoGlow}>
                    <View style={styles.logoCircle}>
                      <Image
                        source={require("../../assets/images/logo.png")}
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
                      <View style={styles.activeBadge} />
                    </View>
                  </View>
                </View>

                <View style={styles.menuList}>
                  {menuItems.map((item, index) => {
                    const isActive = index === 0;

                    return (
                      <TouchableOpacity
                        key={item.label}
                        activeOpacity={0.84}
                        style={[styles.menuItem, isActive && styles.activeMenuItem]}
                        onPress={() => handleNavigate(item.screen)}
                      >
                        <View style={[styles.menuIconBox, isActive && styles.activeIconBox]}>
                          <Ionicons
                            name={item.icon as any}
                            size={22}
                            color={isActive ? "#2563EB" : "#4B5563"}
                          />
                        </View>

                        <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                          {item.label}
                        </Text>

                        {isActive && <View style={styles.activeBlueSign} />}

                        <Ionicons name="chevron-forward" size={18} color="#93C5FD" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View
                style={[
                  styles.bottomActions,
                  {
                    bottom: Math.max(insets.bottom + 16, Platform.OS === "android" ? 24 : 28),
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.84}
                  style={styles.contactBtn}
                  onPress={() => handleNavigate("Contact Us")}
                >
                  <View style={styles.bottomIconBlue}>
                    <Ionicons name="call-outline" size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.contactText}>Contact Us</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.84}
                  style={styles.logoutBtn}
                  onPress={confirmLogout}
                >
                  <View style={styles.bottomIconRed}>
                    <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                  </View>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
    zIndex: 20,
  },

  header: {
    height: isSmall ? 68 : 72,
    paddingHorizontal: isSmall ? 12 : 16,
    paddingTop: Platform.OS === "android" ? 6 : 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },

  iconButton: {
    width: isSmall ? 46 : 48,
    height: isSmall ? 46 : 48,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#2563EB",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  searchBox: {
    flex: 1,
    height: isSmall ? 46 : 48,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#2563EB",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: isSmall ? 14 : 15,
    fontWeight: "600",
    color: "#111827",
    paddingVertical: 0,
  },

  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  modalRoot: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.48)",
  },

  overlayPress: {
    flex: 1,
  },

  drawer: {
    width: DRAWER_WIDTH,
    height,
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: "#2563EB",
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 8, height: 0 },
    elevation: 24,
  },

  drawerContent: {
    flex: 1,
    paddingHorizontal: isSmall ? 14 : 18,
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },

  closeBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? 32 : 34,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  drawerScroll: {
    paddingBottom: 150,
  },

  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: isSmall ? 18 : 24,
  },

  logoGlow: {
    width: isSmall ? 102 : 116,
    height: isSmall ? 102 : 116,
    borderRadius: isSmall ? 51 : 58,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },

  logoCircle: {
    width: isSmall ? 82 : 90,
    height: isSmall ? 82 : 90,
    borderRadius: isSmall ? 41 : 45,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  logoImage: {
    width: isSmall ? 54 : 62,
    height: isSmall ? 54 : 62,
  },

  activeBadge: {
    position: "absolute",
    right: 7,
    bottom: 8,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#2563EB",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  brandTitle: {
    marginTop: 12,
    fontSize: isSmall ? 18 : 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  brandSubTitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  menuList: {
    gap: isSmall ? 10 : 12,
  },

  menuItem: {
    minHeight: isSmall ? 54 : 59,
    borderRadius: 20,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#2563EB",
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  activeMenuItem: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },

  menuIconBox: {
    width: isSmall ? 38 : 40,
    height: isSmall ? 38 : 40,
    borderRadius: 15,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  activeIconBox: {
    backgroundColor: "#DBEAFE",
  },

  menuText: {
    flex: 1,
    fontSize: isSmall ? 14 : 15,
    fontWeight: "800",
    color: "#111827",
  },

  activeMenuText: {
    color: "#1D4ED8",
  },

  activeBlueSign: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    marginRight: 10,
  },

  bottomActions: {
    position: "absolute",
    left: isSmall ? 14 : 18,
    right: isSmall ? 14 : 18,
    gap: 12,
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
  },

  contactBtn: {
    height: isSmall ? 52 : 56,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: "#2563EB",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  contactText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#1D4ED8",
  },

  logoutBtn: {
    height: isSmall ? 52 : 56,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    shadowColor: "#DC2626",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#DC2626",
  },

  bottomIconBlue: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomIconRed: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
});