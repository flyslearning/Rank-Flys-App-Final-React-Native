import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { clearTemporaryAppData } from "./clearstorage";

export const isVersionLower = (current: string, minimum: string) => {
  const c = current.split(".").map(Number);
  const m = minimum.split(".").map(Number);

  for (let i = 0; i < Math.max(c.length, m.length); i++) {
    const currentPart = c[i] || 0;
    const minPart = m[i] || 0;

    if (currentPart < minPart) return true;
    if (currentPart > minPart) return false;
  }

  return false;
};

const APP_DATA_VERSION = '2';

const CACHE_KEYS_TO_CLEAR = [
  'home_cache',
  'ebooks_cache',
  'tests_cache',
  'mentorship_cache',
  'tools_cache',
  'syllabus_cache',
  'chat_cache',
  'pdf_cache',
];

export const checkAndMigrateAppData = async () => {
  try {
    const appVersion = Constants.expoConfig?.version || 'unknown';

    const savedAppVersion = await AsyncStorage.getItem('APP_VERSION');
    const savedDataVersion = await AsyncStorage.getItem('APP_DATA_VERSION');

    const isNewAppUpdate = savedAppVersion !== appVersion;
    const isDataChanged = savedDataVersion !== APP_DATA_VERSION;

    if (isNewAppUpdate || isDataChanged) {
      console.log('App/Data update detected');

      if (isDataChanged) {
        await clearTemporaryAppData();
        await AsyncStorage.setItem('APP_DATA_VERSION', APP_DATA_VERSION);
      }

      await AsyncStorage.setItem('APP_VERSION', appVersion);
    }
  } catch (error) {
    console.log('Version migration error:', error);
  }
};