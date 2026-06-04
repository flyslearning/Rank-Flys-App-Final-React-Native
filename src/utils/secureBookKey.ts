import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const BOOK_CACHE_KEY = "RANK_FLYS_BOOK_CACHE_KEY";

export async function getBookCacheKey() {
  let key = await SecureStore.getItemAsync(BOOK_CACHE_KEY);

  if (!key) {
    const random = `${Date.now()}-${Math.random()}-${Math.random()}`;

    key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      random
    );

    await SecureStore.setItemAsync(BOOK_CACHE_KEY, key);
  }

  return key;
}