export type RootStackParamList = {
  SendOtp: undefined;
  VerifyOtp: { mobile: string };
  Onboarding: undefined;
  Home: undefined;
  TestSeries: undefined;
  Tests: { seriesId: string };
  TestAttempt: { testId: string };
  Attempts: { testId: string };
  Result: { attemptId: string };
   EbookSeries: undefined;
  EbookNodes: {
    seriesId: string;
    seriesTitle: string;
    parentId?: string | null;
    parentTitle?: string;
  };
   PdfViewer: {
    title: string;
    fileUrl: string;
  };
};

export type UserProfile = {
  id: string;
  email: string;
  role: "user" | "admin" | "teacher";
  first_name: string;
  last_name: string;
  gender: string;
  goal_id: string;
  class_id: string;
  goal_class_id: string;
  is_verified: boolean;
  onboarding_completed: boolean;
};

export type Goal = {
  id: string;
  name: string;
};

export type ClassItem = {
  id: string;
  name: string;
};

export type TestSeries = {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  explore_text?: string;
};

export type TestItem = {
  id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  total_questions?: number;
};

export type Question = {
  id: string;
  question_text?: string;
  question?: string;
  options: string[];
  subject?: string;
  chapter?: string;
  section?: string;
};

export type ResponseItem = {
  question_id: string;
  selected_option: number | null;
  time_spent_seconds: number;
};
export type EbookSeriesItem = {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  explore_text?: string | null;
  created_at?: string | null;
  goal_class_id?: string | null;
};

export type EbookNode = {
  id: string;
  title?: string;
  name?: string;
  type: "folder" | "file" | "pdf";
  parent_id?: string | null;
  series_id: string;
  file_url?: string | null;
  has_children?: boolean;

  order?: number | null;
  sort_order?: number | null;
  created_at?: string | null;
};