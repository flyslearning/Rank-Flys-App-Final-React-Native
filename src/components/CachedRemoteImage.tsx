import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { StyleProp, ImageStyle } from "react-native";
import { getCachedImageUri } from "../utils/imageCache";

type Props = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
};

export default function CachedRemoteImage({ uri, style }: Props) {
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!uri) {
        setLocalUri(null);
        return;
      }

      const cachedUri = await getCachedImageUri(uri);

      if (mounted) {
        setLocalUri(cachedUri);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [uri]);

  if (!localUri) return null;

  return (
    <Image
      source={{ uri: localUri }}
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={0}
      recyclingKey={localUri}
    />
  );
}