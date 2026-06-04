import * as FileSystem from "expo-file-system/legacy";

const IMAGE_CACHE_DIR =
  FileSystem.documentDirectory + "remote-images/";

const downloadingMap = new Map<string, Promise<string>>();

const safeName = (uri: string) => {
  return encodeURIComponent(uri).replace(/%/g, "_");
};

export const getCachedImageUri = async (uri: string) => {
  try {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, {
      intermediates: true,
    });

    const fileUri = IMAGE_CACHE_DIR + safeName(uri);

    const info = await FileSystem.getInfoAsync(fileUri);

    if (info.exists) {
      console.log("IMAGE LOCAL HIT:", uri);
      return fileUri;
    }

    if (downloadingMap.has(uri)) {
      console.log("IMAGE DOWNLOAD WAIT:", uri);
      return await downloadingMap.get(uri)!;
    }

    const downloadPromise = (async () => {
      console.log("IMAGE DOWNLOAD:", uri);

      const downloaded = await FileSystem.downloadAsync(uri, fileUri);

      return downloaded.uri;
    })();

    downloadingMap.set(uri, downloadPromise);

    try {
      return await downloadPromise;
    } finally {
      downloadingMap.delete(uri);
    }
  } catch (error) {
    console.log("IMAGE CACHE ERROR:", error);
    return uri;
  }
};
export const clearAllCachedImages = async () => {
  try {
    const info = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);

    if (info.exists) {
      await FileSystem.deleteAsync(IMAGE_CACHE_DIR, {
        idempotent: true,
      });
    }

    console.log("All cached images cleared");
  } catch (error) {
    console.log("Clear cached images error:", error);
  }
};