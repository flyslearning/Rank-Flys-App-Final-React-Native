import { EbookAPI } from "./ebook.api";
import { TestAPI } from "./test.api";
import { mentorshipApi } from "./mentorship.api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type GlobalSearchItem = {
  id: string;
  title: string;
  type: "ebook_series" | "study_material" | "test_series" | "mentorship";
  subtitle?: string;
  raw?: any;
};

const SEARCH_CACHE_KEY = "global_search_cache_v2";
const SEARCH_CACHE_TIME_KEY = "global_search_cache_time_v2";
const SEARCH_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const normalize = (value?: any) => {
  return String(value || "").toLowerCase().trim();
};

const getList = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res)) return res;
  return [];
};

export async function fetchSearchData(
  forceRefresh: boolean = false
): Promise<GlobalSearchItem[]> {
  try {
    const now = Date.now();

    if (!forceRefresh) {
      const cachedData = await AsyncStorage.getItem(SEARCH_CACHE_KEY);
      const cachedTime = await AsyncStorage.getItem(SEARCH_CACHE_TIME_KEY);

      const lastCachedAt = cachedTime ? Number(cachedTime) : 0;
      const cacheAge = now - lastCachedAt;

      if (cachedData && lastCachedAt > 0 && cacheAge < SEARCH_CACHE_TTL) {
        console.log("GLOBAL SEARCH: CACHE USED");
        return JSON.parse(cachedData);
      }
    }

    console.log("GLOBAL SEARCH: API CALLED");

    const results: GlobalSearchItem[] = [];

    const [ebookRes, studyRes, testRes, mentorshipRes] =
      await Promise.allSettled([
        EbookAPI.getSeries(),
        EbookAPI.getStudyMaterial(),
        TestAPI.getTestSeries(),
        mentorshipApi.getMyMentorships(),
      ]);

    if (ebookRes.status === "fulfilled") {
      getList(ebookRes.value).forEach((item: any) => {
        const title = item.title || item.name || "";

        if (item.id && title) {
          results.push({
            id: String(item.id),
            title,
            type: "ebook_series",
            subtitle: item.description || "Ebook Series",
            raw: item,
          });
        }
      });
    }

    if (studyRes.status === "fulfilled") {
      getList(studyRes.value).forEach((item: any) => {
        const title = item.title || item.name || "";

        if (item.id && title) {
          results.push({
            id: String(item.id),
            title,
            type: "study_material",
            subtitle: item.description || "Study Material",
            raw: item,
          });
        }
      });
    }

    if (testRes.status === "fulfilled") {
      getList(testRes.value).forEach((item: any) => {
        const title = item.title || item.name || "";

        if (item.id && title) {
          results.push({
            id: String(item.id),
            title,
            type: "test_series",
            subtitle: item.description || "Test Series",
            raw: item,
          });
        }
      });
    }

    if (mentorshipRes.status === "fulfilled") {
      getList(mentorshipRes.value).forEach((item: any) => {
        const title = item.title || item.name || item.plan_title || "";

        if (item.id && title) {
          results.push({
            id: String(item.id),
            title,
            type: "mentorship",
            subtitle: item.description || "Mentorship",
            raw: item,
          });
        }
      });
    }

    const finalData = removeDuplicates(results);

    await AsyncStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(finalData));
    await AsyncStorage.setItem(SEARCH_CACHE_TIME_KEY, String(now));

    console.log("GLOBAL SEARCH: CACHE SAVED", finalData.length);

    return finalData;
  } catch (error) {
    console.log("Fetch search data error:", error);

    const cachedData = await AsyncStorage.getItem(SEARCH_CACHE_KEY);

    if (cachedData) {
      console.log("GLOBAL SEARCH: FALLBACK CACHE USED");
      return JSON.parse(cachedData);
    }

    return [];
  }
}

export function filterSearchData(
  data: GlobalSearchItem[],
  query: string
): GlobalSearchItem[] {
  const q = normalize(query);

  if (q.length < 2) return [];

  return data.filter((item) => {
    const title = normalize(item.title);
    const subtitle = normalize(item.subtitle);
    const description = normalize(
      item.raw?.description || item.raw?.short_description
    );

    return title.includes(q) || subtitle.includes(q) || description.includes(q);
  });
}

function removeDuplicates(data: GlobalSearchItem[]) {
  const map = new Map<string, GlobalSearchItem>();

  data.forEach((item) => {
    const key = `${item.type}-${item.id}`;

    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}