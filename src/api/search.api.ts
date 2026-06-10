import { EbookAPI } from "./ebook.api";
import { TestAPI } from "./test.api";
import { mentorshipApi } from "./mentorship.api";

export type GlobalSearchItem = {
  id: string;
  title: string;
  type: "ebook_series" | "study_material" | "test_series" | "mentorship";
  subtitle?: string;
  raw?: any;
};

const normalize = (value?: any) => {
  return String(value || "").toLowerCase().trim();
};

const getList = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res)) return res;
  return [];
};

export async function fetchSearchData(): Promise<GlobalSearchItem[]> {
  const results: GlobalSearchItem[] = [];

  try {
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

    return removeDuplicates(results);
  } catch (error) {
    console.log("Fetch search data error:", error);
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

    return (
      title.includes(q) ||
      subtitle.includes(q) ||
      description.includes(q)
    );
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