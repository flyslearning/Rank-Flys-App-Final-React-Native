import { create } from "zustand";
import {
  createPlannerTask,
  getPlannerTasks,
  updatePlannerTask,
  startPomodoro,
  finishPomodoro,
  createFlashcard,
  getDueFlashcards,
  reviewFlashcard,
  createStudyGoal,
  getStudyGoals,
  getAnalyticsDashboard,
} from "../api/tools.api";

type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";
type PomodoroStatus = "completed" | "cancelled";

type ToolsState = {
  tasks: any[];
  flashcards: any[];
  goals: any[];
  analytics: any | null;
  pomodoroSession: any | null;

  loading: boolean;
  dashboardLoading: boolean;
  tasksLoading: boolean;
  flashcardsLoading: boolean;
  goalsLoading: boolean;
  actionLoading: boolean;

  error: string | null;

  clearError: () => void;

  loadDashboard: () => Promise<void>;
  loadAllTools: (date?: string) => Promise<void>;

  loadTasks: (date: string) => Promise<void>;
  addTask: (data: any, date: string) => Promise<void>;
  updateTaskStatus: (
    taskID: string,
    date: string,
    status: TaskStatus,
    actualMinutes?: number
  ) => Promise<void>;

  loadFlashcards: () => Promise<void>;
  addFlashcard: (data: any) => Promise<void>;
  reviewCard: (cardID: string, quality: number) => Promise<void>;

  loadGoals: () => Promise<void>;
  addGoal: (data: any) => Promise<void>;

  startFocus: (data: any) => Promise<void>;
  finishFocus: (
    cyclesCompleted?: number,
    status?: PomodoroStatus
  ) => Promise<void>;
};

function normalizeArray(data: any) {
  return Array.isArray(data) ? data : [];
}

function getErrorMessage(err: any) {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Something went wrong"
  );
}

