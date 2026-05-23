import { create } from "zustand";
import { useAuthStore } from "./auth.store";

import {
  getSyncMeta,
  saveSyncMeta,
  updateLastSyncOnly,
  getSubjects,
  getChapters,
  getTopics,
  replaceSyllabus,
  updateLocalTopic,
} from "../db/syllabusDb";

import {
  checkToolSync,
  getFullToolSync,
  updateTopicProgress,
} from "../api/tools.api";

type State = {
  subjects: any[];
  chaptersBySubject: Record<string, any[]>;
  topicsByChapter: Record<string, any[]>;

  openSubjectID: string | null;
  openChapterID: string | null;

  loading: boolean;
  syncing: boolean;
  loadingChapterID: string | null;

  loadLocal: () => void;
  syncNow: (force?: boolean) => Promise<void>;
  refresh: () => Promise<void>;

  toggleSubject: (subjectID: string) => void;
  toggleChapter: (chapterID: string) => void;
  completeTopic: (topic: any) => Promise<void>;
};

const MODULE = "syllabus";
const TEN_MINUTES = 10 * 60 * 1000;

function getGoalClassID() {
  const token = useAuthStore.getState().accessToken;

  if (!token) return "";

  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.goal_class_id ?? "";
  } catch {
    return "";
  }
}

export const useSyllabusStore = create<State>((set, get) => ({
  subjects: [],
  chaptersBySubject: {},
  topicsByChapter: {},

  openSubjectID: null,
  openChapterID: null,

  loading: false,
  syncing: false,
  loadingChapterID: null,

  loadLocal: () => {
    const goalClassID = getGoalClassID();

    if (!goalClassID) {
      console.log("NO GOAL CLASS ID FOUND");
      return;
    }

    const subjects = getSubjects(goalClassID);

    const chaptersBySubject: Record<string, any[]> = {};
    const topicsByChapter: Record<string, any[]> = {};

    for (const subject of subjects) {
      const chapters = getChapters(subject.id);
      chaptersBySubject[subject.id] = chapters;

      for (const chapter of chapters) {
        topicsByChapter[chapter.id] = getTopics(chapter.id);
      }
    }

    set({
      subjects,
      chaptersBySubject,
      topicsByChapter,
    });

    console.log("LOCAL LOADED:", {
      subjects: subjects.length,
      chapters: Object.values(chaptersBySubject).flat().length,
      topics: Object.values(topicsByChapter).flat().length,
    });
  },

  syncNow: async (force = false) => {
    const goalClassID = getGoalClassID();

    if (!goalClassID) {
      console.log("SYNC STOPPED: goal_class_id missing");
      return;
    }

    const meta = getSyncMeta(goalClassID);
    const localVersion = meta?.version ?? 0;
    const lastSync = meta?.last_sync_time ?? 0;

    if (!force && Date.now() - lastSync < TEN_MINUTES) {
      console.log("SYNC SKIPPED: cache fresh");
      get().loadLocal();
      return;
    }

    try {
      set({ syncing: true, loading: true });

      console.log("SYNC CHECK:", {
        module: MODULE,
        goalClassID,
        localVersion,
      });

      const check = await checkToolSync(MODULE, localVersion);

      console.log("SYNC CHECK RESPONSE:", check);

      if (!check.update_available) {
        updateLastSyncOnly(goalClassID);
        get().loadLocal();
        return;
      }

      const fullData = await getFullToolSync(MODULE);

      console.log("SYNC FULL RESPONSE RECEIVED");

      const saved = replaceSyllabus(goalClassID, fullData);

      if (saved) {
        const nextVersion =
          check.server_version ??
          fullData?.version ??
          localVersion + 1;

        saveSyncMeta(goalClassID, nextVersion);
      } else {
        console.log("SYNC NOT SAVED: invalid or empty fullData");
      }

      get().loadLocal();
    } catch (err) {
      console.log("SYLLABUS SYNC ERROR:", err);
      get().loadLocal();
    } finally {
      set({ syncing: false, loading: false });
    }
  },

  refresh: async () => {
    await get().syncNow(true);
  },

  toggleSubject: (subjectID: string) => {
    const isOpen = get().openSubjectID === subjectID;

    set({
      openSubjectID: isOpen ? null : subjectID,
      openChapterID: null,
    });
  },

  toggleChapter: (chapterID: string) => {
    const isOpen = get().openChapterID === chapterID;

    set({
      openChapterID: isOpen ? null : chapterID,
    });
  },

  completeTopic: async (topic: any) => {
  const chapterID = topic.chapter_id;
  const oldTopics = get().topicsByChapter[chapterID] ?? [];

  const isCompleted = topic.status === "completed";

  const nextStatus = isCompleted ? "not_started" : "completed";
  const nextConfidence = isCompleted ? 0 : 5;

  updateLocalTopic(topic.id, nextStatus, nextConfidence, topic.notes ?? "");

  set({
    topicsByChapter: {
      ...get().topicsByChapter,
      [chapterID]: getTopics(chapterID),
    },
  });

  try {
    await updateTopicProgress(topic.id, {
      status: nextStatus,
      confidence: nextConfidence,
      notes: topic.notes ?? "",
    });
  } catch (err) {
    console.log("PROGRESS API ERROR:", err);

    set({
      topicsByChapter: {
        ...get().topicsByChapter,
        [chapterID]: oldTopics,
      },
    });

    updateLocalTopic(
      topic.id,
      topic.status ?? "not_started",
      topic.confidence ?? 0,
      topic.notes ?? ""
    );
  }
},
}));