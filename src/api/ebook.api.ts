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
  getHomeBooks() {
    return ebookClient.get("/books/home");
  },

  getAllBooks(limit = 20, offset = 0) {
    return ebookClient.get("/books/view-all", {
      params: { limit, offset },
    });
  },

  getBookDetail(bookId: string) {
    return ebookClient.get(`/books/${bookId}`);
  },

  getBookPages(bookId: string, from = 1, limit = 10) {
    return ebookClient.get(`/books/${bookId}/pages`, {
      params: { from, limit },
    });
  },

  getBookPagesAround(bookId: string, center = 1, before = 2, after = 3) {
    return ebookClient.get(`/books/${bookId}/pages-around`, {
      params: { center, before, after },
    });
  },

  getBookBookmarks(bookId: string) {
    return ebookClient.get("/books/bookmarks", {
      params: { book_id: bookId },
    });
  },

  toggleBookBookmark(bookId: string, pageNo: number) {
    return ebookClient.post("/books/bookmark", {
      book_id: bookId,
      page_no: pageNo,
    });
  },

  saveBookProgress(bookId: string, pageNo: number) {
    return ebookClient.post("/books/progress", {
      book_id: bookId,
      page_no: pageNo,
    });
  },

  getLibraryPassPlans(goalClassId?: string) {
    return ebookClient.get("/library-pass/plans", {
      params: goalClassId ? { goal_class_id: goalClassId } : {},
    });
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