import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";

const CHANNEL_ID = "study-room";
const NOTIFICATION_ID = "study-room-active";

let timerInterval: ReturnType<typeof setInterval> | null = null;
let startedAt = 0;
let currentName = "Student";
let isRunning = false;

function formatTime(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

async function createStudyChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: "Study Room",
    importance: AndroidImportance.LOW,
    visibility: AndroidVisibility.PUBLIC,
    sound: undefined,
    vibration: false,
  });
}

async function showStudyNotification() {
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

  await notifee.displayNotification({
    id: NOTIFICATION_ID,
    title: "Focus Study Room Active",
    body: `${currentName} studying • ${formatTime(seconds)}`,
    android: {
      channelId: CHANNEL_ID,
      asForegroundService: true,
      ongoing: true,
      autoCancel: false,
      onlyAlertOnce: true,
      smallIcon: "ic_launcher",
      pressAction: {
        id: "default",
      },
    },
  });
}

export async function startStudyNotification(name: string, startTime: number) {
  currentName = name || "Student";
  startedAt = startTime || Date.now();

  if (isRunning) {
    await showStudyNotification();
    return;
  }

  isRunning = true;

  await notifee.requestPermission();
  await createStudyChannel();
  await showStudyNotification();

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // 1 second update heavy hota hai. 15 sec is production safe.
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

  try {
    await notifee.stopForegroundService();
  } catch {}

  try {
    await notifee.cancelNotification(NOTIFICATION_ID);
  } catch {}
}