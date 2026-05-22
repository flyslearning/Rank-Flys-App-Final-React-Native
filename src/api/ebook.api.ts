import { ebookClient } from "./client";

export const EbookAPI = {
  getSeries() {
    return ebookClient.get("/ebook-series");
  },
  getStudyMaterial() {
  return ebookClient.get("/study-material");
  },
  getSeriesDetail(seriesId: string) {
    return ebookClient.get(`/ebook-series/${seriesId}`);
  },

  getSeriesTree(seriesId: string) {
    return ebookClient.get(`/ebook-series/${seriesId}/tree`);
  },

  getNodes(seriesId: string, parentId?: string | null) {
    const params: Record<string, string> = {
      series_id: seriesId,
    };

    if (parentId) {
      params.parent_id = parentId;
    }

    return ebookClient.get("/ebook-nodes", {
      params,
    });
  },
};