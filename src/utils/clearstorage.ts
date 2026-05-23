import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAllCachedPdfs } from "./pdfCache";

// ❌ Important data — never clear automatically
export const PROTECTED_KEYS = [
  "access_token",
  "refresh_token",
  "user",
  "has_seen_intro",
  "APP_VERSION",
  "APP_DATA_VERSION",
];

// ✅ Temporary/cache data — safe to clear
export const TEMP_KEYS = [
  "active_attempt",

  "home_cache",
  "ebooks_cache",
  "tests_cache",
  "mentorship_cache",
  "tools_cache",
  "syllabus_cache",
  "chat_cache",
  "pdf_cache",
];

// Clear only temporary app data
export const clearTemporaryAppData = async () => {
  try {
    console.log("Clearing temporary app data...");

    await AsyncStorage.multiRemove(TEMP_KEYS);

    await clearAllCachedPdfs();

    console.log("Temporary app data cleared");
  } catch (error) {
    console.log("Clear temporary data error:", error);
  }
};

// Clear everything except protected keys
export const clearEverythingExceptProtected = async () => {
  try {
    console.log("Clearing all non-protected data...");

    const allKeys = await AsyncStorage.getAllKeys();

    const keysToDelete = allKeys.filter(
      (key) => !PROTECTED_KEYS.includes(key)
    );

    if (keysToDelete.length > 0) {
      await AsyncStorage.multiRemove(keysToDelete);
    }

    await clearAllCachedPdfs();

    console.log("All non-protected data cleared");
  } catch (error) {
    console.log("Full clear error:", error);
  }
};

// Debug helper
export const printAllStorageKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();

    console.log("ALL STORAGE KEYS:");
    console.log(keys);
  } catch (error) {
    console.log("Print keys error:", error);
  }
};