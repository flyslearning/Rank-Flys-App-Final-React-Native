import { toolClient } from "./client";

function apiPath(path: string) {
  const baseURL = toolClient.defaults.baseURL || "";

  // Agar baseURL already /api/tools pe end ho raha hai
  if (baseURL.endsWith("/api/tools")) {
    return path.replace(/^\/tools/, "");
  }

  // Agar baseURL /api pe end ho raha hai
  return path;
}

export type SyncCheckResponse = {
  module: string;
  client_version: number;
  server_version: number;
  update_available: boolean;
};

export async function healthCheck() {
  const baseURL = toolClient.defaults.baseURL || "";
  console.log("TOOL BASE URL:", baseURL);

  const res = await toolClient.get(apiPath("/tools/health"));
  return res.data;
}

// ================= SYLLABUS NORMAL API =================

export async function getToolSubjects() {
  const url = apiPath("/tools/syllabus/subjects");
  console.log("HIT SUBJECTS API:", url);
  const res = await toolClient.get(url);
  return res.data;
}

export async function getToolChapters(subjectID: string) {
  const url = apiPath("/tools/syllabus/chapters");
  console.log("HIT CHAPTERS API:", url, subjectID);

  const res = await toolClient.get(url, {
    params: { subject_id: subjectID },
  });

  return res.data;
}

export async function getToolTopics(chapterID: string) {
  const url = apiPath("/tools/syllabus/topics");
  console.log("HIT TOPICS API:", url, chapterID);

  const res = await toolClient.get(url, {
    params: { chapter_id: chapterID },
  });

  return res.data;
}

export async function updateTopicProgress(
  topicID: string,
  data: { status: string; confidence: number; notes?: string }
) {
  const url = apiPath(`/tools/syllabus/topics/${topicID}/progress`);
  console.log("HIT PROGRESS API:", url);

  const res = await toolClient.post(url, data);
  return res.data;
}

// ================= SYNC API =================

export async function checkToolSync(module: string, clientVersion: number) {
  console.log("HIT API:", apiPath("/tools/sync/check"));

  const res = await toolClient.get<SyncCheckResponse>(
    apiPath("/tools/sync/check"),
    {
      params: {
        module,
        client_version: clientVersion,
        local_version: clientVersion,
      },
    }
  );

  return res.data;
}

export async function getFullToolSync(module: string) {
  console.log("HIT API:", apiPath("/tools/sync/full"));

  const res = await toolClient.get(apiPath("/tools/sync/full"), {
    params: {
      module,
    },
  });

  return res.data;
}

// ================= PLANNER =================

export async function createPlannerTask(data: any) {
  console.log("HIT API:", apiPath("/tools/planner/tasks"));

  const res = await toolClient.post(apiPath("/tools/planner/tasks"), data);
  return res.data;
}

export async function getPlannerTasks(date: string) {
  console.log("HIT API:", apiPath("/tools/planner/tasks"));

  const res = await toolClient.get(apiPath("/tools/planner/tasks"), {
    params: {
      date,
    },
  });

  return res.data;
}

export async function updatePlannerTask(taskID: string, data: any) {
  console.log("HIT API:", apiPath(`/tools/planner/tasks/${taskID}`));

  const res = await toolClient.patch(
    apiPath(`/tools/planner/tasks/${taskID}`),
    data
  );

  return res.data;
}

// ================= POMODORO =================

export async function startPomodoro(data: any) {
  console.log("HIT API:", apiPath("/tools/pomodoro/start"));

  const res = await toolClient.post(apiPath("/tools/pomodoro/start"), data);
  return res.data;
}

export async function finishPomodoro(sessionID: string, data: any) {
  console.log("HIT API:", apiPath(`/tools/pomodoro/${sessionID}/finish`));

  const res = await toolClient.patch(
    apiPath(`/tools/pomodoro/${sessionID}/finish`),
    data
  );

  return res.data;
}

// ================= FLASHCARDS =================

export async function createFlashcard(data: any) {
  console.log("HIT API:", apiPath("/tools/flashcards"));

  const res = await toolClient.post(apiPath("/tools/flashcards"), data);
  return res.data;
}

export async function getDueFlashcards() {
  console.log("HIT API:", apiPath("/tools/flashcards/due"));

  const res = await toolClient.get(apiPath("/tools/flashcards/due"));
  return res.data;
}

export async function reviewFlashcard(cardID: string, quality: number) {
  console.log("HIT API:", apiPath(`/tools/flashcards/${cardID}/review`));

  const res = await toolClient.post(
    apiPath(`/tools/flashcards/${cardID}/review`),
    {
      quality,
    }
  );

  return res.data;
}

// ================= GOALS =================

export async function createStudyGoal(data: any) {
  console.log("HIT API:", apiPath("/tools/goals"));

  const res = await toolClient.post(apiPath("/tools/goals"), data);
  return res.data;
}

export async function getStudyGoals() {
  console.log("HIT API:", apiPath("/tools/goals"));

  const res = await toolClient.get(apiPath("/tools/goals"));
  return res.data;
}

// ================= ANALYTICS =================

export async function getAnalyticsDashboard() {
  console.log("HIT API:", apiPath("/tools/analytics/dashboard"));

  const res = await toolClient.get(apiPath("/tools/analytics/dashboard"));
  return res.data;
}

// ================= ADVERTISEMENTS =================

export type ToolAdvertisementAction = {
  type: string;
  id?: string;
  url?: string;
};

export type ToolAdvertisement = {
  id: string;
  title: string;
  image_url: string;
  action?: ToolAdvertisementAction;
};

export type ToolAdvertisementResponse = {
  data: ToolAdvertisement[] | null;
  success: boolean;
};

export async function getToolAdvertisements(): Promise<ToolAdvertisementResponse> {
  console.log("HIT API:", apiPath("/tools/advertisements"));

  const res = await toolClient.get<ToolAdvertisementResponse>(
    apiPath("/tools/advertisements")
  );

  return res.data;
}


