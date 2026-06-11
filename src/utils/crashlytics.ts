import crashlytics from "@react-native-firebase/crashlytics";

export const logCrash = (message: string) => {
  if (!__DEV__) {
    crashlytics().log(message);
  }
};

export const recordError = (error: unknown, context?: string) => {
  if (__DEV__) {
    console.log("Crashlytics:", context, error);
    return;
  }

  if (context) {
    crashlytics().log(context);
  }

  if (error instanceof Error) {
    crashlytics().recordError(error);
  } else {
    crashlytics().recordError(
      new Error(typeof error === "string" ? error : JSON.stringify(error))
    );
  }
};

export const setCrashUser = (userId: string) => {
  if (!__DEV__) {
    crashlytics().setUserId(userId);
  }
};

export const clearCrashUser = () => {
  if (!__DEV__) {
    crashlytics().setUserId("");
  }
};