import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const SECURE_KEYS = ["refresh_token"];

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    let value: string | null = null;

    if (SECURE_KEYS.includes(key)) {
      value = await SecureStore.getItemAsync(key);
    } else {
      value = await AsyncStorage.getItem(key);
    }

    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set<T>(key: string, value: T) {
    const finalValue =
      typeof value === "string" ? value : JSON.stringify(value);

    if (SECURE_KEYS.includes(key)) {
      await SecureStore.setItemAsync(key, finalValue);
    } else {
      await AsyncStorage.setItem(key, finalValue);
    }
  },

  async remove(key: string) {
    if (SECURE_KEYS.includes(key)) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },

  async clearAuth() {
    await AsyncStorage.removeItem("access_token");
    await SecureStore.deleteItemAsync("refresh_token");
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("auth-storage");
  },
};