export const useToolsStore = create<ToolsState>((set, get) => ({
  tasks: [],
  flashcards: [],
  goals: [],
  analytics: null,
  pomodoroSession: null,

  loading: false,
  dashboardLoading: false,
  tasksLoading: false,
  flashcardsLoading: false,
  goalsLoading: false,
  actionLoading: false,

  error: null,

  clearError: () => set({ error: null }),

  loadDashboard: async () => {
    set({ loading: true, dashboardLoading: true, error: null });

    try {
      const analytics = await getAnalyticsDashboard();
      set({ analytics: analytics ?? null });
    } catch (err) {
      console.log("LOAD DASHBOARD ERROR:", err);
      set({ analytics: null, error: getErrorMessage(err) });
    } finally {
      set({ loading: false, dashboardLoading: false });
    }
  },

  loadAllTools: async (date?: string) => {
    set({ loading: true, error: null });

    try {
      await Promise.all([
        get().loadDashboard(),
        get().loadGoals(),
        get().loadFlashcards(),
        date ? get().loadTasks(date) : Promise.resolve(),
      ]);
    } catch (err) {
      console.log("LOAD ALL TOOLS ERROR:", err);
      set({ error: getErrorMessage(err) });
    } finally {
      set({ loading: false });
    }
  },

  loadTasks: async (date: string) => {
    set({ loading: true, tasksLoading: true, error: null });

    try {
      const tasks = await getPlannerTasks(date);
      set({ tasks: normalizeArray(tasks) });
    } catch (err) {
      console.log("LOAD TASKS ERROR:", err);
      set({ tasks: [], error: getErrorMessage(err) });
    } finally {
      set({ loading: false, tasksLoading: false });
    }
  },

  addTask: async (data: any, date: string) => {
    set({ actionLoading: true, error: null });

    try {
      await createPlannerTask(data);
      await Promise.all([
        get().loadTasks(date),
        get().loadDashboard(),
      ]);
    } catch (err) {
      console.log("ADD TASK ERROR:", err);
      set({ error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ actionLoading: false });
    }
  },

  updateTaskStatus: async (
    taskID,
    date,
    status,
    actualMinutes = 0
  ) => {
    set({ actionLoading: true, error: null });

    const oldTasks = get().tasks;

    set({
      tasks: oldTasks.map((task) =>
        task.id === taskID
          ? { ...task, status, actual_minutes: actualMinutes }
          : task
      ),
    });

    try {
      await updatePlannerTask(taskID, {
        status,
        actual_minutes: actualMinutes,
      });

      await Promise.all([
        get().loadTasks(date),
        get().loadDashboard(),
      ]);
    } catch (err) {
      console.log("UPDATE TASK ERROR:", err);
      set({ tasks: oldTasks, error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ actionLoading: false });
    }
  },

  loadFlashcards: async () => {
    set({ loading: true, flashcardsLoading: true, error: null });

    try {
      const flashcards = await getDueFlashcards();
      set({ flashcards: normalizeArray(flashcards) });
    } catch (err) {
      console.log("LOAD FLASHCARDS ERROR:", err);
      set({ flashcards: [], error: getErrorMessage(err) });
    } finally {
      set({ loading: false, flashcardsLoading: false });
    }
  },

  addFlashcard: async (data: any) => {
    set({ actionLoading: true, error: null });

    try {
      await createFlashcard(data);
      await Promise.all([
        get().loadFlashcards(),
        get().loadDashboard(),
      ]);
    } catch (err) {
      console.log("CREATE FLASHCARD ERROR:", err);
      set({ error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ actionLoading: false });
    }
  },

  reviewCard: async (cardID: string, quality: number) => {
    set({ actionLoading: true, error: null });

    const safeQuality = Math.max(0, Math.min(5, Number(quality) || 0));
    const oldCards = get().flashcards;

    set({
      flashcards: oldCards.filter((card) => card.id !== cardID),
    });

    try {
      await reviewFlashcard(cardID, safeQuality);
      await Promise.all([
        get().loadFlashcards(),
        get().loadDashboard(),
      ]);
    } catch (err) {
      console.log("REVIEW FLASHCARD ERROR:", err);
      set({ flashcards: oldCards, error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ actionLoading: false });
    }
  },

  loadGoals: async () => {
    set({ loading: true, goalsLoading: true, error: null });

    try {
      const goals = await getStudyGoals();
      set({ goals: normalizeArray(goals) });
    } catch (err) {
      console.log("LOAD GOALS ERROR:", err);
      set({ goals: [], error: getErrorMessage(err) });
    } finally {
      set({ loading: false, goalsLoading: false });
    }
  },

  addGoal: async (data: any) => {
    set({ actionLoading: true, error: null });

    try {
      await createStudyGoal(data);
      await Promise.all([
        get().loadGoals(),
        get().loadDashboard(),
      ]);
    } catch (err) {
      console.log("CREATE GOAL ERROR:", err);
      set({ error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ actionLoading: false });
    }
  },

  startFocus: async (data: any) => {
    set({ actionLoading: true, error: null });

    try {
      const session = await startPomodoro({
        study_minutes: Number(data.study_minutes) || 25,
        break_minutes: Number(data.break_minutes) || 5,
        cycles_planned: Number(data.cycles_planned) || 4,
        task_id: data.task_id,
        topic_id: data.topic_id,
      });

      set({ pomodoroSession: session });
    } catch (err) {
      console.log("START POMODORO ERROR:", err);
      set({ error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ actionLoading: false });
    }
  },

  finishFocus: async (
    cyclesCompleted = 1,
    status: PomodoroStatus = "completed"
  ) => {
    const session = get().pomodoroSession;
    if (!session?.id) return;

    set({ actionLoading: true, error: null });

    try {
      await finishPomodoro(session.id, {
        cycles_completed: Math.max(0, Number(cyclesCompleted) || 0),
        status,
      });

      set({ pomodoroSession: null });

      await Promise.all([
        get().loadDashboard(),
        get().loadTasks(new Date().toISOString().slice(0, 10)),
      ]);
    } catch (err) {
      console.log("FINISH POMODORO ERROR:", err);
      set({ error: getErrorMessage(err) });
      throw err;
    } finally {
      set({ actionLoading: false });
    }
  },
}));