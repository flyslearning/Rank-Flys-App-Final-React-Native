import * as FileSystem from "expo-file-system/legacy";

export const clearAllCachedBooks = async () => {
  try {
    const booksDir =
      `${FileSystem.documentDirectory}books/`;

    const info = await FileSystem.getInfoAsync(
      booksDir
    );

    if (info.exists) {
      await FileSystem.deleteAsync(booksDir, {
        idempotent: true,
      });
    }

    console.log("All cached books cleared");
  } catch (error) {
    console.log(
      "Clear cached books error:",
      error
    );
  }
};