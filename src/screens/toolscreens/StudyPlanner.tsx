import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  useWindowDimensions,
  Animated,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useToolsStore } from "../../store/tools.store";
import {
  getToolSubjects,
  getToolChapters,
  getToolTopics,
} from "../../api/tools.api";

const ACCENT = "#2563EB";
const ACCENT_SOFT = "#EFF6FF";
const BG = "#F8FAFC";

type TaskType =
  | "study"
  | "revision"
  | "test"
  | "flashcard"
  | "pomodoro"
  | "custom";

type Priority = "low" | "medium" | "high";
type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";

type Subject = {
  id: string;
  name: string;
  description?: string;
};

type Chapter = {
  id: string;
  subject_id: string;
  name: string;
};

type Topic = {
  id: string;
  chapter_id: string;
  name: string;
};

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateString: string, days: number) {
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);

  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yy}-${mm}-${dd}`;
}

function normalizeArray(data: any) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.subjects)) return data.subjects;
  if (Array.isArray(data?.chapters)) return data.chapters;
  if (Array.isArray(data?.topics)) return data.topics;
  if (Array.isArray(data?.data?.subjects)) return data.data.subjects;
  if (Array.isArray(data?.data?.chapters)) return data.data.chapters;
  if (Array.isArray(data?.data?.topics)) return data.data.topics;
  return [];
}

function getStatusColor(status: string) {
  if (status === "completed") return "#16A34A";
  if (status === "in_progress") return ACCENT;
  if (status === "skipped") return "#EA580C";
  return "#64748B";
}

function displayDate(date: string) {
  if (date === today()) return `Today • ${date}`;
  return date;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

export default function StudyPlanner() {
  const { width } = useWindowDimensions();
  const isSmall = width < 370;

  const store: any = useToolsStore();

  const {
    tasks = [],
    loading,
    tasksLoading,
    actionLoading,
    loadTasks,
    addTask,
    updateTaskStatus,
  } = store;

  const [selectedDate, setSelectedDate] = useState(today());
  const [plannedDate, setPlannedDate] = useState(today());

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [syllabusLoading, setSyllabusLoading] = useState(false);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [topicLoading, setTopicLoading] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [pickerType, setPickerType] = useState<
    null | "subject" | "chapter" | "topic" | "date" | "start" | "end"
  >(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("study");
  const [priority] = useState<Priority>("medium");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");
  const [minutes, setMinutes] = useState("60");

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [actualMinutes, setActualMinutes] = useState("60");

  const [submitting, setSubmitting] = useState(false);
  const patchAnim = useRef(new Animated.Value(0)).current;

  const subjectNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    subjects.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [subjects]);

  const chapterNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    chapters.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [chapters]);

  const topicNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    topics.forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [topics]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(patchAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(patchAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    loadTasks?.(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject?.id) {
      loadChapters(selectedSubject.id);
    } else {
      setChapters([]);
      setTopics([]);
    }

    setSelectedChapter(null);
    setSelectedTopic(null);
  }, [selectedSubject?.id]);

  useEffect(() => {
    if (selectedChapter?.id) {
      loadTopics(selectedChapter.id);
    } else {
      setTopics([]);
    }

    setSelectedTopic(null);
  }, [selectedChapter?.id]);

  async function loadSubjects() {
    try {
      setSyllabusLoading(true);

      let res: any = [];

      if (store.loadSyllabusSubjects) {
        res = await store.loadSyllabusSubjects();
      } else {
        res = await getToolSubjects();
      }

      const arr = normalizeArray(res);
      console.log("SUBJECTS FETCHED:", arr.length);
      setSubjects(arr);
    } catch (err: any) {
      console.log("SUBJECT LOAD ERROR:", err?.response?.data || err);
      Alert.alert("Error", "Subjects fetch nahi ho rahe. API/JWT check karo.");
      setSubjects([]);
    } finally {
      setSyllabusLoading(false);
    }
  }

  async function loadChapters(subjectID: string) {
    try {
      setChapterLoading(true);

      let res: any = [];

      if (store.loadSyllabusChapters) {
        res = await store.loadSyllabusChapters(subjectID);
      } else {
        res = await getToolChapters(subjectID);
      }

      const arr = normalizeArray(res);
      console.log("CHAPTERS FETCHED:", arr.length);
      setChapters(arr);
    } catch (err: any) {
      console.log("CHAPTER LOAD ERROR:", err?.response?.data || err);
      Alert.alert("Error", "Chapters fetch nahi ho rahe.");
      setChapters([]);
    } finally {
      setChapterLoading(false);
    }
  }

  async function loadTopics(chapterID: string) {
    try {
      setTopicLoading(true);

      let res: any = [];

      if (store.loadSyllabusTopics) {
        res = await store.loadSyllabusTopics(chapterID);
      } else {
        res = await getToolTopics(chapterID);
      }

      const arr = normalizeArray(res);
      console.log("TOPICS FETCHED:", arr.length);
      setTopics(arr);
    } catch (err: any) {
      console.log("TOPIC LOAD ERROR:", err?.response?.data || err);
      Alert.alert("Error", "Topics fetch nahi ho rahe.");
      setTopics([]);
    } finally {
      setTopicLoading(false);
    }
  }

  const visibleTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      if (!t.planned_date) return true;
      return t.planned_date === selectedDate;
    });
  }, [tasks, selectedDate]);

  const stats = useMemo(() => {
    const completed = visibleTasks.filter(
      (t: any) => t.status === "completed"
    ).length;
    const pending = visibleTasks.filter(
      (t: any) => t.status === "pending"
    ).length;
    const progress = visibleTasks.filter(
      (t: any) => t.status === "in_progress"
    ).length;

    const estimatedMinutes = visibleTasks.reduce(
      (sum: number, t: any) => sum + Number(t.estimated_minutes || 0),
      0
    );

    const actual = visibleTasks.reduce(
      (sum: number, t: any) => sum + Number(t.actual_minutes || 0),
      0
    );

    return {
      total: visibleTasks.length,
      completed,
      pending,
      progress,
      estimatedMinutes,
      actual,
    };
  }, [visibleTasks]);

  async function handleRefresh() {
    await Promise.all([loadTasks?.(selectedDate), loadSubjects()]);
  }

  async function handleAddTask() {
    if (!title.trim()) {
      Alert.alert("Required", "Task title likho");
      return;
    }

    try {
      setSubmitting(true);

      const newTaskPayload = {
        subject_id: selectedSubject?.id || undefined,
        chapter_id: selectedChapter?.id || undefined,
        topic_id: selectedTopic?.id || undefined,

        subject_name: selectedSubject?.name || undefined,
        chapter_name: selectedChapter?.name || undefined,
        topic_name: selectedTopic?.name || undefined,

        subject: selectedSubject || undefined,
        chapter: selectedChapter || undefined,
        topic: selectedTopic || undefined,

        title: title.trim(),
        description: description.trim(),
        task_type: taskType,
        priority,
        planned_date: plannedDate,
        start_time: startTime,
        end_time: endTime,
        estimated_minutes: Number(minutes) || 60,
      };

      await addTask(newTaskPayload, plannedDate);

      setSelectedDate(plannedDate);
      setSelectedSubject(null);
      setSelectedChapter(null);
      setSelectedTopic(null);
      setTitle("");
      setDescription("");
      setTaskType("study");
      setStartTime("07:00");
      setEndTime("08:00");
      setMinutes("60");

      await loadTasks?.(plannedDate);
    } catch (err) {
      console.log("ADD TASK ERROR:", err);
      Alert.alert("Error", "Task create nahi ho paya");
    } finally {
      setSubmitting(false);
    }
  }

  function openStatusModal(task: any) {
    setSelectedTask(task);
    setActualMinutes(String(task.actual_minutes || task.estimated_minutes || 60));
    setStatusModalVisible(true);
  }

  async function handleUpdateStatus(status: TaskStatus) {
    if (!selectedTask?.id) return;

    try {
      await updateTaskStatus(
        selectedTask.id,
        selectedTask.planned_date || selectedDate,
        status,
        status === "completed" ? Number(actualMinutes) || 0 : 0
      );

      setStatusModalVisible(false);
      setSelectedTask(null);
      await loadTasks?.(selectedDate);
    } catch (err) {
      console.log("UPDATE TASK ERROR:", err);
      Alert.alert("Error", "Task update nahi ho paya");
    }
  }

  async function quickComplete(task: any) {
    try {
      const isDone = task.status === "completed";

      await updateTaskStatus(
        task.id,
        task.planned_date || selectedDate,
        isDone ? "pending" : "completed",
        isDone ? 0 : Number(task.estimated_minutes || 0)
      );

      await loadTasks?.(selectedDate);
    } catch (err) {
      console.log("QUICK COMPLETE ERROR:", err);
      Alert.alert("Error", "Task update nahi ho paya");
    }
  }

  function selectDateAndClose(date: string) {
    setPlannedDate(date);
    setSelectedDate(date);
    setPickerType(null);
  }

  function getPickerData() {
    if (pickerType === "subject") return subjects;
    if (pickerType === "chapter") return chapters;
    if (pickerType === "topic") return topics;

    if (pickerType === "date") {
      return Array.from({ length: 21 }, (_, i) => {
        const date = addDays(today(), i - 5);
        return { id: date, name: displayDate(date), value: date };
      });
    }

    if (pickerType === "start" || pickerType === "end") {
      return HOURS.flatMap((h) =>
        MINUTES.map((m) => ({
          id: `${h}:${m}`,
          name: `${h}:${m}`,
          value: `${h}:${m}`,
        }))
      );
    }

    return [];
  }

  function getPickerTitle() {
    if (pickerType === "subject") return "Select Subject";
    if (pickerType === "chapter") return "Select Chapter";
    if (pickerType === "topic") return "Select Topic";
    if (pickerType === "date") return "Select Planned Date";
    if (pickerType === "start") return "Select Start Time";
    if (pickerType === "end") return "Select End Time";
    return "";
  }

  function getPickerLoading() {
    if (pickerType === "subject") return syllabusLoading;
    if (pickerType === "chapter") return chapterLoading;
    if (pickerType === "topic") return topicLoading;
    return false;
  }

  function renderPickerModal() {
    const data = getPickerData();
    const isLoading = getPickerLoading();

    return (
      <Modal
        visible={!!pickerType}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPickerType(null)}
      >
        <SafeAreaView style={styles.centerModalOverlay}>
          <View style={styles.centerPickerCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getPickerTitle()}</Text>

              <Pressable
                style={styles.closeBtn}
                onPress={() => setPickerType(null)}
              >
                <Ionicons name="close" size={22} color={ACCENT} />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator color={ACCENT} />
                <Text style={styles.loaderText}>Loading...</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerScrollContent}
              >
                {data.length === 0 ? (
                  <View style={styles.emptySmall}>
                    <Text style={styles.emptyTitleSmall}>Data nahi mila</Text>
                    <Text style={styles.emptyText}>
                      Refresh dabao ya API/JWT/baseURL check karo.
                    </Text>

                    <Pressable
                      style={styles.retryBtn}
                      onPress={() => {
                        if (pickerType === "subject") loadSubjects();
                        if (pickerType === "chapter" && selectedSubject?.id) {
                          loadChapters(selectedSubject.id);
                        }
                        if (pickerType === "topic" && selectedChapter?.id) {
                          loadTopics(selectedChapter.id);
                        }
                      }}
                    >
                      <Ionicons name="refresh" size={17} color="#fff" />
                      <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : (
                  data.map((item: any) => (
                    <Pressable
                      key={item.id}
                      style={styles.pickerItem}
                      onPress={() => {
                        if (pickerType === "subject") {
                          setSelectedSubject(item);
                        }

                        if (pickerType === "chapter") {
                          setSelectedChapter(item);
                        }

                        if (pickerType === "topic") {
                          setSelectedTopic(item);
                          if (!title.trim()) {
                            setTitle(`Study ${item.name}`);
                          }
                        }

                        if (pickerType === "date") {
                          selectDateAndClose(item.value);
                          return;
                        }

                        if (pickerType === "start") {
                          setStartTime(item.value);
                        }

                        if (pickerType === "end") {
                          setEndTime(item.value);
                        }

                        setPickerType(null);
                      }}
                    >
                      <Text style={styles.pickerItemText}>
                        {item.name || item.title || item.id}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#94A3B8"
                      />
                    </Pressable>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  function renderSelectBox(
    label: string,
    value: string,
    placeholder: string,
    type: "subject" | "chapter" | "topic" | "date" | "start" | "end",
    disabled = false
  ) {
    return (
      <Pressable
        style={[styles.selectBox, disabled && { opacity: 0.55 }]}
        onPress={() => {
          if (disabled) return;

          if (type === "subject" && subjects.length === 0) {
            loadSubjects();
          }

          if (type === "chapter" && selectedSubject?.id && chapters.length === 0) {
            loadChapters(selectedSubject.id);
          }

          if (type === "topic" && selectedChapter?.id && topics.length === 0) {
            loadTopics(selectedChapter.id);
          }

          setPickerType(type);
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.selectLabel}>{label}</Text>
          <Text
            numberOfLines={1}
            style={[styles.selectValue, !value && { color: "#94A3B8" }]}
          >
            {value || placeholder}
          </Text>
        </View>

        <Ionicons name="chevron-down" size={20} color={ACCENT} />
      </Pressable>
    );
  }

  function getTaskSubjectName(item: any) {
    return (
      item.subject_name ||
      item.subject?.name ||
      subjectNameMap[item.subject_id] ||
      ""
    );
  }

  function getTaskChapterName(item: any) {
    return (
      item.chapter_name ||
      item.chapter?.name ||
      chapterNameMap[item.chapter_id] ||
      ""
    );
  }

  function getTaskTopicName(item: any) {
    return item.topic_name || item.topic?.name || topicNameMap[item.topic_id] || "";
  }

  function renderTask({ item }: { item: any }) {
    const done = item.status === "completed";
    const statusColor = getStatusColor(item.status);

    const subjectName = getTaskSubjectName(item);
    const chapterName = getTaskChapterName(item);
    const topicName = getTaskTopicName(item);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.taskCard,
          done && styles.taskDone,
          pressed && styles.pressed,
        ]}
        onPress={() => openStatusModal(item)}
      >
        <View style={styles.taskLeft}>
          <Pressable
            style={[
              styles.checkCircle,
              done && { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
            ]}
            onPress={() => quickComplete(item)}
          >
            <Ionicons
              name={done ? "checkmark-circle" : "ellipse-outline"}
              size={25}
              color={done ? "#16A34A" : "#94A3B8"}
            />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={2}
              style={[styles.taskTitle, done && styles.taskTitleDone]}
            >
              {item.title}
            </Text>

            {!!description && null}

            {!!item.description && (
              <Text numberOfLines={2} style={styles.taskDescription}>
                {item.description}
              </Text>
            )}

            {(subjectName || chapterName || topicName) && (
              <View style={styles.syllabusBox}>
                {!!subjectName && (
                  <View style={styles.syllabusLine}>
                    <Ionicons name="school-outline" size={13} color={ACCENT} />
                    <Text numberOfLines={1} style={styles.syllabusText}>
                      Subject: {subjectName}
                    </Text>
                  </View>
                )}

                {!!chapterName && (
                  <View style={styles.syllabusLine}>
                    <Ionicons name="albums-outline" size={13} color={ACCENT} />
                    <Text numberOfLines={1} style={styles.syllabusText}>
                      Chapter: {chapterName}
                    </Text>
                  </View>
                )}

                {!!topicName && (
                  <View style={styles.syllabusLine}>
                    <Ionicons name="book-outline" size={13} color={ACCENT} />
                    <Text numberOfLines={1} style={styles.syllabusText}>
                      Topic: {topicName}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.timeRow}>
              <Ionicons name="calendar-outline" size={14} color={ACCENT} />
              <Text style={styles.timeText}>
                {item.planned_date || selectedDate}
              </Text>
            </View>

            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={ACCENT} />
              <Text style={styles.timeText}>
                {item.start_time || "--:--"} - {item.end_time || "--:--"}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="hourglass-outline" size={13} color={ACCENT} />
                <Text style={styles.metaText}>
                  {item.estimated_minutes || 0} min
                </Text>
              </View>

              <View style={styles.metaPill}>
                <Ionicons name="layers-outline" size={13} color={ACCENT} />
                <Text style={styles.metaText}>{item.task_type || "study"}</Text>
              </View>

              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: `${statusColor}18` },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {item.status || "pending"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
      </Pressable>
    );
  }

  const patchTranslate = patchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 18],
  });

  const patchOpacity = patchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.8],
  });

  const header = (
    <>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.bluePatch,
            {
              opacity: patchOpacity,
              transform: [{ translateX: patchTranslate }],
            },
          ]}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>STUDY PLANNER</Text>
          <Text style={[styles.title, isSmall && { fontSize: 26 }]}>
            Daily Study Plan
          </Text>
          <Text style={styles.subtitle}>{displayDate(selectedDate)}</Text>
        </View>

        <Pressable onPress={handleRefresh} style={styles.refreshBtn}>
          {loading || tasksLoading || syllabusLoading ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : (
            <Ionicons name="refresh" size={21} color={ACCENT} />
          )}
        </Pressable>
      </View>

      <View style={styles.dateCard}>
        <Pressable
          style={styles.dateBtn}
          onPress={() => {
            const d = addDays(selectedDate, -1);
            setSelectedDate(d);
            setPlannedDate(d);
          }}
        >
          <Ionicons name="chevron-back" size={20} color={ACCENT} />
          <Text style={styles.dateBtnText}>Prev</Text>
        </Pressable>

        <Pressable
          style={[
            styles.todayBtn,
            selectedDate !== today() && styles.todayBtnInactive,
          ]}
          onPress={() => {
            setSelectedDate(today());
            setPlannedDate(today());
          }}
        >
          <Text
            style={[
              styles.todayText,
              selectedDate !== today() && { color: ACCENT },
            ]}
          >
            {selectedDate === today() ? "Today" : "Go Today"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.dateBtn}
          onPress={() => {
            const d = addDays(selectedDate, 1);
            setSelectedDate(d);
            setPlannedDate(d);
          }}
        >
          <Text style={styles.dateBtnText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color={ACCENT} />
        </Pressable>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Create Planner Task</Text>

        {renderSelectBox(
          "Subject",
          selectedSubject?.name || "",
          syllabusLoading ? "Loading subjects..." : "Subject select karo",
          "subject"
        )}

        {renderSelectBox(
          "Chapter",
          selectedChapter?.name || "",
          chapterLoading ? "Loading chapters..." : "Chapter select karo",
          "chapter",
          !selectedSubject
        )}

        {renderSelectBox(
          "Topic",
          selectedTopic?.name || "",
          topicLoading ? "Loading topics..." : "Topic select karo",
          "topic",
          !selectedChapter
        )}

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Example: Study Coulomb's Law"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Theory + 20 questions"
          placeholderTextColor="#94A3B8"
          style={[styles.input, styles.textArea]}
          multiline
        />

        {renderSelectBox(
          "Planned Date",
          displayDate(plannedDate),
          "Date select karo",
          "date"
        )}

        <View style={styles.row}>
          <View style={styles.halfInput}>
            {renderSelectBox("Start Time", startTime, "07:00", "start")}
          </View>

          <View style={styles.halfInput}>
            {renderSelectBox("End Time", endTime, "08:00", "end")}
          </View>
        </View>

        <TextInput
          value={minutes}
          onChangeText={setMinutes}
          placeholder="Estimated minutes"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.selectorLabel}>Task Type</Text>

        <View style={styles.optionRow}>
          {["study", "revision", "test", "flashcard", "pomodoro", "custom"].map(
            (type) => {
              const active = taskType === type;

              return (
                <Pressable
                  key={type}
                  onPress={() => setTaskType(type as TaskType)}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.optionTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

        <Pressable
          style={[
            styles.button,
            (submitting || actionLoading) && { opacity: 0.7 },
          ]}
          onPress={handleAddTask}
          disabled={submitting || actionLoading}
        >
          {submitting || actionLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Add Task</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Tasks</Text>
    </>
  );

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={visibleTasks}
          keyExtractor={(item: any) => item.id}
          renderItem={renderTask}
          ListHeaderComponent={header}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={loading || tasksLoading}
              onRefresh={handleRefresh}
              tintColor={ACCENT}
              colors={[ACCENT]}
            />
          }
          ListEmptyComponent={
            !loading && !tasksLoading ? (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={42} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No tasks</Text>
                <Text style={styles.emptyText}>
                  Is date ke liye apna first study task add karo.
                </Text>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>

      {renderPickerModal()}

      <Modal visible={statusModalVisible} transparent animationType="fade">
        <SafeAreaView style={styles.updateModalOverlay}>
          <View style={styles.updateModalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Update Task</Text>
                <Text numberOfLines={1} style={styles.modalSubTitle}>
                  {selectedTask?.title}
                </Text>
              </View>

              <Pressable
                style={styles.closeBtn}
                onPress={() => setStatusModalVisible(false)}
              >
                <Ionicons name="close" size={22} color={ACCENT} />
              </Pressable>
            </View>

            <TextInput
              value={actualMinutes}
              onChangeText={setActualMinutes}
              keyboardType="numeric"
              placeholder="Actual minutes"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <View style={styles.statusGrid}>
              <Pressable
                style={[styles.statusBtn, { backgroundColor: "#EFF6FF" }]}
                onPress={() => handleUpdateStatus("in_progress")}
              >
                <Text style={[styles.statusBtnText, { color: ACCENT }]}>
                  In Progress
                </Text>
              </Pressable>

              <Pressable
                style={[styles.statusBtn, { backgroundColor: "#F0FDF4" }]}
                onPress={() => handleUpdateStatus("completed")}
              >
                <Text style={[styles.statusBtnText, { color: "#16A34A" }]}>
                  Completed
                </Text>
              </Pressable>

              <Pressable
                style={[styles.statusBtn, { backgroundColor: "#FFF7ED" }]}
                onPress={() => handleUpdateStatus("skipped")}
              >
                <Text style={[styles.statusBtnText, { color: "#EA580C" }]}>
                  Skipped
                </Text>
              </Pressable>

              <Pressable
                style={[styles.statusBtn, { backgroundColor: "#F8FAFC" }]}
                onPress={() => handleUpdateStatus("pending")}
              >
                <Text style={[styles.statusBtnText, { color: "#64748B" }]}>
                  Pending
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingBottom: 120 },

  header: {
    marginTop: 46,
    marginBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  bluePatch: {
    position: "absolute",
    right: 42,
    top: -12,
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#DBEAFE",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "900",
    color: ACCENT,
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.7,
  },
  subtitle: {
    color: "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },
  refreshBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ACCENT_SOFT,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  dateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ACCENT_SOFT,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  dateBtnText: {
    color: ACCENT,
    fontWeight: "900",
    fontSize: 12,
  },
  todayBtn: {
    backgroundColor: ACCENT,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  todayBtnInactive: {
    backgroundColor: ACCENT_SOFT,
    borderColor: "#DBEAFE",
  },
  todayText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
  },

  statsCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: ACCENT_SOFT,
    borderRadius: 18,
    padding: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "900",
    color: ACCENT,
  },
  statLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  form: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 24,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    fontWeight: "700",
  },
  textArea: {
    height: 82,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  selectBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  selectValue: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
  },
  selectorLabel: {
    color: "#0F172A",
    fontWeight: "900",
    marginTop: 4,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  optionChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  optionText: {
    color: "#475569",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "capitalize",
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
  button: {
    marginTop: 6,
    backgroundColor: ACCENT,
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  taskDone: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  pressed: {
    opacity: 0.82,
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  checkCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  taskTitleDone: {
    color: "#166534",
  },
  taskDescription: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 17,
  },
  syllabusBox: {
    marginTop: 9,
    backgroundColor: ACCENT_SOFT,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    gap: 5,
  },
  syllabusLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  syllabusText: {
    flex: 1,
    color: "#1E3A8A",
    fontSize: 11,
    fontWeight: "900",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  timeText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
  },
  metaPill: {
    backgroundColor: ACCENT_SOFT,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 150,
  },
  metaText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptySmall: {
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyTitleSmall: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },

  centerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  updateModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  updateModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    width: "100%",
  },
  centerPickerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 18,
    maxHeight: "82%",
    width: "100%",
  },
  pickerScrollContent: {
    paddingBottom: 30,
  },
  loaderBox: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: "#64748B",
    fontWeight: "800",
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  modalSubTitle: {
    color: "#64748B",
    fontWeight: "700",
    marginTop: 3,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: ACCENT_SOFT,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  pickerItem: {
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerItemText: {
    color: "#0F172A",
    fontWeight: "900",
    flex: 1,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  statusGrid: {
    gap: 10,
  },
  statusBtn: {
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  statusBtnText: {
    fontWeight: "900",
    fontSize: 15,
  },
});