import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAllCachedPdfs } from "./pdfCache";
import { clearAllCachedImages } from "./imageCache";
import { clearAllCachedBooks } from "./bookCache";
import { db } from "../db/database";


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

    // preserve intro
    const hasSeenIntro = await AsyncStorage.getItem(
      "has_seen_intro"
    );

    await AsyncStorage.multiRemove(TEMP_KEYS);

    // restore intro just in case
    if (hasSeenIntro) {
      await AsyncStorage.setItem(
        "has_seen_intro",
        hasSeenIntro
      );
    }

    await clearAllCachedPdfs();
    await clearAllCachedBooks();
    await clearAllCachedImages();

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
    await clearAllCachedBooks();

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

export const clearFullLocalDatabase = async () => {
  try {
    const tables = db.getAllSync<{ name: string }>(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    `);

    db.withTransactionSync(() => {
      tables.forEach((table) => {
        if (table.name === "app_meta") return;

        db.runSync(`DELETE FROM ${table.name}`);
      });
    });

    console.log("Full local database data cleared");
  } catch (error) {
    console.log("Full DB clear error:", error);
  }
};

export const clearDataOnGoalClassChange = async () => {
  try {
    await clearEverythingExceptProtected();
    await clearFullLocalDatabase();

    console.log("Goal/Class change data cleared");
  } catch (error) {
    console.log("Goal/Class clear error:", error);
  }
};

export const clearDataOnLogout = async () => {
  try {
    const hasSeenIntro = await AsyncStorage.getItem(
      "has_seen_intro"
    );

    await AsyncStorage.clear();

    if (hasSeenIntro) {
      await AsyncStorage.setItem(
        "has_seen_intro",
        hasSeenIntro
      );
    }

    await clearAllCachedPdfs();
    await clearAllCachedBooks();
    await clearAllCachedImages();
    await clearFullLocalDatabase();

    console.log("Logout clear complete");
  } catch (error) {
    console.log("Logout clear error:", error);
  }
};