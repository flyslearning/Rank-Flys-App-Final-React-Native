import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";

const CHANNEL_ID = "study-room";
const NOTIFICATION_ID = "study-room-active";

let timerInterval: any = null;
let startedAt = 0;

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
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: undefined,
  });
}

export async function startStudyNotification(name: string, startTime: number) {
  startedAt = startTime;

  await notifee.requestPermission();
  await createStudyChannel();

  await notifee.displayNotification({
    id: NOTIFICATION_ID,
    title: "Focus Study Room Active",
    body: `${name} studying • 00:00:00`,
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

  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerInterval = setInterval(async () => {
    const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: "Focus Study Room Active",
      body: `${name} studying • ${formatTime(seconds)}`,
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
  }, 1000);
}

export async function stopStudyNotification() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  await notifee.stopForegroundService();
  await notifee.cancelNotification(NOTIFICATION_ID);
}