import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);

    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  },

  async set<T>(key: string, value: T) {
    if (typeof value === "string") {
      await AsyncStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  },

  async remove(key: string) {
    await AsyncStorage.removeItem(key);
  },

  async clearAuth() {
    await AsyncStorage.removeItem("auth-storage");
  },
};