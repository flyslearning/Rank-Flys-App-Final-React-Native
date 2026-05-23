import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const CHANNEL_ID = "study-room";
const NOTIFICATION_ID = "study-room-active";

let timerInterval: ReturnType<typeof setInterval> | null = null;
let startedAt = 0;
let currentName = "Student";
let isRunning = false;
let currentNotificationIdentifier: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function formatTime(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

async function createStudyChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Study Room",
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: undefined,
    sound: undefined,
    lockscreenVisibility:
      Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

async function requestNotificationPermission() {
  const existing = await Notifications.getPermissionsAsync();

  if (existing.status === "granted") {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

async function showStudyNotification() {
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

  if (currentNotificationIdentifier) {
    try {
      await Notifications.dismissNotificationAsync(currentNotificationIdentifier);
    } catch {}
  }

  currentNotificationIdentifier =
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: "Focus Study Room Active",
        body: `${currentName} studying • ${formatTime(seconds)}`,
        sound: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
        sticky: true,
        autoDismiss: false,
        data: {
          type: "study-room-active",
        },
      },
      trigger: {
        channelId: CHANNEL_ID,
        seconds: 1,
      },
    });
}

export async function startStudyNotification(name: string, startTime: number) {
  currentName = name || "Student";
  startedAt = startTime || Date.now();

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  await createStudyChannel();

  if (isRunning) {
    await showStudyNotification();
    return;
  }

  isRunning = true;

  await showStudyNotification();

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(() => {
    showStudyNotification().catch(() => {});
  }, 15000);
}

export async function stopStudyNotification() {
  isRunning = false;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  if (currentNotificationIdentifier) {
    try {
      await Notifications.dismissNotificationAsync(currentNotificationIdentifier);
    } catch {}

    try {
      await Notifications.cancelScheduledNotificationAsync(
        currentNotificationIdentifier
      );
    } catch {}

    currentNotificationIdentifier = null;
  }

  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {}
}