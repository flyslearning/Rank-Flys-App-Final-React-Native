import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";

const PDF_CACHE_DIR = FileSystem.documentDirectory + ".rankflys-secure-cache/";
const KEY_PREFIX = "rankflys_pdf_cache_";
const MIN_VALID_FILE_SIZE = 1024;
const MAX_CACHE_AGE_DAYS = 180;
const MAX_CACHE_AGE_MS = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;

type CacheMeta = {
  allowed: true;
  createdAt: number;
  fileUrlHash: string;
};

function simpleHash(value: string) {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString();
}

async function ensureCacheDir() {
  await FileSystem.makeDirectoryAsync(PDF_CACHE_DIR, {
    intermediates: true,
  }).catch(() => {});
}

function getSafePdfPath(fileUrl: string) {
  const hash = simpleHash(fileUrl);
  return `${PDF_CACHE_DIR}${hash}.rankflys`;
}

function getMetaKey(fileUrl: string) {
  return `${KEY_PREFIX}${simpleHash(fileUrl)}`;
}

function isExpired(createdAt: number) {
  return Date.now() - createdAt > MAX_CACHE_AGE_MS;
}

function isValidUrl(fileUrl: string) {
  return (
    fileUrl.startsWith("https://") &&
    !fileUrl.includes("..") &&
    !fileUrl.startsWith("file://")
  );
}

async function deleteOne(fileUrl: string) {
  const localPath = getSafePdfPath(fileUrl);
  const metaKey = getMetaKey(fileUrl);

  await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
  await SecureStore.deleteItemAsync(metaKey).catch(() => {});
}

export async function getCachedPdfUrl(
  fileUrl: string,
  accessToken: string
): Promise<string> {
  if (!isValidUrl(fileUrl)) {
    throw new Error("Invalid PDF URL");
  }

  if (!accessToken) {
    throw new Error("Access token missing");
  }

  await cleanupOldCachedPdfs();
  await ensureCacheDir();

  const localPath = getSafePdfPath(fileUrl);
  const metaKey = getMetaKey(fileUrl);
  const fileUrlHash = simpleHash(fileUrl);

  const info = await FileSystem.getInfoAsync(localPath);

  if (info.exists && info.size && info.size > MIN_VALID_FILE_SIZE) {
    const savedMetaRaw = await SecureStore.getItemAsync(metaKey);

    try {
      const savedMeta: CacheMeta | null = savedMetaRaw
        ? JSON.parse(savedMetaRaw)
        : null;

      if (
        savedMeta?.allowed === true &&
        savedMeta.fileUrlHash === fileUrlHash &&
        savedMeta.createdAt &&
        !isExpired(savedMeta.createdAt)
      ) {
        return localPath;
      }
    } catch {}

    await deleteOne(fileUrl);
  }

  await deleteOne(fileUrl);

  const downloaded = await FileSystem.downloadAsync(fileUrl, localPath, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/pdf",
    },
  });

  if (downloaded.status < 200 || downloaded.status >= 300) {
    await deleteOne(fileUrl);
    throw new Error("PDF download failed");
  }

  const downloadedInfo = await FileSystem.getInfoAsync(localPath);

  if (
    !downloadedInfo.exists ||
    !downloadedInfo.size ||
    downloadedInfo.size <= MIN_VALID_FILE_SIZE
  ) {
    await deleteOne(fileUrl);
    throw new Error("Invalid downloaded PDF");
  }

  const meta: CacheMeta = {
    allowed: true,
    createdAt: Date.now(),
    fileUrlHash,
  };

  await SecureStore.setItemAsync(metaKey, JSON.stringify(meta));

  return downloaded.uri;
}

export async function deleteCachedPdf(fileUrl: string) {
  await deleteOne(fileUrl);
}

export async function clearAllCachedPdfs() {
  await FileSystem.deleteAsync(PDF_CACHE_DIR, { idempotent: true }).catch(
    () => {}
  );
}

export async function cleanupOldCachedPdfs() {
  await ensureCacheDir();

  const files = await FileSystem.readDirectoryAsync(PDF_CACHE_DIR).catch(
    () => []
  );

  const now = Date.now();

  for (const file of files) {
    const filePath = PDF_CACHE_DIR + file;
    const info = await FileSystem.getInfoAsync(filePath).catch(() => null);

    if (!info?.exists || !info.modificationTime) continue;

    const modifiedAt = info.modificationTime * 1000;

    if (now - modifiedAt > MAX_CACHE_AGE_MS) {
      await FileSystem.deleteAsync(filePath, { idempotent: true }).catch(
        () => {}
      );
    }
  }
}